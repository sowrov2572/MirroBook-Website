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
  ArrowRight,
  ChevronRight,
  Layers,
  Languages,
} from 'lucide-react';

interface MirrorPOSPageProps {
  onNavigateHome: () => void;
  onStartProject?: () => void;
}

type BrowserTab = 'chrome' | 'edge';
type GuideLang = 'bn' | 'en';

export const MirrorPOSPage: React.FC<MirrorPOSPageProps> = ({
  onNavigateHome,
  onStartProject,
}) => {
  const [activeScreenshot, setActiveScreenshot] = useState<number>(0);
  const [browserTab, setBrowserTab] = useState<BrowserTab>('chrome');
  const [activeManualChapter, setActiveManualChapter] = useState<number>(0);
  const [guideLang, setGuideLang] = useState<GuideLang>('bn');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const MIRRORPOS_APP_URL = 'https://mirror-pos.vercel.app/';

  useEffect(() => {
    const originalTitle = document.title;
    const newTitle = 'MirrorPOS by MirrorBook | Smart POS Software';
    document.title = newTitle;

    let metaDesc = document.querySelector('meta[name="description"]');
    const originalDesc = metaDesc?.getAttribute('content') || '';
    const newDesc =
      'MirrorPOS by MirrorBook is smart POS software for modern businesses with offline billing, online sync, inventory, sales, expense, customer & reporting tools.';
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
      operatingSystem: 'Windows, macOS, Web, Android, iOS',
      url: 'https://mirrorbook.site/mirrorpos',
      installUrl: 'https://mirror-pos.vercel.app/',
      image: 'https://mirrorbook.site/mirror-pos-icon.png',
      description: newDesc,
      featureList: [
        'Offline billing support',
        'Online data synchronization',
        'Inventory management',
        'Sales and expense tracking',
        'Customer management',
        'Smart business reporting',
      ],
      brand: {
        '@type': 'Brand',
        name: 'MirrorBook',
        url: 'https://mirrorbook.site/',
      },
      author: {
        '@type': 'Organization',
        '@id': 'https://mirrorbook.site/#organization',
        name: 'MirrorBook',
        url: 'https://mirrorbook.site/',
      },
      creator: {
        '@type': 'Organization',
        '@id': 'https://mirrorbook.site/#organization',
        name: 'MirrorBook',
        url: 'https://mirrorbook.site/',
      },
      publisher: {
        '@type': 'Organization',
        '@id': 'https://mirrorbook.site/#organization',
        name: 'MirrorBook',
        url: 'https://mirrorbook.site/',
      },
      isPartOf: {
        '@type': 'WebSite',
        '@id': 'https://mirrorbook.site/#website',
        name: 'MirrorBook',
        url: 'https://mirrorbook.site/',
      },
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'MirrorBook',
            item: 'https://mirrorbook.site/',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'MirrorPOS',
            item: 'https://mirrorbook.site/mirrorpos',
          },
        ],
      },
    };

    let scriptTag = document.getElementById('mirrorpos-schema') as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'mirrorpos-schema';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(softwareSchema, null, 2);

    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });

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
        // User cancelled share
      }
    }
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      } catch {
        // Ignore clipboard denial
      }
    }
  };

  const scrollToLocalSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const features = [
    {
      icon: Printer,
      title: 'Offline billing support',
      description:
        'Keep counter billing running even when internet connectivity drops. Create invoices, print 58mm/80mm thermal or PDF receipts, and continue selling without disruption.',
    },
    {
      icon: Cloud,
      title: 'Online data synchronization',
      description:
        'Automatically sync sales, inventory updates, and store backups online with cloud backup sync and Google Sheets integration across your authorized devices.',
    },
    {
      icon: ScanBarcode,
      title: 'Inventory management',
      description:
        'Manage SKUs, USB/Bluetooth barcodes, size and color variants, purchase rates, selling prices, and automatic low-stock alerts with real-time deduction.',
    },
    {
      icon: ShoppingCart,
      title: 'Sales and expense tracking',
      description:
        'Process fast POS counter checkouts with discounts and split payments while logging daily shop expenses like rent, electricity, staff, and courier costs.',
    },
    {
      icon: Users,
      title: 'Customer management',
      description:
        'Maintain complete customer profiles, track partial payments or credit receivables, record supplier payables, and reconcile balances with transparent ledgers.',
    },
    {
      icon: BarChart3,
      title: 'Smart business reporting',
      description:
        'Review real-time Today, This Month, and All-Time financial statements covering gross revenue, COGS, operating expenses, and net profit margins.',
    },
  ];

  // Compact screenshots using the user's exact 3 ImgBB links with local static fallbacks
  const screenshots = [
    {
      id: 'pos',
      label: '01. POS Terminal & Checkout',
      caption: 'Quick Actions, Today’s Sales, Cash, Net Profit & Cloud Sync.',
      image: 'https://i.ibb.co/XfQDsJGq/Screenshot-2026-11-16-153436.png',
      fallback: '/mirrorpos-shot-1.png',
      alt: 'MirrorPOS Dashboard and Quick POS Checkout Terminal',
    },
    {
      id: 'inventory',
      label: '02. Inventory & Barcode',
      caption: 'Product Catalog, Barcode, Stock Quantity & Variant Management.',
      image: 'https://i.ibb.co/4ng8NJ7R/Screenshot-2026-11-16-153459.png',
      fallback: '/mirrorpos-shot-2.png',
      alt: 'MirrorPOS Inventory and Barcode Stock Management Screen',
    },
    {
      id: 'analytics',
      label: '03. Reports & Ledgers',
      caption: 'Profit & Loss Statement, Customer Dues & Supplier Payables.',
      image: 'https://i.ibb.co/v4s6khWt/Screenshot-2026-11-16-153530.png',
      fallback: '/mirrorpos-shot-3.png',
      alt: 'MirrorPOS Financial Reports, Ledgers and Profit Statement',
    },
  ];

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
            'Launch Google Chrome on your Windows 10 or Windows 11 PC and visit https://mirror-pos.vercel.app/. Wait a moment for the app to finish loading.',
        },
        {
          step: 'Step 02',
          title: 'Click the Install Icon in Address Bar',
          detail:
            'Click the small Install icon on the right side of Chrome’s address bar, or open the three-dot menu (⋮) → Cast, save, and share → Install page as app.',
        },
        {
          step: 'Step 03',
          title: 'Confirm Installation',
          detail:
            'Click "Install" in the confirmation popup. MirrorPOS will immediately open in its own clean Windows desktop window without browser tabs.',
        },
        {
          step: 'Step 04',
          title: 'Pin to Windows Taskbar & Desktop',
          detail:
            'Right-click the MirrorPOS icon on your Windows Taskbar and select "Pin to taskbar". A Desktop shortcut is also created automatically.',
        },
      ],
      edgeSteps: [
        {
          step: 'Step 01',
          title: 'Open MirrorPOS in Microsoft Edge',
          detail:
            'Open Microsoft Edge on your Windows 10 or Windows 11 PC and go to https://mirror-pos.vercel.app/.',
        },
        {
          step: 'Step 02',
          title: 'Click "Install this site as an app"',
          detail:
            'Click the "App available" icon on the right side of the Edge address bar, or open the three-dot menu (⋯) → Apps → Install this site as an app.',
        },
        {
          step: 'Step 03',
          title: 'Confirm App Name & Install',
          detail:
            'Keep the name as "MirrorPOS" and click "Install". Edge sets up MirrorPOS as a standalone Windows desktop app.',
        },
        {
          step: 'Step 04',
          title: 'Pin to Taskbar & Desktop',
          detail:
            'Check "Pin to taskbar", "Pin to Start", and "Create Desktop shortcut" in the confirmation prompt for instant one-click access.',
        },
      ],
    },
    bn: {
      heading: 'মিররপস (MirrorPOS) ইনস্টল করার নিয়ম',
      sub: 'আপনার Windows 10 বা Windows 11 কম্পিউটারে Google Chrome অথবা Microsoft Edge ব্রাউজার দিয়ে খুব সহজেই MirrorPOS অ্যাপ হিসেবে ইনস্টল করুন।',
      sysReqLabel: 'সিস্টেম রিকোয়ারমেন্ট:',
      sysReqText:
        'Windows 10/11 পিসি, Google Chrome বা Microsoft Edge ব্রাউজার এবং ঐচ্ছিক বারকোড স্ক্যানার ও 58mm/80mm থার্মাল প্রিন্টার।',
      openBtn: 'MirrorPOS ওপেন করুন',
      chromeSteps: [
        {
          step: 'ধাপ ০১',
          title: 'Google Chrome-এ MirrorPOS ওপেন করুন',
          detail:
            'আপনার কম্পিউটারে Google Chrome ব্রাউজার চালু করে https://mirror-pos.vercel.app/ লিংকে প্রবেশ করুন এবং পুরোপুরি লোড হওয়া পর্যন্ত ২ সেকেন্ড অপেক্ষা করুন।',
        },
        {
          step: 'ধাপ ০২',
          title: 'অ্যাড্রেস বারের Install আইকনে ক্লিক করুন',
          detail:
            'Chrome-এর অ্যাড্রেস বারের ডান পাশে থাকা ছোট ডাউনলোড/ইনস্টল (Install MirrorPOS) আইকনে ক্লিক করুন। অথবা উপরে ডান কোণায় ৩-ডট মেনু (⋮) → Cast, save, and share → Install page as app সিলেক্ট করুন।',
        },
        {
          step: 'ধাপ ০৩',
          title: 'ইনস্টল কনফার্ম করুন',
          detail:
            'পপআপ বক্সে নীল রঙের "Install" বাটনে ক্লিক করুন। সাথে সাথেই MirrorPOS আলাদা একটি পরিচ্ছন্ন Windows অ্যাপ উইন্ডোতে ওপেন হবে।',
        },
        {
          step: 'ধাপ ০৪',
          title: 'টাস্কবার ও ডেস্কটপে পিন করুন',
          detail:
            'উইন্ডোজ টাস্কবারে MirrorPOS আইকনে মাউসের রাইট-ক্লিক করে "Pin to taskbar" সিলেক্ট করুন। ডেস্কটপেও অটোমেটিক একটি শর্টকাট তৈরি হয়ে যাবে।',
        },
      ],
      edgeSteps: [
        {
          step: 'ধাপ ০১',
          title: 'Microsoft Edge-এ MirrorPOS ওপেন করুন',
          detail:
            'আপনার Windows 10 বা Windows 11 পিসিতে Microsoft Edge ব্রাউজার খুলে https://mirror-pos.vercel.app/ লিংকে যান।',
        },
        {
          step: 'ধাপ ০২',
          title: '"Install this site as an app" সিলেক্ট করুন',
          detail:
            'Edge অ্যাড্রেস বারের ডান পাশে থাকা App আইকনে ক্লিক করুন, অথবা ৩-ডট মেনু (⋯) → Apps → Install this site as an app অপশনে ক্লিক করুন।',
        },
        {
          step: 'ধাপ ০৩',
          title: 'অ্যাপের নাম যাচাই করে Install দিন',
          detail:
            'অ্যাপের নাম "MirrorPOS" রেখে "Install" বাটনে ক্লিক করুন। মুহূর্তেই এটি আপনার পিসিতে আলাদা সফটওয়্যার হিসেবে যুক্ত হবে।',
        },
        {
          step: 'ধাপ ০৪',
          title: 'ডেস্কটপ শর্টকাট ও টাস্কবার চালু করুন',
          detail:
            'ইনস্টল হওয়ার পর দেখানো অপশন থেকে "Pin to taskbar", "Pin to Start" এবং "Create Desktop shortcut" টিক দিয়ে OK করুন।',
        },
      ],
    },
  };

  const manualData = {
    en: {
      badge: 'Operator Guide',
      heading: 'MirrorPOS User Manual',
      sub: 'Everything you get inside MirrorPOS and how to operate daily sales, stock, customer dues, and accounts.',
      includedTitle: 'What You Get Inside MirrorPOS:',
      includedHighlights: [
        'Owner Mode & Staff Mode Role Access',
        'Quick POS Counter, Barcode & Variant Stock',
        'Customer Receivables & Supplier Payables Ledgers',
        'Daily Expenses & Profit/Loss Financial Report',
        'Google Sheets Sync & Cloud Backup/Restore',
        '58mm/80mm Thermal & A4 PDF Receipt Printing',
      ],
      chapters: [
        {
          number: '01',
          title: 'Dashboard, Owner/Staff Mode & Cloud Sync',
          summary: 'Understand the main command center, Google Sheets sync, and role access inside MirrorPOS.',
          steps: [
            'Open MirrorPOS and switch between Owner Mode and Staff Mode depending on who is operating the counter.',
            'Use the top Quick Action buttons (+ New Invoice, + Customer, + Stock, Save to Google Sheets) for one-click daily tasks.',
            'Monitor Today’s Sales, Cash Collected, Net Profit, and Low Stock alerts directly from the home dashboard.',
            'Use Data Backup, Cloud Backup Sync, and Restore buttons anytime to keep your store data safely backed up.',
          ],
        },
        {
          number: '02',
          title: 'Adding Products, Barcodes & Stock Control',
          summary: 'Register items with purchase cost, selling price, SKU barcodes, and size/color variants.',
          steps: [
            'Go to Product & Stock from the left sidebar and click "+ Add Product" or "+ Quick Stock".',
            'Enter the product name, category, barcode/SKU, purchase rate, and retail selling price.',
            'Add opening stock quantities and enable size/color variants if you run a clothing, shoe, or multi-variant shop.',
            'Receive automatic Low-Stock Alerts before high-demand items run out.',
          ],
        },
        {
          number: '03',
          title: 'POS Billing, Checkout & Receipts',
          summary: 'Process counter sales quickly with barcode scan, discounts, and thermal or PDF memo printing.',
          steps: [
            'Open POS from the sidebar or click the orange Sales (POS Counter) Quick Action card.',
            'Search items by name or scan directly with a barcode scanner to add them to the bill.',
            'Apply item/total discounts, attach a customer profile if needed, and choose Cash, Card, Mobile Banking, or Due.',
            'Click Complete Sale to print a 58mm/80mm thermal cash memo or save a PDF invoice while stock updates automatically.',
          ],
        },
        {
          number: '04',
          title: 'Customer & Supplier Due Ledgers',
          summary: 'Keep transparent records of customer credit (receivables) and supplier balances (payables).',
          steps: [
            'Open Customer Ledger to add regular clients and track any remaining credit balance from partial payments.',
            'Record due collections anytime; MirrorPOS updates both the customer’s balance and your daily cash total.',
            'Open Suppliers to log wholesale stock-in purchases and track unpaid vendor balances cleanly.',
          ],
        },
        {
          number: '05',
          title: 'Expenses, Profit/Loss & Financial Reports',
          summary: 'Track daily operating expenses and generate full Profit & Loss income statements.',
          steps: [
            'Log daily shop expenses (rent, electricity, tea, staff, courier) from the Shop Expense tab.',
            'Open Financial Reports for Today, This Month, or All Time to review Gross Revenue, COGS, Operating Expenses, and Net Profit.',
            'Click "Print Report" to print or save official financial statements for your records.',
          ],
        },
      ],
    },
    bn: {
      badge: 'ব্যবহার নির্দেশিকা',
      heading: 'মিররপস ইউজার ম্যানুয়াল (বাংলা)',
      sub: 'MirrorPOS-এ আপনি কী কী পাচ্ছেন এবং কীভাবে ড্যাশবোর্ড, পজ বিলিং, স্টক, বাকি-বকেয়া ও আর্থিক রিপোর্ট পরিচালনা করবেন তার পূর্ণাঙ্গ গাইড।',
      includedTitle: 'MirrorPOS সফটওয়্যারের ভেতরে যা যা পাচ্ছেন:',
      includedHighlights: [
        'ওনার মোড ও স্টাফ মোড (User Role Control)',
        'দ্রুত পজ (POS) কাউন্টার, ক্যাশ মেমো ও বারকোড',
        'প্রোডাক্ট, সাইজ/কালার ভ্যারিয়েন্ট ও লো-স্টক সতর্কতা',
        'কাস্টমার বাকি (Receivables) ও সাপ্লায়ার পাওনা (Payables) খাতা',
        'দৈনিক দোকান খরচ ও মাসিক লাভ-লস (Profit & Loss) হিসাব',
        'গুগল শিট সিঙ্ক (Google Sheets) ও ক্লাউড ডাটা ব্যাকআপ',
      ],
      chapters: [
        {
          number: '০১',
          title: 'ড্যাশবোর্ড, ওনার/স্টাফ মোড ও ক্লাউড ব্যাকআপ',
          summary: 'মূল ড্যাশবোর্ডের কুইক অ্যাকশন, ডাটা ব্যাকআপ ও গুগল শিট সিঙ্ক ব্যবহারের নিয়ম।',
          steps: [
            'MirrorPOS ওপেন করে বাম দিকের উপরের অংশ থেকে আপনার প্রয়োজন অনুযায়ী ওনার মোড বা স্টাফ মোড ব্যবহার করতে পারবেন।',
            'উপরের কুইক বাটন (+ New Invoice, + Customer, + Stock, গুগল শিটে সেভ) দিয়ে এক ক্লিকেই যেকোনো এন্ট্রি করতে পারবেন।',
            'ড্যাশবোর্ড থেকেই আজকের মোট বিক্রি, নগদ জমা (Cash), আজকের খাঁটি লাভ (Net Profit) এবং লো-স্টক সতর্কতা দেখতে পাবেন।',
            'ডাটা ব্যাকআপ, ক্লাউড ব্যাকআপ সিঙ্ক এবং রিস্টোর বাটনের মাধ্যমে আপনার ব্যবসার সকল তথ্য নিরাপদে সংরক্ষণ করতে পারবেন।',
          ],
        },
        {
          number: '০২',
          title: 'প্রোডাক্ট, বারকোড ও স্টক ম্যানেজমেন্ট',
          summary: 'নতুন পণ্য যোগ করা, কেনা-বেচার দাম সেট করা এবং বারকোড ও স্টক হিসাব রাখা।',
          steps: [
            'বাম পাশের মেনু থেকে "প্রোডাক্ট ও স্টক" অপশনে গিয়ে "+ নতুন পণ্য/পোশাক" অথবা "+ দ্রুত স্টক যোগ" বাটনে ক্লিক করুন।',
            'পণ্যের নাম, ক্যাটাগরি, বারকোড নম্বর, ক্রয়মূল্য (কেনা দাম) এবং বিক্রয়মূল্য লিখে সেভ করুন।',
            'গার্মেন্টস বা ফ্যাশন শপ হলে পণ্যের সাইজ ও কালার ভ্যারিয়েন্ট অনুযায়ী আলাদা স্টক ও বারকোড সেট করতে পারবেন।',
            'কোনো পণ্য বিক্রি হওয়ার সাথে সাথেই স্টক অটোমেটিক কমে যাবে এবং স্টক কমে গেলে ড্যাশবোর্ডে সতর্কতা দেখাবে।',
          ],
        },
        {
          number: '০৩',
          title: 'বিক্রয় (POS কাউন্টার) ও ক্যাশ মেমো প্রিন্ট',
          summary: 'বারকোড স্ক্যান বা সার্চ করে দ্রুত বিল তৈরি করা এবং থার্মাল বা PDF রসিদ প্রিন্ট করা।',
          steps: [
            'ড্যাশবোর্ডের কমলা রঙের "বিক্রয় (পজ কাউন্টার)" কার্ডে অথবা বাম মেনু থেকে "পজ (POS)" অপশনে ক্লিক করুন।',
            'বারকোড স্ক্যানার দিয়ে স্ক্যান করে অথবা পণ্যের নাম সার্চ করে কার্টে যোগ করুন এবং পরিমাণ (+/-) ঠিক করুন।',
            'প্রয়োজনে ডিসকাউন্ট দিন, কাস্টমার সিলেক্ট করুন এবং ক্যাশ, বিকাশ/নগদ, কার্ড বা বাকি পেমেন্ট অপশন বেছে নিন।',
            'বিক্রয় সম্পন্ন করলেই 58mm/80mm থার্মাল প্রিন্টারে ক্যাশ মেমো প্রিন্ট হবে বা PDF ইনভয়েস ডাউনলোড করতে পারবেন।',
          ],
        },
        {
          number: '০৪',
          title: 'কাস্টমার বাকি ও সাপ্লায়ার (মহাজন) খাতা',
          summary: 'কাস্টমারের বকেয়া হিসাব এবং সাপ্লায়ারদের পাওনা টাকার নির্ভুল লেজার।',
          steps: [
            '"কাস্টমার লেজার" থেকে নিয়মিত ক্রেতাদের নাম ও মোবাইল নম্বর যোগ করে বাকি বিক্রয়ের হিসাব রাখতে পারবেন।',
            'কাস্টমার যখন বাকি টাকা পরিশোধ করবেন, "পেমেন্ট ও জমা" বা কাস্টমার খাতা থেকে জমা এন্ট্রি করলে বকেয়া অটোমেটিক সমন্বয় হবে।',
            '"সাপ্লায়ার" ও "ক্রয় / পারচেজ" অপশন থেকে নতুন মাল কেনা ও মহাজনের পাওনা টাকার হিসাব সহজেই রাখতে পারবেন।',
          ],
        },
        {
          number: '০৫',
          title: 'দৈনিক খরচ ও আর্থিক লাভ-ক্ষতি (Profit & Loss) রিপোর্ট',
          summary: 'দোকানের প্রতিদিনের খরচ হিসাব রাখা এবং মাসিক খাঁটি লাভের পূর্ণ বিবরণী দেখা।',
          steps: [
            '"দোকান খরচ" অপশন থেকে প্রতিদিনকার ভাড়া, বিদ্যুৎ বিল, নাস্তা, কর্মচারী বা কুরিয়ার খরচ এন্ট্রি করে রাখুন।',
            '"আর্থিক রিপোর্ট" অপশনে গিয়ে Today, This Month বা All Time সিলেক্ট করে মোট বিক্রি, পণ্যের ব্যয় (COGS), খরচ এবং চূড়ান্ত নিট লাভ (Final Net Profit) দেখুন।',
            'উপরের "Print Report" বাটনে ক্লিক করে সম্পূর্ণ আর্থিক রিপোর্ট প্রিন্ট বা PDF হিসেবে সংরক্ষণ করতে পারবেন।',
          ],
        },
      ],
    },
  };

  const activeGuide = installGuide[guideLang];
  const activeSteps = browserTab === 'chrome' ? activeGuide.chromeSteps : activeGuide.edgeSteps;
  const activeManual = manualData[guideLang];
  const currentManual = activeManual.chapters[activeManualChapter] || activeManual.chapters[0];

  return (
    <div className="min-h-screen bg-[#0B0D0C] text-[#F5F7F2]">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-10 md:py-16">
        {/* Top Breadcrumb & Share Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-12 pb-6 border-b border-white/[0.09]">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#A1AAA2]">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onNavigateHome();
              }}
              className="hover:text-[#B7F34A] transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <ArrowLeft size={14} />
              <span>MirrorBook Home</span>
            </a>
            <span aria-hidden="true">/</span>
            <span className="text-[#A1AAA2]">Software</span>
            <span aria-hidden="true">/</span>
            <span className="text-[#B7F34A] font-semibold">MirrorPOS</span>
          </nav>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glossy-btn-secondary text-xs font-medium cursor-pointer whitespace-nowrap shrink-0"
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

        {/* 1. Clean Icon-First Header */}
        <section className="max-w-3xl mb-20 space-y-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-[#121614] border border-white/[0.09] p-3.5 flex items-center justify-center shrink-0 shadow-[0_12px_30px_rgba(0,0,0,0.6)]">
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

            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#B7F34A] mb-1">
                <span>Developed by MirrorBook</span>
                <span aria-hidden="true" className="text-[#707A72]">·</span>
                <span className="text-[#A1AAA2] font-normal">Official Software Product</span>
              </div>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#F5F7F2] leading-none">
                MirrorPOS
              </h1>
            </div>
          </div>

          <p className="text-lg sm:text-2xl text-[#F5F7F2] font-semibold tracking-tight">
            Smart POS Software for Modern Businesses.
          </p>

          <p className="text-sm sm:text-base text-[#A1AAA2] leading-relaxed font-normal">
            A MirrorBook software product designed for offline billing support, online data synchronization, inventory management, sales and expense tracking, customer management, and smart business reporting.
          </p>

          {/* Clean Action Buttons */}
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3.5 pt-2">
            <a
              href={MIRRORPOS_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 rounded-xl glossy-btn text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>Launch MirrorPOS</span>
              <ExternalLink size={15} />
            </a>

            <button
              type="button"
              onClick={() => scrollToLocalSection('install-mirrorpos')}
              className="px-7 py-4 rounded-xl glossy-btn-secondary text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download size={14} className="text-[#B7F34A]" />
              <span>How to Install</span>
            </button>

            <button
              type="button"
              onClick={() => scrollToLocalSection('user-manual')}
              className="px-6 py-4 rounded-xl bg-transparent hover:bg-white/[0.04] border border-white/[0.09] text-[#A1AAA2] hover:text-[#F5F7F2] text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
            >
              <BookOpen size={14} className="text-[#B7F34A]" />
              <span>User Manual</span>
            </button>
          </div>
        </section>

        {/* 2. What MirrorPOS Does */}
        <section id="features" className="mb-16 pt-14 border-t border-white/[0.09]">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#B7F34A] block mb-2">
                Developed by MirrorBook
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#F5F7F2] tracking-tight">
                Key Features of MirrorPOS
              </h2>
            </div>
            <p className="text-sm text-[#A1AAA2] max-w-md leading-relaxed">
              Engineered under the MirrorBook ecosystem for reliable counter billing, stock control, due ledgers, and business reporting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature) => {
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

        {/* 3. Compact Software Screenshots (User's 3 real screenshots) */}
        <section id="screenshots" className="mb-16 pt-12 border-t border-white/[0.09]">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#B7F34A] block mb-1.5">
                Software Preview
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#F5F7F2] tracking-tight">
                Screenshots
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 glass-tab-bar p-1 rounded-xl">
              {screenshots.map((shot, idx) => {
                const isActive = activeScreenshot === idx;
                return (
                  <button
                    key={shot.id}
                    type="button"
                    onClick={() => setActiveScreenshot(idx)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
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

        {/* 4. How to Install MirrorPOS (Bangla + English) */}
        <section id="install-mirrorpos" className="mb-16 pt-14 border-t border-white/[0.09]">
          <div className="glossy-card p-6 sm:p-10">
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
                {/* Language Switcher (বাংলা / English) */}
                <div className="flex items-center gap-1 p-1 glass-tab-bar rounded-xl">
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
                </div>

                {/* Browser Switcher */}
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
                  <p className="text-xs sm:text-sm text-[#A1AAA2] leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-[#121614] border border-white/[0.09] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <ShieldCheck size={18} className="text-[#B7F34A] shrink-0 mt-0.5 sm:mt-0" />
                <div className="text-xs sm:text-sm text-[#A1AAA2] leading-relaxed">
                  <strong className="text-[#F5F7F2]">{activeGuide.sysReqLabel}</strong> {activeGuide.sysReqText}
                </div>
              </div>

              <a
                href={MIRRORPOS_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="glossy-btn px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
              >
                <span>{activeGuide.openBtn}</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </section>

        {/* 5. User Manual (Bangla + English, Last Major Section) */}
        <section id="user-manual" className="mb-16 pt-14 border-t border-white/[0.09]">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-[#B7F34A] mb-2">
                <BookOpen size={14} />
                <span>{activeManual.badge}</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#F5F7F2] tracking-tight">
                {activeManual.heading}
              </h2>
              <p className="text-sm text-[#A1AAA2] mt-2 max-w-2xl leading-relaxed">
                {activeManual.sub}
              </p>
            </div>

            {/* Language Switcher for Manual */}
            <div className="glass-tab-bar self-start md:self-end shrink-0">
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
            </div>
          </div>

          {/* What You Get Inside MirrorPOS Highlights Strip */}
          <div className="mb-6 p-5 sm:p-6 rounded-2xl glossy-card">
            <h3 className="text-xs font-bold tracking-wide text-[#B7F34A] mb-3">
              {activeManual.includedTitle}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {activeManual.includedHighlights.map((item) => (
                <div key={item} className="flex items-center gap-2 text-xs sm:text-sm text-[#F5F7F2]">
                  <CheckCircle2 size={14} className="text-[#B7F34A] shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-4 space-y-2">
              {activeManual.chapters.map((chapter, idx) => {
                const isActive = activeManualChapter === idx;
                return (
                  <button
                    key={chapter.number}
                    type="button"
                    onClick={() => setActiveManualChapter(idx)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isActive
                        ? 'bg-[#B7F34A]/10 border-[#B7F34A]/50 text-[#F5F7F2]'
                        : 'bg-[#171C19] border-white/[0.09] hover:border-white/20 text-[#A1AAA2] hover:text-[#F5F7F2]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`font-display text-sm font-bold tabular-nums shrink-0 ${
                          isActive ? 'text-[#B7F34A]' : 'text-[#707A72]'
                        }`}
                      >
                        {chapter.number}.
                      </span>
                      <span className="text-sm font-semibold truncate">{chapter.title}</span>
                    </div>
                    <ChevronRight
                      size={15}
                      className={`shrink-0 ${isActive ? 'text-[#B7F34A]' : 'text-[#707A72]'}`}
                    />
                  </button>
                );
              })}
            </div>

            <div className="lg:col-span-8 glossy-card rounded-2xl p-6 sm:p-9">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-5 border-b border-white/[0.09]">
                <div>
                  <span className="text-xs font-bold tracking-wide text-[#B7F34A] tabular-nums">
                    {guideLang === 'bn'
                      ? `অধ্যায় ${currentManual.number} / ০৫`
                      : `Chapter ${currentManual.number} of 05`}
                  </span>
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-[#F5F7F2] mt-1">
                    {currentManual.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveManualChapter((prev) =>
                        prev > 0 ? prev - 1 : activeManual.chapters.length - 1
                      )
                    }
                    className="glossy-btn-secondary px-3 py-1.5 rounded-xl text-xs font-medium text-[#F5F7F2] cursor-pointer"
                  >
                    {guideLang === 'bn' ? 'পূর্ববর্তী' : 'Previous'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveManualChapter((prev) =>
                        prev < activeManual.chapters.length - 1 ? prev + 1 : 0
                      )
                    }
                    className="glossy-btn-secondary px-3 py-1.5 rounded-xl text-xs font-medium text-[#F5F7F2] cursor-pointer"
                  >
                    {guideLang === 'bn' ? 'পরবর্তী' : 'Next'}
                  </button>
                </div>
              </div>

              <p className="text-sm text-[#A1AAA2] leading-relaxed mb-5">
                {currentManual.summary}
              </p>

              <ol className="space-y-3">
                {currentManual.steps.map((stepText, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 p-4 rounded-xl bg-[#121614] border border-white/[0.08]"
                  >
                    <span className="w-6 h-6 rounded-full bg-[#B7F34A]/15 border border-[#B7F34A]/40 text-[#B7F34A] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                      {index + 1}
                    </span>
                    <span className="text-xs sm:text-sm text-[#F5F7F2] leading-relaxed">{stepText}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-6 pt-5 border-t border-white/[0.09] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-[#A1AAA2]">
                  <CheckCircle2 size={14} className="text-[#B7F34A]" />
                  <span>
                    {guideLang === 'bn'
                      ? 'কম্পিউটার, ট্যাবলেট ও মোবাইল সব ডিভাইসে কাজ করে'
                      : 'Works on Desktop, Tablet & Mobile touchscreens'}
                  </span>
                </div>

                <a
                  href={MIRRORPOS_APP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-[#B7F34A] hover:underline inline-flex items-center gap-1.5"
                >
                  <span>Launch MirrorPOS</span>
                  <ArrowRight size={13} />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Action Bar */}
        <section className="glossy-card border-[#B7F34A]/25 rounded-2xl p-8 text-center">
          <div className="max-w-xl mx-auto space-y-4">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#F5F7F2] tracking-tight">
              Start using MirrorPOS today
            </h2>
            <p className="text-xs sm:text-sm text-[#A1AAA2] leading-relaxed">
              Launch MirrorPOS directly in your browser or install it on Windows Desktop via Chrome or Edge.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3">
              <a
                href={MIRRORPOS_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="glossy-btn w-full sm:w-auto px-7 py-3.5 rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>Launch MirrorPOS</span>
                <ExternalLink size={14} />
              </a>

              {onStartProject && (
                <button
                  type="button"
                  onClick={onStartProject}
                  className="glossy-btn-secondary w-full sm:w-auto px-6 py-3.5 rounded-xl text-xs font-semibold tracking-wide flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Layers size={14} className="text-[#B7F34A]" />
                  <span>Custom Enterprise Setup</span>
                </button>
              )}

              <button
                type="button"
                onClick={onNavigateHome}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-transparent hover:bg-white/[0.04] border border-white/[0.09] text-[#A1AAA2] hover:text-[#F5F7F2] text-xs font-semibold tracking-wide transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                Back to MirrorBook
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
