import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ExternalLink,
  Share2,
  Check,
  ShoppingCart,
  Users,
  BarChart3,
  Printer,
  Cloud,
  Chrome,
  Globe,
  BookOpen,
  Download,
  CheckCircle2,
  ScanBarcode,
  ShieldCheck,
  Laptop,
  Layers,
  Languages,
  ChevronDown,
  Mail,
  Loader2,
  AlertCircle,
  WifiOff,
  HardDriveDownload,
  Truck,
  Wallet,
  LayoutDashboard,
  LifeBuoy,
} from 'lucide-react';
import { AppUser } from '../types';
import { auth } from '../utils/firebase';

interface MirrorPOSPageProps {
  onNavigateHome: () => void;
  onStartProject?: () => void;
  onBuyPremium?: () => void;
  isPremiumPurchased?: boolean;
  user?: AppUser | null;
  desktopDownloadUrl?: string;
}

type BrowserTab = 'chrome' | 'edge';
type GuideLang = 'en' | 'bn';

interface UserGuideCategory {
  number: string;
  title: string;
  summary: string;
  steps: string[];
}

export const MirrorPOSPage: React.FC<MirrorPOSPageProps> = ({
  onNavigateHome,
  onStartProject,
  onBuyPremium,
  isPremiumPurchased = false,
  user = null,
  desktopDownloadUrl,
}) => {
  const [activeScreenshot, setActiveScreenshot] = useState<number>(0);
  const [browserTab, setBrowserTab] = useState<BrowserTab>('chrome');
  const [openGuideIndex, setOpenGuideIndex] = useState<number | null>(0);
  const [guideLang, setGuideLang] = useState<GuideLang>('en');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Free Access Registration Form State
  const [fullName, setFullName] = useState<string>(user?.displayName || '');
  const [email, setEmail] = useState<string>(user?.email || '');
  const [isSubmittingAccess, setIsSubmittingAccess] = useState<boolean>(false);
  const [accessError, setAccessError] = useState<string>('');
  const [accessConfirmed, setAccessConfirmed] = useState<{
    email: string;
    referenceId: string;
    message: string;
  } | null>(null);

  const MIRRORPOS_APP_URL = 'https://mirror-pos.vercel.app/';
  const verifiedDesktopUrl =
    desktopDownloadUrl && /^https?:\/\//i.test(desktopDownloadUrl.trim())
      ? desktopDownloadUrl.trim()
      : typeof import.meta.env.VITE_MIRRORPOS_DESKTOP_URL === 'string' &&
        /^https?:\/\//i.test(import.meta.env.VITE_MIRRORPOS_DESKTOP_URL.trim())
      ? import.meta.env.VITE_MIRRORPOS_DESKTOP_URL.trim()
      : '';

  useEffect(() => {
    if (user) {
      setFullName((prev) => prev || user.displayName || '');
      setEmail((prev) => prev || user.email || '');
    }
  }, [user]);

  useEffect(() => {
    const originalTitle = document.title;
    const newTitle = 'MirrorPOS by MirrorBook | Smart POS Software';
    document.title = newTitle;

    let metaDesc = document.querySelector('meta[name="description"]');
    const originalDesc = metaDesc?.getAttribute('content') || '';
    const newDesc =
      'MirrorPOS by MirrorBook is Smart POS Software for Modern Businesses with offline-first billing, online synchronization, inventory, sales, expenses, customer & supplier management, and analytics.';
    if (metaDesc) {
      metaDesc.setAttribute('content', newDesc);
    } else {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      metaDesc.setAttribute('content', newDesc);
      document.head.appendChild(metaDesc);
    }

    let canonical = document.querySelector('link[rel="canonical"]');
    const originalCanonical = canonical?.getAttribute('href') || 'https://mirrorbook.site/';
    if (canonical) {
      canonical.setAttribute('href', 'https://mirrorbook.site/mirrorpos');
    } else {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      canonical.setAttribute('href', 'https://mirrorbook.site/mirrorpos');
      document.head.appendChild(canonical);
    }

    const updateMeta = (selector: string, attr: string, nextVal: string): string | null => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const prev = el.getAttribute(attr);
      el.setAttribute(attr, nextVal);
      return prev;
    };

    const prevOgTitle = updateMeta('meta[property="og:title"]', 'content', newTitle);
    const prevOgDesc = updateMeta('meta[property="og:description"]', 'content', newDesc);
    const prevOgUrl = updateMeta('meta[property="og:url"]', 'content', 'https://mirrorbook.site/mirrorpos');
    const prevOgImg = updateMeta('meta[property="og:image"]', 'content', 'https://mirrorbook.site/mirror-pos-icon.png');
    const prevOgImgSecure = updateMeta('meta[property="og:image:secure_url"]', 'content', 'https://mirrorbook.site/mirror-pos-icon.png');
    const prevOgImgAlt = updateMeta('meta[property="og:image:alt"]', 'content', 'MirrorPOS Official App Icon — Developed by MirrorBook');

    const prevTwTitle = updateMeta('meta[name="twitter:title"]', 'content', newTitle);
    const prevTwDesc = updateMeta('meta[name="twitter:description"]', 'content', newDesc);
    const prevTwUrl = updateMeta('meta[name="twitter:url"]', 'content', 'https://mirrorbook.site/mirrorpos');
    const prevTwImg = updateMeta('meta[name="twitter:image"]', 'content', 'https://mirrorbook.site/mirror-pos-icon.png');
    const prevTwImgAlt = updateMeta('meta[name="twitter:image:alt"]', 'content', 'MirrorPOS Official App Icon — Developed by MirrorBook');

    const softwareSchema = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      '@id': 'https://mirrorbook.site/mirrorpos#software',
      name: 'MirrorPOS',
      alternateName: 'MirrorPOS by MirrorBook',
      headline: 'Smart POS Software for Modern Businesses.',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Windows, macOS, Web',
      url: 'https://mirrorbook.site/mirrorpos',
      installUrl: 'https://mirror-pos.vercel.app/',
      image: 'https://mirrorbook.site/mirror-pos-icon.png',
      description: newDesc,
      brand: { '@type': 'Brand', name: 'MirrorBook', url: 'https://mirrorbook.site/' },
      author: { '@type': 'Organization', name: 'MirrorBook', url: 'https://mirrorbook.site/' },
    };

    let scriptTag = document.getElementById('mirrorpos-schema') as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'mirrorpos-schema';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(softwareSchema, null, 2);

    const hash = window.location.hash.replace('#', '');
    if (hash) {
      setTimeout(() => {
        const targetEl = document.getElementById(hash);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }

    return () => {
      document.title = originalTitle;
      if (metaDesc) metaDesc.setAttribute('content', originalDesc);
      if (canonical) canonical.setAttribute('href', originalCanonical);
      if (prevOgTitle !== null) updateMeta('meta[property="og:title"]', 'content', prevOgTitle);
      if (prevOgDesc !== null) updateMeta('meta[property="og:description"]', 'content', prevOgDesc);
      if (prevOgUrl !== null) updateMeta('meta[property="og:url"]', 'content', prevOgUrl);
      if (prevOgImg !== null) updateMeta('meta[property="og:image"]', 'content', prevOgImg);
      if (prevOgImgSecure !== null) updateMeta('meta[property="og:image:secure_url"]', 'content', prevOgImgSecure);
      if (prevOgImgAlt !== null) updateMeta('meta[property="og:image:alt"]', 'content', prevOgImgAlt);
      if (prevTwTitle !== null) updateMeta('meta[name="twitter:title"]', 'content', prevTwTitle);
      if (prevTwDesc !== null) updateMeta('meta[name="twitter:description"]', 'content', prevTwDesc);
      if (prevTwUrl !== null) updateMeta('meta[name="twitter:url"]', 'content', prevTwUrl);
      if (prevTwImg !== null) updateMeta('meta[name="twitter:image"]', 'content', prevTwImg);
      if (prevTwImgAlt !== null) updateMeta('meta[name="twitter:image:alt"]', 'content', prevTwImgAlt);
      const scriptToRemove = document.getElementById('mirrorpos-schema');
      if (scriptToRemove) scriptToRemove.remove();
    };
  }, []);

  const handleShare = async () => {
    const url = 'https://mirrorbook.site/mirrorpos';
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'MirrorPOS by MirrorBook | Smart POS Software',
          text: 'Smart POS Software for Modern Businesses. Developed by MirrorBook.',
          url,
        });
        return;
      } catch {
        // ignore cancel
      }
    }
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      } catch {
        // ignore clipboard denial
      }
    }
  };

  const scrollToLocalSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleFreeAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingAccess) return;

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2) {
      setAccessError('Please enter your full name.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
      setAccessError('Please enter a valid email address.');
      return;
    }

    setIsSubmittingAccess(true);
    setAccessError('');

    try {
      let idToken = '';
      if (auth.currentUser) {
        idToken = await auth.currentUser.getIdToken().catch(() => '');
      }

      const res = await fetch('/api/software/free-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          productId: 'software-mirrorpos',
          name: cleanName,
          email: cleanEmail,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setAccessError(
          data?.error ||
            'Unable to send confirmation email right now. Please verify your email address or try again.'
        );
        return;
      }

      setAccessConfirmed({
        email: data.email || cleanEmail,
        referenceId: data.referenceId || 'MB-SW-READY',
        message:
          data.message ||
          `Your MirrorPOS access details and user guide links have been sent to ${cleanEmail}.`,
      });
    } catch {
      setAccessError(
        'Network error while sending access confirmation email. Please try again.'
      );
    } finally {
      setIsSubmittingAccess(false);
    }
  };

  const overviewSpecs = [
    { label: 'Product Name', value: 'MirrorPOS' },
    { label: 'Tagline', value: 'Smart POS Software for Modern Businesses.' },
    { label: 'Developed by', value: 'MirrorBook' },
    { label: 'Product Type', value: 'Desktop POS Software' },
    { label: 'Access Type', value: 'Lifetime Access' },
    { label: 'Internet Requirement', value: 'Offline-first with online synchronization.' },
  ];

  const keyFeatures = [
    {
      icon: Printer,
      title: 'Sales and billing management',
      description:
        'Create fast counter bills, apply discounts, select Cash/Card/Mobile Banking/Due payments, and generate thermal or PDF invoices.',
    },
    {
      icon: ScanBarcode,
      title: 'Product and inventory management',
      description:
        'Organize items with SKUs, barcodes, size and color variants, purchase rates, selling prices, and automatic stock deduction.',
    },
    {
      icon: Users,
      title: 'Customer management',
      description:
        'Save customer profiles, track partial payments or receivable dues, and reconcile balances cleanly.',
    },
    {
      icon: Truck,
      title: 'Supplier management',
      description:
        'Log wholesale stock purchases, maintain supplier ledgers, and track payables accurately.',
    },
    {
      icon: Wallet,
      title: 'Expense tracking',
      description:
        'Record daily shop operating expenses such as rent, utilities, staff, and logistics so net profit stays exact.',
    },
    {
      icon: BarChart3,
      title: 'Sales reports and analytics',
      description:
        'View Today, This Month, and All-Time financial summaries including revenue, COGS, expenses, and net profit.',
    },
    {
      icon: LayoutDashboard,
      title: 'Business dashboard',
      description:
        'Monitor daily sales, cash flow, net profit, and low-stock warnings at a glance from a clean command center.',
    },
    {
      icon: WifiOff,
      title: 'Offline functionality',
      description:
        'Operate counter sales, product lookups, and receipt printing seamlessly even when internet connectivity drops.',
    },
    {
      icon: Cloud,
      title: 'Automatic online synchronization',
      description:
        'Synchronize invoices, inventory counts, and store data online automatically once connectivity is available.',
    },
    {
      icon: Globe,
      title: 'Google account integration',
      description:
        'Connect your Google account for Google Sheets synchronization and authorized workspace cloud storage.',
    },
    {
      icon: HardDriveDownload,
      title: 'Data backup and synchronization',
      description:
        'Export local store backups, run cloud backup syncs, and restore records reliably whenever switching devices.',
    },
  ];

  const screenshots = [
    {
      id: 'pos',
      label: '01. POS Terminal & Dashboard',
      caption: 'Business Dashboard, Quick Actions, Today’s Sales, Cash, Net Profit & Cloud Sync.',
      image: '/mirrorpos-shot-1.png',
      fallback: '/mirror-pos-icon.png',
      alt: 'MirrorPOS Business Dashboard and Quick POS Billing Terminal',
    },
    {
      id: 'inventory',
      label: '02. Inventory & Barcode',
      caption: 'Product Catalog, Barcodes, Stock Quantities & Variant Management.',
      image: '/mirrorpos-shot-2.png',
      fallback: '/mirrorpos-shot-1.png',
      alt: 'MirrorPOS Inventory and Barcode Stock Management Screen',
    },
    {
      id: 'analytics',
      label: '03. Reports & Ledgers',
      caption: 'Sales Reports, Expense Tracking, Customer Receivables & Supplier Payables.',
      image: '/mirrorpos-shot-3.png',
      fallback: '/mirrorpos-shot-1.png',
      alt: 'MirrorPOS Sales Reports, Expenses, and Due Ledgers',
    },
  ];

  const userGuideCategories: Record<GuideLang, UserGuideCategory[]> = {
    en: [
      {
        number: '01',
        title: 'Getting Started',
        summary: 'Understand MirrorPOS system overview, browser/desktop launch, and main workspace layout.',
        steps: [
          'Open https://mirror-pos.vercel.app/ in Google Chrome or Microsoft Edge on Windows 10/11 (or launch your installed desktop app shortcut).',
          'For dedicated desktop window mode without browser tabs, click the Install icon in the browser address bar to pin MirrorPOS to your taskbar.',
          'Review the left navigation sidebar covering Business Dashboard, POS Billing, Product & Inventory, Customers, Suppliers, Shop Expenses, Reports, and Backup.',
        ],
      },
      {
        number: '02',
        title: 'Account Registration and Login',
        summary: 'Register your store access on MirrorBook and switch securely between Owner Mode and Staff Mode.',
        steps: [
          'Submit your Full Name and Email Address in the Free Access form above to receive your official MirrorPOS launch confirmation and User Guide reference.',
          'Open MirrorPOS and sign in or link your business account.',
          'Switch between Owner Mode (full financial reports, settings, backup controls) and Staff Mode (counter billing and basic lookups) depending on counter staff.',
        ],
      },
      {
        number: '03',
        title: 'Initial Business Setup',
        summary: 'Configure your business name, currency symbol, invoice footer details, and printer preferences.',
        steps: [
          'Navigate to Store Settings from the MirrorPOS sidebar.',
          'Enter your business name, shop address, phone number, and custom cash memo thank-you footer note.',
          'Select your preferred receipt width (58mm/80mm thermal roll or A4 PDF invoice) and currency formatting.',
        ],
      },
      {
        number: '04',
        title: 'Adding Products',
        summary: 'Create items with purchase cost, retail selling price, barcodes/SKUs, and variants.',
        steps: [
          'Open Product & Stock and click "+ Add Product".',
          'Enter product title, category, SKU/barcode number, purchase rate, and retail selling price.',
          'Specify opening stock quantity and optional size/color variants if managing multi-variant retail inventory, then save.',
        ],
      },
      {
        number: '05',
        title: 'Creating Sales and Invoices',
        summary: 'Process fast counter checkouts with barcode scanning, discounts, split payments, and receipts.',
        steps: [
          'Click POS Billing Counter (or "+ New Invoice" Quick Action) on the Business Dashboard.',
          'Scan product barcodes with a USB/Bluetooth scanner or search by product name to add items to the cart.',
          'Adjust item quantities, apply optional item or bill discounts, attach a customer profile if recording credit/due, and pick the payment method (Cash, Mobile Banking, Card, or Due).',
          'Click Complete Sale to finalize the invoice, deduct inventory automatically, and print or save the thermal/PDF receipt.',
        ],
      },
      {
        number: '06',
        title: 'Managing Inventory',
        summary: 'Track stock levels in real time, restock from suppliers, and respond to low-stock alerts.',
        steps: [
          'Use the Quick Stock adjustment button to update shelf counts or log damaged/returned stock.',
          'Record wholesale stock-in deliveries through Suppliers / Purchases so unit costs and inventory totals update together.',
          'Check Low-Stock Alerts directly on the Business Dashboard to restock popular items ahead of time.',
        ],
      },
      {
        number: '07',
        title: 'Customer Management',
        summary: 'Maintain customer directory profiles, partial payments, and due/receivable ledgers.',
        steps: [
          'Open Customer Management / Customer Ledger and add customers with name and phone number.',
          'Select a customer during POS checkout whenever an invoice has a partial payment or credit balance.',
          'Log due collections from the customer ledger anytime; balances and daily cash collected update immediately.',
        ],
      },
      {
        number: '08',
        title: 'Expense Management',
        summary: 'Record shop operating costs so profit calculations remain accurate.',
        steps: [
          'Open the Shop Expense section from the navigation panel.',
          'Add daily or monthly expenses such as rent, electricity, staff wages, packaging, or courier fees with date and category.',
          'Review categorized expense totals inside financial reports to control store overhead.',
        ],
      },
      {
        number: '09',
        title: 'Reports and Analytics',
        summary: 'Analyze sales volume, cost of goods sold, expenses, and net profit over any timeframe.',
        steps: [
          'Open Financial Reports & Analytics and filter between Today, This Month, or All-Time ranges.',
          'Inspect Gross Revenue, COGS, Operating Expenses, and Final Net Profit figures side by side.',
          'Use the Print Report action to print or save a PDF summary for accounting.',
        ],
      },
      {
        number: '10',
        title: 'Offline Mode',
        summary: 'Keep counter operations uninterrupted when internet connectivity drops.',
        steps: [
          'Continue opening POS Billing, scanning barcodes, adding products, and completing customer invoices even offline.',
          'All offline entries are safely queued and stored locally in your browser/desktop app storage.',
          'Once internet connectivity returns, pending updates synchronize automatically without losing a single transaction.',
        ],
      },
      {
        number: '11',
        title: 'Google Account Synchronization',
        summary: 'Link your Google account for Google Sheets sync and authorized online storage.',
        steps: [
          'Open Sync / Integrations inside MirrorPOS and connect your Google account.',
          'Authorize Google Sheets synchronization or trigger "Save to Google Sheets" from the Quick Actions bar.',
          'Verify synced rows across sales, inventory, and ledger sheets on your connected Google workspace.',
        ],
      },
      {
        number: '12',
        title: 'Data Backup and Recovery',
        summary: 'Export local backups, trigger cloud sync backups, and restore your store cleanly.',
        steps: [
          'Visit Data Backup in MirrorPOS settings and click Export Backup to download a timestamped backup file of your store.',
          'Run Cloud Backup Sync regularly when online to keep your latest encrypted snapshot safely stored.',
          'If setting up a new PC or after clearing browser data, open Restore Backup and select your backup file or cloud snapshot.',
        ],
      },
      {
        number: '13',
        title: 'Troubleshooting and Support',
        summary: 'Quick fixes for printers, barcode scanners, sync status, and contacting MirrorBook support.',
        steps: [
          'Thermal Printer Formatting: Ensure Chrome/Edge print settings match your 58mm/80mm paper size with Margins set to None.',
          'Barcode Scanner Not Entering Items: Verify the scanner is in USB HID keyboard mode and focus is inside the POS search field.',
          'Sync Delayed: Confirm stable internet connectivity and click the manual Cloud Sync button to push queued offline records.',
          'Still need assistance? Contact MirrorBook Technical Support at khansaheb2572@gmail.com or via the Technical Support button below.',
        ],
      },
    ],
    bn: [
      {
        number: '০১',
        title: 'Getting Started (শুরু করার নিয়ম)',
        summary: 'MirrorPOS সফটওয়্যার ওপেন করা, ডেস্কটপ অ্যাপ ইনস্টল ও মূল ড্যাশবোর্ড পরিচিতি।',
        steps: [
          'আপনার Windows 10/11 পিসিতে Google Chrome বা Microsoft Edge দিয়ে https://mirror-pos.vercel.app/ ওপেন করুন।',
          'ব্রাউজার ট্যাব ছাড়া আলাদা ডেস্কটপ অ্যাপ উইন্ডোতে চালাতে অ্যাড্রেস বারের Install আইকনে ক্লিক করে টাস্কবারে পিন করুন।',
          'বাম দিকের সাইডবার থেকে বিজনেস ড্যাশবোর্ড, পজ (POS), প্রোডাক্ট ও স্টক, কাস্টমার, সাপ্লায়ার, খরচ ও রিপোর্ট মেনু দেখুন।',
        ],
      },
      {
        number: '০২',
        title: 'Account Registration and Login',
        summary: 'ফ্রি অ্যাক্সেস রেজিস্ট্রেশন ও ওনার/স্টাফ মোড লগইন পরিচালনা।',
        steps: [
          'এই পেজের Free Access ফর্মে আপনার Full Name এবং Email Address সাবমিট করে ইমেইলে লঞ্চ লিংক ও গাইড সংগ্রহ করুন।',
          'MirrorPOS ওপেন করে আপনার অ্যাকাউন্ট দিয়ে সাইন-ইন করুন।',
          'কাউন্টার পরিচালনার জন্য প্রয়োজন অনুযায়ী Owner Mode বা Staff Mode নির্বাচন করুন।',
        ],
      },
      {
        number: '০৩',
        title: 'Initial Business Setup',
        summary: 'দোকানের নাম, ঠিকানা, কারেন্সি এবং থার্মাল/PDF ইনভয়েস সেটিংস নির্ধারণ।',
        steps: [
          'সাইডবার থেকে Store Settings অপশনে প্রবেশ করুন।',
          'আপনার দোকানের নাম, ঠিকানা, মোবাইল নম্বর ও মেমোর নিচের ফুটনোট যুক্ত করুন।',
          '৫৮মিমি/৮০মিমি থার্মাল প্রিন্টার অথবা A4 PDF পেপার সাইজ সেট করে সেভ করুন।',
        ],
      },
      {
        number: '০৪',
        title: 'Adding Products',
        summary: 'ক্রয়মূল্য, বিক্রয়মূল্য, বারকোড ও ভ্যারিয়েন্টসহ পণ্য যুক্ত করার নিয়ম।',
        steps: [
          '"Product & Stock" মেনু থেকে "+ Add Product" বাটনে ক্লিক করুন।',
          'পণ্যের নাম, ক্যাটাগরি, বারকোড/SKU, কেনা দাম ও বিক্রয় দাম লিখুন।',
          'ওপেনিং স্টক সংখ্যা এবং প্রয়োজন হলে সাইজ বা কালার ভ্যারিয়েন্ট দিয়ে সেভ করুন।',
        ],
      },
      {
        number: '০৫',
        title: 'Creating Sales and Invoices',
        summary: 'বারকোড স্ক্যান করে দ্রুত বিল তৈরি, ডিসকাউন্ট ও মেমো প্রিন্ট।',
        steps: [
          'ড্যাশবোর্ডের POS Billing বা "+ New Invoice" বাটনে ক্লিক করুন।',
          'বারকোড স্ক্যানার দিয়ে স্ক্যান করে বা নাম লিখে সার্চ করে পণ্য কার্টে যোগ করুন।',
          'ডিসকাউন্ট, কাস্টমার প্রোফাইল ও পেমেন্ট মেথড (Cash, Mobile Banking, Card বা Due) সিলেক্ট করুন।',
          'Complete Sale ক্লিক করলে স্টক অটোমেটিক আপডেট হবে এবং থার্মাল বা PDF ক্যাশ মেমো তৈরি হবে।',
        ],
      },
      {
        number: '০৬',
        title: 'Managing Inventory',
        summary: 'রিয়েল-টাইম স্টক কন্ট্রোল, দ্রুত স্টক আপডেট এবং লো-স্টক সতর্কতা।',
        steps: [
          'যেকোনো পণ্যের পরিমাণ আপডেট করতে Quick Stock বাটন ব্যবহার করুন।',
          'Suppliers / Purchases অপশন থেকে নতুন মাল কেনা এন্ট্রি করলে ক্রয়মূল্য ও স্টক একসাথে আপডেট হয়।',
          'ড্যাশবোর্ডে থাকা Low-Stock Alerts দেখে চাহিদাসম্পন্ন পণ্য আগেই রি-স্টক করুন।',
        ],
      },
      {
        number: '০৭',
        title: 'Customer Management',
        summary: 'কাস্টমার প্রোফাইল সংরক্ষণ ও বাকি-বকেয়া (Receivables) লেজার হিসাব।',
        steps: [
          'Customer Management সেকশনে নিয়মিত ক্রেতাদের নাম ও ফোন নম্বর সংরক্ষণ করুন।',
          'বাকি বা আংশিক পেমেন্টে বিক্রি করার সময় কাস্টমার সিলেক্ট করে বিল সম্পন্ন করুন।',
          'কাস্টমার বকেয়া টাকা পরিশোধ করলে জমা এন্ট্রি করুন; সাথে সাথেই ব্যালেন্স আপডেট হবে।',
        ],
      },
      {
        number: '০৮',
        title: 'Expense Management',
        summary: 'দোকানের দৈনিক ও মাসিক খরচ হিসাব করে নিট লাভ নির্ভুল রাখা।',
        steps: [
          'ন্যাভিগেশন থেকে Shop Expense ট্যাবে যান।',
          'দোকান ভাড়া, বিদ্যুৎ বিল, কর্মচারী বেতন, প্যাকেজিং বা কুরিয়ার খরচ ক্যাটাগরি অনুযায়ী এন্ট্রি করুন।',
          'আর্থিক রিপোর্টে মোট খরচ ও প্রকৃত লাভ সরাসরি পর্যবেক্ষণ করুন।',
        ],
      },
      {
        number: '০৯',
        title: 'Reports and Analytics',
        summary: 'দৈনিক, মাসিক ও সর্বমোট বিক্রি এবং Profit & Loss বিবরণী দেখা।',
        steps: [
          'Reports & Analytics অপশনে গিয়ে Today, This Month বা All-Time ফিল্টার বেছে নিন।',
          'মোট বিক্রি (Gross Revenue), পণ্যের ব্যয় (COGS), দোকান খরচ এবং নিট লাভ দেখুন।',
          'Print Report বাটনের মাধ্যমে প্রিন্ট বা PDF রিপোর্ট সংরক্ষণ করুন।',
        ],
      },
      {
        number: '১০',
        title: 'Offline Mode',
        summary: 'ইন্টারনেট না থাকলেও বিরতিহীন বিলিং ও পরবর্তী অটো সিঙ্ক।',
        steps: [
          'ইন্টারনেট সংযোগ বিচ্ছিন্ন থাকলেও পজ বিলিং, পণ্য সার্চ এবং রসিদ প্রিন্ট স্বাভাবিকভাবে চালিয়ে যান।',
          'অফলাইন থাকাকালীন সব হিসাব আপনার ডিভাইসে নিরাপদে সংরক্ষিত থাকবে।',
          'ইন্টারনেট ফিরে এলেই পেন্ডিং সব সেলস ও স্টক ডাটা অটোমেটিক অনলাইনে সিঙ্ক হয়ে যাবে।',
        ],
      },
      {
        number: '১১',
        title: 'Google Account Synchronization',
        summary: 'Google অ্যাকাউন্ট যুক্ত করে Google Sheets সিঙ্ক ও ওয়ার্কস্পেস ইন্টিগ্রেশন।',
        steps: [
          'MirrorPOS-এর Sync সেটিংসে আপনার Google অ্যাকাউন্ট সংযুক্ত করুন।',
          'ড্যাশবোর্ডের কুইক অ্যাকশন থেকে "Save to Google Sheets" ব্যবহার করে সরাসরি তথ্য সিঙ্ক করুন।',
          'আপনার কানেক্টেড Google Sheets-এ সেলস, স্টক ও হিসাবের তথ্য যাচাই করুন।',
        ],
      },
      {
        number: '১২',
        title: 'Data Backup and Recovery',
        summary: 'লোকাল ব্যাকআপ ডাউনলোড, ক্লাউড সিঙ্ক ও রিস্টোর করার পদ্ধতি।',
        steps: [
          'Data Backup মেনু থেকে Export Backup ক্লিক করে দোকানের সম্পূর্ণ ডাটা ব্যাকআপ ফাইল ডাউনলোড করে রাখুন।',
          'অনলাইনে থাকা অবস্থায় নিয়মিত Cloud Backup Sync চালিয়ে ক্লাউড কপি সুরক্ষিত রাখুন।',
          'নতুন পিসি ব্যবহার করলে বা ডাটা রিসেট হলে Restore Backup অপশন দিয়ে পূর্বের সব তথ্য ফিরিয়ে আনুন।',
        ],
      },
      {
        number: '১৩',
        title: 'Troubleshooting and Support',
        summary: 'প্রিন্টার, বারকোড স্ক্যানার ও সিঙ্ক সমস্যার সমাধান এবং সাপোর্ট যোগাযোগ।',
        steps: [
          'থার্মাল প্রিন্ট সেটিংস: Chrome/Edge প্রিন্ট ডায়ালগে পেপার সাইজ 58mm/80mm এবং Margins: None রাখুন।',
          'বারকোড স্ক্যান না হলে: স্ক্যানার USB HID কিবোর্ড মোডে আছে কিনা দেখুন এবং POS সার্চ বক্সে ক্লিক করে স্ক্যান করুন।',
          'সিঙ্ক সমস্যা হলে: ইন্টারনেট কানেকশন নিশ্চিত করে Cloud Sync বাটনে ক্লিক করুন।',
          'অতিরিক্ত সহায়তার জন্য khansaheb2572@gmail.com ইমেইলে বা নিচের Technical Support বাটনে যোগাযোগ করুন।',
        ],
      },
    ],
  };

  const installGuide = {
    en: {
      heading: 'How to Install MirrorPOS',
      sub: 'Install MirrorPOS onto your Windows 10 or Windows 11 PC using Google Chrome or Microsoft Edge.',
      sysReqLabel: 'System Requirements:',
      sysReqText:
        'Windows 10/11, Chrome or Edge, plus optional barcode scanner & 58mm/80mm thermal printer.',
      openBtn: 'Open MirrorPOS',
      chromeSteps: [
        {
          step: 'Step 01',
          title: 'Open MirrorPOS in Google Chrome',
          detail:
            'Launch Google Chrome on your Windows 10 or Windows 11 PC and visit https://mirror-pos.vercel.app/.',
        },
        {
          step: 'Step 02',
          title: 'Click the Install Icon in Address Bar',
          detail:
            'Click the Install icon on the right side of Chrome’s address bar, or open menu (⋮) → Cast, save, and share → Install page as app.',
        },
        {
          step: 'Step 03',
          title: 'Confirm Installation',
          detail:
            'Click "Install" in the confirmation popup to launch MirrorPOS in a standalone desktop window.',
        },
        {
          step: 'Step 04',
          title: 'Pin to Windows Taskbar & Desktop',
          detail:
            'Right-click the MirrorPOS icon on your Taskbar and choose "Pin to taskbar" for instant daily access.',
        },
      ],
      edgeSteps: [
        {
          step: 'Step 01',
          title: 'Open MirrorPOS in Microsoft Edge',
          detail:
            'Open Microsoft Edge on Windows 10/11 and visit https://mirror-pos.vercel.app/.',
        },
        {
          step: 'Step 02',
          title: 'Click "Install this site as an app"',
          detail:
            'Click the App available icon in the Edge address bar, or open menu (⋯) → Apps → Install this site as an app.',
        },
        {
          step: 'Step 03',
          title: 'Confirm App Name & Install',
          detail:
            'Keep the name "MirrorPOS" and click "Install" to add it as a desktop app.',
        },
        {
          step: 'Step 04',
          title: 'Pin to Taskbar & Desktop',
          detail:
            'Check "Pin to taskbar" and "Create Desktop shortcut" for quick counter launches.',
        },
      ],
    },
    bn: {
      heading: 'মিররপস (MirrorPOS) ইনস্টল করার নিয়ম',
      sub: 'Windows 10 বা Windows 11 পিসিতে Google Chrome অথবা Microsoft Edge দিয়ে MirrorPOS অ্যাপ হিসেবে ইনস্টল করুন।',
      sysReqLabel: 'সিস্টেম রিকোয়ারমেন্ট:',
      sysReqText:
        'Windows 10/11 পিসি, Google Chrome বা Microsoft Edge ব্রাউজার এবং ঐচ্ছিক বারকোড স্ক্যানার ও 58mm/80mm থার্মাল প্রিন্টার।',
      openBtn: 'MirrorPOS ওপেন করুন',
      chromeSteps: [
        {
          step: 'ধাপ ০১',
          title: 'Google Chrome-এ MirrorPOS ওপেন করুন',
          detail:
            'Google Chrome চালু করে https://mirror-pos.vercel.app/ লিংকে প্রবেশ করুন।',
        },
        {
          step: 'ধাপ ০২',
          title: 'অ্যাড্রেস বারের Install আইকনে ক্লিক করুন',
          detail:
            'Chrome অ্যাড্রেস বারের ডান পাশে থাকা Install আইকনে ক্লিক করুন অথবা মেনু (⋮) থেকে Install page as app সিলেক্ট করুন।',
        },
        {
          step: 'ধাপ ০৩',
          title: 'ইনস্টল কনফার্ম করুন',
          detail:
            'পপআপ বক্সে "Install" বাটনে ক্লিক করুন; সাথে সাথেই এটি আলাদা ডেস্কটপ অ্যাপ উইন্ডোতে ওপেন হবে।',
        },
        {
          step: 'ধাপ ০৪',
          title: 'টাস্কবার ও ডেস্কটপে পিন করুন',
          detail:
            'টাস্কবারে MirrorPOS আইকনে রাইট-ক্লিক করে "Pin to taskbar" সিলেক্ট করুন।',
        },
      ],
      edgeSteps: [
        {
          step: 'ধাপ ০১',
          title: 'Microsoft Edge-এ MirrorPOS ওপেন করুন',
          detail:
            'Microsoft Edge খুলে https://mirror-pos.vercel.app/ লিংকে যান।',
        },
        {
          step: 'ধাপ ০২',
          title: '"Install this site as an app" সিলেক্ট করুন',
          detail:
            'Edge অ্যাড্রেস বারের App আইকনে ক্লিক করুন বা মেনু (⋯) → Apps → Install this site as an app সিলেক্ট করুন।',
        },
        {
          step: 'ধাপ ০৩',
          title: 'অ্যাপের নাম যাচাই করে Install দিন',
          detail:
            'নাম "MirrorPOS" রেখে "Install" বাটনে ক্লিক করুন।',
        },
        {
          step: 'ধাপ ০৪',
          title: 'ডেস্কটপ শর্টকাট ও টাস্কবার চালু করুন',
          detail:
            '"Pin to taskbar" এবং "Create Desktop shortcut" টিক দিয়ে OK করুন।',
        },
      ],
    },
  };

  const activeGuide = installGuide[guideLang];
  const activeSteps = browserTab === 'chrome' ? activeGuide.chromeSteps : activeGuide.edgeSteps;
  const activeManualCategories = userGuideCategories[guideLang];

  return (
    <div className="min-h-screen bg-[#0B0D0C] text-[#F5F7F2] overflow-x-clip">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-16">
        {/* Top Breadcrumb & Share Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8 sm:mb-12 pb-5 sm:pb-6 border-b border-white/[0.09]">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-[#A1AAA2]">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onNavigateHome();
              }}
              className="hover:text-[#B7F34A] transition-colors flex items-center gap-1.5 whitespace-nowrap min-h-[36px]"
            >
              <ArrowLeft size={14} />
              <span>MirrorBook Home</span>
            </a>
            <span aria-hidden="true">/</span>
            <span className="text-[#A1AAA2]">Software Library</span>
            <span aria-hidden="true">/</span>
            <span className="text-[#B7F34A] font-semibold">MirrorPOS</span>
          </nav>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 rounded-xl glossy-btn-secondary text-xs font-medium cursor-pointer whitespace-nowrap shrink-0"
          >
            {copiedLink ? (
              <>
                <Check size={13} className="text-[#B7F34A]" />
                <span className="text-[#B7F34A]">Link Copied</span>
              </>
            ) : (
              <>
                <Share2 size={13} className="text-[#B7F34A]" />
                <span>Share Page</span>
              </>
            )}
          </button>
        </div>

        {/* 1. Hero & Product Overview + Free Access Registration Card */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start mb-16">
          {/* Left: Product Overview & Actions */}
          <div className="lg:col-span-7 space-y-6 min-w-0">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#121614] border border-white/[0.09] p-3 sm:p-3.5 flex items-center justify-center shrink-0 shadow-[0_12px_30px_rgba(0,0,0,0.6)]">
                <img
                  src="/mirror-pos-icon.png"
                  alt="MirrorPOS Official App Icon"
                  width={64}
                  height={64}
                  loading="eager"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#B7F34A] mb-1">
                  <span>Developed by MirrorBook</span>
                  <span aria-hidden="true" className="text-[#707A72]">·</span>
                  <span className="text-[#A1AAA2] font-normal">Desktop POS Software</span>
                </div>
                <h1 className="font-display text-3xl min-[375px]:text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#F5F7F2] leading-none">
                  MirrorPOS
                </h1>
              </div>
            </div>

            <p className="text-lg sm:text-2xl text-[#F5F7F2] font-semibold tracking-tight">
              Smart POS Software for Modern Businesses.
            </p>

            {/* Product Overview Spec Table */}
            <div className="glossy-card p-5 rounded-2xl border border-white/[0.09]">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#B7F34A] mb-4">
                Product Overview
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                {overviewSpecs.map((spec) => (
                  <div
                    key={spec.label}
                    className="p-3 rounded-xl bg-[#0B0D0C]/80 border border-white/[0.07]"
                  >
                    <dt className="text-[#A1AAA2] mb-1">{spec.label}</dt>
                    <dd className="text-[#F5F7F2] font-semibold break-words">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
              {accessConfirmed || isPremiumPurchased ? (
                <a
                  href={MIRRORPOS_APP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] px-7 py-3.5 rounded-xl glossy-btn text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>Launch MirrorPOS</span>
                  <ExternalLink size={15} />
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => scrollToLocalSection('get-access')}
                  className="min-h-[44px] px-7 py-3.5 rounded-xl glossy-btn text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Mail size={15} />
                  <span>Get Free Access via Email</span>
                </button>
              )}

              {onBuyPremium && !isPremiumPurchased && (
                <button
                  type="button"
                  onClick={onBuyPremium}
                  className="min-h-[44px] px-6 py-3.5 rounded-xl glossy-btn-secondary border-[#B7F34A]/40 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Download size={14} className="text-[#B7F34A]" />
                  <span>Buy Desktop License – ৳9,999</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => scrollToLocalSection('user-guide')}
                className="min-h-[44px] px-6 py-3.5 rounded-xl glossy-btn-secondary text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
              >
                <BookOpen size={14} className="text-[#B7F34A]" />
                <span>Complete User Guide</span>
              </button>

              <button
                type="button"
                onClick={() => scrollToLocalSection('install-mirrorpos')}
                className="min-h-[44px] px-5 py-3.5 rounded-xl bg-transparent hover:bg-white/[0.04] border border-white/[0.09] text-[#A1AAA2] hover:text-[#F5F7F2] text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Laptop size={14} className="text-[#B7F34A]" />
                <span>Install Guide</span>
              </button>
            </div>
          </div>

          {/* Right: Free Email Access OR ৳9,999 Premium Direct Purchase */}
          <div id="get-access" className="lg:col-span-5 scroll-mt-24">
            <div className="glossy-card p-6 sm:p-7 rounded-2xl border border-[#B7F34A]/30 space-y-5">
              <div className="space-y-1.5 border-b border-white/[0.09] pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#B7F34A]/15 border border-[#B7F34A]/35 text-[10px] font-bold uppercase tracking-wider text-[#B7F34A]">
                    Free via Email · Premium ৳9,999
                  </span>
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[#F5F7F2]">
                  Get MirrorPOS Access
                </h2>
                <p className="text-xs text-[#A1AAA2] leading-relaxed">
                  For free access, register with your email below to receive your MirrorPOS access link directly in Gmail. Or purchase the full ৳9,999 desktop license for instant direct unlock.
                </p>
              </div>

              {accessError && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/35 text-xs text-red-200 flex items-start gap-2.5">
                  <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
                  <span className="break-words">{accessError}</span>
                </div>
              )}

              {accessConfirmed || isPremiumPurchased ? (
                <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/35 space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 size={20} className="text-[#B7F34A] shrink-0 mt-0.5" />
                    <div className="space-y-1 min-w-0">
                      <h3 className="text-sm font-bold text-[#F5F7F2]">
                        {isPremiumPurchased
                          ? 'Premium License Verified & Ready'
                          : 'Access Confirmed & Email Sent'}
                      </h3>
                      <p className="text-xs text-[#D4DBD5] leading-relaxed break-words">
                        {isPremiumPurchased
                          ? 'Your MirrorPOS Desktop Lifetime License (৳9,999) is active. Launch MirrorPOS below anytime.'
                          : accessConfirmed?.message}
                      </p>
                      {accessConfirmed?.referenceId && (
                        <p className="text-[11px] font-mono text-[#B7F34A]">
                          Reference ID: {accessConfirmed.referenceId}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                    <a
                      href={MIRRORPOS_APP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-h-[44px] py-2.5 px-4 text-xs glossy-btn rounded-xl flex items-center justify-center gap-2"
                    >
                      <span>Launch MirrorPOS</span>
                      <ExternalLink size={13} />
                    </a>
                    <button
                      type="button"
                      onClick={() => scrollToLocalSection('user-guide')}
                      className="min-h-[44px] py-2.5 px-4 text-xs font-semibold glossy-btn-secondary rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <BookOpen size={13} className="text-[#B7F34A]" />
                      <span>User Guide</span>
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleFreeAccessSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="mirrorpos-full-name"
                      className="text-xs font-medium text-[#A1AAA2] block mb-1.5"
                    >
                      Full Name *
                    </label>
                    <input
                      id="mirrorpos-full-name"
                      type="text"
                      required
                      minLength={2}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full px-3.5 py-2.5 text-base sm:text-xs bg-[#0B0D0C] border border-white/[0.12] rounded-xl text-[#F5F7F2] placeholder:text-[#707A72] focus:border-[#B7F34A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="mirrorpos-email"
                      className="text-xs font-medium text-[#A1AAA2] block mb-1.5"
                    >
                      Email Address *
                    </label>
                    <input
                      id="mirrorpos-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@business.com"
                      className="w-full px-3.5 py-2.5 text-base sm:text-xs bg-[#0B0D0C] border border-white/[0.12] rounded-xl text-[#F5F7F2] placeholder:text-[#707A72] focus:border-[#B7F34A] focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingAccess}
                    className="w-full min-h-[44px] py-3 px-5 text-xs font-bold glossy-btn rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isSubmittingAccess ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>Sending Access Email...</span>
                      </>
                    ) : (
                      <>
                        <Mail size={14} />
                        <span>Get Free Access via Email</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Direct Paid Option (৳9,999) */}
              {onBuyPremium && !isPremiumPurchased && (
                <div className="pt-4 border-t border-white/[0.09] space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-[#A1AAA2]">Direct Desktop Purchase (Instant Launch)</span>
                    <span className="font-display font-bold text-[#F5F7F2] tabular-nums">৳9,999</span>
                  </div>
                  <button
                    type="button"
                    onClick={onBuyPremium}
                    className="w-full min-h-[44px] py-2.5 px-5 text-xs font-bold glossy-btn-secondary border-[#B7F34A]/35 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download size={14} className="text-[#B7F34A]" />
                    <span>Purchase &amp; Launch MirrorPOS – ৳9,999</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 2. Key Features */}
        <section id="features" className="mb-16 pt-14 border-t border-white/[0.09]">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#B7F34A] block mb-2">
                Actual Product Capabilities
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#F5F7F2] tracking-tight">
                Key Features
              </h2>
            </div>
            <p className="text-sm text-[#A1AAA2] max-w-md leading-relaxed">
              Every module inside MirrorPOS is engineered for reliable offline-first billing, stock tracking, customer &amp; supplier ledgers, and Google account synchronization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {keyFeatures.map((feature) => {
              const IconComp = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="glossy-card glossy-card-hover p-6"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#121614] border border-white/[0.09] flex items-center justify-center text-[#B7F34A] mb-4">
                    <IconComp size={19} />
                  </div>
                  <h3 className="font-display text-base sm:text-lg font-bold text-[#F5F7F2] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#A1AAA2] leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. Software Preview */}
        <section id="software-preview" className="mb-16 pt-12 border-t border-white/[0.09]">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#B7F34A] block mb-1.5">
                MirrorPOS Interface
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#F5F7F2] tracking-tight">
                Software Preview
              </h2>
            </div>

            <div className="flex items-center gap-1.5 glass-tab-bar p-1 rounded-xl overflow-x-auto no-scrollbar max-w-full">
              {screenshots.map((shot, idx) => {
                const isActive = activeScreenshot === idx;
                return (
                  <button
                    key={shot.id}
                    type="button"
                    onClick={() => setActiveScreenshot(idx)}
                    className={`min-h-[38px] px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-[#B7F34A] text-black font-bold'
                        : 'text-[#A1AAA2] hover:text-[#F5F7F2]'
                    }`}
                  >
                    {shot.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="glossy-card p-3 sm:p-4 max-w-4xl">
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-[#0B0D0C] border border-white/[0.09]">
              <img
                src={screenshots[activeScreenshot].image}
                alt={screenshots[activeScreenshot].alt}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== screenshots[activeScreenshot].fallback) {
                    target.src = screenshots[activeScreenshot].fallback;
                  }
                }}
                className="w-full h-full object-contain bg-[#090d16]"
              />
            </div>

            <div className="pt-3 px-1 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-[#F5F7F2]">{screenshots[activeScreenshot].label}</span>
              <span className="text-[#A1AAA2]">{screenshots[activeScreenshot].caption}</span>
            </div>
          </div>
        </section>

        {/* 4. Windows Desktop Installation Guide */}
        <section id="install-mirrorpos" className="scroll-mt-20 mb-16 pt-14 border-t border-white/[0.09]">
          <div className="glossy-card p-5 sm:p-8 lg:p-10">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 pb-6 border-b border-white/[0.09]">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#B7F34A] mb-2">
                  <Laptop size={14} />
                  <span>Windows Desktop App Installation</span>
                </div>
                <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#F5F7F2] tracking-tight mb-2">
                  {activeGuide.heading}
                </h2>
                <p className="text-sm text-[#A1AAA2] leading-relaxed">
                  {activeGuide.sub}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 self-start lg:self-end">
                <div className="flex items-center gap-1 p-1 glass-tab-bar rounded-xl">
                  <button
                    type="button"
                    onClick={() => setGuideLang('en')}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      guideLang === 'en'
                        ? 'bg-[#F5F7F2] text-black'
                        : 'text-[#A1AAA2] hover:text-[#F5F7F2]'
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setGuideLang('bn')}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                      guideLang === 'bn'
                        ? 'bg-[#F5F7F2] text-black'
                        : 'text-[#A1AAA2] hover:text-[#F5F7F2]'
                    }`}
                  >
                    <Languages size={13} />
                    <span>বাংলা</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5 p-1 glass-tab-bar rounded-xl">
                  <button
                    type="button"
                    onClick={() => setBrowserTab('chrome')}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                      browserTab === 'chrome'
                        ? 'bg-[#B7F34A] text-black'
                        : 'text-[#A1AAA2] hover:text-[#F5F7F2]'
                    }`}
                  >
                    <Chrome size={14} />
                    <span>Chrome</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBrowserTab('edge')}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                      browserTab === 'edge'
                        ? 'bg-[#B7F34A] text-black'
                        : 'text-[#A1AAA2] hover:text-[#F5F7F2]'
                    }`}
                  >
                    <Globe size={14} />
                    <span>Edge</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {activeSteps.map((item) => (
                <div
                  key={item.step}
                  className="p-5 rounded-2xl bg-[#121614] border border-white/[0.09] hover:border-[#B7F34A]/35 transition-all"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#B7F34A] tabular-nums">
                      {item.step}
                    </span>
                    <span className="text-[11px] text-[#707A72]">
                      {browserTab === 'chrome' ? 'Google Chrome' : 'Microsoft Edge'}
                    </span>
                  </div>
                  <h3 className="font-display text-base font-bold text-[#F5F7F2] mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#A1AAA2] leading-relaxed break-words">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-[#121614] border border-white/[0.09] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <ShieldCheck size={18} className="text-[#B7F34A] shrink-0 mt-0.5 sm:mt-0" />
                <div className="text-xs sm:text-sm text-[#A1AAA2] leading-relaxed">
                  <strong className="text-[#F5F7F2]">{activeGuide.sysReqLabel}</strong> {activeGuide.sysReqText}
                </div>
              </div>

              <a
                href={MIRRORPOS_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="glossy-btn min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
              >
                <span>{activeGuide.openBtn}</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </section>

        {/* 5. Complete User Guide (13 Expandable Accordion Categories) */}
        <section id="user-guide" className="scroll-mt-20 mb-16 pt-14 border-t border-white/[0.09]">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-[#B7F34A] mb-2">
                <BookOpen size={14} />
                <span>Step-by-Step Software Documentation</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#F5F7F2] tracking-tight">
                Complete User Guide
              </h2>
              <p className="text-sm text-[#A1AAA2] mt-2 max-w-2xl leading-relaxed">
                Explore all 13 sections covering Getting Started, account setup, inventory, POS billing, offline operation, Google sync, backup/recovery, and troubleshooting.
              </p>
            </div>

            <div className="glass-tab-bar self-start md:self-end shrink-0">
              <button
                type="button"
                onClick={() => setGuideLang('en')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  guideLang === 'en'
                    ? 'bg-[#B7F34A] text-[#0B0D0C]'
                    : 'text-[#A1AAA2] hover:text-[#F5F7F2]'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setGuideLang('bn')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                  guideLang === 'bn'
                    ? 'bg-[#B7F34A] text-[#0B0D0C]'
                    : 'text-[#A1AAA2] hover:text-[#F5F7F2]'
                }`}
              >
                <Languages size={13} />
                <span>বাংলা</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {activeManualCategories.map((cat, idx) => {
              const isOpen = openGuideIndex === idx;
              return (
                <div
                  key={cat.number}
                  className={`glossy-card rounded-2xl border transition-colors ${
                    isOpen ? 'border-[#B7F34A]/45' : 'border-white/[0.09]'
                  }`}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenGuideIndex(isOpen ? null : idx)}
                    className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="font-display text-sm font-bold text-[#B7F34A] tabular-nums shrink-0">
                        {cat.number}.
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-display text-base sm:text-lg font-bold text-[#F5F7F2] break-words">
                          {cat.title}
                        </h3>
                        <p className="text-xs text-[#A1AAA2] mt-0.5 line-clamp-1">
                          {cat.summary}
                        </p>
                      </div>
                    </div>

                    <ChevronDown
                      size={18}
                      className={`text-[#B7F34A] shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-2 border-t border-white/[0.08] space-y-3">
                      <p className="text-xs sm:text-sm text-[#A1AAA2] leading-relaxed">
                        {cat.summary}
                      </p>
                      <ol className="space-y-2.5">
                        {cat.steps.map((stepText, stepIdx) => (
                          <li
                            key={stepIdx}
                            className="flex items-start gap-3 p-3.5 rounded-xl bg-[#0B0D0C]/80 border border-white/[0.08]"
                          >
                            <span className="w-6 h-6 rounded-full bg-[#B7F34A]/15 border border-[#B7F34A]/40 text-[#B7F34A] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                              {stepIdx + 1}
                            </span>
                            <span className="text-xs sm:text-sm text-[#F5F7F2] leading-relaxed break-words min-w-0">
                              {stepText}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 6. Launch Software Section */}
        <section className="glossy-card border-[#B7F34A]/25 rounded-2xl p-6 sm:p-10 text-center">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#F5F7F2] tracking-tight">
              Ready to Start with MirrorPOS?
            </h2>
            <p className="text-xs sm:text-base text-[#A1AAA2] leading-relaxed">
              Access your business management software and manage your business smarter with MirrorPOS.
            </p>
            <div className="pt-3 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3">
              <a
                href={MIRRORPOS_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="glossy-btn w-full sm:w-auto min-h-[44px] px-7 py-3.5 rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>Launch MirrorPOS</span>
                <ExternalLink size={14} />
              </a>

              {verifiedDesktopUrl && (
                <a
                  href={verifiedDesktopUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glossy-btn-secondary w-full sm:w-auto min-h-[44px] px-6 py-3.5 rounded-xl text-xs font-semibold tracking-wide flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Download size={14} className="text-[#B7F34A]" />
                  <span>Download Desktop App</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => scrollToLocalSection('user-guide')}
                className="glossy-btn-secondary w-full sm:w-auto min-h-[44px] px-6 py-3.5 rounded-xl text-xs font-semibold tracking-wide flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
              >
                <BookOpen size={14} className="text-[#B7F34A]" />
                <span>Complete User Guide</span>
              </button>

              {onStartProject ? (
                <button
                  type="button"
                  onClick={onStartProject}
                  className="w-full sm:w-auto min-h-[44px] px-6 py-3.5 rounded-xl bg-transparent hover:bg-white/[0.04] border border-white/[0.09] text-[#A1AAA2] hover:text-[#F5F7F2] text-xs font-semibold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <LifeBuoy size={14} className="text-[#B7F34A]" />
                  <span>Technical Support</span>
                </button>
              ) : (
                <a
                  href="mailto:khansaheb2572@gmail.com?subject=MirrorPOS%20Technical%20Support"
                  className="w-full sm:w-auto min-h-[44px] px-6 py-3.5 rounded-xl bg-transparent hover:bg-white/[0.04] border border-white/[0.09] text-[#A1AAA2] hover:text-[#F5F7F2] text-xs font-semibold tracking-wide transition-all flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
                >
                  <LifeBuoy size={14} className="text-[#B7F34A]" />
                  <span>Technical Support</span>
                </a>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onNavigateHome}
                className="inline-flex items-center gap-1.5 text-xs text-[#A1AAA2] hover:text-[#B7F34A] transition-colors cursor-pointer"
              >
                <Layers size={13} />
                <span>Back to MirrorBook</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
