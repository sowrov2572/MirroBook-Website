# MirrorBook Firestore Security Specification (Phase 0)

## 1. Data Invariants
1. **Strict Admin Isolation:** Only a verified account whose UID exists in `/admins/{uid}` OR whose verified Firebase token email is strictly `khansaheb2572@gmail.com` (`email_verified == true`) is authorized as Admin.
2. **Self-Assigned Role Prevention:** No user can create or update `/users/{userId}` with `role == 'admin'` unless verified by `isVerifiedOwnerEmail()`. Customer registration is forced to `role == 'customer'`.
3. **Admin Secrets Isolation:** Sensitive configuration (`telegramBotToken`, `telegramChatId`, `spreadsheetUrl`) is stored in `/settings/adminConfig` and strictly denied for all non-admins. Only `/settings/paymentConfig` (public payment phone numbers/bank info) is publicly readable.
4. **Customer Data & PII Isolation:** Customer profiles (`/users/{userId}`), purchases (`/users/{userId}/purchases/{purchaseId}`), downloads (`/users/{userId}/downloads/{downloadId}`), and orders (`/orders/{orderId}`) cannot be listed or read by unauthenticated visitors or other customers.
5. **Immutable Identity & Audit Fields:** `uid`, `email`, and `createdAt` on `/users/{userId}` are immutable after creation.
6. **Zero-Bypass Order Integrity:** Customer order creation cannot forge another `userId`, cannot inject arbitrary fields, and cannot directly mark `Completed` status. Only verified Admin can approve, update, or delete orders.

## 2. The "Dirty Dozen" Payloads (Expected Result: PERMISSION_DENIED)
1. **Self-Role Escalation on Registration (`create /users/{uid}`):** `{ uid, email, displayName, role: "admin", ... }` by normal customer.
2. **Shadow Update Escalation (`update /users/{uid}`):** `{ displayName: "Bob", role: "admin" }` attempting to inject `role`.
3. **Cross-User Profile Read (`get /users/{otherUid}`):** Customer A reading Customer B's PII.
4. **Unverified Admin Email Spoof:** Authenticated account claiming `email == "khansaheb2572@gmail.com"` with `email_verified == false`.
5. **Blanket Users List Scrape (`list /users`):** Normal customer executing `collection(db, 'users')` query.
6. **Blanket Orders Scrape (`list /orders`):** Unauthenticated visitor or Customer A listing all orders.
7. **Admin Secrets Theft (`get /settings/adminConfig`):** Customer or visitor reading `telegramBotToken` from `settings/adminConfig`.
8. **Product Catalog Tampering (`update /products/plugin-easy-flow-v2`):** Normal customer modifying price to `0`.
9. **Payment Config Hijack (`update /settings/paymentConfig`):** Attacker changing `bKashNumber` to their own phone number.
10. **ID Poisoning Attack (`create /users/../../../etc/passwd` or >128 char docId):** Violates `isValidId()`.
11. **Order Identity Spoofing (`create /orders/MB-9999`):** Logged-in Customer A setting `userId: CustomerB_UID`.
12. **Admin Allowlist Injection (`create /admins/{attackerUid}`):** Attacker attempting to write into `/admins`.
