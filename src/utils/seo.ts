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
    title: 'MirrorBook',
    description:
      'MirrorBook is a Bangladesh-based creative agency and digital studio for graphic design, video editing, motion graphics, branding, web development, and digital products.',
    keywords:
      'MirrorBook, MirrorBook Agency, Reflecting Creativity, creative agency Bangladesh, graphic design, video editing, motion graphics, branding, web development, digital products, MirrorPOS',
    canonicalUrl: `${SITE}/`,
    robots: INDEX_ROBOTS,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: 'MirrorBook official logo, Reflecting Creativity',
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
  '/sowrov-hosen': {
    title: 'Team & Founder | MirrorBook',
    description:
      'Meet MirrorBook founders Sowrov Hosen and Walid Ahmed Shraban, and team members Musabbir Al Said and Mehedi Hasan. Learn about the people behind the creative studio.',
    keywords:
      'MirrorBook founders, MirrorBook team, Sowrov Hosen, Walid Ahmed Shraban, Musabbir Al Said, Mehedi Hasan, creative team Bangladesh',
    canonicalUrl: `${SITE}/sowrov-hosen`,
    robots: INDEX_ROBOTS,
    ogType: 'profile',
    ogImage: 'https://i.ibb.co.com/BHmVcvxW/Sowrov-Hosen.jpg',
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

export function applyRouteSeoMetadata(path: string): void {
  if (typeof document === 'undefined') return;
  const normalized = path.toLowerCase().replace(/\/+$/, '') || '/';
  const config = ROUTE_SEO_CONFIG[normalized] || ROUTE_SEO_CONFIG['/'];

  document.title = config.title;
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
