import { ServiceItem, PackageItem, PluginItem, CourseItem, TutorialItem, Order, ProductItem, ShowcaseItem } from '../types';

export const SERVICES: ServiceItem[] = [
  {
    id: 'video-editing',
    title: 'Cinematic Video Editing',
    subtitle: 'Professional video editing services in Bangladesh delivering high-retention commercial cuts, Hollywood color grading, and dynamic audio design.'
  },
  {
    id: 'reels-editing',
    title: 'Reels & Short-Form Video',
    subtitle: 'Viral hook pacing, kinetic captions, and high-retention visual timing tailored for brand campaigns across TikTok, Instagram, and YouTube.'
  },
  {
    id: 'graphic-design',
    title: 'Graphic Design & Branding',
    subtitle: 'Creative graphic design agency services in Bangladesh crafting minimalist brand identities, typography systems, and high-conversion vector assets.'
  },
  {
    id: 'web-development',
    title: 'Modern Web Development',
    subtitle: 'Full-cycle web development agency services in Bangladesh building ultra-fast responsive websites, custom web apps, and conversion architectures.'
  },
  {
    id: 'software-design-ai',
    title: 'Software Design with AI',
    subtitle: 'Bespoke AI automation workflows, custom Adobe plugin panels, and neural productivity tools engineered for high-performance creative teams.'
  },
  {
    id: 'advertising-campaigns',
    title: 'Advertising Campaigns',
    subtitle: 'Full-service digital marketing agency Bangladesh strategies, performance-driven video variants, direct response scripts, and paid acquisition assets.'
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
    price: 200,
    priceDisplay: '৳200',
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

  // PC & Phone Software
  {
    id: 'software-mirrorflow-studio',
    type: 'Software',
    category: 'PC & Mac',
    title: 'MirrorFlow Creator Studio (PC & Mac)',
    description: 'Standalone desktop production suite with GPU accelerated timeline, timeline batch render, and offline AI captioning.',
    price: 1999,
    priceDisplay: '৳1,999',
    thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    protectedUrl: 'https://drive.google.com/drive/folders/1bJ7CxftRuaE8FRPXQevZtBk6yZncsu3v?usp=drive_link',
    createdAt: '2026-10-10'
  },
  {
    id: 'software-reelsync-mobile',
    type: 'Software',
    category: 'Android & iOS',
    title: 'ReelSync Pro Mobile Engine (Phone)',
    description: 'High-speed viral reels generator for Android & iPhone with instant beat-sync, trending fonts, and lossless 4K export.',
    price: 499,
    priceDisplay: '৳499',
    thumbnailUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80',
    protectedUrl: 'https://drive.google.com/drive/folders/1bJ7CxftRuaE8FRPXQevZtBk6yZncsu3v?usp=drive_link',
    createdAt: '2026-10-11'
  },
  {
    id: 'software-audiosculpt-pc',
    type: 'Software',
    category: 'PC & Mac',
    title: 'AudioSculpt AI Denoiser & Enhancer (PC)',
    description: 'Clean room vocal isolator and studio-grade audio mastering tool for podcasters and editors.',
    price: 899,
    priceDisplay: '৳899',
    thumbnailUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80',
    protectedUrl: 'https://drive.google.com/drive/folders/1bJ7CxftRuaE8FRPXQevZtBk6yZncsu3v?usp=drive_link',
    createdAt: '2026-10-12'
  },
  {
    id: 'software-lensvault-mobile',
    type: 'Software',
    category: 'Android & iOS',
    title: 'LensVault Mobile Cinema LUT Camera',
    description: 'Real-time cinema log recording app with custom 3D LUT preview on iPhone & Android flagships.',
    price: 350,
    priceDisplay: '৳350',
    thumbnailUrl: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=800&q=80',
    protectedUrl: 'https://drive.google.com/drive/folders/1bJ7CxftRuaE8FRPXQevZtBk6yZncsu3v?usp=drive_link',
    createdAt: '2026-10-13'
  },

  // Free Tutorials (Official Khan Saheb / Khan Saheb Editz Masterclasses)
  {
    id: 'tut-bangladeshi-money-explosion',
    type: 'Free Tutorial',
    category: 'After Effects',
    title: 'Bangladeshi Money Explosion Effect | After Effects Tutorial in Bangla | Khan Saheb',
    description: '',
    price: 0,
    priceDisplay: 'Free',
    duration: '8:05',
    instructor: 'Khan Saheb Editz',
    thumbnailUrl: 'https://i.ytimg.com/vi/Zj9IE-1CQik/maxresdefault.jpg',
    protectedUrl: 'https://www.youtube.com/watch?v=Zj9IE-1CQik',
    createdAt: '2026-10-01'
  },
  {
    id: 'tut-dune-2-scene-recreation',
    type: 'Free Tutorial',
    category: 'After Effects',
    title: 'I Recreated a Scene from DUNE-2 || Bangla Tutorial || After Effect || Khan Saheb',
    description: '',
    price: 0,
    priceDisplay: 'Free',
    duration: '6:17',
    instructor: 'Khan Saheb Editz',
    thumbnailUrl: 'https://i.ytimg.com/vi/VHNqdusgG6g/maxresdefault.jpg',
    protectedUrl: 'https://www.youtube.com/watch?v=VHNqdusgG6g',
    createdAt: '2026-10-02'
  },
  {
    id: 'tut-social-media-poster-design',
    type: 'Free Tutorial',
    category: 'Photoshop',
    title: 'How To Master Social Media Poster Design || Bangla Tutorial || Khan Saheb Editz',
    description: '',
    price: 0,
    priceDisplay: 'Free',
    duration: '9:12',
    instructor: 'Khan Saheb Editz',
    thumbnailUrl: 'https://i.ytimg.com/vi/AO-lWDwrLTo/maxresdefault.jpg',
    protectedUrl: 'https://www.youtube.com/watch?v=AO-lWDwrLTo',
    createdAt: '2026-10-03'
  },
  {
    id: 'tut-improve-design-skill',
    type: 'Free Tutorial',
    category: 'Photoshop',
    title: 'Imporve Your Design Skill || Bangla Tutorial || Photoshop || Khan Saheb Editz',
    description: '',
    price: 0,
    priceDisplay: 'Free',
    duration: '9:12',
    instructor: 'Khan Saheb Editz',
    thumbnailUrl: 'https://i.ytimg.com/vi/Dg8MbL71kW8/maxresdefault.jpg',
    protectedUrl: 'https://www.youtube.com/watch?v=Dg8MbL71kW8',
    createdAt: '2026-10-04'
  },

  // Agency Packages (Two Separate Monthly Subscription Services Starting From ৳25,000/mo)
  {
    id: 'monthly-graphic-design',
    type: 'Agency Package',
    category: 'Monthly Retainer',
    title: 'Monthly Graphic Design',
    description: 'Consistent, creative, and brand-focused graphic design solutions for businesses wanting a strong social media presence. 4 designs/day (~120/month).',
    price: 25000,
    period: '/ month',
    priceDisplay: 'Starting From ৳25,000',
    createdAt: '2026-11-12'
  },
  {
    id: 'monthly-video-editing-reels',
    type: 'Agency Package',
    category: 'Monthly Retainer',
    title: 'Monthly Video Editing & Reels',
    description: 'Professional short-form video editing for brands and content creators. 2 edited reels/day (~60 reels/month), motion graphics, sound design & captions.',
    price: 25000,
    period: '/ month',
    priceDisplay: 'Starting From ৳25,000',
    createdAt: '2026-11-12'
  }
];

export const PACKAGES: PackageItem[] = [
  {
    id: 'monthly-graphic-design',
    name: 'Monthly Graphic Design',
    price: 25000,
    period: '/ month',
    priceDisplay: 'Starting From ৳25,000',
    description: 'Consistent, creative, and brand-focused graphic design solutions (4 designs/day, ~120/month).',
    featured: true
  },
  {
    id: 'monthly-video-editing-reels',
    name: 'Monthly Video Editing & Reels',
    price: 25000,
    period: '/ month',
    priceDisplay: 'Starting From ৳25,000',
    description: 'Professional short-form video editing (2 reels/day, ~60 reels/month, sound design & captions).',
    featured: true
  }
];

export const PLUGINS: PluginItem[] = [
  {
    id: 'plugin-easy-flow',
    title: 'Easy Flow Plugin',
    software: 'AE & Premiere Pro',
    price: 200,
    priceDisplay: '৳200',
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
    id: 'tut-bangladeshi-money-explosion',
    title: 'Bangladeshi Money Explosion Effect | After Effects Tutorial in Bangla | Khan Saheb',
    software: 'After Effects',
    duration: '8:05',
    description: '',
    instructor: 'Khan Saheb Editz',
    videoUrl: 'https://www.youtube.com/watch?v=Zj9IE-1CQik',
    thumbnailUrl: 'https://i.ytimg.com/vi/Zj9IE-1CQik/maxresdefault.jpg'
  },
  {
    id: 'tut-dune-2-scene-recreation',
    title: 'I Recreated a Scene from DUNE-2 || Bangla Tutorial || After Effect || Khan Saheb',
    software: 'After Effects',
    duration: '6:17',
    description: '',
    instructor: 'Khan Saheb Editz',
    videoUrl: 'https://www.youtube.com/watch?v=VHNqdusgG6g',
    thumbnailUrl: 'https://i.ytimg.com/vi/VHNqdusgG6g/maxresdefault.jpg'
  },
  {
    id: 'tut-social-media-poster-design',
    title: 'How To Master Social Media Poster Design || Bangla Tutorial || Khan Saheb Editz',
    software: 'Photoshop',
    duration: '9:12',
    description: '',
    instructor: 'Khan Saheb Editz',
    videoUrl: 'https://www.youtube.com/watch?v=AO-lWDwrLTo',
    thumbnailUrl: 'https://i.ytimg.com/vi/AO-lWDwrLTo/maxresdefault.jpg'
  },
  {
    id: 'tut-improve-design-skill',
    title: 'Imporve Your Design Skill || Bangla Tutorial || Photoshop || Khan Saheb Editz',
    software: 'Photoshop',
    duration: '9:12',
    description: '',
    instructor: 'Khan Saheb Editz',
    videoUrl: 'https://www.youtube.com/watch?v=Dg8MbL71kW8',
    thumbnailUrl: 'https://i.ytimg.com/vi/Dg8MbL71kW8/maxresdefault.jpg'
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
