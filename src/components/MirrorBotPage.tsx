import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Facebook,
  ImagePlus,
  Languages,
  Loader2,
  MessageCircle,
  PackageCheck,
  Phone,
  Plus,
  RefreshCw,
  Send,
  Share2,
  ShoppingBag,
  Sparkles,
  Store,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';

export interface MirrorBotPageProps {
  onNavigateHome: () => void;
  onStartProject?: () => void;
}

type Lang = 'bn' | 'en';
type SetupStep = 'business' | 'channels' | 'agent-name' | 'live-agent';
type ActiveChannelView = 'messenger' | 'whatsapp' | 'facebook';

interface CatalogItem {
  id: string;
  name: string;
  price: string;
  category: string;
  details: string;
}

interface ChannelConnections {
  facebookPageName: string;
  facebookPageConnected: boolean;
  messengerConnected: boolean;
  whatsappNumber: string;
  whatsappConnected: boolean;
}

interface NameSuggestion {
  name: string;
  personaNote: string;
}

interface CapturedOrder {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  productSummary: string;
  priceNote: string;
  capturedAt: string;
}

interface ChatMessage {
  id: string;
  sender: 'customer' | 'bot';
  text: string;
  imagePreviewUrl?: string;
  imageObserved?: string;
  needsHumanWait?: boolean;
  orderStage?: string;
  timestamp: string;
}

interface CategoryPreset {
  id: string;
  labelBn: string;
  labelEn: string;
  businessName: string;
  businessCategory: string;
  whatYouWorkWith: string;
  openingHours: string;
  deliveryInfo: string;
  suggestedBotName: string;
  catalog: CatalogItem[];
}

const MIRROR_BOT_APP_URL = 'https://mirrorbook-ai-support-sowrovhosenstudio.vercel.app';
const STORAGE_KEY = 'mirrorbook_mirrorbot_gemini_workspace_v1';

const CATEGORY_PRESETS: CategoryPreset[] = [
  {
    id: 'garments',
    labelBn: 'গার্মেন্টস ও শাড়ি',
    labelEn: 'Garments & Saree',
    businessName: 'সারা গার্মেন্টস',
    businessCategory: 'Garments, Saree & Women Fashion',
    whatYouWorkWith:
      'জামদানি শাড়ি, কাতান শাড়ি, সফট সিল্ক শাড়ি, থ্রি-পিস, কুর্তি এবং পার্টি ড্রেস সেল করি।',
    openingHours: 'সকাল ১০:০০ টা – রাত ১০:০০ টা (সপ্তাহে ৭ দিন)',
    deliveryInfo:
      'সারা বাংলাদেশে ক্যাশ অন ডেলিভারি। ঢাকার ভেতরে ৳৭০ (২৪-৪৮ ঘণ্টা), ঢাকার বাইরে ৳১৩০ (২-৩ দিন)।',
    suggestedBotName: 'সারা',
    catalog: [
      {
        id: 'p-jamdani',
        name: 'প্রিমিয়াম ঢাকাই জামদানি শাড়ি',
        price: '৳২,৪৫০',
        category: 'Saree',
        details: 'লাল, মেরুন, নীল ও গোল্ডেন রঙে পাওয়া যায়, ম্যাচিং ব্লাউজ পিস সহ',
      },
      {
        id: 'p-katan',
        name: 'রয়্যাল বেনারসি কাতান শাড়ি',
        price: '৳৩,২০০',
        category: 'Saree',
        details: 'বিয়ের ও পার্টি ওয়্যার, ভারী জরি কাজ করা',
      },
      {
        id: 'p-threepiece',
        name: 'লাক্সারি কটন থ্রি-পিস',
        price: '৳১,৩৫০',
        category: 'Three-Piece',
        details: 'সফট কটন, শিফন ওড়না সহ, সাইজ M / L / XL',
      },
    ],
  },
  {
    id: 'gadgets',
    labelBn: 'ইলেকট্রনিক্স ও গ্যাজেট',
    labelEn: 'Electronics & Gadgets',
    businessName: 'টেক পালস বিডি',
    businessCategory: 'Smart Gadgets & Accessories',
    whatYouWorkWith: 'স্মার্টওয়াচ, এয়ারবাডস, পাওয়ার ব্যাংক, চার্জার এবং মোবাইল এক্সেসরিজ সেল করি।',
    openingHours: 'সকাল ১০:৩০ – রাত ৯:৩০ (শুক্রবার বন্ধ)',
    deliveryInfo: 'সারা বাংলাদেশে ক্যাশ অন ডেলিভারি। ঢাকায় ৳৬০, ঢাকার বাইরে ৳১২০। ৭ দিনের রিপ্লেসমেন্ট ওয়ারেন্টি।',
    suggestedBotName: 'আরিয়ান',
    catalog: [
      {
        id: 'p-watch',
        name: 'AMOLED কলিং স্মার্টওয়াচ প্রো',
        price: '৳২,৮৫০',
        category: 'Smartwatch',
        details: 'ব্লুটুথ কলিং, ৭ দিন ব্যাটারি ব্যাকআপ, ওয়াটার রেজিস্ট্যান্ট',
      },
      {
        id: 'p-buds',
        name: 'ANC ওয়্যারলেস এয়ারবাডস',
        price: '৳১,৬৫০',
        category: 'Audio',
        details: 'অ্যাক্টিভ নয়েজ ক্যান্সেলেশন, ৩০ ঘণ্টা প্লেটাইম',
      },
    ],
  },
  {
    id: 'cosmetics',
    labelBn: 'কসমেটিকস ও স্কিনকেয়ার',
    labelEn: 'Cosmetics & Skincare',
    businessName: 'গ্লো বাই নূরা',
    businessCategory: 'Authentic Skincare & Beauty',
    whatYouWorkWith: 'কোরিয়ান স্কিনকেয়ার, সিরাম, সানস্ক্রিন, ফেসওয়াশ এবং অরিজিনাল বিউটি প্রোডাক্ট সেল করি।',
    openingHours: 'সকাল ১০:০০ – রাত ১১:০০ (প্রতিদিন)',
    deliveryInfo: 'সারা বাংলাদেশে হোম ও ক্যাশ অন ডেলিভারি। ঢাকায় ৳৭০, ঢাকার বাইরে ৳১৩০।',
    suggestedBotName: 'নূরা',
    catalog: [
      {
        id: 'p-serum',
        name: 'নিয়াসিনামাইড গ্লো সিরাম (30ml)',
        price: '৳১,২৫০',
        category: 'Skincare',
        details: 'সব স্কিন টাইপের জন্য উপযোগী, ১০০% অথেনটিক',
      },
      {
        id: 'p-sunscreen',
        name: 'রিলিফ সানস্ক্রিন SPF 50+',
        price: '৳১,৪৫০',
        category: 'Skincare',
        details: 'কোনো হোয়াইট কাস্ট নেই, লাইটওয়েট ফর্মুলা',
      },
    ],
  },
  {
    id: 'food',
    labelBn: 'ফুড ও হোম কিচেন',
    labelEn: 'Food & Restaurant',
    businessName: 'স্বাদ ঘর কিচেন',
    businessCategory: 'Homemade Food & Catering',
    whatYouWorkWith: 'বিফ তেহারি, কাচ্চি বিরিয়ানি, হোমমেড আচার, কেক এবং ডেজার্ট বক্স ডেলিভারি করি।',
    openingHours: 'সকাল ১১:০০ – রাত ১০:৩০ (প্রতিদিন)',
    deliveryInfo: 'ঢাকা সিটিতে ৬০ মিনিটে হোম ডেলিভারি (চার্জ ৳৬০)। ক্যাশ অন ডেলিভারি ও বিকাশ গ্রহণযোগ্য।',
    suggestedBotName: 'রাফি',
    catalog: [
      {
        id: 'p-kacchi',
        name: 'স্পেশাল বাসমতি কাচ্চি (১:১)',
        price: '৳৩৮০',
        category: 'Main Dish',
        details: 'বোরহানি ও জর্দা সহ, ফ্রেশ গরম ডেলিভারি',
      },
      {
        id: 'p-achar',
        name: 'হোমমেড গরুর মাংসের আচার (500g)',
        price: '৳৮৫০',
        category: 'Pickle',
        details: 'সারা বাংলাদেশে কুরিয়ার ও ক্যাশ অন ডেলিভারি',
      },
    ],
  },
];

function nowTimeLabel(): string {
  try {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export const MirrorBotPage: React.FC<MirrorBotPageProps> = ({
  onNavigateHome,
  onStartProject,
}) => {
  const [lang, setLang] = useState<Lang>('bn');
  const [activeStep, setActiveStep] = useState<SetupStep>('business');
  const [copiedLink, setCopiedLink] = useState(false);

  // Step 1: Business Understanding State (preloaded with Sara Garments example for immediate testing)
  const [selectedPresetId, setSelectedPresetId] = useState<string>('garments');
  const [businessName, setBusinessName] = useState<string>(CATEGORY_PRESETS[0].businessName);
  const [businessCategory, setBusinessCategory] = useState<string>(
    CATEGORY_PRESETS[0].businessCategory
  );
  const [whatYouWorkWith, setWhatYouWorkWith] = useState<string>(
    CATEGORY_PRESETS[0].whatYouWorkWith
  );
  const [openingHours, setOpeningHours] = useState<string>(CATEGORY_PRESETS[0].openingHours);
  const [deliveryInfo, setDeliveryInfo] = useState<string>(CATEGORY_PRESETS[0].deliveryInfo);
  const [codAvailable, setCodAvailable] = useState<boolean>(true);
  const [supportPhone, setSupportPhone] = useState<string>('+880 1767-079837');
  const [extraNotes, setExtraNotes] = useState<string>(
    'অর্ডার কনফার্মের আগে কাস্টমারের নাম, ফোন নাম্বার ও পূর্ণ ঠিকানা নিতে হবে।'
  );
  const [catalog, setCatalog] = useState<CatalogItem[]>(CATEGORY_PRESETS[0].catalog);

  // Add Product mini-form
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemDetails, setNewItemDetails] = useState('');

  // Step 2: Social Channel Connection State (Facebook Page, Messenger, WhatsApp)
  const [channels, setChannels] = useState<ChannelConnections>({
    facebookPageName: 'Sara Garments Official',
    facebookPageConnected: true,
    messengerConnected: true,
    whatsappNumber: '+880 1767-079837',
    whatsappConnected: true,
  });
  const [metaStatus, setMetaStatus] = useState<{
    webhookUrl: string;
    facebookMessengerConfigured: boolean;
    whatsappCloudConfigured: boolean;
    metaVerifyTokenConfigured: boolean;
    geminiReady: boolean;
  } | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Step 3: AI Bot Name Suggestion via Gemini
  const [botName, setBotName] = useState<string>(CATEGORY_PRESETS[0].suggestedBotName);
  const [nameSuggestions, setNameSuggestions] = useState<NameSuggestion[]>([]);
  const [isSuggestingNames, setIsSuggestingNames] = useState<boolean>(false);
  const [nameError, setNameError] = useState<string>('');

  // Step 4: Real Gemini Multimodal Live Agent State
  const [activeChannelView, setActiveChannelView] = useState<ActiveChannelView>('messenger');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isTypingFollowUp, setIsTypingFollowUp] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string>('');
  const [capturedOrders, setCapturedOrders] = useState<CapturedOrder[]>([]);
  const [humanWaitCount, setHumanWaitCount] = useState<number>(0);

  // Image attachment state for multimodal product photo inspection
  const [pendingImage, setPendingImage] = useState<{
    previewUrl: string;
    mimeType: string;
    base64Data: string;
    fileName: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Restore saved workspace from localStorage if present & load live Meta status
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetch('/api/mirrorbot/meta-status')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.success) {
          setMetaStatus({
            webhookUrl: data.webhookUrl || 'https://mirrorbook.site/api/mirrorbot/meta-webhook',
            facebookMessengerConfigured: Boolean(data.facebookMessengerConfigured),
            whatsappCloudConfigured: Boolean(data.whatsappCloudConfigured),
            metaVerifyTokenConfigured: Boolean(data.metaVerifyTokenConfigured),
            geminiReady: Boolean(data.geminiReady),
          });
        }
      })
      .catch(() => {});
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.businessName) setBusinessName(parsed.businessName);
        if (parsed.businessCategory) setBusinessCategory(parsed.businessCategory);
        if (parsed.whatYouWorkWith) setWhatYouWorkWith(parsed.whatYouWorkWith);
        if (parsed.openingHours) setOpeningHours(parsed.openingHours);
        if (parsed.deliveryInfo) setDeliveryInfo(parsed.deliveryInfo);
        if (typeof parsed.codAvailable === 'boolean') setCodAvailable(parsed.codAvailable);
        if (parsed.supportPhone) setSupportPhone(parsed.supportPhone);
        if (parsed.extraNotes) setExtraNotes(parsed.extraNotes);
        if (Array.isArray(parsed.catalog) && parsed.catalog.length > 0) setCatalog(parsed.catalog);
        if (parsed.botName) setBotName(parsed.botName);
        if (parsed.channels) setChannels((prev) => ({ ...prev, ...parsed.channels }));
      }
    } catch {
      // Ignore invalid localStorage state
    }
  }, []);

  // Persist workspace changes locally for convenience
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          businessName,
          businessCategory,
          whatYouWorkWith,
          openingHours,
          deliveryInfo,
          codAvailable,
          supportPhone,
          extraNotes,
          catalog,
          botName,
          channels,
        })
      );
    } catch {
      // Ignore storage quota issues
    }
  }, [
    businessName,
    businessCategory,
    whatYouWorkWith,
    openingHours,
    deliveryInfo,
    codAvailable,
    supportPhone,
    extraNotes,
    catalog,
    botName,
    channels,
  ]);

  // Schema.org SoftwareApplication metadata
  useEffect(() => {
    const schemaId = 'mirrorbook-mirrorbot-schema';
    document.getElementById(schemaId)?.remove();
    const script = document.createElement('script');
    script.id = schemaId;
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Mirror Bot',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: 'https://mirrorbook.site/mirrorbot',
      description:
        'Mirror Bot by MirrorBook AI Support is a Gemini-powered AI customer support & sales agent with product photo understanding, Facebook Messenger & WhatsApp integration, and automated Cash-on-Delivery order taking.',
      publisher: {
        '@type': 'Organization',
        name: 'MirrorBook',
        url: 'https://mirrorbook.site/',
      },
    });
    document.head.appendChild(script);
    return () => {
      document.getElementById(schemaId)?.remove();
    };
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isSending, isTypingFollowUp]);

  const applyPreset = (preset: CategoryPreset) => {
    setSelectedPresetId(preset.id);
    setBusinessName(preset.businessName);
    setBusinessCategory(preset.businessCategory);
    setWhatYouWorkWith(preset.whatYouWorkWith);
    setOpeningHours(preset.openingHours);
    setDeliveryInfo(preset.deliveryInfo);
    setBotName(preset.suggestedBotName);
    setCatalog(preset.catalog);
    setChannels((prev) => ({
      ...prev,
      facebookPageName: `${preset.businessName} Official`,
    }));
    setNameSuggestions([]);
    setMessages([]);
    setCapturedOrders([]);
    setHumanWaitCount(0);
  };

  const handleAddCatalogItem = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newItemName.trim();
    const cleanPrice = newItemPrice.trim();
    if (!cleanName || !cleanPrice) return;
    setCatalog((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        name: cleanName,
        price: cleanPrice,
        category: businessCategory || 'Product',
        details: newItemDetails.trim(),
      },
    ]);
    setNewItemName('');
    setNewItemPrice('');
    setNewItemDetails('');
  };

  const handleRemoveCatalogItem = (id: string) => {
    setCatalog((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSuggestNamesWithGemini = async () => {
    if (!businessName.trim()) {
      setNameError(
        lang === 'bn'
          ? 'আগে ধাপ ১-এ আপনার বিজনেসের নাম লিখুন।'
          : 'Please enter your business name in Step 1 first.'
      );
      return;
    }

    setIsSuggestingNames(true);
    setNameError('');

    try {
      const res = await fetch('/api/mirrorbot/suggest-names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: businessName.trim(),
          businessCategory: businessCategory.trim(),
          whatYouSell: whatYouWorkWith.trim(),
          language: lang,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Could not fetch Gemini name suggestions.');
      }
      setNameSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
    } catch (err: any) {
      setNameError(err?.message || 'Gemini name suggestion failed. Please try again.');
    } finally {
      setIsSuggestingNames(false);
    }
  };

  const handlePhotoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setChatError(
        lang === 'bn'
          ? 'শুধুমাত্র ছবি ফাইল (JPG, PNG, WebP) আপলোড করুন।'
          : 'Please select an image file (JPG, PNG, WebP).'
      );
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setChatError(
        lang === 'bn'
          ? 'ছবির সাইজ ৪ মেগাবাইটের কম হতে হবে।'
          : 'Image size must be under 4 MB.'
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      const commaIdx = dataUrl.indexOf(',');
      if (commaIdx === -1) return;
      const base64Data = dataUrl.slice(commaIdx + 1);
      setPendingImage({
        previewUrl: dataUrl,
        mimeType: file.type || 'image/jpeg',
        base64Data,
        fileName: file.name,
      });
      setChatError('');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const sendCustomerMessage = async (overrideText?: string) => {
    const textToSend = (overrideText !== undefined ? overrideText : chatInput).trim();
    const attachedImage = pendingImage;

    if (!textToSend && !attachedImage) return;
    if (isSending) return;

    setChatError('');
    const customerMsgId = `cust-${Date.now()}`;
    const customerEntry: ChatMessage = {
      id: customerMsgId,
      sender: 'customer',
      text:
        textToSend ||
        (lang === 'bn' ? 'এই প্রোডাক্টটির দাম কত?' : 'How much is this product?'),
      imagePreviewUrl: attachedImage?.previewUrl,
      timestamp: nowTimeLabel(),
    };

    const historyPayload = messages.slice(-18).map((m) => ({
      sender: m.sender,
      text: m.text,
      hasImage: Boolean(m.imagePreviewUrl),
    }));

    setMessages((prev) => [...prev, customerEntry]);
    if (overrideText === undefined) setChatInput('');
    setPendingImage(null);
    setIsSending(true);

    try {
      const res = await fetch('/api/mirrorbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business: {
            businessName: businessName.trim() || 'My Business',
            businessCategory: businessCategory.trim(),
            whatYouWorkWith: whatYouWorkWith.trim(),
            openingHours: openingHours.trim(),
            deliveryInfo: deliveryInfo.trim(),
            codAvailable,
            supportPhone: supportPhone.trim(),
            extraNotes: extraNotes.trim(),
            botName: botName.trim() || 'Assistant',
            connectedChannels: {
              facebookPage: channels.facebookPageConnected ? channels.facebookPageName : '',
              messengerConnected: channels.messengerConnected,
              whatsappConnected: channels.whatsappConnected,
              whatsappNumber: channels.whatsappConnected ? channels.whatsappNumber : '',
            },
            catalog,
          },
          history: historyPayload,
          message: customerEntry.text,
          image: attachedImage
            ? {
                mimeType: attachedImage.mimeType,
                base64Data: attachedImage.base64Data,
              }
            : null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Gemini could not generate a reply right now.');
      }

      const replyBubbles: string[] = Array.isArray(data.replies) ? data.replies : [];
      if (replyBubbles.length === 0) {
        throw new Error('Empty response received from Gemini.');
      }

      if (data.needsHumanWait) {
        setHumanWaitCount((c) => c + 1);
      }

      if (data.capturedOrder) {
        setCapturedOrders((prev) => [
          {
            id: `ORD-${String(Date.now()).slice(-4)}`,
            customerName: data.capturedOrder.customerName || 'Customer',
            phone: data.capturedOrder.phone || '—',
            address: data.capturedOrder.address || '—',
            productSummary: data.capturedOrder.productSummary || businessCategory,
            priceNote: data.capturedOrder.priceNote || 'Cash on Delivery',
            capturedAt: nowTimeLabel(),
          },
          ...prev,
        ]);
      }

      // Deliver Bubble 1 immediately
      const firstBubble: ChatMessage = {
        id: `bot-${Date.now()}-0`,
        sender: 'bot',
        text: replyBubbles[0],
        imageObserved: data.imageObserved || undefined,
        needsHumanWait: Boolean(data.needsHumanWait),
        orderStage: data.orderStage,
        timestamp: nowTimeLabel(),
      };
      setMessages((prev) => [...prev, firstBubble]);
      setIsSending(false);

      // Deliver follow-up bubbles (e.g., asking for Phone + Address) with realistic messenger pacing
      for (let i = 1; i < replyBubbles.length; i++) {
        setIsTypingFollowUp(true);
        await new Promise((resolve) => window.setTimeout(resolve, 750));
        setIsTypingFollowUp(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}-${i}`,
            sender: 'bot',
            text: replyBubbles[i],
            orderStage: data.orderStage,
            timestamp: nowTimeLabel(),
          },
        ]);
      }
    } catch (err: any) {
      setIsSending(false);
      setIsTypingFollowUp(false);
      setChatError(
        err?.message ||
          (lang === 'bn'
            ? 'জেমিনি এপিআই থেকে উত্তর আনা যায়নি। আবার চেষ্টা করুন।'
            : 'Unable to reach Gemini API right now. Please try again.')
      );
    }
  };

  const handleShareLink = async () => {
    try {
      await navigator.clipboard.writeText('https://mirrorbook.site/mirrorbot');
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      setCopiedLink(false);
    }
  };

  const connectedChannelCount =
    (channels.facebookPageConnected ? 1 : 0) +
    (channels.messengerConnected ? 1 : 0) +
    (channels.whatsappConnected ? 1 : 0);

  const steps: {
    id: SetupStep;
    num: string;
    labelBn: string;
    labelEn: string;
    meta: string;
  }[] = [
    {
      id: 'business',
      num: '01',
      labelBn: 'বিজনেস পরিচিতি',
      labelEn: 'Business Info',
      meta: `${catalog.length}`,
    },
    {
      id: 'channels',
      num: '02',
      labelBn: 'ফেসবুক ও হোয়াটসঅ্যাপ',
      labelEn: 'Connect Channels',
      meta: `${connectedChannelCount}/3`,
    },
    {
      id: 'agent-name',
      num: '03',
      labelBn: 'এআই বটের নাম',
      labelEn: 'AI Bot Name',
      meta: botName || '—',
    },
    {
      id: 'live-agent',
      num: '04',
      labelBn: 'লাইভ জেমিনি এজেন্ট',
      labelEn: 'Live Gemini Agent',
      meta: 'AI',
    },
  ];

  const sampleCustomerMessages =
    lang === 'bn'
      ? [
          {
            label: 'এই জামদানি শাড়িটার দাম কত?',
            hint: 'প্রোডাক্ট প্রাইস প্রশ্ন',
          },
          {
            label: 'হ্যাঁ আমি নিতে চাই',
            hint: '২ ধাপে অর্ডার মেসেজ',
          },
          {
            label: 'আমার নাম নুসরাত, ফোন 01711223344, ঠিকানা মিরপুর ১০, ঢাকা',
            hint: 'অর্ডার কনফার্মেশন',
          },
          {
            label: 'আপনাদের শপ কখন থেকে কতক্ষণ খোলা থাকে?',
            hint: 'সময়সূচি',
          },
          {
            label: 'আমি পাইকারি ১০০ পিস নিলে আলাদা কত ডিসকাউন্ট দেবেন?',
            hint: 'জানা না থাকলে ওয়েট মেসেজ',
          },
        ]
      : [
          {
            label: 'How much is the Jamdani Saree?',
            hint: 'Product price inquiry',
          },
          {
            label: 'Yes, I want to order it',
            hint: '2-message COD order flow',
          },
          {
            label: 'My name is Nusrat, phone 01711223344, address Mirpur 10, Dhaka',
            hint: 'Order confirmation',
          },
          {
            label: 'What are your opening hours?',
            hint: 'Business hours',
          },
          {
            label: 'Can you give me a wholesale discount for 100 pieces?',
            hint: 'Human handoff wait rule',
          },
        ];

  return (
    <div className="min-h-screen bg-[#0B0D0C] text-[#F5F7F2] pb-20">
      {/* Top Contextual Bar */}
      <div className="border-b border-white/[0.09] bg-[#0B0D0C]/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onNavigateHome}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#121614] hover:bg-[#171C19] border border-white/[0.09] text-xs font-medium text-[#D4DBD5] hover:text-[#F5F7F2] flex items-center gap-2 transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeft size={14} />
              <span>{lang === 'bn' ? 'হোমে ফিরুন' : 'Back to MirrorBook'}</span>
            </button>
            <span className="hidden sm:inline text-xs text-[#A1AAA2] truncate">
              Plugins &amp; Software / <span className="text-[#F5F7F2] font-medium">Mirror Bot</span>
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div
              role="group"
              aria-label="Language toggle"
              className="flex items-center bg-[#121614] border border-white/[0.09] rounded-xl p-1"
            >
              <button
                type="button"
                onClick={() => setLang('bn')}
                className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  lang === 'bn'
                    ? 'bg-[#B7F34A] text-[#0B0D0C]'
                    : 'text-[#A1AAA2] hover:text-[#F5F7F2]'
                }`}
              >
                <Languages size={13} />
                <span>বাংলা</span>
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  lang === 'en'
                    ? 'bg-[#B7F34A] text-[#0B0D0C]'
                    : 'text-[#A1AAA2] hover:text-[#F5F7F2]'
                }`}
              >
                English
              </button>
            </div>

            <button
              type="button"
              onClick={handleShareLink}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#121614] hover:bg-[#171C19] border border-white/[0.09] text-xs font-medium text-[#D4DBD5] hover:text-[#F5F7F2] flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              {copiedLink ? <Check size={14} className="text-[#B7F34A]" /> : <Share2 size={14} />}
              <span className="hidden sm:inline">
                {copiedLink
                  ? lang === 'bn'
                    ? 'কপি হয়েছে'
                    : 'Copied'
                  : lang === 'bn'
                  ? 'শেয়ার'
                  : 'Share'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Header Identity Strip (Icon-first, clean, no cover banner) */}
      <section className="border-b border-white/[0.09] bg-grid-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-9 sm:py-11">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4 sm:gap-5 min-w-0 max-w-3xl">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#121614] border border-white/[0.12] p-3 flex items-center justify-center shrink-0">
                <img
                  src="/mirrorbook-ai-support-icon.svg"
                  alt="Mirror Bot Icon"
                  width={64}
                  height={64}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs mb-1.5">
                  <span className="font-semibold text-[#B7F34A]">MirrorBook · AI Support</span>
                  <span className="text-white/20">·</span>
                  <span className="font-bold uppercase tracking-wider text-[#D4DBD5]">AI BOT</span>
                  <span className="text-white/20">·</span>
                  <span className="text-[#A1AAA2]">Powered by Gemini AI Agent</span>
                </div>

                <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#F5F7F2] tracking-tight mb-2">
                  Mirror Bot
                </h1>

                <p className="text-sm sm:text-base text-[#A1AAA2] leading-relaxed">
                  {lang === 'bn'
                    ? 'জেমিনি এআই চালিত স্মার্ট বিজনেস এজেন্ট। আপনার বিজনেস সম্পর্কে ধারণা দিন, ফেসবুক পেজ, মেসেঞ্জার ও হোয়াটসঅ্যাপ কানেক্ট করুন এবং বটের নাম দিন—কাস্টমার ছবি পাঠাক বা যাই জিজ্ঞাসা করুক, আপনার এজেন্ট হয়ে হুবহু রিপ্লাই দেবে ও অর্ডার কনফার্ম করবে।'
                    : 'Gemini-powered conversational AI sales & support agent. Teach Mirror Bot about your business, connect Facebook Page, Messenger, and WhatsApp, pick an AI agent name, and let it inspect product photos, answer customers naturally, capture Cash-on-Delivery orders, and escalate unknown questions.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setActiveStep('live-agent')}
                className="min-h-[46px] px-5 py-3 text-xs sm:text-sm glossy-btn rounded-xl flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <Sparkles size={15} />
                <span>{lang === 'bn' ? 'লাইভ জেমিনি বট টেস্ট করুন' : 'Test Live Gemini Bot'}</span>
              </button>

              <a
                href={MIRROR_BOT_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[46px] px-5 py-3 text-xs sm:text-sm glossy-btn-secondary rounded-xl flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <span>{lang === 'bn' ? 'মিরর বট অ্যাপ' : 'Open Web App'}</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Main 4-Step Interactive Workspace */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Stepper Navigation Buttons */}
        <div
          role="tablist"
          aria-label="Mirror Bot Setup Steps"
          className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-6"
        >
          {steps.map((step) => {
            const isCurrent = activeStep === step.id;
            return (
              <button
                key={step.id}
                type="button"
                role="tab"
                aria-selected={isCurrent}
                onClick={() => setActiveStep(step.id)}
                className={`min-h-[52px] px-4 py-3 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                  isCurrent
                    ? 'bg-[#B7F34A] text-[#0B0D0C] border-[#B7F34A]'
                    : 'bg-[#121614] text-[#F5F7F2] border-white/[0.09] hover:border-white/25'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`font-mono text-[11px] font-bold tabular-nums px-1.5 py-0.5 rounded-md shrink-0 ${
                      isCurrent
                        ? 'bg-[#0B0D0C]/15 text-[#0B0D0C]'
                        : 'bg-white/[0.06] text-[#B7F34A]'
                    }`}
                  >
                    {step.num}
                  </span>
                  <span className="text-xs sm:text-sm font-bold truncate">
                    {lang === 'bn' ? step.labelBn : step.labelEn}
                  </span>
                </div>
                <span
                  className={`text-[11px] font-semibold truncate max-w-[72px] shrink-0 ${
                    isCurrent ? 'text-[#0B0D0C]/80' : 'text-[#A1AAA2]'
                  }`}
                >
                  {step.meta}
                </span>
              </button>
            );
          })}
        </div>

        {/* STEP 1: BUSINESS UNDERSTANDING & PRODUCT CATALOG */}
        {activeStep === 'business' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: Business Interview Form */}
            <div className="lg:col-span-7 bg-[#121614] border border-white/[0.09] rounded-2xl p-5 sm:p-6 space-y-5">
              <div className="pb-4 border-b border-white/[0.09]">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#B7F34A]">
                  {lang === 'bn' ? 'ধাপ ০১ · বিজনেস সম্পর্কে ধারণা দিন' : 'Step 01 · Teach Mirror Bot Your Business'}
                </span>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[#F5F7F2] mt-1">
                  {lang === 'bn'
                    ? 'আপনার বিজনেস কী এবং আপনি কী নিয়ে কাজ করেন?'
                    : 'Tell Mirror Bot About Your Business'}
                </h2>
                <p className="text-xs text-[#A1AAA2] mt-1">
                  {lang === 'bn'
                    ? 'এখানে কোনো মুখস্থ অটো-রিপ্লাই লিখতে হবে না। শুধু আপনার বিজনেসের তথ্য দিন—জেমিনি এআই নিজেই বুঝে কাস্টমারের সাথে কথা বলবে।'
                    : 'No rigid auto-reply scripts needed. Describe your business naturally so Gemini understands your store and talks to customers like a real staff member.'}
                </p>
              </div>

              {/* Quick Industry Category Presets */}
              <div>
                <div className="text-xs font-semibold text-[#D4DBD5] mb-2">
                  {lang === 'bn'
                    ? 'দ্রুত ডেমো বিজনেস ক্যাটাগরি সিলেক্ট করুন (অথবা নিচে নিজের মতো লিখুন):'
                    : 'Quick business category presets (or customize freely below):'}
                </div>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className={`min-h-[38px] px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                        selectedPresetId === preset.id
                          ? 'bg-[#B7F34A] text-[#0B0D0C] border-[#B7F34A]'
                          : 'bg-[#0B0D0C] text-[#D4DBD5] border-white/[0.1] hover:border-white/25'
                      }`}
                    >
                      {lang === 'bn' ? preset.labelBn : preset.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#F5F7F2] mb-1.5">
                    {lang === 'bn' ? '১. আপনার বিজনেসের নাম কী?' : '1. What is your business name?'}
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder={lang === 'bn' ? 'যেমন: সারা গার্মেন্টস' : 'e.g. Sara Garments'}
                    className="w-full min-h-[42px] px-3.5 py-2.5 rounded-xl bg-[#0B0D0C] border border-white/[0.12] focus:border-[#B7F34A]/60 focus:outline-none text-xs sm:text-sm text-[#F5F7F2]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#F5F7F2] mb-1.5">
                    {lang === 'bn' ? '২. বিজনেসের ক্যাটাগরি কী?' : '2. Business category'}
                  </label>
                  <input
                    type="text"
                    value={businessCategory}
                    onChange={(e) => setBusinessCategory(e.target.value)}
                    placeholder={
                      lang === 'bn' ? 'যেমন: গার্মেন্টস ও শাড়ি শপ' : 'e.g. Garments & Saree'
                    }
                    className="w-full min-h-[42px] px-3.5 py-2.5 rounded-xl bg-[#0B0D0C] border border-white/[0.12] focus:border-[#B7F34A]/60 focus:outline-none text-xs sm:text-sm text-[#F5F7F2]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#F5F7F2] mb-1.5">
                  {lang === 'bn'
                    ? '৩. আপনি কী কী প্রোডাক্ট বা সার্ভিস নিয়ে কাজ করেন?'
                    : '3. What products or services do you work with?'}
                </label>
                <textarea
                  rows={2}
                  value={whatYouWorkWith}
                  onChange={(e) => setWhatYouWorkWith(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0D0C] border border-white/[0.12] focus:border-[#B7F34A]/60 focus:outline-none text-xs sm:text-sm text-[#F5F7F2] leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#F5F7F2] mb-1.5">
                    {lang === 'bn'
                      ? '৪. কখন থেকে কতক্ষণ খোলা থাকে?'
                      : '4. Opening & support hours'}
                  </label>
                  <input
                    type="text"
                    value={openingHours}
                    onChange={(e) => setOpeningHours(e.target.value)}
                    className="w-full min-h-[42px] px-3.5 py-2.5 rounded-xl bg-[#0B0D0C] border border-white/[0.12] focus:border-[#B7F34A]/60 focus:outline-none text-xs sm:text-sm text-[#F5F7F2]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#F5F7F2] mb-1.5">
                    {lang === 'bn'
                      ? '৫. হটলাইন / হোয়াটসঅ্যাপ নাম্বার'
                      : '5. Hotline / WhatsApp number'}
                  </label>
                  <input
                    type="text"
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    className="w-full min-h-[42px] px-3.5 py-2.5 rounded-xl bg-[#0B0D0C] border border-white/[0.12] focus:border-[#B7F34A]/60 focus:outline-none text-xs sm:text-sm text-[#F5F7F2] tabular-nums"
                  />
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <label className="text-xs font-semibold text-[#F5F7F2]">
                    {lang === 'bn'
                      ? '৬. ডেলিভারি ও ক্যাশ অন ডেলিভারি নিয়ম'
                      : '6. Delivery & Cash on Delivery policy'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setCodAvailable((v) => !v)}
                    className={`min-h-[32px] px-3 py-1 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
                      codAvailable
                        ? 'bg-[#B7F34A]/15 border-[#B7F34A]/60 text-[#B7F34A]'
                        : 'bg-[#0B0D0C] border-white/15 text-[#A1AAA2]'
                    }`}
                  >
                    {codAvailable
                      ? lang === 'bn'
                        ? '✓ সারা বাংলাদেশে ক্যাশ অন ডেলিভারি চালু'
                        : '✓ Cash on Delivery Across Bangladesh'
                      : lang === 'bn'
                      ? 'ক্যাশ অন ডেলিভারি বন্ধ'
                      : 'Cash on Delivery Off'}
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={deliveryInfo}
                  onChange={(e) => setDeliveryInfo(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0D0C] border border-white/[0.12] focus:border-[#B7F34A]/60 focus:outline-none text-xs sm:text-sm text-[#F5F7F2]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#F5F7F2] mb-1.5">
                  {lang === 'bn'
                    ? '৭. অতিরিক্ত নির্দেশনা (ঐচ্ছিক)'
                    : '7. Extra guidance for the AI agent (optional)'}
                </label>
                <input
                  type="text"
                  value={extraNotes}
                  onChange={(e) => setExtraNotes(e.target.value)}
                  className="w-full min-h-[42px] px-3.5 py-2.5 rounded-xl bg-[#0B0D0C] border border-white/[0.12] focus:border-[#B7F34A]/60 focus:outline-none text-xs sm:text-sm text-[#F5F7F2]"
                />
              </div>

              <div className="pt-3 border-t border-white/[0.09] flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveStep('channels')}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl glossy-btn text-xs flex items-center gap-2 cursor-pointer"
                >
                  <span>
                    {lang === 'bn'
                      ? 'পরবর্তী: ফেসবুক ও হোয়াটসঅ্যাপ কানেক্ট করুন'
                      : 'Next: Connect Facebook & WhatsApp'}
                  </span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Right: Product Catalog & Price Memory */}
            <div className="lg:col-span-5 bg-[#121614] border border-white/[0.09] rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="pb-3.5 border-b border-white/[0.09]">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-base sm:text-lg font-bold text-[#F5F7F2] flex items-center gap-2">
                    <ShoppingBag size={16} className="text-[#B7F34A]" />
                    <span>{lang === 'bn' ? 'প্রোডাক্ট ও প্রাইস লিস্ট' : 'Product & Price List'}</span>
                  </h3>
                  <span className="text-xs font-bold text-[#B7F34A] tabular-nums">
                    {catalog.length} {lang === 'bn' ? 'টি আইটেম' : 'items'}
                  </span>
                </div>
                <p className="text-xs text-[#A1AAA2] mt-1">
                  {lang === 'bn'
                    ? 'কাস্টমার ছবি পাঠালে বা প্রোডাক্টের নাম বললে জেমিনি এই তালিকা দেখে একদম সঠিক দাম বলবে। তালিকার বাইরের কিছু জিজ্ঞাসা করলে বলবে "আপনি একটু ওয়েট করুন, আমি জানাচ্ছি"।'
                    : 'Gemini uses this catalog when inspecting customer photos or price questions. Anything outside this catalog triggers the polite wait handoff.'}
                </p>
              </div>

              <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
                {catalog.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-[#0B0D0C]/80 border border-white/[0.08] flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-[#F5F7F2]">
                          {item.name}
                        </span>
                        <span className="text-xs font-bold text-[#B7F34A] tabular-nums">
                          {item.price}
                        </span>
                      </div>
                      {item.details && (
                        <p className="text-[11px] text-[#A1AAA2] mt-1 leading-relaxed">
                          {item.details}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCatalogItem(item.id)}
                      aria-label="Remove product"
                      className="min-w-[32px] min-h-[32px] rounded-lg hover:bg-red-500/15 text-[#A1AAA2] hover:text-red-300 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleAddCatalogItem}
                className="pt-3.5 border-t border-white/[0.09] space-y-2.5"
              >
                <div className="text-xs font-semibold text-[#D4DBD5]">
                  {lang === 'bn' ? '+ নতুন প্রোডাক্ট যোগ করুন' : '+ Add New Product'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder={lang === 'bn' ? 'প্রোডাক্টের নাম' : 'Product name'}
                    className="sm:col-span-2 min-h-[40px] px-3 py-2 rounded-xl bg-[#0B0D0C] border border-white/[0.12] focus:border-[#B7F34A]/60 focus:outline-none text-xs text-[#F5F7F2]"
                  />
                  <input
                    type="text"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    placeholder={lang === 'bn' ? 'দাম (৳১,৫০০)' : 'Price (৳1,500)'}
                    className="min-h-[40px] px-3 py-2 rounded-xl bg-[#0B0D0C] border border-white/[0.12] focus:border-[#B7F34A]/60 focus:outline-none text-xs text-[#F5F7F2]"
                  />
                </div>
                <input
                  type="text"
                  value={newItemDetails}
                  onChange={(e) => setNewItemDetails(e.target.value)}
                  placeholder={
                    lang === 'bn'
                      ? 'রং, সাইজ বা সংক্ষিপ্ত বিবরণ (ঐচ্ছিক)'
                      : 'Color, fabric, size or brief details (optional)'
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-[#0B0D0C] border border-white/[0.12] focus:border-[#B7F34A]/60 focus:outline-none text-xs text-[#F5F7F2]"
                />
                <button
                  type="submit"
                  className="w-full min-h-[40px] py-2 px-4 rounded-xl bg-[#171C19] hover:bg-[#1E2521] border border-white/15 text-xs font-semibold text-[#F5F7F2] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} className="text-[#B7F34A]" />
                  <span>{lang === 'bn' ? 'প্রোডাক্ট অ্যাড করুন' : 'Add Product to Catalog'}</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* STEP 2: CONNECT FACEBOOK PAGE, MESSENGER & WHATSAPP */}
        {activeStep === 'channels' && (
          <div className="bg-[#121614] border border-white/[0.09] rounded-2xl p-5 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-white/[0.09]">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#B7F34A]">
                  {lang === 'bn' ? 'ধাপ ০২ · চ্যানেল কানেকশন' : 'Step 02 · Social & Messaging Channels'}
                </span>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[#F5F7F2] mt-1">
                  {lang === 'bn'
                    ? 'ফেসবুক পেজ, মেসেঞ্জার ও হোয়াটসঅ্যাপ কানেক্ট করুন'
                    : 'Connect Facebook Page, Messenger & WhatsApp'}
                </h2>
                <p className="text-xs text-[#A1AAA2] mt-1">
                  {lang === 'bn'
                    ? 'কানেক্ট করা হয়ে গেলে জেমিনি এআই এজেন্ট আপনার পেজ, মেসেঞ্জার ও হোয়াটসঅ্যাপে আসা কাস্টমার মেসেজ এবং প্রোডাক্ট ছবি বুঝে সরাসরি রিপ্লাই দেবে।'
                    : 'Once connected, your Gemini agent handles incoming customer messages and product photos across Facebook Page, Messenger, and WhatsApp.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setChannels((prev) => ({
                      ...prev,
                      facebookPageName: prev.facebookPageName || `${businessName || 'My Business'} Official`,
                      whatsappNumber: prev.whatsappNumber || supportPhone || '+880 1767-079837',
                      facebookPageConnected: true,
                      messengerConnected: true,
                      whatsappConnected: true,
                    }))
                  }
                  className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#B7F34A] text-[#0B0D0C] text-xs font-bold cursor-pointer whitespace-nowrap"
                >
                  {lang === 'bn' ? '১ ক্লিকে সব কানেক্ট করুন' : 'Auto-Connect All'}
                </button>
                <span className="text-xs font-bold text-[#B7F34A] tabular-nums">
                  {connectedChannelCount}/3 {lang === 'bn' ? 'কানেক্টেড' : 'Connected'}
                </span>
              </div>
            </div>

            {/* Live Meta Webhook Endpoint Strip for Direct Production Facebook Messenger & WhatsApp Connection */}
            <div className="p-4 rounded-xl bg-[#0B0D0C]/80 border border-white/[0.09] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#F5F7F2] mb-1">
                  {lang === 'bn'
                    ? 'অফিশিয়াল Meta Webhook (Facebook Messenger ও WhatsApp Cloud API)'
                    : 'Official Meta Webhook (Facebook Messenger & WhatsApp Cloud API)'}
                </div>
                <div className="text-[11px] font-mono text-[#B7F34A] break-all">
                  {metaStatus?.webhookUrl || 'https://mirrorbook.site/api/mirrorbot/meta-webhook'}
                </div>
                <div className="text-[11px] text-[#A1AAA2] mt-1">
                  {lang === 'bn'
                    ? `সার্ভার স্ট্যাটাস: Messenger API ${
                        metaStatus?.facebookMessengerConfigured ? 'যুক্ত আছে' : 'Meta App Token পেন্ডিং'
                      } · WhatsApp Cloud API ${
                        metaStatus?.whatsappCloudConfigured ? 'যুক্ত আছে' : 'Meta Token পেন্ডিং'
                      }`
                    : `Server Bridge: Messenger API ${
                        metaStatus?.facebookMessengerConfigured ? 'Active' : 'Awaiting Meta Token'
                      } · WhatsApp Cloud API ${
                        metaStatus?.whatsappCloudConfigured ? 'Active' : 'Awaiting Meta Token'
                      }`}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        metaStatus?.webhookUrl || 'https://mirrorbook.site/api/mirrorbot/meta-webhook'
                      );
                      setCopiedWebhook(true);
                      window.setTimeout(() => setCopiedWebhook(false), 2000);
                    } catch {
                      setCopiedWebhook(false);
                    }
                  }}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#171C19] hover:bg-[#1E2521] border border-white/15 text-xs font-semibold text-[#F5F7F2] flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  {copiedWebhook ? <Check size={13} className="text-[#B7F34A]" /> : <Copy size={13} />}
                  <span>
                    {copiedWebhook
                      ? lang === 'bn'
                        ? 'কপি হয়েছে'
                        : 'Copied'
                      : lang === 'bn'
                      ? 'Webhook URL কপি'
                      : 'Copy Webhook URL'}
                  </span>
                </button>
                <a
                  href="https://developers.facebook.com/apps/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#171C19] hover:bg-[#1E2521] border border-[#B7F34A]/40 text-xs font-semibold text-[#B7F34A] flex items-center gap-1.5 whitespace-nowrap"
                >
                  <span>{lang === 'bn' ? 'Meta Business কানেক্ট' : 'Open Meta Console'}</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1. Facebook Page */}
              <div className="p-5 rounded-2xl bg-[#0B0D0C]/80 border border-white/[0.09] flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#171C19] border border-white/[0.1] flex items-center justify-center text-[#B7F34A]">
                      <Facebook size={18} />
                    </div>
                    <span
                      className={`text-[11px] font-bold ${
                        channels.facebookPageConnected ? 'text-[#B7F34A]' : 'text-[#A1AAA2]'
                      }`}
                    >
                      {channels.facebookPageConnected
                        ? lang === 'bn'
                          ? 'কানেক্টেড'
                          : 'Connected'
                        : lang === 'bn'
                        ? 'কানেক্ট করুন'
                        : 'Not Connected'}
                    </span>
                  </div>
                  <h3 className="font-display text-base font-bold text-[#F5F7F2] mb-1">
                    {lang === 'bn' ? 'ফেসবুক পেজ' : 'Facebook Page'}
                  </h3>
                  <p className="text-xs text-[#A1AAA2] leading-relaxed mb-3">
                    {lang === 'bn'
                      ? 'আপনার বিজনেস ফেসবুক পেজ লিংক করুন যাতে পোস্ট কমেন্ট ও ইনবক্স সিঙ্ক থাকে।'
                      : 'Link your business Facebook Page for page identity and inbox syncing.'}
                  </p>
                  <input
                    type="text"
                    value={channels.facebookPageName}
                    onChange={(e) =>
                      setChannels((prev) => ({ ...prev, facebookPageName: e.target.value }))
                    }
                    placeholder={lang === 'bn' ? 'ফেসবুক পেজের নাম' : 'Facebook Page Name'}
                    className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-[#121614] border border-white/[0.12] focus:border-[#B7F34A]/60 focus:outline-none text-xs text-[#F5F7F2]"
                  />
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setChannels((prev) => ({
                      ...prev,
                      facebookPageConnected: !prev.facebookPageConnected,
                    }))
                  }
                  className={`w-full min-h-[42px] py-2 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    channels.facebookPageConnected
                      ? 'bg-[#B7F34A] text-[#0B0D0C]'
                      : 'bg-[#171C19] text-[#F5F7F2] border border-white/15 hover:border-[#B7F34A]/60'
                  }`}
                >
                  <CheckCircle2 size={14} />
                  <span>
                    {channels.facebookPageConnected
                      ? lang === 'bn'
                        ? 'ফেসবুক পেজ কানেক্টেড'
                        : 'Page Connected'
                      : lang === 'bn'
                      ? 'ফেসবুক পেজ কানেক্ট করুন'
                      : 'Connect Facebook Page'}
                  </span>
                </button>
              </div>

              {/* 2. Facebook Messenger */}
              <div className="p-5 rounded-2xl bg-[#0B0D0C]/80 border border-white/[0.09] flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#171C19] border border-white/[0.1] flex items-center justify-center text-[#B7F34A]">
                      <MessageCircle size={18} />
                    </div>
                    <span
                      className={`text-[11px] font-bold ${
                        channels.messengerConnected ? 'text-[#B7F34A]' : 'text-[#A1AAA2]'
                      }`}
                    >
                      {channels.messengerConnected
                        ? lang === 'bn'
                          ? 'কানেক্টেড'
                          : 'Connected'
                        : lang === 'bn'
                        ? 'কানেক্ট করুন'
                        : 'Not Connected'}
                    </span>
                  </div>
                  <h3 className="font-display text-base font-bold text-[#F5F7F2] mb-1">
                    {lang === 'bn' ? 'ফেসবুক মেসেঞ্জার' : 'Facebook Messenger'}
                  </h3>
                  <p className="text-xs text-[#A1AAA2] leading-relaxed mb-3">
                    {lang === 'bn'
                      ? 'কাস্টমার মেসেঞ্জারে শাড়ি বা প্রোডাক্টের ছবি পাঠিয়ে দাম জানতে চাইলে জেমিনি ছবি দেখে সরাসরি উত্তর দেবে ও অর্ডার নেবে।'
                      : 'Reads incoming Messenger texts and product photos so Gemini replies with prices and confirms orders automatically.'}
                  </p>
                  <div className="text-[11px] text-[#D4DBD5] space-y-1.5 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Check size={12} className="text-[#B7F34A] shrink-0" />
                      <span>
                        {lang === 'bn'
                          ? 'প্রোডাক্ট ছবি দেখে দাম বলা'
                          : 'Vision inspection for product photos'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check size={12} className="text-[#B7F34A] shrink-0" />
                      <span>
                        {lang === 'bn'
                          ? 'অর্ডার নাম্বার ও ঠিকানা সংগ্রহ'
                          : 'Phone & address order collection'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setChannels((prev) => ({
                      ...prev,
                      messengerConnected: !prev.messengerConnected,
                    }))
                  }
                  className={`w-full min-h-[42px] py-2 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    channels.messengerConnected
                      ? 'bg-[#B7F34A] text-[#0B0D0C]'
                      : 'bg-[#171C19] text-[#F5F7F2] border border-white/15 hover:border-[#B7F34A]/60'
                  }`}
                >
                  <CheckCircle2 size={14} />
                  <span>
                    {channels.messengerConnected
                      ? lang === 'bn'
                        ? 'মেসেঞ্জার কানেক্টেড'
                        : 'Messenger Connected'
                      : lang === 'bn'
                      ? 'মেসেঞ্জার কানেক্ট করুন'
                      : 'Connect Messenger'}
                  </span>
                </button>
              </div>

              {/* 3. WhatsApp Business */}
              <div className="p-5 rounded-2xl bg-[#0B0D0C]/80 border border-white/[0.09] flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#171C19] border border-white/[0.1] flex items-center justify-center text-[#B7F34A]">
                      <Phone size={18} />
                    </div>
                    <span
                      className={`text-[11px] font-bold ${
                        channels.whatsappConnected ? 'text-[#B7F34A]' : 'text-[#A1AAA2]'
                      }`}
                    >
                      {channels.whatsappConnected
                        ? lang === 'bn'
                          ? 'কানেক্টেড'
                          : 'Connected'
                        : lang === 'bn'
                        ? 'কানেক্ট করুন'
                        : 'Not Connected'}
                    </span>
                  </div>
                  <h3 className="font-display text-base font-bold text-[#F5F7F2] mb-1">
                    {lang === 'bn' ? 'হোয়াটসঅ্যাপ বিজনেস' : 'WhatsApp Business'}
                  </h3>
                  <p className="text-xs text-[#A1AAA2] leading-relaxed mb-3">
                    {lang === 'bn'
                      ? 'হোয়াটসঅ্যাপে আসা কাস্টমার মেসেজের রিপ্লাই এবং অর্ডার কনফার্মেশন সিঙ্ক করুন।'
                      : 'Connect your WhatsApp Business number for instant customer replies and order alerts.'}
                  </p>
                  <input
                    type="text"
                    value={channels.whatsappNumber}
                    onChange={(e) =>
                      setChannels((prev) => ({ ...prev, whatsappNumber: e.target.value }))
                    }
                    placeholder="+880 1XXX-XXXXXX"
                    className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-[#121614] border border-white/[0.12] focus:border-[#B7F34A]/60 focus:outline-none text-xs text-[#F5F7F2] tabular-nums"
                  />
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setChannels((prev) => ({
                      ...prev,
                      whatsappConnected: !prev.whatsappConnected,
                    }))
                  }
                  className={`w-full min-h-[42px] py-2 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    channels.whatsappConnected
                      ? 'bg-[#B7F34A] text-[#0B0D0C]'
                      : 'bg-[#171C19] text-[#F5F7F2] border border-white/15 hover:border-[#B7F34A]/60'
                  }`}
                >
                  <CheckCircle2 size={14} />
                  <span>
                    {channels.whatsappConnected
                      ? lang === 'bn'
                        ? 'হোয়াটসঅ্যাপ কানেক্টেড'
                        : 'WhatsApp Connected'
                      : lang === 'bn'
                      ? 'হোয়াটসঅ্যাপ কানেক্ট করুন'
                      : 'Connect WhatsApp'}
                  </span>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.09] flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setActiveStep('business')}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-[#171C19] border border-white/15 text-xs font-semibold text-[#D4DBD5] hover:text-[#F5F7F2] cursor-pointer"
              >
                {lang === 'bn' ? '← পেছনে যান' : '← Back to Business Info'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveStep('agent-name');
                  if (nameSuggestions.length === 0) {
                    void handleSuggestNamesWithGemini();
                  }
                }}
                className="min-h-[44px] px-5 py-2.5 rounded-xl glossy-btn text-xs flex items-center gap-2 cursor-pointer"
              >
                <Sparkles size={14} />
                <span>
                  {lang === 'bn'
                    ? 'পরবর্তী: জেমিনি দিয়ে এআই বটের নাম সাজেস্ট করুন'
                    : 'Next: Suggest AI Agent Name with Gemini'}
                </span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: GEMINI AI AGENT NAME SUGGESTION */}
        {activeStep === 'agent-name' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-7 bg-[#121614] border border-white/[0.09] rounded-2xl p-5 sm:p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-white/[0.09]">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#B7F34A]">
                    {lang === 'bn' ? 'ধাপ ০৩ · এআই এজেন্টের নাম' : 'Step 03 · Name Your AI Agent'}
                  </span>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-[#F5F7F2] mt-1">
                    {lang === 'bn'
                      ? 'আপনার বিজনেসের এআই বটের নাম কী দেবেন?'
                      : 'What Should We Name Your Business AI Bot?'}
                  </h2>
                  <p className="text-xs text-[#A1AAA2] mt-1">
                    {lang === 'bn'
                      ? 'জেমিনি এআই আপনার বিজনেস অনুযায়ী নাম সাজেস্ট করবে। যেকোনো নামে ক্লিক করুন অথবা নিচে নিজের পছন্দের নাম লিখুন।'
                      : 'Gemini suggests friendly agent names tailored to your business. Click any suggestion or enter your own custom name.'}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isSuggestingNames}
                  onClick={handleSuggestNamesWithGemini}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-[#171C19] hover:bg-[#1E2521] border border-[#B7F34A]/45 text-xs font-semibold text-[#B7F34A] flex items-center gap-2 cursor-pointer disabled:opacity-60 shrink-0"
                >
                  {isSuggestingNames ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Sparkles size={14} />
                  )}
                  <span>
                    {isSuggestingNames
                      ? lang === 'bn'
                        ? 'জেমিনি সাজেস্ট করছে...'
                        : 'Generating...'
                      : lang === 'bn'
                      ? 'জেমিনি নাম সাজেস্ট'
                      : 'Suggest with Gemini'}
                  </span>
                </button>
              </div>

              {nameError && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-200 flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-300" />
                  <span>{nameError}</span>
                </div>
              )}

              {/* Gemini Suggested Name Buttons */}
              {isSuggestingNames ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className="h-20 rounded-xl bg-[#0B0D0C]/70 border border-white/[0.07] animate-pulse"
                    />
                  ))}
                </div>
              ) : nameSuggestions.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {nameSuggestions.map((s, idx) => {
                    const isPicked = botName.trim().toLowerCase() === s.name.trim().toLowerCase();
                    return (
                      <button
                        key={`${s.name}-${idx}`}
                        type="button"
                        onClick={() => setBotName(s.name)}
                        className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                          isPicked
                            ? 'bg-[#171C19] border-[#B7F34A] text-[#F5F7F2]'
                            : 'bg-[#0B0D0C]/80 border-white/[0.09] hover:border-white/25 text-[#D4DBD5]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display text-base font-bold text-[#F5F7F2]">
                            {s.name}
                          </span>
                          {isPicked && <CheckCircle2 size={15} className="text-[#B7F34A]" />}
                        </div>
                        <p className="text-[11px] text-[#A1AAA2] mt-1 leading-relaxed">
                          {s.personaNote}
                        </p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-5 rounded-xl bg-[#0B0D0C]/70 border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-xs text-[#A1AAA2]">
                    {lang === 'bn'
                      ? `"${businessName}" এর জন্য জেমিনি দিয়ে উপযুক্ত এআই এজেন্টের নাম সাজেস্ট করতে বাটনে ক্লিক করুন।`
                      : `Click to generate tailored AI agent names for "${businessName}" with Gemini.`}
                  </p>
                  <button
                    type="button"
                    onClick={handleSuggestNamesWithGemini}
                    className="min-h-[38px] px-4 py-2 rounded-xl bg-[#B7F34A] text-[#0B0D0C] text-xs font-bold whitespace-nowrap cursor-pointer"
                  >
                    {lang === 'bn' ? 'নাম সাজেস্ট করুন' : 'Suggest Names'}
                  </button>
                </div>
              )}

              {/* Custom Agent Name Input */}
              <div>
                <label className="block text-xs font-semibold text-[#F5F7F2] mb-1.5">
                  {lang === 'bn'
                    ? 'সিলেক্টেড / কাস্টম এআই বটের নাম'
                    : 'Selected / Custom AI Agent Name'}
                </label>
                <input
                  type="text"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  placeholder={lang === 'bn' ? 'যেমন: সারা' : 'e.g. Sara'}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#0B0D0C] border border-white/[0.14] focus:border-[#B7F34A]/60 focus:outline-none text-sm font-semibold text-[#F5F7F2]"
                />
              </div>

              <div className="pt-4 border-t border-white/[0.09] flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setActiveStep('channels')}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-[#171C19] border border-white/15 text-xs font-semibold text-[#D4DBD5] hover:text-[#F5F7F2] cursor-pointer"
                >
                  {lang === 'bn' ? '← পেছনে যান' : '← Back'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep('live-agent')}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl glossy-btn text-xs flex items-center gap-2 cursor-pointer"
                >
                  <span>
                    {lang === 'bn'
                      ? 'পরবর্তী: লাইভ জেমিনি এজেন্ট চালু করুন'
                      : 'Launch Live Gemini Agent'}
                  </span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Right: Live Persona Introduction Preview */}
            <div className="lg:col-span-5 bg-[#121614] border border-white/[0.09] rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-white/[0.09]">
                <div className="w-12 h-12 rounded-xl bg-[#0B0D0C] border border-[#B7F34A]/40 flex items-center justify-center text-[#B7F34A] shrink-0">
                  <Bot size={22} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#B7F34A] truncate">
                    {businessName || 'Your Business'}
                  </div>
                  <div className="font-display text-lg font-bold text-[#F5F7F2] truncate">
                    {botName || 'Mirror Bot'}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-semibold text-[#A1AAA2]">
                  {lang === 'bn' ? 'কাস্টমারকে যেভাবে পরিচয় দেবে:' : 'Sample Agent Introduction:'}
                </div>
                <div className="p-4 rounded-2xl rounded-bl-sm bg-[#171C19] border border-white/[0.09] text-xs sm:text-sm text-[#F5F7F2] leading-relaxed">
                  {lang === 'bn'
                    ? `আচ্ছা ম্যাম/স্যার, আমি ${businessName || 'আপনার বিজনেস'}-এর ${
                        botName || 'এজেন্ট'
                      } বলছিলাম। আমাদের ${
                        catalog[0]?.name || 'প্রোডাক্ট'
                      }-এর দাম ${
                        catalog[0]?.price || 'তালিকা অনুযায়ী'
                      }। আপনি কি এটি নিতে চান?`
                    : `Hello! I'm ${botName || 'your assistant'} from ${
                        businessName || 'your business'
                      }. Our ${catalog[0]?.name || 'featured item'} is priced at ${
                        catalog[0]?.price || 'catalog rate'
                      }. Would you like to order it?`}
                </div>

                <div className="pt-2 space-y-2 text-xs text-[#A1AAA2]">
                  <div className="flex items-center gap-2">
                    <Store size={13} className="text-[#B7F34A] shrink-0" />
                    <span className="truncate">{businessCategory}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={13} className="text-[#B7F34A] shrink-0" />
                    <span className="truncate">{openingHours}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCheck size={13} className="text-[#B7F34A] shrink-0" />
                    <span>
                      {lang === 'bn'
                        ? 'অজানা প্রশ্নে বলবে: "আপনি একটু ওয়েট করুন, আমি জানাচ্ছি"'
                        : 'Unknown queries reply: "Please wait a moment, I will check and let you know"'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: LIVE GEMINI MULTIMODAL CUSTOMER AGENT */}
        {activeStep === 'live-agent' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: Live Multi-Turn & Vision Chat Console */}
            <div className="lg:col-span-8 bg-[#121614] border border-white/[0.09] rounded-2xl overflow-hidden flex flex-col">
              {/* Chat Header */}
              <div className="px-4 sm:px-5 py-3.5 border-b border-white/[0.09] bg-[#171C19]/70 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#0B0D0C] border border-[#B7F34A]/40 p-1.5 flex items-center justify-center shrink-0">
                    <img
                      src="/mirrorbook-ai-support-icon.svg"
                      alt="Mirror Bot"
                      width={28}
                      height={28}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-[#F5F7F2] truncate">
                      {botName || 'Mirror Bot'} · {businessName || 'Business'}
                    </div>
                    <div className="text-[11px] text-[#A1AAA2] truncate">
                      Gemini Vision &amp; Chat · {catalog.length}{' '}
                      {lang === 'bn' ? 'টি প্রোডাক্ট লোডেড' : 'products loaded'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {(
                    [
                      { id: 'messenger', label: 'Messenger' },
                      { id: 'whatsapp', label: 'WhatsApp' },
                      { id: 'facebook', label: 'FB Page' },
                    ] as const
                  ).map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setActiveChannelView(ch.id)}
                      className={`min-h-[32px] px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                        activeChannelView === ch.id
                          ? 'bg-[#B7F34A] text-[#0B0D0C]'
                          : 'bg-[#0B0D0C] text-[#A1AAA2] hover:text-[#F5F7F2] border border-white/[0.08]'
                      }`}
                    >
                      {ch.label}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      setMessages([]);
                      setChatError('');
                      setPendingImage(null);
                    }}
                    title={lang === 'bn' ? 'নতুন চ্যাট' : 'New Chat'}
                    className="min-h-[32px] px-2.5 py-1 rounded-lg bg-[#0B0D0C] hover:bg-[#1E2521] border border-white/[0.1] text-[11px] font-semibold text-[#D4DBD5] flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={12} />
                    <span>{lang === 'bn' ? 'রিসেট' : 'Reset'}</span>
                  </button>
                </div>
              </div>

              {/* Conversation Thread */}
              <div
                ref={chatScrollRef}
                className="p-4 sm:p-5 space-y-3.5 h-[430px] overflow-y-auto bg-[#0B0D0C]/70"
              >
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto px-2">
                    <div className="w-12 h-12 rounded-2xl bg-[#121614] border border-white/[0.1] flex items-center justify-center text-[#B7F34A] mb-3">
                      <Sparkles size={20} />
                    </div>
                    <h3 className="font-display text-base font-bold text-[#F5F7F2] mb-1.5">
                      {lang === 'bn'
                        ? `${businessName}-এর "${botName}" লাইভ চ্যাটের জন্য প্রস্তুত`
                        : `"${botName}" for ${businessName} is Ready`}
                    </h3>
                    <p className="text-xs text-[#A1AAA2] leading-relaxed mb-4">
                      {lang === 'bn'
                        ? 'নিচের ক্যামেরা আইকনে ক্লিক করে শাড়ি বা যেকোনো প্রোডাক্টের ছবি আপলোড করে দাম জানতে চান, অথবা ডানপাশের স্যাম্পল প্রশ্ন বাটনে ক্লিক করে অর্ডার ফ্লো টেস্ট করুন।'
                        : 'Upload a product photo using the photo button below and ask its price, or click a sample customer message on the right to test the full Cash-on-Delivery order flow.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-[#171C19] hover:bg-[#1E2521] border border-[#B7F34A]/45 text-xs font-semibold text-[#B7F34A] flex items-center gap-2 cursor-pointer"
                    >
                      <ImagePlus size={15} />
                      <span>
                        {lang === 'bn'
                          ? 'প্রোডাক্টের ছবি আপলোড করে টেস্ট করুন'
                          : 'Upload a Product Photo to Test'}
                      </span>
                    </button>
                  </div>
                )}

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === 'customer' ? 'items-end' : 'items-start'
                    }`}
                  >
                    {msg.imagePreviewUrl && (
                      <div className="mb-1.5 max-w-[220px] rounded-xl overflow-hidden border border-[#B7F34A]/40 bg-[#121614]">
                        <img
                          src={msg.imagePreviewUrl}
                          alt="Customer uploaded product"
                          className="w-full h-auto max-h-48 object-cover"
                        />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.sender === 'customer'
                          ? 'bg-[#B7F34A] text-[#0B0D0C] font-medium rounded-br-sm'
                          : msg.needsHumanWait
                          ? 'bg-amber-500/12 text-[#F5F7F2] border border-amber-400/40 rounded-bl-sm'
                          : 'bg-[#171C19] text-[#F5F7F2] border border-white/[0.1] rounded-bl-sm'
                      }`}
                    >
                      {msg.text}
                    </div>

                    <div className="mt-1 px-1 flex flex-wrap items-center gap-2 text-[10px] text-[#A1AAA2]">
                      <span>
                        {msg.sender === 'customer'
                          ? lang === 'bn'
                            ? 'কাস্টমার'
                            : 'Customer'
                          : `${botName || 'Mirror Bot'} (${activeChannelView})`}
                      </span>
                      {msg.timestamp && (
                        <>
                          <span>·</span>
                          <span className="tabular-nums">{msg.timestamp}</span>
                        </>
                      )}
                      {msg.imageObserved && (
                        <>
                          <span>·</span>
                          <span className="text-[#B7F34A]">{msg.imageObserved}</span>
                        </>
                      )}
                      {msg.needsHumanWait && (
                        <>
                          <span>·</span>
                          <span className="text-amber-300 font-semibold">
                            {lang === 'bn' ? 'হিউম্যান ফলো-আপ পেন্ডিং' : 'Human Follow-Up Needed'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))}

                {(isSending || isTypingFollowUp) && (
                  <div className="flex items-center gap-2 text-xs text-[#A1AAA2] px-2">
                    <Loader2 size={14} className="animate-spin text-[#B7F34A]" />
                    <span>
                      {isTypingFollowUp
                        ? lang === 'bn'
                          ? `${botName} পরবর্তী মেসেজ লিখছে...`
                          : `${botName} is typing follow-up...`
                        : lang === 'bn'
                        ? `${botName} ছবি ও মেসেজ দেখে রিপ্লাই তৈরি করছে...`
                        : `${botName} is inspecting your message with Gemini...`}
                    </span>
                  </div>
                )}
              </div>

              {/* Error Banner (Honest real API error propagation) */}
              {chatError && (
                <div className="px-4 py-2.5 bg-red-500/10 border-t border-red-500/30 text-xs text-red-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertCircle size={14} className="text-red-300 shrink-0" />
                    <span className="truncate">{chatError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setChatError('')}
                    className="text-red-300 hover:text-white cursor-pointer shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Pending Image Preview Strip */}
              {pendingImage && (
                <div className="px-4 py-2.5 bg-[#171C19] border-t border-white/[0.09] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={pendingImage.previewUrl}
                      alt="Preview"
                      className="w-10 h-10 rounded-lg object-cover border border-[#B7F34A]/50 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#F5F7F2] truncate">
                        {pendingImage.fileName}
                      </div>
                      <div className="text-[11px] text-[#B7F34A]">
                        {lang === 'bn'
                          ? 'জেমিনি ছবিটি দেখে রিপ্লাই দেবে'
                          : 'Ready for Gemini photo inspection'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPendingImage(null)}
                    className="min-w-[32px] min-h-[32px] rounded-lg hover:bg-white/10 text-[#A1AAA2] hover:text-white flex items-center justify-center cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Message Input Bar with Real Photo Upload */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void sendCustomerMessage();
                }}
                className="p-3.5 border-t border-white/[0.09] bg-[#121614] flex items-center gap-2"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handlePhotoSelected}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title={lang === 'bn' ? 'প্রোডাক্টের ছবি আপলোড করুন' : 'Attach product photo'}
                  className="min-w-[44px] min-h-[44px] rounded-xl bg-[#171C19] hover:bg-[#1E2521] border border-white/[0.12] hover:border-[#B7F34A]/50 text-[#B7F34A] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <ImagePlus size={18} />
                </button>

                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={isSending}
                  placeholder={
                    lang === 'bn'
                      ? 'কাস্টমার হিসেবে মেসেজ লিখুন (যেমন: এই শাড়িটার দাম কত?)...'
                      : 'Type as a customer (e.g. How much is this saree?)...'
                  }
                  className="flex-1 min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#0B0D0C] border border-white/[0.12] focus:border-[#B7F34A]/60 focus:outline-none text-xs sm:text-sm text-[#F5F7F2] placeholder:text-[#A1AAA2]/70"
                />

                <button
                  type="submit"
                  disabled={isSending || (!chatInput.trim() && !pendingImage)}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl glossy-btn text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <Send size={14} />
                  <span>{lang === 'bn' ? 'পাঠান' : 'Send'}</span>
                </button>
              </form>
            </div>

            {/* Right: Quick Test Prompts + Live Captured Orders Panel */}
            <div className="lg:col-span-4 space-y-4">
              {/* Quick Customer Messages */}
              <div className="bg-[#121614] border border-white/[0.09] rounded-2xl p-4 sm:p-5">
                <h3 className="font-display text-sm font-bold text-[#F5F7F2] mb-1">
                  {lang === 'bn' ? 'কাস্টমার টেস্ট বাটন' : 'Quick Customer Scenarios'}
                </h3>
                <p className="text-[11px] text-[#A1AAA2] mb-3">
                  {lang === 'bn'
                    ? 'ধারাবাহিকভাবে ক্লিক করে দাম জানা, অর্ডার কনফার্মেশন ও ওয়েট মেসেজ দেখুন'
                    : 'Click in order to test pricing, 2-step Cash-on-Delivery order flow, and wait handoff'}
                </p>
                <div className="space-y-2">
                  {sampleCustomerMessages.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={isSending}
                      onClick={() => void sendCustomerMessage(item.label)}
                      className="w-full text-left p-3 rounded-xl bg-[#0B0D0C]/80 hover:bg-[#171C19] border border-white/[0.08] hover:border-[#B7F34A]/50 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <div className="text-xs text-[#F5F7F2] font-medium leading-snug">
                        {item.label}
                      </div>
                      <div className="text-[10px] text-[#B7F34A] mt-1">{item.hint}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Captured Orders & Escalations */}
              <div className="bg-[#121614] border border-white/[0.09] rounded-2xl p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-white/[0.09]">
                  <h3 className="font-display text-sm font-bold text-[#F5F7F2] flex items-center gap-1.5">
                    <PackageCheck size={15} className="text-[#B7F34A]" />
                    <span>{lang === 'bn' ? 'কনফার্মড অর্ডার লগ' : 'Captured Orders'}</span>
                  </h3>
                  <span className="text-xs font-bold text-[#B7F34A] tabular-nums">
                    {capturedOrders.length}
                  </span>
                </div>

                {capturedOrders.length === 0 ? (
                  <p className="text-xs text-[#A1AAA2] leading-relaxed">
                    {lang === 'bn'
                      ? 'কাস্টমার চ্যাটে নাম, ফোন নাম্বার ও ঠিকানা দিলে অর্ডারটি অটোমেটিক এখানে সেভ হয়ে দেখাবে।'
                      : 'When a customer shares their name, phone number, and delivery address in chat, Mirror Bot extracts and logs the order here automatically.'}
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {capturedOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-3 rounded-xl bg-[#0B0D0C]/80 border border-[#B7F34A]/35 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-[#F5F7F2]">{ord.customerName}</span>
                          <span className="font-mono text-[10px] text-[#B7F34A] tabular-nums">
                            {ord.id}
                          </span>
                        </div>
                        <div className="text-[#D4DBD5] tabular-nums">{ord.phone}</div>
                        <div className="text-[#A1AAA2]">{ord.address}</div>
                        <div className="text-[11px] text-[#B7F34A] pt-1">
                          {ord.productSummary} · {ord.priceNote}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {humanWaitCount > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/[0.09] text-xs text-amber-300 flex items-center justify-between tabular-nums">
                    <span>
                      {lang === 'bn' ? 'হিউম্যান ফলো-আপ পেন্ডিং:' : 'Pending human follow-up:'}
                    </span>
                    <span className="font-bold">{humanWaitCount}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Bottom Action Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="p-5 sm:p-6 rounded-2xl bg-[#121614] border border-white/[0.09] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-base sm:text-lg font-bold text-[#F5F7F2]">
              {lang === 'bn'
                ? 'আপনার ফেসবুক পেজ ও হোয়াটসঅ্যাপের জন্য লাইভ মিরর বট সেটআপ করতে চান?'
                : 'Want Mirror Bot Connected Live to Your Facebook Page & WhatsApp?'}
            </h3>
            <p className="text-xs text-[#A1AAA2] mt-1">
              {lang === 'bn'
                ? 'মিরর বট ওয়েব অ্যাপ ওপেন করুন অথবা আপনার বিজনেসের জন্য সম্পূর্ণ কাস্টম ইন্টিগ্রেশন নিতে মিররবুক টিমের সাথে যোগাযোগ করুন।'
                : 'Launch the Mirror Bot web app or talk to the MirrorBook team for full business onboarding and custom Messenger/WhatsApp integration.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <a
              href={MIRROR_BOT_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] px-5 py-2.5 text-xs glossy-btn rounded-xl flex items-center gap-2 whitespace-nowrap"
            >
              <span>{lang === 'bn' ? 'মিরর বট অ্যাপ খুলুন' : 'Open Mirror Bot App'}</span>
              <ExternalLink size={14} />
            </a>
            {onStartProject && (
              <button
                type="button"
                onClick={onStartProject}
                className="min-h-[44px] px-5 py-2.5 text-xs glossy-btn-secondary rounded-xl cursor-pointer whitespace-nowrap"
              >
                {lang === 'bn' ? 'কাস্টম সেটআপ রিকোয়েস্ট' : 'Request Custom Setup'}
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
