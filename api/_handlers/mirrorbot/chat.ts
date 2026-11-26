import { Type } from '@google/genai';
import {
  MIRRORBOT_GEMINI_MODEL,
  checkMirrorBotRateLimit,
  extractFriendlyGeminiError,
  generateMirrorBotContent,
} from '../../_lib/gemini.js';

export interface MirrorBotCatalogItem {
  id?: string;
  name: string;
  price: string;
  category?: string;
  details?: string;
}

export interface MirrorBotBusinessContext {
  businessName: string;
  businessCategory: string;
  whatYouWorkWith: string;
  openingHours: string;
  deliveryInfo: string;
  codAvailable: boolean;
  supportPhone?: string;
  extraNotes?: string;
  botName: string;
  connectedChannels?: {
    facebookPage?: string;
    messengerConnected?: boolean;
    whatsappConnected?: boolean;
    whatsappNumber?: string;
  };
  catalog?: MirrorBotCatalogItem[];
}

export interface MirrorBotHistoryEntry {
  sender: 'customer' | 'bot';
  text: string;
  hasImage?: boolean;
}

export interface MirrorBotChatRequest {
  business: MirrorBotBusinessContext;
  history?: MirrorBotHistoryEntry[];
  message?: string;
  image?: {
    mimeType: string;
    base64Data: string;
  } | null;
}

export interface CapturedOrderData {
  customerName: string;
  phone: string;
  address: string;
  productSummary: string;
  priceNote: string;
}

export interface MirrorBotChatResult {
  status: number;
  data: {
    success: boolean;
    replies?: string[];
    needsHumanWait?: boolean;
    orderStage?: 'browsing' | 'interested' | 'collecting_details' | 'order_confirmed' | 'human_handoff';
    imageObserved?: string;
    capturedOrder?: CapturedOrderData | null;
    modelUsed?: string;
    error?: string;
  };
}

const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

function cleanStr(val: unknown, maxLen: number): string {
  return typeof val === 'string' ? val.trim().slice(0, maxLen) : '';
}

function buildSystemInstruction(biz: MirrorBotBusinessContext): string {
  const businessName = cleanStr(biz.businessName, 120);
  const botName = cleanStr(biz.botName, 50) || 'Assistant';

  const catalogLines =
    Array.isArray(biz.catalog) && biz.catalog.length > 0
      ? biz.catalog
          .slice(0, 40)
          .map(
            (item, idx) =>
              `${idx + 1}. ${cleanStr(item.name, 100)} — Price: ${cleanStr(item.price, 40)}${
                item.category ? ` (${cleanStr(item.category, 60)})` : ''
              }${item.details ? ` | Details: ${cleanStr(item.details, 200)}` : ''}`
          )
          .join('\n')
      : 'No individual priced items listed yet. Rely strictly on the general business info and never make up specific prices.';

  const channelsSummary: string[] = [];
  if (biz.connectedChannels?.facebookPage) {
    channelsSummary.push(`Facebook Page: ${cleanStr(biz.connectedChannels.facebookPage, 100)}`);
  }
  if (biz.connectedChannels?.messengerConnected) {
    channelsSummary.push('Facebook Messenger: Connected');
  }
  if (biz.connectedChannels?.whatsappConnected) {
    channelsSummary.push(
      `WhatsApp Business: Connected${
        biz.connectedChannels.whatsappNumber
          ? ` (${cleanStr(biz.connectedChannels.whatsappNumber, 40)})`
          : ''
      }`
    );
  }

  return `You are "${botName}", a real, intelligent human-style business manager & sales executive running customer conversations on behalf of "${businessName}" while the business owner is away.

=== BUSINESS CONTEXT YOU MANAGE ===
- Business Name: ${businessName}
- Your Name: ${botName}
- Business Category: ${cleanStr(biz.businessCategory, 120)}
- Products & Services: ${cleanStr(biz.whatYouWorkWith, 600)}
- Opening Hours: ${cleanStr(biz.openingHours, 160)}
- Delivery & Shipping Policy: ${cleanStr(biz.deliveryInfo, 300)}
- Cash on Delivery Across Bangladesh: ${biz.codAvailable ? 'Yes, Cash on Delivery available across Bangladesh' : 'Confirm delivery payment method with customer'}
- Hotline / WhatsApp: ${cleanStr(biz.supportPhone, 60) || 'Not specified'}
- Owner's Extra Rules: ${cleanStr(biz.extraNotes, 500) || 'None'}
- Active Channels: ${channelsSummary.length > 0 ? channelsSummary.join(' | ') : 'Direct Inbox'}

=== LIVE PRODUCT & PRICE CATALOG ===
${catalogLines}

=== HOW YOU MUST COMMUNICATE (REAL HUMAN MANAGER — ZERO TEMPLATES) ===
1. GENUINE REAL-TIME UNDERSTANDING (NO CANNED / ROBOTIC TEMPLATES):
   - Understand whatever the customer actually says — casual Bangla, Banglish, typos, short replies ("koto?", "nibo", "dhaka te pathaben?", "discount hobe?"), questions, greetings, or multi-part messages.
   - Reply freshly and naturally every single time like an attentive real person chatting on Facebook Messenger or WhatsApp. Never repeat stiff boilerplate or sound like a keyword auto-responder. Never say "As an AI".
   - Match the customer's language naturally (Bangla -> natural Bangladeshi Bangla; Banglish -> friendly Bangla or Banglish; English -> natural English).
   - Introduce yourself naturally on the first reply when appropriate (e.g. "আচ্ছা ম্যাম/স্যার, আমি ${businessName}-এর ${botName} বলছিলাম..."), without repeating your introduction on every single turn after that.

2. MULTIMODAL PHOTO UNDERSTANDING:
   - When the customer attaches a photo, genuinely inspect the image (item type, color, pattern, style).
   - Match it against the catalog above. If matched, tell them the exact price and details naturally and ask if they'd like to take it.
   - If the photo shows something NOT in your catalog or whose price you do not know, do NOT invent a price! Briefly acknowledge the photo, set "needsHumanWait": true and "orderStage": "human_handoff", and reply naturally: "আপনি একটু ওয়েট করুন, আমি ছবিটি চেক করে সঠিক দাম ও স্টক জেনে আপনাকে এখনই জানাচ্ছি।"

3. RUNNING ORDERS END-TO-END IN THE OWNER'S ABSENCE:
   - When a customer shows buying intent ("হ্যাঁ নিতে চাই", "অর্ডার করবো", "yes I want it", "nibo"):
     * Send 2 short natural chat bubbles in the "replies" array (just like a real Messenger/WhatsApp seller!):
       - Bubble 1: Acknowledge warmly, mention Cash on Delivery across Bangladesh (if enabled) and delivery info, and ask where they'd like delivery.
       - Bubble 2: Follow-up message asking for their Name, Phone Number, and Full Delivery Address so you can confirm the order.
     * Set "orderStage": "collecting_details".
   - When the customer gives their Name, Phone Number, and Address:
     * Confirm the order warmly with a brief summary (product, delivery address, COD/delivery charge) and thank them.
     * Set "orderStage": "order_confirmed" and extract their exact details into "capturedOrder".
   - If part of the details is missing (e.g. they gave address but no phone number), politely ask only for the missing part.

4. STRICT HONESTY & OWNER HANDOFF RULE:
   - Whenever the customer asks something outside your known business info/catalog (e.g. wholesale/bulk pricing, custom discount approval, unlisted color/size stock check, complaint, special exchange/refund approval):
     * NEVER make up a fake answer or promise unauthorized discounts.
     * Set "needsHumanWait": true and "orderStage": "human_handoff".
     * Reply politely and naturally: "আপনি একটু ওয়েট করুন, আমি জেনে আপনাকে এখনই জানাচ্ছি।" (or equivalent in English if they wrote in English).

5. CONCISE MOBILE CHAT STYLE:
   - Keep every bubble crisp, polite, warm, and natural — like a real human shop manager running the inbox.`;
}

export async function processMirrorBotChat(
  rawBody: unknown,
  clientIp: string
): Promise<MirrorBotChatResult> {
  if (!checkMirrorBotRateLimit(`chat:${clientIp}`, 35)) {
    return {
      status: 429,
      data: {
        success: false,
        error: 'Too many chat requests. Please wait a few seconds and try again.',
      },
    };
  }

  const body = (rawBody && typeof rawBody === 'object' ? rawBody : {}) as MirrorBotChatRequest;
  const biz = body.business;

  if (!biz || !cleanStr(biz.businessName, 120)) {
    return {
      status: 400,
      data: {
        success: false,
        error: 'Please complete your business profile first before chatting with Mirror Bot.',
      },
    };
  }

  const userMessage = cleanStr(body.message, 2000);
  const image = body.image;

  if (!userMessage && !image) {
    return {
      status: 400,
      data: {
        success: false,
        error: 'Please send a message or attach a product photo.',
      },
    };
  }

  let validatedImage: { mimeType: string; data: string } | null = null;
  if (image) {
    const mimeType = cleanStr(image.mimeType, 50).toLowerCase();
    const base64Data = typeof image.base64Data === 'string' ? image.base64Data.trim() : '';

    if (!ALLOWED_IMAGE_MIMES.has(mimeType)) {
      return {
        status: 400,
        data: {
          success: false,
          error: 'Unsupported image format. Please upload JPG, PNG, WebP, or GIF.',
        },
      };
    }

    const estimatedBytes = Math.ceil((base64Data.length * 3) / 4);
    if (!base64Data || estimatedBytes > MAX_IMAGE_BYTES) {
      return {
        status: 400,
        data: {
          success: false,
          error: 'Image is too large. Please upload a photo under 4 MB.',
        },
      };
    }

    validatedImage = { mimeType, data: base64Data };
  }

  const contents: Array<{ role: 'user' | 'model'; parts: Array<Record<string, any>> }> = [];

  if (Array.isArray(body.history)) {
    const recent = body.history.slice(-20);
    for (const entry of recent) {
      if (!entry || typeof entry.text !== 'string') continue;
      const text = cleanStr(entry.text, 2000);
      if (!text) continue;
      contents.push({
        role: entry.sender === 'bot' ? 'model' : 'user',
        parts: [
          {
            text: entry.hasImage ? `[Customer attached a product photo] ${text}` : text,
          },
        ],
      });
    }
  }

  const currentParts: Array<Record<string, any>> = [];
  if (validatedImage) {
    currentParts.push({
      inlineData: {
        mimeType: validatedImage.mimeType,
        data: validatedImage.data,
      },
    });
  }
  currentParts.push({
    text:
      userMessage ||
      'কাস্টমার একটি প্রোডাক্টের ছবি পাঠিয়েছেন এবং দাম ও বিস্তারিত জানতে চাচ্ছেন। ছবিটি দেখে বিজনেসের ক্যাটালগ অনুযায়ী ন্যাচারাল মানুষের মতো রিপ্লাই দিন।',
  });

  contents.push({
    role: 'user',
    parts: currentParts,
  });

  try {
    const { response, modelUsed } = await generateMirrorBotContent({
      model: MIRRORBOT_GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: buildSystemInstruction(biz),
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            replies: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description:
                'One or two natural human-like chat bubbles in order (use 2 bubbles when confirming buying interest and following up for phone number and address).',
            },
            needsHumanWait: {
              type: Type.BOOLEAN,
              description:
                'True when the agent cannot answer from the business profile/catalog and politely tells the customer to wait while checking.',
            },
            orderStage: {
              type: Type.STRING,
              description:
                'One of: browsing, interested, collecting_details, order_confirmed, human_handoff',
            },
            imageObserved: {
              type: Type.STRING,
              description:
                'Brief 1-line note of what was seen in the attached photo, or empty string if no photo was sent.',
            },
            capturedOrder: {
              type: Type.OBJECT,
              description:
                'Populated when the customer provides delivery phone/address details; otherwise empty strings.',
              properties: {
                customerName: { type: Type.STRING },
                phone: { type: Type.STRING },
                address: { type: Type.STRING },
                productSummary: { type: Type.STRING },
                priceNote: { type: Type.STRING },
              },
              required: ['customerName', 'phone', 'address', 'productSummary', 'priceNote'],
            },
          },
          required: ['replies', 'needsHumanWait', 'orderStage', 'imageObserved', 'capturedOrder'],
        },
      },
    });

    const rawText = (response.text || '').trim();
    const parsed = JSON.parse(rawText || '{}');

    const replies: string[] = Array.isArray(parsed?.replies)
      ? parsed.replies
          .filter((r: unknown) => typeof r === 'string' && r.trim().length > 0)
          .slice(0, 3)
          .map((r: string) => r.trim())
      : [];

    if (replies.length === 0) {
      return {
        status: 502,
        data: {
          success: false,
          error: 'Gemini returned an empty response. Please try sending your message again.',
        },
      };
    }

    const validStages = new Set([
      'browsing',
      'interested',
      'collecting_details',
      'order_confirmed',
      'human_handoff',
    ]);
    const orderStage = validStages.has(parsed.orderStage) ? parsed.orderStage : 'browsing';

    const co = parsed.capturedOrder;
    const hasCapturedOrder =
      co &&
      typeof co === 'object' &&
      (cleanStr(co.phone, 40).length >= 6 || cleanStr(co.address, 200).length >= 4);

    return {
      status: 200,
      data: {
        success: true,
        replies,
        needsHumanWait: Boolean(parsed.needsHumanWait),
        orderStage,
        imageObserved: cleanStr(parsed.imageObserved, 240),
        modelUsed,
        capturedOrder: hasCapturedOrder
          ? {
              customerName: cleanStr(co.customerName, 100),
              phone: cleanStr(co.phone, 40),
              address: cleanStr(co.address, 240),
              productSummary: cleanStr(co.productSummary, 160),
              priceNote: cleanStr(co.priceNote, 80),
            }
          : null,
      },
    };
  } catch (err) {
    const friendly = extractFriendlyGeminiError(err);
    return {
      status: friendly.status,
      data: {
        success: false,
        error: friendly.message,
      },
    };
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
    return;
  }

  const clientIp =
    (req.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  const result = await processMirrorBotChat(req.body, clientIp);
  res.status(result.status).json(result.data);
}
