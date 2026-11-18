import { verifyFirebaseIdToken, VerifiedFirebaseToken } from '../auth/session';
import {
  AdminStore,
  createFirebaseAdminStore,
  isFirebaseAdminConfigured,
} from '../_lib/firebaseAdmin';
import {
  COURSE_VIDEO_EDITING_FUNDAMENTALS_ID,
  VIDEO_EDITING_FUNDAMENTALS_COURSE,
  enrichLessonDurationsFromYouTubeApi,
  resolveCourseLessons,
} from '../_lib/courseCatalog';
import { checkRateLimitBucket } from '../_lib/security';

export interface GetCourseLessonsInput {
  authorizationHeader?: string;
  courseId?: string;
  clientIp?: string;
}

export interface GetCourseLessonsDeps {
  store?: AdminStore;
  verifyTokenFn?: (idToken: string) => Promise<VerifiedFirebaseToken>;
  enrichDurationsFn?: typeof enrichLessonDurationsFromYouTubeApi;
}

function cleanCourseId(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw.trim().slice(0, 128);
}

export async function processGetCourseLessons(
  input: GetCourseLessonsInput,
  deps: GetCourseLessonsDeps = {}
): Promise<{ status: number; data: Record<string, any> }> {
  const ip = input.clientIp || 'unknown';
  if (!checkRateLimitBucket('course-lessons-ip', ip, 40, 5 * 60 * 1000)) {
    return {
      status: 429,
      data: {
        enrolled: false,
        success: false,
        error: 'Too many requests. Please wait a moment and try again.',
      },
    };
  }

  const courseId = cleanCourseId(input.courseId) || COURSE_VIDEO_EDITING_FUNDAMENTALS_ID;
  if (!/^[a-zA-Z0-9_-]+$/.test(courseId)) {
    return {
      status: 400,
      data: { enrolled: false, success: false, error: 'Invalid courseId.' },
    };
  }

  if (!input.authorizationHeader || !input.authorizationHeader.startsWith('Bearer ')) {
    return {
      status: 401,
      data: {
        enrolled: false,
        success: false,
        error: 'Please sign in to access your enrolled course lessons.',
      },
    };
  }

  const token = input.authorizationHeader.slice(7).trim();
  if (!token) {
    return {
      status: 401,
      data: {
        enrolled: false,
        success: false,
        error: 'Authentication token is required.',
      },
    };
  }

  let verifiedUser: VerifiedFirebaseToken;
  try {
    const verifier = deps.verifyTokenFn || verifyFirebaseIdToken;
    verifiedUser = await verifier(token);
  } catch (err: unknown) {
    return {
      status: 401,
      data: {
        enrolled: false,
        success: false,
        error: err instanceof Error ? err.message : 'Invalid or expired authentication session.',
      },
    };
  }

  let store: AdminStore;
  try {
    store = deps.store || createFirebaseAdminStore();
  } catch (err: unknown) {
    return {
      status: 503,
      data: {
        enrolled: false,
        success: false,
        error: err instanceof Error ? err.message : 'Server database configuration is not ready.',
      },
    };
  }

  const productDoc = await store.getDoc('products', courseId);
  const courseTitle = String(
    productDoc?.title ||
      (courseId === COURSE_VIDEO_EDITING_FUNDAMENTALS_ID
        ? VIDEO_EDITING_FUNDAMENTALS_COURSE.title
        : '')
  ).trim();

  if (!courseTitle) {
    return {
      status: 404,
      data: {
        enrolled: false,
        success: false,
        error: 'Requested course was not found.',
      },
    };
  }

  let isEnrolled = verifiedUser.isAdmin === true;

  if (!isEnrolled) {
    const userPurchases = await store.listDocs(`users/${verifiedUser.uid}/purchases`, 250);
    isEnrolled = userPurchases.some(
      (p) =>
        p.productId === courseId ||
        p.id === courseId ||
        String(p.title || '').toLowerCase().trim() === courseTitle.toLowerCase()
    );
  }

  // Secondary check against verified completed orders bound to this UID or verified email
  if (!isEnrolled) {
    const orders = await store.listDocs('orders', 400);
    const verifiedEmail =
      verifiedUser.emailVerified && verifiedUser.email
        ? verifiedUser.email.toLowerCase().trim()
        : '';

    isEnrolled = orders.some((o) => {
      const status = String(o.status || '');
      const isPaidStatus = status === 'Completed' || status === 'Verified' || status === 'Paid';
      if (!isPaidStatus) return false;

      const matchesProduct =
        o.productId === courseId ||
        o.itemId === courseId ||
        String(o.itemName || '').toLowerCase().trim() === courseTitle.toLowerCase();
      if (!matchesProduct) return false;

      if (o.userId && o.userId === verifiedUser.uid) return true;
      if (
        verifiedEmail &&
        typeof o.customerEmail === 'string' &&
        o.customerEmail.toLowerCase().trim() === verifiedEmail
      ) {
        return true;
      }
      return false;
    });
  }

  if (!isEnrolled) {
    return {
      status: 403,
      data: {
        enrolled: false,
        success: false,
        error: 'Course enrollment verification required. Complete checkout to unlock lessons.',
      },
    };
  }

  const secretDoc = await store.getDoc('productSecrets', courseId);
  const resolvedLessons = resolveCourseLessons(courseId, secretDoc);
  const enrichFn = deps.enrichDurationsFn || enrichLessonDurationsFromYouTubeApi;
  const lessons = await enrichFn(resolvedLessons);

  return {
    status: 200,
    data: {
      success: true,
      enrolled: true,
      courseId,
      title: courseTitle,
      lessons,
    },
  };
}

export async function processGetCourseLessonThumbnail(input: {
  courseId?: string;
  lessonNumber?: number;
}): Promise<{ status: number; contentType?: string; body?: Buffer; error?: string }> {
  const courseId = cleanCourseId(input.courseId) || COURSE_VIDEO_EDITING_FUNDAMENTALS_ID;
  const lessonNum = Number(input.lessonNumber);
  if (!Number.isInteger(lessonNum) || lessonNum < 1 || lessonNum > 20) {
    return { status: 400, error: 'Invalid lesson number.' };
  }

  let secretDoc: Record<string, any> | null = null;
  if (isFirebaseAdminConfigured()) {
    try {
      const store = createFirebaseAdminStore();
      secretDoc = await store.getDoc('productSecrets', courseId);
    } catch {
      secretDoc = null;
    }
  }

  const lessons = resolveCourseLessons(courseId, secretDoc);
  const target = lessons.find((l) => l.lessonNumber === lessonNum);
  if (!target || target.status !== 'Available' || !target.thumbnailUrl) {
    return { status: 404, error: 'Lesson preview thumbnail not available.' };
  }

  try {
    const imgRes = await fetch(target.thumbnailUrl);
    if (!imgRes.ok) {
      return { status: 502, error: 'Could not load lesson preview thumbnail.' };
    }
    const arrayBuf = await imgRes.arrayBuffer();
    return {
      status: 200,
      contentType: imgRes.headers.get('content-type') || 'image/jpeg',
      body: Buffer.from(arrayBuf),
    };
  } catch {
    return { status: 502, error: 'Network error fetching lesson preview thumbnail.' };
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ enrolled: false, success: false, error: 'Method not allowed. Use GET.' });
  }

  const courseId =
    typeof req.query?.courseId === 'string' ? req.query.courseId : undefined;

  // Non-sensitive preview thumbnail proxy (streams JPEG bytes without exposing video IDs)
  if (req.query?.thumb !== undefined) {
    const thumbResult = await processGetCourseLessonThumbnail({
      courseId,
      lessonNumber: Number(req.query.thumb),
    });
    if (thumbResult.status === 200 && thumbResult.body) {
      res.setHeader('Content-Type', thumbResult.contentType || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.status(200).send(thumbResult.body);
    }
    return res.status(thumbResult.status).json({ success: false, error: thumbResult.error });
  }

  if (!isFirebaseAdminConfigured()) {
    return res.status(503).json({
      enrolled: false,
      success: false,
      error: 'Firebase Admin SDK credentials are not configured on server.',
    });
  }

  const clientIp =
    req.headers?.['x-forwarded-for']?.toString().split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  const authHeader =
    typeof req.headers?.authorization === 'string' ? req.headers.authorization : undefined;

  const result = await processGetCourseLessons({
    authorizationHeader: authHeader,
    courseId,
    clientIp,
  });

  res.setHeader('Cache-Control', 'no-store');
  return res.status(result.status).json(result.data);
}
