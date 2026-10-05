import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Services } from './components/Services';
import { ShowcasesVault } from './components/ShowcasesVault';
import { Packages } from './components/Packages';
import { PluginStore } from './components/PluginStore';
import { CoursesAndTutorials } from './components/CoursesAndTutorials';
import { CheckoutModal } from './components/CheckoutModal';
import { VideoPlayerModal, PlayableVideo } from './components/VideoPlayerModal';
import { AdminModal } from './components/AdminModal';
import { StartProjectModal } from './components/StartProjectModal';
import { Footer } from './components/Footer';
import { CheckoutItem, TutorialItem, Order, ProductItem, ShowcaseItem, PaymentConfig } from './types';
import { INITIAL_DEMO_ORDERS, INITIAL_PRODUCTS } from './data/content';
import {
  loadPaymentConfig,
  savePaymentConfig,
} from './utils/paymentService';
import {
  sanitizeProductsForPublic,
  syncProductsToSheet,
  fetchProductsFromSheet,
  SHEETS_URL_KEY,
  PRODUCTS_STORAGE_KEY,
} from './utils/syncService';

export default function App() {
  const [checkoutItem, setCheckoutItem] = useState<CheckoutItem | null>(null);
  const [activeVideo, setActiveVideo] = useState<PlayableVideo | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isStartProjectOpen, setIsStartProjectOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);

  // Payment configuration for bKash, Nagad, Bank, Google Sheets, Telegram
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>(loadPaymentConfig);

  // Dynamic Products and Google Sheets state
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [sheetsUrl, setSheetsUrl] = useState<string>('');

  // 1. Load orders & products from localStorage on mount
  useEffect(() => {
    // Orders
    try {
      const storedOrders = localStorage.getItem('mirrorbook_orders');
      if (storedOrders) {
        setOrders(JSON.parse(storedOrders));
      } else {
        localStorage.setItem('mirrorbook_orders', JSON.stringify(INITIAL_DEMO_ORDERS));
        setOrders(INITIAL_DEMO_ORDERS);
      }
    } catch {
      setOrders(INITIAL_DEMO_ORDERS);
    }

    // Google Sheets URL
    const storedSheetsUrl = localStorage.getItem(SHEETS_URL_KEY) || '';
    setSheetsUrl(storedSheetsUrl);

    // Products
    try {
      const storedProducts = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      } else {
        localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTS));
        setProducts(INITIAL_PRODUCTS);
      }
    } catch {
      setProducts(INITIAL_PRODUCTS);
    }

    // If sheets URL exists, attempt background sync
    if (storedSheetsUrl) {
      fetchProductsFromSheet(storedSheetsUrl).then((res) => {
        if (res.success && res.items && res.items.length > 0) {
          setProducts(res.items);
        }
      });
    }
  }, []);

  // Public Catalog Security Sanitization:
  // Paid items NEVER have their protectedUrl exposed in public React tree or inspect element
  const publicProducts = useMemo(() => {
    return sanitizeProductsForPublic(products);
  }, [products]);

  const publicPackages = useMemo(
    () => publicProducts.filter((p) => p.type === 'Agency Package'),
    [publicProducts]
  );
  const publicPlugins = useMemo(
    () => publicProducts.filter((p) => p.type === 'Plugin'),
    [publicProducts]
  );
  const publicCourses = useMemo(
    () => publicProducts.filter((p) => p.type === 'Course'),
    [publicProducts]
  );
  const publicTutorials = useMemo(
    () => publicProducts.filter((p) => p.type === 'Free Tutorial'),
    [publicProducts]
  );

  // Product mutations with instant LocalStorage save & Google Sheets sync
  const handleAddProduct = (newProduct: ProductItem) => {
    const updated = [newProduct, ...products];
    setProducts(updated);
    syncProductsToSheet(sheetsUrl, updated);
  };

  const handleUpdateProduct = (updatedProduct: ProductItem) => {
    const updated = products.map((p) => (p.id === updatedProduct.id ? updatedProduct : p));
    setProducts(updated);
    syncProductsToSheet(sheetsUrl, updated);
  };

  const handleDeleteProduct = (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    syncProductsToSheet(sheetsUrl, updated);
  };

  const handleSyncProducts = async (urlOverride?: string) => {
    const targetUrl = urlOverride !== undefined ? urlOverride : sheetsUrl;
    if (targetUrl) {
      // First try fetching latest from sheet
      const fetchRes = await fetchProductsFromSheet(targetUrl);
      if (fetchRes.items && fetchRes.items.length > 0) {
        setProducts(fetchRes.items);
        return { success: true, message: `Synced ${fetchRes.items.length} items from Google Sheet.` };
      }
    }
    // Otherwise push current products
    const pushRes = await syncProductsToSheet(targetUrl, products);
    return { success: pushRes.success, message: pushRes.message };
  };

  const handleSaveSheetsUrl = (url: string) => {
    const cleanUrl = url.trim();
    setSheetsUrl(cleanUrl);
    localStorage.setItem(SHEETS_URL_KEY, cleanUrl);
  };

  const handleOrderSuccess = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
  };

  const handleDeleteOrder = (id: string) => {
    const updated = orders.filter((o) => o.id !== id);
    setOrders(updated);
    try {
      localStorage.setItem('mirrorbook_orders', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleClearOrders = () => {
    if (window.confirm('Are you sure you want to clear all orders from the registry?')) {
      setOrders([]);
      try {
        localStorage.removeItem('mirrorbook_orders');
      } catch {
        // ignore
      }
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#070707] text-white flex flex-col selection:bg-[#CCFF00] selection:text-black">
      {/* 1. Header */}
      <Header onStartProject={() => setIsStartProjectOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-grow">
        {/* 2. Hero with Interactive Agency Showreel Video Player */}
        <Hero
          onViewPackages={() => scrollToSection('packages')}
          onBrowseStore={() => scrollToSection('plugins')}
          onPlayShowreel={() =>
            setActiveVideo({
              title: 'MirrorBook Agency Showreel // 2026 Edition',
              software: 'Agency 4K Master',
              duration: '03:20',
              description: 'Commercial video reel featuring our flagship client edits, DaVinci color grading, viral reels pacing, and proprietary AI workflows.',
              instructor: 'MirrorBook Creative Director',
            })
          }
        />

        {/* 3. Services with Modern High-Impact Copy & Video Thumbnail Previews */}
        <Services
          onPreviewVideo={(title, category) =>
            setActiveVideo({
              title: `${title} // Showcase Breakdown`,
              software: category,
              duration: '01:45',
              description: `Deep-dive case study into ${title}. Discover timeline breakdown, custom node trees, kinetic typography easing curves, and conversion lift.`,
              instructor: 'Lead Creative Specialist',
            })
          }
        />

        {/* 4. Creative Vault & Video Showcases (New Video/Thumbnail Slot Section) */}
        <ShowcasesVault
          onSelectVideo={(showcase: ShowcaseItem) =>
            setActiveVideo({
              title: showcase.title,
              software: showcase.category,
              duration: showcase.duration,
              description: showcase.description,
              instructor: showcase.client,
            })
          }
        />

        {/* 5. Agency Packages (Glossy iPhone-style Pricing Cards) */}
        <Packages
          packages={publicPackages}
          onSelectPackage={(item) => setCheckoutItem(item)}
        />

        {/* 6. Plugin Store (Glossy Glass Panels & Software UI Thumbnails) */}
        <PluginStore
          plugins={publicPlugins}
          onBuyItem={(item) => setCheckoutItem(item)}
        />

        {/* 7. Courses & Video Masterclasses */}
        <CoursesAndTutorials
          courses={publicCourses}
          tutorials={publicTutorials}
          onEnrollCourse={(item) => setCheckoutItem(item)}
          onSelectTutorial={(tut: TutorialItem) =>
            setActiveVideo({
              title: tut.title,
              software: tut.software,
              duration: tut.duration,
              description: tut.description,
              instructor: tut.instructor,
              videoUrl: tut.videoUrl,
            })
          }
        />
      </main>

      {/* 8. Footer & Admin View Link */}
      <Footer onOpenAdmin={() => setIsAdminOpen(true)} />

      {/* Multi-Method Payment Checkout Modal */}
      <CheckoutModal
        item={checkoutItem}
        onClose={() => setCheckoutItem(null)}
        onOrderSuccess={handleOrderSuccess}
        paymentConfig={paymentConfig}
        allProducts={products}
      />

      {/* Video Player Modal for Showreels, Showcases, Services, and Tutorials */}
      <VideoPlayerModal
        video={activeVideo}
        onClose={() => setActiveVideo(null)}
      />

      {/* Discreet Admin Portal (PIN: 1234) with Orders, Manage Products, and Automation Setup */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        orders={orders}
        onDeleteOrder={handleDeleteOrder}
        onClearOrders={handleClearOrders}
        products={products}
        onAddProduct={handleAddProduct}
        onUpdateProduct={handleUpdateProduct}
        onDeleteProduct={handleDeleteProduct}
        onSyncProducts={handleSyncProducts}
        sheetsUrl={sheetsUrl}
        onSaveSheetsUrl={handleSaveSheetsUrl}
        paymentConfig={paymentConfig}
        onSavePaymentConfig={(newCfg) => {
          savePaymentConfig(newCfg);
          setPaymentConfig(newCfg);
        }}
      />

      {/* Start Project Direct Inquiry Modal */}
      <StartProjectModal
        isOpen={isStartProjectOpen}
        onClose={() => setIsStartProjectOpen(false)}
        onSelectCheckout={(item) => setCheckoutItem(item)}
      />
    </div>
  );
}

