export interface RouteSeoConfig {
  title: string;
  description: string;
  keywords: string;
  canonicalUrl: string;
  robots: string;
  ogType: string;
  ogImage: string;
  ogImageAlt: string;
}

const SITE = 'https://mirrorbook.site';
const DEFAULT_OG_IMAGE = `${SITE}/mirrorbook-logo.png`;
const INDEX_ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
const NOINDEX_ROBOTS = 'noindex, nofollow';

export const ROUTE_SEO_CONFIG: Record<string, RouteSeoConfig> = {
  '/': {
    title: 'MirrorBook – Reflecting Creativity',
    description:
      'Reflecting Creativity. MirrorBook (মিরর বুক – রিফ্লেক্টিং ক্রিয়েটিভিটি) is a creative studio for graphic design, video editing, web development, plugins, and Mirror Bot AI.',
    keywords:
      'MirrorBook, Mirror Book, মিরর বুক, Reflecting Creativity, রিফ্লেক্টিং ক্রিয়েটিভিটি, creative agency Bangladesh, graphic design, video editing, motion graphics, branding, web development, digital products, MirrorPOS, Mirror Bot',
    canonicalUrl: `${SITE}/`,
    robots: INDEX_ROBOTS,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: 'MirrorBook official logo – Reflecting Creativity',
  },
  '/mirrorpos': {
    title: 'MirrorPOS | Smart POS Software for Businesses',
    description:
      'Explore MirrorPOS by MirrorBook, smart POS software for modern businesses with billing, inventory, sales, expenses, customer and supplier management, analytics, and offline-first workflows.',
    keywords:
      'MirrorPOS, POS software Bangladesh, point of sale software, inventory management, billing software, sales management, retail POS, MirrorBook',
    canonicalUrl: `${SITE}/mirrorpos`,
    robots: INDEX_ROBOTS,
    ogType: 'product',
    ogImage: `${SITE}/mirror-pos-icon.png`,
    ogImageAlt: 'MirrorPOS software by MirrorBook',
  },
  '/mirrorbot': {
    title: 'Mirror Bot | MirrorBook AI Support Auto-Reply Agent',
    description:
      'Connect Facebook Page, Messenger & WhatsApp in one click with Mirror Bot by MirrorBook for automatic AI replies to comments, messages, and customer photos.',
    keywords:
      'Mirror Bot, MirrorBook AI Support, AI support agent, auto reply bot Bangladesh, customer support automation, Bangla English AI bot, MirrorBook',
    canonicalUrl: `${SITE}/mirrorbot`,
    robots: INDEX_ROBOTS,
    ogType: 'product',
    ogImage: `${SITE}/mirrorbot-icon.png`,
    ogImageAlt: 'Mirror Bot AI Support by MirrorBook',
  },
  '/sowrov-hosen': {
    title: 'Team & Founder | MirrorBook',
    description:
      'Meet MirrorBook founders Sowrov Hosen and Walid Ahmed Shraban, and team members Musabbir Al Sayed and Mehedi Hasan. Learn about the people behind the creative studio.',
    keywords:
      'MirrorBook founders, MirrorBook team, Sowrov Hosen, Walid Ahmed Shraban, Musabbir Al Sayed, Mehedi Hasan, creative team Bangladesh',
    canonicalUrl: `${SITE}/sowrov-hosen`,
    robots: INDEX_ROBOTS,
    ogType: 'profile',
    ogImage: `${SITE}/team/sowrov-hosen.jpg`,
    ogImageAlt: 'Sowrov Hosen, Founder of MirrorBook',
  },
  '/contact': {
    title: 'Contact MirrorBook | Discuss Your Project',
    description:
      'Contact MirrorBook, a Bangladesh-based creative agency and digital studio, for graphic design, branding, video editing, motion graphics, web development, and digital projects. Reach us by WhatsApp or email.',
    keywords:
      'Contact MirrorBook, hire creative agency Bangladesh, graphic design quotation, video editing services, branding agency, web development contact',
    canonicalUrl: `${SITE}/contact`,
    robots: INDEX_ROBOTS,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: 'Contact MirrorBook creative studio',
  },
  '/privacy-policy': {
    title: 'Privacy Policy | MirrorBook & Mirror Bot',
    description:
      'Read how MirrorBook and Mirror Bot handle account data, connected Facebook Pages, Messenger, and WhatsApp Business automation securely.',
    keywords: 'MirrorBook privacy policy, Mirror Bot privacy policy, Meta app privacy policy',
    canonicalUrl: `${SITE}/privacy-policy`,
    robots: INDEX_ROBOTS,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: 'MirrorBook Privacy Policy',
  },
  '/data-deletion': {
    title: 'User Data Deletion Instructions | MirrorBook & Mirror Bot',
    description:
      'Step-by-step instructions to disconnect Facebook Page, Messenger, or WhatsApp Business channels and delete your data from MirrorBook and Mirror Bot.',
    keywords: 'MirrorBook data deletion, Mirror Bot user data deletion, Meta data deletion instructions',
    canonicalUrl: `${SITE}/data-deletion`,
    robots: INDEX_ROBOTS,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: 'MirrorBook User Data Deletion',
  },
  '/login': {
    title: 'Customer Sign In | MirrorBook',
    description: 'Sign in to your MirrorBook customer account to access purchased plugins, courses, licenses, and downloads.',
    keywords: 'MirrorBook customer login',
    canonicalUrl: `${SITE}/login`,
    robots: NOINDEX_ROBOTS,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: 'MirrorBook official logo',
  },
  '/signup': {
    title: 'Create Customer Account | MirrorBook',
    description: 'Create a MirrorBook customer account to access plugins, courses, downloads, and MirrorPOS licensing.',
    keywords: 'MirrorBook account registration',
    canonicalUrl: `${SITE}/signup`,
    robots: NOINDEX_ROBOTS,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: 'MirrorBook official logo',
  },
  '/account': {
    title: 'My Account & Digital Library | MirrorBook',
    description: 'Manage your MirrorBook purchases, licenses, courses, and digital downloads.',
    keywords: 'MirrorBook customer dashboard',
    canonicalUrl: `${SITE}/account`,
    robots: NOINDEX_ROBOTS,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: 'MirrorBook official logo',
  },
  '/admin/login': {
    title: 'Admin Sign In | MirrorBook',
    description: 'Restricted MirrorBook administrator sign-in.',
    keywords: 'MirrorBook admin',
    canonicalUrl: `${SITE}/admin/login`,
    robots: NOINDEX_ROBOTS,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: 'MirrorBook official logo',
  },
  '/admin': {
    title: 'Admin Console | MirrorBook',
    description: 'Restricted MirrorBook studio management console.',
    keywords: 'MirrorBook admin console',
    canonicalUrl: `${SITE}/admin`,
    robots: NOINDEX_ROBOTS,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: 'MirrorBook official logo',
  },
};

function upsertMeta(attrName: 'name' | 'property', attrValue: string, content: string) {
  if (typeof document === 'undefined') return;
  let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLinkCanonical(href: string) {
  if (typeof document === 'undefined') return;
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function applyRouteSeoMetadata(path: string, lang: 'en' | 'bn' = 'en'): void {
  if (typeof document === 'undefined') return;
  const normalized = path.toLowerCase().replace(/\/+$/, '') || '/';
  const config = ROUTE_SEO_CONFIG[normalized] || ROUTE_SEO_CONFIG['/'];

  document.title =
    normalized === '/' && lang === 'bn'
      ? 'মিরর বুক – রিফ্লেক্টিং ক্রিয়েটিভিটি'
      : config.title;
  upsertMeta('name', 'description', config.description);
  upsertMeta('name', 'keywords', config.keywords);
  upsertMeta('name', 'author', 'MirrorBook');
  upsertMeta('name', 'robots', config.robots);
  upsertMeta('name', 'googlebot', config.robots);
  upsertLinkCanonical(config.canonicalUrl);

  upsertMeta('property', 'og:locale', 'en_US');
  upsertMeta('property', 'og:type', config.ogType);
  upsertMeta('property', 'og:site_name', 'MirrorBook');
  upsertMeta('property', 'og:url', config.canonicalUrl);
  upsertMeta('property', 'og:title', config.title);
  upsertMeta('property', 'og:description', config.description);
  upsertMeta('property', 'og:image', config.ogImage);
  upsertMeta('property', 'og:image:secure_url', config.ogImage);
  upsertMeta('property', 'og:image:alt', config.ogImageAlt);

  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:url', config.canonicalUrl);
  upsertMeta('name', 'twitter:title', config.title);
  upsertMeta('name', 'twitter:description', config.description);
  upsertMeta('name', 'twitter:image', config.ogImage);
  upsertMeta('name', 'twitter:image:alt', config.ogImageAlt);
}
