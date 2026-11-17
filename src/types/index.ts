export type Category = 'All' | 'Premiere Pro' | 'After Effects' | 'Photoshop' | 'PC & Mac' | 'Android & iOS';

export type ProductType = 'Plugin' | 'Course' | 'Software' | 'Free Tutorial' | 'Agency Package';

export type UserRole = 'customer' | 'admin';

export type ProductStatus = 'active' | 'draft' | 'archived';

export interface ProductItem {
  id: string;
  type: ProductType;
  category: string;
  title: string;
  description: string;
  price: number;
  isFree?: boolean;
  priceDisplay?: string;
  period?: string;
  thumbnailUrl?: string;
  iconUrl?: string;
  launchUrl?: string;
  protectedUrl?: string;
  features?: string[];
  status?: ProductStatus;
  duration?: string;
  instructor?: string;
  createdAt?: string;
  updatedAt?: string;
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

export type CourseLessonStatus = 'Available' | 'Coming Soon';

export interface CourseLessonSlot {
  lessonNumber: number;
  title: string;
  status: CourseLessonStatus;
  duration?: string;
  youtubeId?: string | null;
  thumbnailUrl?: string | null;
  embedUrl?: string | null;
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
  spreadsheetUrl?: string;
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
  status?: 'Pending' | 'Verified' | 'Paid' | 'Completed';
  productId?: string;
  downloadUrl?: string;
  licenseKey?: string;
  canonicalAmount?: number;
  verificationNote?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface UserPurchase {
  id: string;
  productId?: string;
  title: string;
  category?: string;
  downloadUrl: string;
  purchasedAt: string;
  trxId?: string;
  licenseKey?: string;
}

export interface DownloadHistoryItem {
  id: string;
  userId: string;
  purchaseId?: string;
  title: string;
  category?: string;
  licenseKey?: string;
  sessionToken?: string;
  downloadedAt: string;
}

export interface CustomerProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  phone?: string;
  company?: string;
  role: UserRole;
  authProvider: string;
  emailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  isGoogle?: boolean;
  authProvider?: string;
  emailVerified?: boolean;
  role: UserRole;
  backendVerified?: boolean;
  phone?: string;
  company?: string;
}

export interface CheckoutItem {
  id?: string;
  name: string;
  price: string;
  category?: string;
}

export interface SheetPaymentLog {
  timestamp: string;
  gateway: string;
  transactionType?: string;
  trxId: string;
  amount: number;
  sender: string;
  status: string;
  usedByOrderId?: string;
}

// Strict Studio Owner identity — verified server-side via Firebase ID token & Firestore rules
export const OWNER_EMAILS: string[] = [
  'khansaheb2572@gmail.com',
];

export function isStudioOwner(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return OWNER_EMAILS.some((owner) => owner.toLowerCase() === clean);
}

export function isVerifiedAdminUser(user?: AppUser | null): boolean {
  if (!user) return false;
  return user.role === 'admin' && user.backendVerified === true && isStudioOwner(user.email);
}

export function generateDeterministicLicenseKey(title: string, email?: string | null, seed?: string): string {
  const cleanProd = (title || 'ASSET').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase() || 'ASSET';
  const emailPrefix = ((email || 'USER').split('@')[0] || 'USER').replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase() || 'USER';
  const suffix = (seed || '0000').replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase() || 'ACTIVE';
  return `MB-${cleanProd}-${emailPrefix}-${suffix}`;
}
