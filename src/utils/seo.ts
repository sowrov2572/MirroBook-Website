export interface RouteSeoConfig {
  title: string;
  description: string;
  canonicalUrl: string;
  robots: string;
  ogType: string;
  ogImage: string;
  ogImageAlt: string;
}

const DEFAULT_OG_IMAGE = 'https://mirrorbook.site/mirrorbook-logo.png';
const INDEX_ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
const NOINDEX_ROBOTS = 'noindex, nofollow';

export const ROUTE_SEO_CONFIG: Record<string, RouteSeoConfig> = {
  '/': {
    title: 'MirrorBook | Graphic Design, Video Editing & Motion Graphics',
    description:
      'MirrorBook is a creative agency in Bangladesh offering graphic design, video editing, motion graphics, digital marketing, web development, and modern software solutions. Reflecting Creativity.',
    canonicalUrl: 'https://mirrorbook.site/',
    robots: INDEX_ROBOTS,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: 'MirrorBook Official Logo – Reflecting Creativity',
  },
  '/mirrorpos': {
    title: 'MirrorPOS by MirrorBook | Smart POS Software',
    description:
      'MirrorPOS by MirrorBook is Smart POS Software for Modern Businesses with offline-first billing, online synchronization, inventory, sales, expenses, customer & supplier management, and analytics.',
    canonicalUrl: 'https://mirrorbook.site/mirrorpos',
    robots: INDEX_ROBOTS,
    ogType: 'website',
    ogImage: 'https://mirrorbook.site/mirror-pos-icon.png',
    ogImageAlt: 'MirrorPOS Official App Icon — Developed by MirrorBook',
  },
  '/sowrov-hosen': {
    title: 'Founder & Team | MirrorBook',
    description:
      'Meet the founders and creative team behind MirrorBook. Learn about Sowrov Hosen, co-founder Walid Ahmed Shraban, and the team delivering graphic design, video editing and web development.',
    canonicalUrl: 'https://mirrorbook.site/sowrov-hosen',
    robots: INDEX_ROBOTS,
    ogType: 'profile',
    ogImage: 'https://i.ibb.co.com/BHmVcvxW/Sowrov-Hosen.jpg',
    ogImageAlt: 'Sowrov Hosen, Founder of MirrorBook',
  },
  '/login': {
    title: 'Customer Sign In | MirrorBook',
    description: 'Sign in to your MirrorBook customer account to access purchased plugins, courses, and downloads.',
    canonicalUrl: 'https://mirrorbook.site/login',
    robots: NOINDEX_ROBOTS,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: 'MirrorBook Official Logo – Reflecting Creativity',
  },
  '/signup': {
    title: 'Create Customer Account | MirrorBook',
    description: 'Create a MirrorBook customer account for access to plugins, courses, and MirrorPOS licensing.',
    canonicalUrl: 'https://mirrorbook.site/signup',
    robots: NOINDEX_ROBOTS,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: 'MirrorBook Official Logo – Reflecting Creativity',
  },
  '/account': {
    title: 'My Account & Dashboard | MirrorBook',
    description: 'Manage your MirrorBook purchases, licenses, courses, and digital downloads.',
    canonicalUrl: 'https://mirrorbook.site/account',
    robots: NOINDEX_ROBOTS,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: 'MirrorBook Official Logo – Reflecting Creativity',
  },
  '/admin/login': {
    title: 'Admin Portal Sign In | MirrorBook',
    description: 'Restricted MirrorBook Studio Administrator authentication portal.',
    canonicalUrl: 'https://mirrorbook.site/admin/login',
    robots: NOINDEX_ROBOTS,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: 'MirrorBook Official Logo – Reflecting Creativity',
  },
  '/admin': {
    title: 'Studio Admin Console | MirrorBook',
    description: 'MirrorBook Studio management console.',
    canonicalUrl: 'https://mirrorbook.site/admin',
    robots: NOINDEX_ROBOTS,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: 'MirrorBook Official Logo – Reflecting Creativity',
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
  upsertMeta('name', 'robots', config.robots);
  upsertLinkCanonical(config.canonicalUrl);

  upsertMeta('property', 'og:type', config.ogType);
  upsertMeta('property', 'og:site_name', 'MirrorBook');
  upsertMeta('property', 'og:url', config.canonicalUrl);
  upsertMeta('property', 'og:title', config.title);
  upsertMeta('property', 'og:description', config.description);
  upsertMeta('property', 'og:image', config.ogImage);
  upsertMeta('property', 'og:image:secure_url', config.ogImage);
  upsertMeta('property', 'og:image:alt', config.ogImageAlt);

  upsertMeta('name', 'twitter:url', config.canonicalUrl);
  upsertMeta('name', 'twitter:title', config.title);
  upsertMeta('name', 'twitter:description', config.description);
  upsertMeta('name', 'twitter:image', config.ogImage);
  upsertMeta('name', 'twitter:image:alt', config.ogImageAlt);
}
