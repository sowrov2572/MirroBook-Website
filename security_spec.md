# MirrorBook Firestore Security Specification (SMS Payment Verification Hardening)

## 1. Data Invariants
1. **Strict Admin Isolation:** Only a verified account whose UID exists in `/admins/{uid}` OR whose verified Firebase token email is strictly `khansaheb2572@gmail.com` (`email_verified == true`) is authorized as Admin.
2. **Self-Assigned Role Prevention:** No user can create or update `/users/{userId}` with `role == 'admin'` unless verified by `isVerifiedOwnerEmail()`. Customer registration is forced to `role == 'customer'`.
3. **Paid Product Secret Isolation:** Paid products in `/products/{productId}` (`price > 0`) MUST NOT contain a `protectedUrl` URL. Protected download links are isolated in `/productSecrets/{productId}` (strictly Admin read/write + server-side Admin SDK).
4. **Server-Only SMS & Payment Verification Collections:** `/bkashTransactions/{trxId}`, `/redeemedTrxIds/{trxId}`, and `/paymentSessions/{sessionId}` reject all client reads and writes (`allow read, write: if false`). Only trusted Vercel serverless functions using Firebase Admin SDK may access them.
5. **Admin-SDK-Only Purchase Records:** Customers may ONLY read (`get`, `list`) their own `/users/{userId}/purchases/{purchaseId}` documents. All `create`, `update`, and `delete` operations on `/users/{userId}/purchases/{purchaseId}` are denied to client SDKs (`allow write: if false`) and performed exclusively by Firebase Admin SDK inside atomic transactions.
6. **Zero-Bypass Order Integrity:** Clients can NEVER create an order with status `Verified`, `Paid`, or `Completed`, nor inject non-empty `downloadUrl` or `licenseKey`. Customer client writes (when allowed for Pending manual requests) are restricted to `status == 'Pending'` and empty `downloadUrl`/`licenseKey`. Only Admins / Admin SDK may transition orders to `Completed` or `Verified`.

## 2. The "Dirty Dozen" Payloads (Expected Result: PERMISSION_DENIED)
1. **Customer Forging Completed/Paid Order (`create /orders/MB-9999`):** `{ id: "MB-9999", status: "Completed", downloadUrl: "https://evil.test", ... }` by customer.
2. **Customer Forging Verified Order (`create /orders/MB-9998`):** `{ id: "MB-9998", status: "Verified", ... }` by customer.
3. **Customer Writing Own Purchase Directly (`create /users/{uid}/purchases/MB-9999`):** `{ id: "MB-9999", title: "Course", downloadUrl: "https://drive.google.com/...", ... }`.
4. **Fake SMS Injection from Client (`create /bkashTransactions/FAKE12345`):** `{ trxId: "FAKE12345", amount: 2000, status: "UNUSED", verifiedByWebhook: true }`.
5. **Public Enumeration of Unused TrxIDs (`list /bkashTransactions`):** Visitor or customer querying `/bkashTransactions` to steal unused TrxIDs.
6. **Paid Secret Download URL Theft (`get /productSecrets/course-video-reels` or `list /productSecrets`):** Customer reading `/productSecrets`.
7. **Redeemed TrxID Lock Tampering (`delete /redeemedTrxIds/CKL82910AK`):** Attacker trying to clear a redeemed transaction lock.
8. **Shadow Update Escalation (`update /users/{uid}`):** `{ displayName: "Bob", role: "admin" }`.
9. **Unverified Admin Email Spoof:** Account claiming `email == "khansaheb2572@gmail.com"` with `email_verified == false`.
10. **Blanket Orders Scrape (`list /orders`):** Customer A querying orders belonging to Customer B.
11. **Admin Secrets Theft (`get /settings/adminConfig`):** Customer reading `telegramBotToken`.
12. **Paid Product URL Injection (`update /products/course-video-reels`):** Writing `protectedUrl: "https://drive.google.com/..."` onto a paid product document.
13. **MirrorPOS Self-Approval (`create /mirrorpos_license_requests/{id}` with `paymentStatus: "APPROVED"` or `update /mirrorpos_license_requests/{id}`):** Customer attempting to auto-approve or flip `paymentStatus` / `licenseStatus`.
14. **MirrorPOS Direct License Forgery (`create` or `update /mirrorpos_user_licenses/{uid}`):** Customer writing `licenseStatus: "ACTIVE"` directly without Admin authorization.
15. **MirrorPOS Duplicate TrxID Replay (`create /mirrorpos_trx_locks/{trxId}`):** Reusing an already submitted Transaction ID.
16. **MirrorPOS License Request Scraping (`list /mirrorpos_license_requests`):** Customer attempting to list another user's payment submissions.
17. **Admin Audit Log Forgery or Deletion (`create /admin_activity_logs` as customer, or `delete/update` as anyone):** Tampering with audit logs.

