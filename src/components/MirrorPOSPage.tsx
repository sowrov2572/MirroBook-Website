import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ExternalLink,
  Share2,
  Check,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Printer,
  Cloud,
  Monitor,
  Chrome,
  Globe,
  BookOpen,
  Download,
  CheckCircle2,
  ScanBarcode,
  Receipt,
  ShieldCheck,
  Laptop,
  ArrowRight,
  ChevronRight,
  Layers,
} from 'lucide-react';
import posTerminalImg from '../assets/images/mirrorpos_pos_terminal_1794819846095.jpg';
import inventoryImg from '../assets/images/mirrorpos_inventory_ledger_1794819847755.jpg';
import analyticsImg from '../assets/images/mirrorpos_analytics_reports_1794819847659.jpg';

interface MirrorPOSPageProps {
  onNavigateHome: () => void;
  onStartProject?: () => void;
}

type BrowserTab = 'chrome' | 'edge';

export const MirrorPOSPage: React.FC<MirrorPOSPageProps> = ({
  onNavigateHome,
  onStartProject,
}) => {
  const [activeScreenshot, setActiveScreenshot] = useState<number>(0);
  const [browserTab, setBrowserTab] = useState<BrowserTab>('chrome');
  const [activeManualChapter, setActiveManualChapter] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const MIRRORPOS_APP_URL = 'https://mirror-pos.vercel.app/';

  useEffect(() => {
    const originalTitle = document.title;
    const newTitle = 'MirrorPOS | Smart Point of Sale Software by MirrorBook';
    document.title = newTitle;

    let metaDesc = document.querySelector('meta[name="description"]');
    const originalDesc = metaDesc?.getAttribute('content') || '';
    const newDesc =
      'A smart Point of Sale software designed to manage sales, inventory, customers, and business operations. Built by MirrorBook for Windows Desktop, Web, and Mobile.';
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

    const ogTitle = document.querySelector('meta[property="og:title"]');
    const origOgTitle = ogTitle?.getAttribute('content') || '';
    if (ogTitle) ogTitle.setAttribute('content', newTitle);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    const origOgDesc = ogDesc?.getAttribute('content') || '';
    if (ogDesc) ogDesc.setAttribute('content', newDesc);

    const ogUrl = document.querySelector('meta[property="og:url"]');
    const origOgUrl = ogUrl?.getAttribute('content') || '';
    if (ogUrl) ogUrl.setAttribute('content', 'https://mirrorbook.site/mirrorpos');

    const softwareSchema = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      '@id': 'https://mirrorbook.site/mirrorpos#software',
      name: 'MirrorPOS',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Windows, macOS, Web, Android, iOS',
      url: 'https://mirror-pos.vercel.app/',
      sameAs: 'https://mirrorbook.site/mirrorpos',
      image: 'https://mirrorbook.site/mirror-pos-icon.png',
      description: newDesc,
      author: {
        '@type': 'Organization',
        '@id': 'https://mirrorbook.site/#organization',
        name: 'MirrorBook',
        url: 'https://mirrorbook.site/',
      },
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
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
      if (ogTitle && origOgTitle) ogTitle.setAttribute('content', origOgTitle);
      if (ogDesc && origOgDesc) ogDesc.setAttribute('content', origOgDesc);
      if (ogUrl && origOgUrl) ogUrl.setAttribute('content', origOgUrl);
      const scriptToRemove = document.getElementById('mirrorpos-schema');
      if (scriptToRemove) scriptToRemove.remove();
    };
  }, []);

  const handleShare = async () => {
    const url = 'https://mirrorbook.site/mirrorpos';
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'MirrorPOS | Smart Point of Sale Software by MirrorBook',
          text: 'A smart Point of Sale software designed to manage sales, inventory, customers, and business operations.',
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
      icon: ShoppingCart,
      title: 'Fast POS Billing & Checkout',
      description:
        'Process counter sales in seconds with keyboard shortcuts, instant item search, flexible line-item discounts, tax rules, and split payment methods.',
    },
    {
      icon: ScanBarcode,
      title: 'Barcode & Inventory Control',
      description:
        'Scan USB or Bluetooth barcodes directly at checkout. Every completed sale deducts stock automatically and flags low-inventory SKUs before you run out.',
    },
    {
      icon: Users,
      title: 'Customer & Supplier Ledgers',
      description:
        'Maintain organized customer profiles, track partial payments or credit dues, record supplier purchase invoices, and settle balances with full audit trails.',
    },
    {
      icon: BarChart3,
      title: 'Real-Time Business Accounting',
      description:
        'Monitor daily revenue, net profit margins, expense entries, and cashier performance in clear visual dashboards without manual spreadsheet reconciliation.',
    },
    {
      icon: Printer,
      title: 'Thermal & A4 Invoice Printing',
      description:
        'Print crisp 58mm and 80mm thermal counter receipts or export branded PDF invoices tailored with your business name, logo, address, and footer notes.',
    },
    {
      icon: Cloud,
      title: 'Cloud Sync & Offline Resilience',
      description:
        'Keep selling even when internet connectivity dips. Local browser caching works smoothly alongside real-time cloud synchronization across devices.',
    },
  ];

  const screenshots = [
    {
      id: 'pos',
      label: '01. POS Terminal & Checkout',
      caption:
        'High-speed sales counter view with instant product catalog, barcode search, itemized invoice cart, discount controls, and one-click receipt printing.',
      image: posTerminalImg,
      alt: 'MirrorPOS Point of Sale Terminal and Active Checkout Screen',
    },
    {
      id: 'inventory',
      label: '02. Inventory & Barcode Control',
      caption:
        'Complete stock registry with SKU barcodes, real-time unit counts, supplier mapping, category filters, and immediate low-stock action alerts.',
      image: inventoryImg,
      alt: 'MirrorPOS Inventory Management and Barcode Stock Registry',
    },
    {
      id: 'analytics',
      label: '03. Analytics, Ledgers & Receipts',
      caption:
        'Executive retail accounting view displaying hourly sales trends, monthly revenue vs. profit, customer & supplier due ledgers, and thermal receipt previews.',
      image: analyticsImg,
      alt: 'MirrorPOS Financial Analytics, Customer Due Ledgers and Receipt Preview',
    },
  ];

  const chromeSteps = [
    {
      step: 'Step 01',
      title: 'Open MirrorPOS in Google Chrome',
      detail:
        'Launch Google Chrome on your Windows 10 or Windows 11 PC and go to https://mirror-pos.vercel.app/. Wait 2 seconds for the application to finish loading.',
    },
    {
      step: 'Step 02',
      title: 'Click the Install App Icon in Address Bar',
      detail:
        'Look at the right edge of Chrome’s URL address bar for the small computer/download icon ("Install MirrorPOS"). Alternatively, click the three-dot menu (⋮) in the top-right corner → Cast, save, and share → Install page as app.',
    },
    {
      step: 'Step 03',
      title: 'Confirm Installation',
      detail:
        'In the popup dialog, click the blue "Install" button. MirrorPOS immediately opens in its own clean, distraction-free Windows desktop window without Chrome tabs.',
    },
    {
      step: 'Step 04',
      title: 'Pin to Windows Taskbar & Desktop',
      detail:
        'Right-click the MirrorPOS icon on your Windows Taskbar and select "Pin to taskbar". Chrome also creates a Desktop shortcut automatically so cashiers can launch MirrorPOS with one click.',
    },
  ];

  const edgeSteps = [
    {
      step: 'Step 01',
      title: 'Open MirrorPOS in Microsoft Edge',
      detail:
        'Open Microsoft Edge on your Windows 10 or Windows 11 computer and navigate to https://mirror-pos.vercel.app/.',
    },
    {
      step: 'Step 02',
      title: 'Select "Install this site as an app"',
      detail:
        'Click the "App available" icon on the right side of the Edge address bar, or click the three-dot menu (⋯) at the top-right → Apps → Install this site as an app.',
    },
    {
      step: 'Step 03',
      title: 'Confirm App Name & Install',
      detail:
        'Keep the application name as "MirrorPOS" and click "Install". Edge packages MirrorPOS as an isolated Windows desktop application.',
    },
    {
      step: 'Step 04',
      title: 'Enable Taskbar & Desktop Shortcuts',
      detail:
        'In the confirmation window that appears right after installation, check "Pin to taskbar", "Pin to Start", and "Create Desktop shortcut" for instant counter access.',
    },
  ];

  const manualChapters = [
    {
      number: '01',
      title: 'Store Setup & Initial Configuration',
      summary: 'Configure your shop profile, receipt header, currency, and operator workspace in under 2 minutes.',
      steps: [
        'Launch MirrorPOS from your Desktop shortcut or visit https://mirror-pos.vercel.app/ and sign in with your business account.',
        'Open Settings → Store Profile and enter your Shop Name, Business Phone, Address, Currency symbol (e.g., ৳ / $), and optional tax rate.',
        'Configure Receipt Footer Notes (e.g., "Thank you for shopping with us" or exchange policy terms) so every printed receipt looks official.',
        'Select your default printer width (58mm thermal, 80mm thermal, or standard A4 PDF invoice).',
      ],
    },
    {
      number: '02',
      title: 'Adding Products, Prices & Barcodes',
      summary: 'Populate your catalog with SKUs, purchase cost, retail price, and opening stock quantities.',
      steps: [
        'Navigate to Inventory from the left navigation sidebar and click the "+ Add Product" button.',
        'Enter the Product Name, select or create a Category, and scan an existing product barcode (or auto-generate a unique SKU code).',
        'Set the Purchase Cost (for accurate net profit reporting) and Selling Price, along with any wholesale tier if applicable.',
        'Input your current Opening Stock quantity and set a Low-Stock Alert threshold so MirrorPOS warns you before popular items sell out.',
      ],
    },
    {
      number: '03',
      title: 'Processing Sales & Printing Receipts',
      summary: 'Run smooth, error-free counter checkouts using barcode scanning, touch selection, or search.',
      steps: [
        'Open the POS Terminal screen. Click the search bar or scan an item directly with a USB/Bluetooth barcode scanner to add it to the Active Invoice Cart.',
        'Adjust item quantities using the + / − controls, apply item-level or invoice-wide discounts, and select a walk-in or saved customer.',
        'Choose the payment method (Cash, Card, Mobile Banking / bKash / Nagad, or Credit/Due) and enter the tendered amount to view change due.',
        'Click "Checkout & Print Receipt" to finalize the sale, automatically deduct stock levels, and trigger thermal or PDF receipt printing.',
      ],
    },
    {
      number: '04',
      title: 'Customer Profiles & Due Ledgers',
      summary: 'Keep track of repeat buyers, credit invoices, and due settlements cleanly.',
      steps: [
        'Go to Customers and register regular buyers with their name, phone number, and optional address.',
        'During POS checkout, assign the invoice to a customer and record partial or zero upfront payment to log the remaining balance into their Due Ledger.',
        'Open any customer’s ledger card to inspect past invoices, total outstanding balance, and chronological payment history.',
        'Click "Receive Payment" whenever a customer settles their due; MirrorPOS updates both their balance and daily cash inflow automatically.',
      ],
    },
    {
      number: '05',
      title: 'Suppliers & Stock-In Purchases',
      summary: 'Log incoming wholesale deliveries and keep supplier payables reconciled.',
      steps: [
        'Open Suppliers to add your distributors and wholesale vendors along with contact information.',
        'When new merchandise arrives, create a Purchase / Stock-In entry selecting the supplier, products received, unit cost, and quantities.',
        'Confirming the purchase instantly increases available inventory quantities and updates weighted purchase costs.',
        'Track paid vs. unpaid supplier invoices under the Supplier Due Ledger to stay on top of vendor payments.',
      ],
    },
    {
      number: '06',
      title: 'Daily Closing, Expenses & Reports',
      summary: 'Audit sales performance, log daily shop expenses, and review net profitability.',
      steps: [
        'Record shop operating expenses (rent, utilities, courier fees, tea/supplies) in the Accounting → Expenses tab.',
        'Open Reports at the end of your shift to inspect Total Gross Sales, Cost of Goods Sold, Operating Expenses, and Net Profit.',
        'Verify Cash-in-Hand against cash sales, card settlements, and due collections before closing the counter for the day.',
        'Export summary statements or invoice logs as PDF/CSV whenever needed for tax filing or partner review.',
      ],
    },
  ];

  const activeSteps = browserTab === 'chrome' ? chromeSteps : edgeSteps;
  const currentManual = manualChapters[activeManualChapter];

  return (
    <div className="min-h-screen bg-[#070707] text-white">
      <div className="max-w-7xl mx-auto px-6 py-10 md:py-16">
        {/* Top Breadcrumb & Share Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-12 pb-6 border-b border-white/[0.08]">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#888888]">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onNavigateHome();
              }}
              className="hover:text-[#71B913] transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <ArrowLeft size={14} />
              <span>MirrorBook Home</span>
            </a>
            <span aria-hidden="true">/</span>
            <span className="text-[#AAAAAA]">Products</span>
            <span aria-hidden="true">/</span>
            <span className="text-[#71B913] font-semibold">MirrorPOS</span>
          </nav>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-medium text-[#CCCCCC] hover:text-white transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            {copiedLink ? (
              <>
                <Check size={13} className="text-[#71B913]" />
                <span className="text-[#71B913]">Link Copied</span>
              </>
            ) : (
              <>
                <Share2 size={13} className="text-[#71B913]" />
                <span>Share Product Page</span>
              </>
            )}
          </button>
        </div>

        {/* 1. Product Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center mb-24">
          <div className="lg:col-span-6 space-y-6">
            {/* App Icon + Brand Attribution */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#0D0D0D] border border-white/15 p-3 flex items-center justify-center shrink-0 shadow-[0_12px_30px_rgba(0,0,0,0.6)]">
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
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#888888] mb-1">
                  <span className="text-[#71B913] font-semibold">MirrorBook Software</span>
                  <span aria-hidden="true">·</span>
                  <span>Commercial POS &amp; Inventory</span>
                </div>
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-none">
                  MirrorPOS
                </h1>
              </div>
            </div>

            <p className="text-lg sm:text-xl text-[#DDDDDD] leading-relaxed font-normal max-w-xl">
              A smart Point of Sale software designed to manage sales, inventory, customers, and business operations.
            </p>

            <p className="text-sm text-[#999999] leading-relaxed max-w-xl">
              Built for retail stores, wholesalers, pharmacies, electronics outlets, and service counters. Run seamlessly in your browser or install directly onto Windows Desktop with Google Chrome or Microsoft Edge.
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3.5 pt-2">
              <a
                href={MIRRORPOS_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 rounded-xl bg-[#71B913] hover:bg-[#82d119] active:scale-[0.98] text-black text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0 shadow-[0_10px_30px_rgba(113,185,19,0.3)]"
              >
                <span>Launch MirrorPOS</span>
                <ExternalLink size={15} />
              </a>

              <button
                type="button"
                onClick={() => scrollToLocalSection('install-mirrorpos')}
                className="px-6 py-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 hover:border-[#71B913]/50 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Download size={14} className="text-[#71B913]" />
                <span>How to Install</span>
              </button>

              <button
                type="button"
                onClick={() => scrollToLocalSection('user-manual')}
                className="px-6 py-4 rounded-xl bg-transparent hover:bg-white/[0.04] border border-white/10 text-[#CCCCCC] hover:text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
              >
                <BookOpen size={14} className="text-[#71B913]" />
                <span>User Manual</span>
              </button>
            </div>

            {/* Compatibility Strip */}
            <div className="pt-4 border-t border-white/[0.08] flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#888888]">
              <span className="flex items-center gap-1.5">
                <Monitor size={13} className="text-[#71B913]" />
                Windows 10 / 11 Desktop App
              </span>
              <span className="flex items-center gap-1.5">
                <Globe size={13} className="text-[#71B913]" />
                Cloud Web App
              </span>
              <span className="flex items-center gap-1.5">
                <Receipt size={13} className="text-[#71B913]" />
                58mm / 80mm Thermal &amp; PDF
              </span>
            </div>
          </div>

          {/* Right Hero Screenshot */}
          <div className="lg:col-span-6">
            <div className="rounded-3xl bg-[#0D0D0D] border border-white/10 p-3 sm:p-4 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.85)]">
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/10">
                <img
                  src={posTerminalImg}
                  alt="MirrorPOS Commercial Point of Sale Interface"
                  loading="eager"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center"
                />
              </div>
              <div className="pt-3 px-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[#888888]">
                <span className="text-white/90 font-medium">MirrorPOS Counter Terminal</span>
                <span>Live at mirror-pos.vercel.app</span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Product Features Section */}
        <section id="features" className="mb-24 pt-16 border-t border-white/[0.08]">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#71B913] block mb-2">
                Core Capabilities
              </span>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
                Product Features
              </h2>
            </div>
            <p className="text-sm text-[#999999] max-w-md leading-relaxed">
              Every module needed to run daily counter billing, stock control, due collection, and financial reporting in one unified interface.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const IconComp = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-[#0C0C0C] border border-white/[0.08] hover:border-[#71B913]/40 rounded-2xl p-7 transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-[#71B913] mb-5">
                      <IconComp size={20} />
                    </div>
                    <h3 className="font-display text-lg font-bold text-white mb-2.5">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-[#999999] leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. Software Screenshots Gallery */}
        <section id="screenshots" className="mb-24 pt-16 border-t border-white/[0.08]">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#71B913] block mb-2">
                Interface Walkthrough
              </span>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
                Software Screenshots
              </h2>
            </div>

            {/* Interactive Screenshot Switcher */}
            <div className="flex flex-wrap items-center gap-2">
              {screenshots.map((shot, idx) => {
                const isActive = activeScreenshot === idx;
                return (
                  <button
                    key={shot.id}
                    type="button"
                    onClick={() => setActiveScreenshot(idx)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-[#71B913] text-black font-bold'
                        : 'bg-white/[0.04] border border-white/10 text-[#AAAAAA] hover:text-white hover:border-white/25'
                    }`}
                  >
                    {shot.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary Featured Screenshot Frame */}
          <div className="bg-[#0C0C0C] border border-white/[0.08] rounded-3xl p-4 sm:p-6 mb-6">
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/10">
              <img
                src={screenshots[activeScreenshot].image}
                alt={screenshots[activeScreenshot].alt}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center"
              />
            </div>

            <div className="pt-5 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-lg font-bold text-white">
                  {screenshots[activeScreenshot].label}
                </h3>
                <p className="text-sm text-[#999999] mt-1 max-w-3xl leading-relaxed">
                  {screenshots[activeScreenshot].caption}
                </p>
              </div>

              <a
                href={MIRRORPOS_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-[#71B913] hover:text-black border border-white/15 text-xs font-bold text-white transition-all inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
              >
                <span>Try Live App</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>

          {/* Thumbnail Selector Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {screenshots.map((shot, idx) => {
              const isSelected = activeScreenshot === idx;
              return (
                <button
                  key={shot.id}
                  type="button"
                  onClick={() => setActiveScreenshot(idx)}
                  className={`text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#71B913]/10 border-[#71B913]/60'
                      : 'bg-[#0C0C0C] border-white/[0.08] hover:border-white/25'
                  }`}
                >
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10 mb-3">
                    <img
                      src={shot.image}
                      alt={shot.alt}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-xs font-bold ${
                        isSelected ? 'text-[#71B913]' : 'text-white'
                      }`}
                    >
                      {shot.label}
                    </span>
                    <ChevronRight
                      size={14}
                      className={isSelected ? 'text-[#71B913]' : 'text-[#666666]'}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 4. How to Install MirrorPOS on Windows Desktop */}
        <section id="install-mirrorpos" className="mb-24 pt-16 border-t border-white/[0.08]">
          <div className="bg-[#0C0C0C] border border-white/[0.08] rounded-3xl p-6 sm:p-10 lg:p-12">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 pb-8 border-b border-white/[0.08]">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#71B913] mb-2">
                  <Laptop size={14} />
                  <span>Windows Desktop App Installation</span>
                </div>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
                  How to Install MirrorPOS on Windows
                </h2>
                <p className="text-sm sm:text-base text-[#AAAAAA] leading-relaxed">
                  Install MirrorPOS directly onto your Windows 10 or Windows 11 PC as a standalone desktop application using <strong className="text-white">Google Chrome</strong> or <strong className="text-white">Microsoft Edge</strong>—no bulky `.exe` installer required.
                </p>
              </div>

              {/* Browser Switcher Tabs */}
              <div className="flex items-center gap-2 p-1.5 bg-[#070707] border border-white/10 rounded-xl self-start lg:self-end">
                <button
                  type="button"
                  onClick={() => setBrowserTab('chrome')}
                  className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                    browserTab === 'chrome'
                      ? 'bg-[#71B913] text-black'
                      : 'text-[#AAAAAA] hover:text-white'
                  }`}
                >
                  <Chrome size={15} />
                  <span>Google Chrome</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBrowserTab('edge')}
                  className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                    browserTab === 'edge'
                      ? 'bg-[#71B913] text-black'
                      : 'text-[#AAAAAA] hover:text-white'
                  }`}
                >
                  <Globe size={15} />
                  <span>Microsoft Edge</span>
                </button>
              </div>
            </div>

            {/* 4-Step Install Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              {activeSteps.map((item) => (
                <div
                  key={item.step}
                  className="p-6 rounded-2xl bg-[#070707] border border-white/[0.08] hover:border-[#71B913]/35 transition-all"
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#71B913] tabular-nums">
                      {item.step}
                    </span>
                    <span className="text-[11px] text-[#777777]">
                      {browserTab === 'chrome' ? 'Chrome on Windows' : 'Edge on Windows'}
                    </span>
                  </div>
                  <h3 className="font-display text-base sm:text-lg font-bold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[#999999] leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>

            {/* Quick Start Bar */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <ShieldCheck size={20} className="text-[#71B913] shrink-0 mt-0.5 sm:mt-0" />
                <div className="text-xs sm:text-sm text-[#CCCCCC] leading-relaxed">
                  <strong className="text-white">System Requirements:</strong> Windows 10 or Windows 11, Google Chrome or Microsoft Edge (latest version), plus optional USB/Bluetooth barcode scanner &amp; 58mm/80mm thermal printer.
                </div>
              </div>

              <a
                href={MIRRORPOS_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-xl bg-[#71B913] hover:bg-[#82d119] text-black text-xs font-bold uppercase tracking-wider transition-all inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
              >
                <span>Open MirrorPOS to Install</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </section>

        {/* 5. Interactive User Manual Section */}
        <section id="user-manual" className="mb-24 pt-16 border-t border-white/[0.08]">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#71B913] mb-2">
                <BookOpen size={14} />
                <span>Operator Guide</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
                MirrorPOS User Manual
              </h2>
            </div>
            <p className="text-sm text-[#999999] max-w-md leading-relaxed">
              Step-by-step operational manual for store owners and cashiers covering setup, inventory, checkout, customer dues, and accounting.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Chapter Navigation List */}
            <div className="lg:col-span-4 space-y-2">
              {manualChapters.map((chapter, idx) => {
                const isActive = activeManualChapter === idx;
                return (
                  <button
                    key={chapter.number}
                    type="button"
                    onClick={() => setActiveManualChapter(idx)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isActive
                        ? 'bg-[#71B913]/10 border-[#71B913]/60 text-white'
                        : 'bg-[#0C0C0C] border-white/[0.08] hover:border-white/20 text-[#AAAAAA] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`font-display text-sm font-bold tabular-nums shrink-0 ${
                          isActive ? 'text-[#71B913]' : 'text-[#666666]'
                        }`}
                      >
                        {chapter.number}.
                      </span>
                      <span className="text-sm font-semibold truncate">{chapter.title}</span>
                    </div>
                    <ChevronRight
                      size={15}
                      className={`shrink-0 ${isActive ? 'text-[#71B913]' : 'text-[#555555]'}`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Active Chapter Content */}
            <div className="lg:col-span-8 bg-[#0C0C0C] border border-white/[0.08] rounded-3xl p-7 sm:p-10">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-6 mb-6 border-b border-white/[0.08]">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#71B913] tabular-nums">
                    Chapter {currentManual.number} of 06
                  </span>
                  <h3 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
                    {currentManual.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveManualChapter((prev) =>
                        prev > 0 ? prev - 1 : manualChapters.length - 1
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-medium text-[#CCCCCC] cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveManualChapter((prev) =>
                        prev < manualChapters.length - 1 ? prev + 1 : 0
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-medium text-[#CCCCCC] cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>

              <p className="text-sm sm:text-base text-[#CCCCCC] leading-relaxed mb-6">
                {currentManual.summary}
              </p>

              <ol className="space-y-4">
                {currentManual.steps.map((stepText, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#070707] border border-white/[0.06]"
                  >
                    <span className="w-6 h-6 rounded-full bg-[#71B913]/15 border border-[#71B913]/40 text-[#71B913] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                      {index + 1}
                    </span>
                    <span className="text-sm text-[#DDDDDD] leading-relaxed">{stepText}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-8 pt-6 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-[#888888]">
                  <CheckCircle2 size={14} className="text-[#71B913]" />
                  <span>Works seamlessly on Desktop &amp; Mobile touchscreens</span>
                </div>

                <a
                  href={MIRRORPOS_APP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-[#71B913] hover:underline inline-flex items-center gap-1.5"
                >
                  <span>Open MirrorPOS Workspace</span>
                  <ArrowRight size={13} />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Final Prominent Launch MirrorPOS CTA */}
        <section className="bg-[#0C0C0C] border border-[#71B913]/30 rounded-3xl p-8 sm:p-12 text-center">
          <div className="max-w-2xl mx-auto space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-[#070707] border border-white/15 p-3 mx-auto flex items-center justify-center">
              <img
                src="/mirror-pos-icon.png"
                alt="MirrorPOS App Icon"
                width={48}
                height={48}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>

            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Ready to run your store on MirrorPOS?
            </h2>

            <p className="text-sm sm:text-base text-[#AAAAAA] leading-relaxed">
              Launch MirrorPOS in your browser right now or install it onto your Windows Desktop counter terminal in under 60 seconds.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3.5">
              <a
                href={MIRRORPOS_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-9 py-4 rounded-xl bg-[#71B913] hover:bg-[#82d119] text-black text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-[0_10px_30px_rgba(113,185,19,0.3)] whitespace-nowrap shrink-0"
              >
                <span>Launch MirrorPOS</span>
                <ExternalLink size={15} />
              </a>

              {onStartProject && (
                <button
                  type="button"
                  onClick={onStartProject}
                  className="w-full sm:w-auto px-7 py-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Layers size={14} className="text-[#71B913]" />
                  <span>Request Custom Setup</span>
                </button>
              )}

              <button
                type="button"
                onClick={onNavigateHome}
                className="w-full sm:w-auto px-7 py-4 rounded-xl bg-transparent hover:bg-white/[0.04] border border-white/10 text-[#AAAAAA] hover:text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0"
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
