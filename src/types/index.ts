export type Category = 'All' | 'Premiere Pro' | 'After Effects' | 'Photoshop';

export type ProductType = 'Plugin' | 'Course' | 'Free Tutorial' | 'Agency Package';

export interface ProductItem {
  id: string;
  type: ProductType;
  category: string;
  title: string;
  description: string;
  price: number;
  priceDisplay?: string;
  period?: string;
  thumbnailUrl?: string;
  protectedUrl?: string;
  duration?: string;
  instructor?: string;
  createdAt?: string;
  featured?: boolean;
}

export interface ServiceItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  features?: string[];
  metrics?: string;
}

export interface ShowcaseItem {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  client: string;
  duration: string;
  description: string;
  videoUrl: string;
  aspectRatio?: '16:9' | '9:16';
  stats: string;
}

export interface PackageItem {
  id: string;
  name: string;
  price: number;
  period?: string;
  priceDisplay: string;
  description: string;
  featured?: boolean;
}

export interface PluginItem {
  id: string;
  title: string;
  software: string;
  price: number;
  priceDisplay: string;
  thumbnailUrl?: string;
  description?: string;
}

export interface CourseItem {
  id: string;
  title: string;
  price: number;
  priceDisplay: string;
  description: string;
  thumbnailUrl?: string;
}

export interface TutorialItem {
  id: string;
  title: string;
  software: string;
  duration: string;
  description: string;
  videoUrl: string;
  instructor: string;
  thumbnailUrl?: string;
}

export type PaymentMethod = 'bKash' | 'Nagad' | 'Rocket' | 'Upay' | 'Bank Transfer';

export interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branchName: string;
  routingNumber: string;
}

export interface PaymentConfig {
  bKashNumber: string;
  nagadNumber: string;
  rocketNumber: string;
  upayNumber: string;
  bankDetails: BankDetails;
  secondaryBankDetails?: BankDetails;
  webAppUrl: string;
  telegramBotToken: string;
  telegramChatId: string;
  whatsAppNumber: string;
}

export interface Order {
  id: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  itemName: string;
  itemPrice: string;
  paymentMethod: PaymentMethod;
  senderAccount: string;
  trxId: string;
  createdAt: string;
  status?: 'Pending' | 'Verified' | 'Completed';
  productId?: string;
  downloadUrl?: string;
}

export interface UserPurchase {
  id: string;
  productId?: string;
  title: string;
  category?: string;
  downloadUrl: string;
  purchasedAt: string;
  trxId?: string;
}

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  isGoogle?: boolean;
}

export interface CheckoutItem {
  id?: string;
  name: string;
  price: string;
  category?: string;
}

