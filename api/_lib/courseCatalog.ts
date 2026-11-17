export type LessonStatus = 'Available' | 'Coming Soon';

export interface ServerCourseLesson {
  lessonNumber: number;
  title: string;
  youtubeId: string | null;
  thumbnailUrl: string | null;
  embedUrl: string | null;
  status: LessonStatus;
  duration?: string;
}

export interface ServerCourseDefinition {
  id: string;
  title: string;
  software: string;
  price: number;
  priceDisplay: string;
  description: string;
  whatYouLearn: string[];
  protectedUrl: string;
  lessons: ServerCourseLesson[];
}

export interface ServerProductFallback {
  id: string;
  type: 'Course' | 'Software';
  category: string;
  title: string;
  description: string;
  price: number;
  isFree: boolean;
  priceDisplay: string;
  launchUrl?: string;
  protectedUrl: string;
  iconUrl?: string;
  thumbnailUrl?: string;
  status: 'active';
}

export const COURSE_VIDEO_EDITING_FUNDAMENTALS_ID = 'course-video-editing-fundamentals';
export const SOFTWARE_MIRRORPOS_ID = 'software-mirrorpos';

function buildYouTubeThumbnail(youtubeId: string): string {
  return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
}

function buildYouTubeEmbedUrl(youtubeId: string): string {
  return `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&playsinline=1`;
}

export function extractYouTubeVideoId(input?: string | null): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

export const VIDEO_EDITING_FUNDAMENTALS_COURSE: ServerCourseDefinition = {
  id: COURSE_VIDEO_EDITING_FUNDAMENTALS_ID,
  title: 'Video Editing Fundamentals',
  software: 'Adobe After Effects & Adobe Premiere Pro',
  price: 499,
  priceDisplay: '৳499',
  description:
    'Learn the fundamentals of professional video editing with After Effects and Premiere Pro.',
  whatYouLearn: [
    'Video Editing Fundamentals',
    'Understanding the Editing Workflow',
    'Adobe Premiere Pro Basics',
    'Adobe After Effects Basics',
    'Timeline and Layer Management',
    'Basic Motion Graphics',
    'Video Exporting',
  ],
  protectedUrl: 'https://mirrorbook.site/#course-video-editing-fundamentals',
  lessons: [
    {
      lessonNumber: 1,
      title: 'Lesson 01',
      youtubeId: '8MIRXy86IYg',
      thumbnailUrl: buildYouTubeThumbnail('8MIRXy86IYg'),
      embedUrl: buildYouTubeEmbedUrl('8MIRXy86IYg'),
      status: 'Available',
    },
    {
      lessonNumber: 2,
      title: 'Lesson 02',
      youtubeId: 'icR0acH-hN4',
      thumbnailUrl: buildYouTubeThumbnail('icR0acH-hN4'),
      embedUrl: buildYouTubeEmbedUrl('icR0acH-hN4'),
      status: 'Available',
    },
    {
      lessonNumber: 3,
      title: 'Lesson 03',
      youtubeId: 'MshFbcUoUAI',
      thumbnailUrl: buildYouTubeThumbnail('MshFbcUoUAI'),
      embedUrl: buildYouTubeEmbedUrl('MshFbcUoUAI'),
      status: 'Available',
    },
    {
      lessonNumber: 4,
      title: 'Lesson 04',
      youtubeId: null,
      thumbnailUrl: null,
      embedUrl: null,
      status: 'Coming Soon',
    },
  ],
};

export const SERVER_CANONICAL_PRODUCTS: Record<string, ServerProductFallback> = {
  [COURSE_VIDEO_EDITING_FUNDAMENTALS_ID]: {
    id: COURSE_VIDEO_EDITING_FUNDAMENTALS_ID,
    type: 'Course',
    category: 'After Effects & Premiere Pro',
    title: 'Video Editing Fundamentals',
    description:
      'Learn the fundamentals of professional video editing with After Effects and Premiere Pro.',
    price: 499,
    isFree: false,
    priceDisplay: '৳499',
    protectedUrl: 'https://mirrorbook.site/#course-video-editing-fundamentals',
    status: 'active',
  },
  [SOFTWARE_MIRRORPOS_ID]: {
    id: SOFTWARE_MIRRORPOS_ID,
    type: 'Software',
    category: 'PC & Mac',
    title: 'MirrorPOS',
    description: 'Smart POS Software for Modern Businesses.',
    price: 0,
    isFree: true,
    priceDisplay: 'Free',
    iconUrl: '/mirror-pos-icon.png',
    thumbnailUrl: '/mirror-pos-icon.png',
    launchUrl: 'https://mirror-pos.vercel.app/',
    protectedUrl: 'https://mirror-pos.vercel.app/',
    status: 'active',
  },
};

export function getServerProductFallback(
  productId?: string,
  titleMatch?: string
): ServerProductFallback | null {
  const cleanId = (productId || '').trim();
  if (cleanId && SERVER_CANONICAL_PRODUCTS[cleanId]) {
    return SERVER_CANONICAL_PRODUCTS[cleanId];
  }
  const cleanTitle = (titleMatch || '').toLowerCase().trim();
  if (cleanTitle) {
    for (const item of Object.values(SERVER_CANONICAL_PRODUCTS)) {
      if (item.title.toLowerCase().trim() === cleanTitle) {
        return item;
      }
    }
  }
  return null;
}

/**
 * Formats an ISO-8601 YouTube API duration string (e.g. PT12M34S) as MM:SS or H:MM:SS.
 */
export function formatIsoDuration(iso?: string): string | undefined {
  if (!iso || typeof iso !== 'string') return undefined;
  const match = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (!match) return undefined;
  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);
  if (!hours && !minutes && !seconds) return undefined;
  const secStr = seconds.toString().padStart(2, '0');
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secStr}`;
  }
  return `${minutes}:${secStr}`;
}

/**
 * Merges base server lessons with optional Firestore /productSecrets/{courseId}.lessons overrides
 * so admins can rename lesson titles or add/update lesson links dynamically.
 */
export function resolveCourseLessons(
  courseId: string,
  secretDoc?: Record<string, any> | null
): ServerCourseLesson[] {
  const baseCourse =
    courseId === COURSE_VIDEO_EDITING_FUNDAMENTALS_ID ? VIDEO_EDITING_FUNDAMENTALS_COURSE : null;
  const baseLessons = baseCourse ? baseCourse.lessons : [];

  const overrideLessons = Array.isArray(secretDoc?.lessons) ? secretDoc!.lessons : null;
  if (!overrideLessons || overrideLessons.length === 0) {
    return baseLessons.map((l) => ({ ...l }));
  }

  return overrideLessons
    .map((raw, index): ServerCourseLesson | null => {
      if (!raw || typeof raw !== 'object') return null;
      const lessonNumber =
        typeof raw.lessonNumber === 'number' && raw.lessonNumber > 0
          ? raw.lessonNumber
          : index + 1;
      const fallbackLesson = baseLessons.find((b) => b.lessonNumber === lessonNumber);
      const ytId =
        extractYouTubeVideoId(raw.youtubeId || raw.videoUrl) || fallbackLesson?.youtubeId || null;
      const explicitComingSoon =
        raw.status === 'Coming Soon' || raw.comingSoon === true || !ytId;
      const status: LessonStatus = explicitComingSoon ? 'Coming Soon' : 'Available';
      const title =
        typeof raw.title === 'string' && raw.title.trim()
          ? raw.title.trim().slice(0, 160)
          : fallbackLesson?.title || `Lesson ${String(lessonNumber).padStart(2, '0')}`;
      const duration =
        typeof raw.duration === 'string' && raw.duration.trim()
          ? raw.duration.trim().slice(0, 24)
          : fallbackLesson?.duration;

      return {
        lessonNumber,
        title,
        youtubeId: status === 'Available' ? ytId : null,
        thumbnailUrl: status === 'Available' && ytId ? buildYouTubeThumbnail(ytId) : null,
        embedUrl: status === 'Available' && ytId ? buildYouTubeEmbedUrl(ytId) : null,
        status,
        ...(duration ? { duration } : {}),
      };
    })
    .filter((item): item is ServerCourseLesson => item !== null)
    .sort((a, b) => a.lessonNumber - b.lessonNumber);
}

/**
 * Optionally fetches real YouTube video durations when YOUTUBE_API_KEY is configured in server env.
 * Never fabricates durations when API key is unset or lookup fails.
 */
export async function enrichLessonDurationsFromYouTubeApi(
  lessons: ServerCourseLesson[]
): Promise<ServerCourseLesson[]> {
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  if (!apiKey) return lessons;

  const idsToLookup = lessons
    .filter((l) => l.status === 'Available' && l.youtubeId && !l.duration)
    .map((l) => l.youtubeId as string);

  if (idsToLookup.length === 0) return lessons;

  try {
    const endpoint = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${encodeURIComponent(
      idsToLookup.join(',')
    )}&key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(endpoint);
    if (!res.ok) return lessons;
    const json = (await res.json()) as {
      items?: Array<{ id?: string; contentDetails?: { duration?: string } }>;
    };
    const durationMap = new Map<string, string>();
    for (const item of json.items || []) {
      const formatted = formatIsoDuration(item.contentDetails?.duration);
      if (item.id && formatted) {
        durationMap.set(item.id, formatted);
      }
    }

    return lessons.map((lesson) => {
      if (lesson.youtubeId && !lesson.duration && durationMap.has(lesson.youtubeId)) {
        return {
          ...lesson,
          duration: durationMap.get(lesson.youtubeId),
        };
      }
      return lesson;
    });
  } catch {
    return lessons;
  }
}
