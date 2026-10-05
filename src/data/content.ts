import { ServiceItem, PackageItem, PluginItem, CourseItem, TutorialItem, Order, ProductItem, ShowcaseItem } from '../types';

export const SERVICES: ServiceItem[] = [
  {
    id: 'video-editing',
    title: 'Cinematic Video Editing',
    subtitle: 'High-retention commercial cuts, Hollywood color grading, and dynamic audio design.'
  },
  {
    id: 'reels-editing',
    title: 'Reels & Short-Form Video',
    subtitle: 'Viral hook pacing, kinetic captions, and high-retention visual timing for TikTok and Instagram.'
  },
  {
    id: 'graphic-design',
    title: 'Graphic Design & Branding',
    subtitle: 'Minimalist brand identities, typography manuals, key marketing visuals, and vector assets.'
  },
  {
    id: 'web-development',
    title: 'Modern Web Development',
    subtitle: 'Ultra-fast responsive websites, custom web applications, and conversion-focused architectures.'
  },
  {
    id: 'software-design-ai',
    title: 'Software Design with AI',
    subtitle: 'Bespoke AI automation workflows, custom Adobe plugin panels, and neural productivity tools.'
  },
  {
    id: 'advertising-campaigns',
    title: 'Advertising Campaigns',
    subtitle: 'Performance-driven creative video variants, direct response scripts, and paid acquisition assets.'
  }
];

export const SHOWCASES: ShowcaseItem[] = [
  {
    id: 'showcase-1',
    title: 'Commercial Brand Film',
    subtitle: 'Cinematic 4K automotive campaign with custom sound design.',
    category: 'Commercial Video',
    client: 'Apex Mobility',
    duration: '0:45',
    description: 'High-speed precision automotive campaign with custom sound design and grading.',
    videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    stats: '1.8M Views',
    aspectRatio: '16:9'
  },
  {
    id: 'showcase-2',
    title: 'Viral Short-Form Series',
    subtitle: 'Sub-second hook pacing engineered for social media retention.',
    category: 'Short-Form Reels',
    client: 'Kinetix Media',
    duration: '0:32',
    description: 'Algorithmic vertical reels with kinetic subtitles and micro-cut pacing.',
    videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    stats: '840K Views',
    aspectRatio: '9:16'
  },
  {
    id: 'showcase-3',
    title: 'AI AutoCut Extension',
    subtitle: 'Automated silence removal and instant timeline ripple cutting.',
    category: 'AI Software & Tools',
    client: 'MirrorBook Labs',
    duration: '2:15',
    description: 'Demonstration of automated silence removal and timeline editing inside Premiere Pro.',
    videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    stats: '14K+ Installs',
    aspectRatio: '16:9'
  },
  {
    id: 'showcase-4',
    title: 'Fintech Platform Interface',
    subtitle: 'High-speed responsive dashboard with real-time analytics.',
    category: 'Web Platform',
    client: 'Obsidian Pay',
    duration: '1:10',
    description: 'Next-gen responsive interface with dark mode and real-time ledger.',
    videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    stats: '99.9% Uptime',
    aspectRatio: '16:9'
  }
];

export const INITIAL_PRODUCTS: ProductItem[] = [
  // Plugins
  {
    id: 'plugin-easy-flow',
    type: 'Plugin',
    category: 'AE & Premiere Pro',
    title: 'Easy Flow Plugin',
    description: 'Quick-access workflows and one-click timeline shortcuts for Premiere Pro & After Effects.',
    price: 20,
    priceDisplay: '৳20',
    thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    protectedUrl: 'https://drive.google.com/drive/folders/1bJ7CxftRuaE8FRPXQevZtBk6yZncsu3v?usp=drive_link',
    createdAt: '2026-10-05'
  },
  {
    id: 'plugin-autocut',
    type: 'Plugin',
    category: 'Premiere Pro',
    title: 'AI AutoCut Plugin',
    description: 'Automated silence, dead-time, and filler removal inside Premiere Pro.',
    price: 999,
    priceDisplay: '৳999',
    thumbnailUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80',
    protectedUrl: 'https://drive.google.com/drive/folders/1MB_AutoCut_Plugin_V2_Protected',
    createdAt: '2026-09-15'
  },
  {
    id: 'plugin-motionfx',
    type: 'Plugin',
    category: 'After Effects',
    title: 'MotionFX AI Plugin',
    description: 'Dynamic physics-based kinetic text animation and easing curves.',
    price: 1299,
    priceDisplay: '৳1,299',
    thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    protectedUrl: 'https://drive.google.com/drive/folders/1MB_MotionFX_AE_Protected',
    createdAt: '2026-09-18'
  },
  {
    id: 'plugin-neuralretouch',
    type: 'Plugin',
    category: 'Photoshop',
    title: 'Neural Retouch Plugin',
    description: 'One-click AI skin texture balancing and high-frequency color separation.',
    price: 799,
    priceDisplay: '৳799',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    protectedUrl: 'https://drive.google.com/drive/folders/1MB_NeuralRetouch_PS_Protected',
    createdAt: '2026-09-20'
  },
  {
    id: 'plugin-presetbundle',
    type: 'Plugin',
    category: 'Premiere Pro',
    title: 'Creator Preset Bundle',
    description: 'Over 150+ transitions, SFX pairings, and LUTs for speed editors.',
    price: 499,
    priceDisplay: '৳499',
    thumbnailUrl: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=800&q=80',
    protectedUrl: 'https://drive.google.com/drive/folders/1MB_CreatorPresetBundle_Protected',
    createdAt: '2026-09-22'
  },

  // Courses
  {
    id: 'course-video-reels',
    type: 'Course',
    category: 'Video Editing',
    title: 'Video & Reels Editing Course',
    description: 'Pacing, sound design, color grade workflows, and viral hook framing.',
    price: 1500,
    priceDisplay: '৳1,500',
    protectedUrl: 'https://drive.google.com/drive/folders/1MB_VideoReelsCourse_MasterClass_Protected',
    createdAt: '2026-09-25'
  },
  {
    id: 'course-design-ai',
    type: 'Course',
    category: 'Graphic Design',
    title: 'Graphic Design & AI Workflow Course',
    description: 'Branding fundamentals, spatial grids, typography, and generative AI asset integration.',
    price: 1200,
    priceDisplay: '৳1,200',
    protectedUrl: 'https://drive.google.com/drive/folders/1MB_GraphicDesignAI_Course_Protected',
    createdAt: '2026-09-26'
  },
  {
    id: 'course-plugin-creation',
    type: 'Course',
    category: 'AI Tools',
    title: 'AI Plugin & Software Creation Course',
    description: 'Scripting Adobe extensions, CEP panels, and modern generative AI microservices.',
    price: 2000,
    priceDisplay: '৳2,000',
    protectedUrl: 'https://drive.google.com/drive/folders/1MB_PluginCreation_SoftwareCourse_Protected',
    createdAt: '2026-09-28'
  },

  // Free Tutorials
  {
    id: 'tut-premiere-cuts',
    type: 'Free Tutorial',
    category: 'Premiere Pro',
    title: 'High-Retention Cutting in Premiere Pro',
    description: 'Master fast timeline editing, J-cuts, L-cuts, and micro-cuts for social attention retention.',
    price: 0,
    priceDisplay: 'Free',
    duration: '14 min',
    instructor: 'Lead Video Editor',
    protectedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    createdAt: '2026-09-29'
  },
  {
    id: 'tut-ae-kinetic',
    type: 'Free Tutorial',
    category: 'After Effects',
    title: 'Minimal Kinetic Typography & Bezier Curves',
    description: 'Crafting clean text motion graphics without templates using graph editor easing curves.',
    price: 0,
    priceDisplay: 'Free',
    duration: '22 min',
    instructor: 'Motion Designer',
    protectedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    createdAt: '2026-09-30'
  },
  {
    id: 'tut-ps-colorgrade',
    type: 'Free Tutorial',
    category: 'Photoshop',
    title: 'Precision Color Grading & Retouching',
    description: 'Tone curve manipulation, selective masking, and high-frequency color balance fundamentals.',
    price: 0,
    priceDisplay: 'Free',
    duration: '18 min',
    instructor: 'Art Director',
    protectedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    createdAt: '2026-10-01'
  },
  {
    id: 'tut-ai-automation',
    type: 'Free Tutorial',
    category: 'AI Tools',
    title: 'Building Custom AI Workflows for Creative Agencies',
    description: 'Automating asset tagging, background removal, and batch export scripts via Python and APIs.',
    price: 0,
    priceDisplay: 'Free',
    duration: '27 min',
    instructor: 'AI Software Engineer',
    protectedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    createdAt: '2026-10-02'
  },

  // Agency Packages
  {
    id: 'starter',
    type: 'Agency Package',
    category: 'Retainer',
    title: 'Starter',
    description: 'Reels Editing & Basic Design',
    price: 5000,
    period: '/ month',
    priceDisplay: '৳5,000',
    createdAt: '2026-09-10'
  },
  {
    id: 'growth',
    type: 'Agency Package',
    category: 'Retainer',
    title: 'Growth',
    description: 'Video Editing, Reels, Ad Creatives',
    price: 12000,
    period: '/ month',
    priceDisplay: '৳12,000',
    featured: true,
    createdAt: '2026-09-10'
  },
  {
    id: 'custom-ai-web',
    type: 'Agency Package',
    category: 'Custom Scope',
    title: 'Custom AI & Web',
    description: 'Web Development & AI Software Design',
    price: 15000,
    period: '+',
    priceDisplay: '৳15,000+',
    createdAt: '2026-09-10'
  }
];

export const PACKAGES: PackageItem[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 5000,
    period: '/ month',
    priceDisplay: '৳5,000',
    description: 'Reels Editing & Basic Design'
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 12000,
    period: '/ month',
    priceDisplay: '৳12,000',
    description: 'Video Editing, Reels, Ad Creatives',
    featured: true
  },
  {
    id: 'custom-ai-web',
    name: 'Custom AI & Web',
    price: 15000,
    period: '+',
    priceDisplay: '৳15,000+',
    description: 'Web Development & AI Software Design'
  }
];

export const PLUGINS: PluginItem[] = [
  {
    id: 'plugin-easy-flow',
    title: 'Easy Flow Plugin',
    software: 'AE & Premiere Pro',
    price: 20,
    priceDisplay: '৳20',
    thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    description: 'Quick-access workflows and one-click timeline shortcuts for Premiere Pro & After Effects.'
  },
  {
    id: 'plugin-autocut',
    title: 'AI AutoCut Plugin',
    software: 'Premiere Pro',
    price: 999,
    priceDisplay: '৳999',
    thumbnailUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80',
    description: 'Automated silence, dead-time, and filler removal inside Premiere Pro.'
  },
  {
    id: 'plugin-motionfx',
    title: 'MotionFX AI Plugin',
    software: 'After Effects',
    price: 1299,
    priceDisplay: '৳1,299',
    thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    description: 'Dynamic physics-based kinetic text animation and easing curves.'
  },
  {
    id: 'plugin-neuralretouch',
    title: 'Neural Retouch Plugin',
    software: 'Photoshop',
    price: 799,
    priceDisplay: '৳799',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    description: 'One-click AI skin texture balancing and high-frequency color separation.'
  },
  {
    id: 'plugin-presetbundle',
    title: 'Creator Preset Bundle',
    software: 'Premiere Pro',
    price: 499,
    priceDisplay: '৳499',
    thumbnailUrl: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=800&q=80',
    description: 'Over 150+ transitions, SFX pairings, and LUTs for speed editors.'
  }
];

export const COURSES: CourseItem[] = [
  {
    id: 'course-video-reels',
    title: 'Video & Reels Editing Course',
    price: 1500,
    priceDisplay: '৳1,500',
    thumbnailUrl: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=800&q=80',
    description: 'Pacing, sound design, color grade workflows, and viral hook framing.'
  },
  {
    id: 'course-design-ai',
    title: 'Graphic Design & AI Workflow Course',
    price: 1200,
    priceDisplay: '৳1,200',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    description: 'Branding fundamentals, spatial grids, typography, and generative AI asset integration.'
  },
  {
    id: 'course-plugin-creation',
    title: 'AI Plugin & Software Creation Course',
    price: 2000,
    priceDisplay: '৳2,000',
    thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
    description: 'Scripting Adobe extensions, CEP panels, and modern generative AI microservices.'
  }
];

export const TUTORIALS: TutorialItem[] = [
  {
    id: 'tut-premiere-cuts',
    title: 'High-Retention Cutting in Premiere Pro',
    software: 'Premiere Pro',
    duration: '14 min',
    description: 'Master fast timeline editing, J-cuts, L-cuts, and micro-cuts for social attention retention.',
    instructor: 'Lead Video Editor',
    videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'
  },
  {
    id: 'tut-ae-kinetic',
    title: 'Minimal Kinetic Typography & Bezier Curves',
    software: 'After Effects',
    duration: '22 min',
    description: 'Crafting clean text motion graphics without templates using graph editor easing curves.',
    instructor: 'Motion Designer',
    videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'
  },
  {
    id: 'tut-ps-colorgrade',
    title: 'Precision Color Grading & Retouching',
    software: 'Photoshop',
    duration: '18 min',
    description: 'Tone curve manipulation, selective masking, and high-frequency color balance fundamentals.',
    instructor: 'Art Director',
    videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'
  },
  {
    id: 'tut-ai-automation',
    title: 'Building Custom AI Workflows for Creative Agencies',
    software: 'AI Tools',
    duration: '27 min',
    description: 'Automating asset tagging, background removal, and batch export scripts via Python and APIs.',
    instructor: 'AI Software Engineer',
    videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'
  }
];

export const PAYMENT_CONFIG = {
  mobileAccounts: {
    bKash: {
      type: 'Personal / Send Money',
      number: '01767079837',
      instructions: 'Send Money to this personal number and copy your Transaction ID (TrxID).'
    },
    Nagad: {
      type: 'Personal / Send Money',
      number: '01767079837',
      instructions: 'Send Money to this personal number and enter your Transaction ID (TrxID).'
    },
    Rocket: {
      type: 'Personal / Send Money',
      number: '01767079837',
      instructions: 'Send Money to this personal number and enter your Transaction ID (TrxID).'
    },
    Upay: {
      type: 'Personal / Send Money',
      number: '01767079837',
      instructions: 'Send Money to this personal number and enter your Transaction ID (TrxID).'
    }
  },
  bankAccount: {
    bankName: 'Islami Bank Bangladesh PLC (IBBL)',
    accountName: 'MD SOUROV HOSEN',
    accountNumber: '20507776702266262',
    branchName: 'Main Branch / Local',
    routingNumber: '125271890',
  },
  secondaryBankAccount: {
    bankName: 'Dutch-Bangla Bank PLC (DBBL)',
    accountName: 'MD SOUROV HOSEN',
    accountNumber: '1641580109543',
    branchName: 'Local Branch / Fast Track',
    routingNumber: '090271890',
  },
  whatsAppNumber: '8801767079837'
};

export const INITIAL_DEMO_ORDERS: Order[] = [
  {
    id: 'MB-8921',
    customerName: 'Tanvir Hossain',
    customerEmail: 'tanvir.media@gmail.com',
    customerPhone: '+8801712984512',
    itemName: 'Growth Package',
    itemPrice: '৳12,000 / month',
    paymentMethod: 'bKash',
    senderAccount: '01712984512',
    trxId: 'BK9X82410L',
    createdAt: '2026-10-02 11:24 AM'
  },
  {
    id: 'MB-8922',
    customerName: 'Samira Rahman',
    customerEmail: 'samira.studio@outlook.com',
    customerPhone: '+8801822334455',
    itemName: 'MotionFX AI Plugin',
    itemPrice: '৳1,299',
    paymentMethod: 'Nagad',
    senderAccount: '01822334455',
    trxId: 'NG67192801',
    createdAt: '2026-10-03 04:15 PM'
  }
];
