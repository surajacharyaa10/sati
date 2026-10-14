# SATI E-Commerce Platform — Comprehensive Testing Specification & Guide

> Complete testing suite architecture, specifications, test cases, and execution strategy for **SATI** (Backend API, Client Storefront, and Admin Management Portal).

---

## Table of Contents

1. [Testing Architecture & Pyramid](#1-testing-architecture--pyramid)
2. [Recommended Testing Stack](#2-recommended-testing-stack)
3. [Backend API Test Suite (`backend/`)](#3-backend-api-test-suite-backend)
   - 3.1 [Authentication & Session Services](#31-authentication--session-services)
   - 3.2 [Cart & Wishlist Engine](#32-cart--wishlist-engine)
   - 3.3 [Product Catalog & Inventory](#33-product-catalog--inventory)
   - 3.4 [Order Processing & Lifecycle](#34-order-processing--lifecycle)
   - 3.5 [Stripe Payment Integration](#35-stripe-payment-integration)
   - 3.6 [eSewa Digital Wallet Integration](#36-esewa-digital-wallet-integration)
   - 3.7 [Admin Protected Endpoints](#37-admin-protected-endpoints)
4. [Client Storefront Test Suite (`client/`)](#4-client-storefront-test-suite-client)
   - 4.1 [State Stores & Contexts](#41-state-stores--contexts)
   - 4.2 [Core Components & Navigation](#42-core-components--navigation)
   - 4.3 [Checkout & Delivery Information Form](#43-checkout--delivery-information-form)
   - 4.4 [Payment Success Slip & Printable Layout](#44-payment-success-slip--printable-layout)
   - 4.5 [Payment Failure & Error Boundaries](#45-payment-failure--error-boundaries)
5. [Admin Portal Test Suite (`sati-admin/`)](#5-admin-portal-test-suite-sati-admin)
   - 5.1 [Admin Auth & Security Guards](#51-admin-auth--security-guards)
   - 5.2 [Orders Management & Fulfillment](#52-orders-management--fulfillment)
   - 5.3 [Official Payment Slip Modal](#53-official-payment-slip-modal)
   - 5.4 [Catalog & Product CRUD](#54-catalog--product-crud)
6. [End-to-End (E2E) Test Scenarios (Playwright)](#6-end-to-end-e2e-test-scenarios-playwright)
7. [Security, Fraud Prevention & Edge Cases](#7-security-fraud-prevention--edge-cases)
8. [Performance & Load Testing](#8-performance--load-testing)
9. [Sample Test Implementation Snippets](#9-sample-test-implementation-snippets)
10. [CI/CD Automation Pipeline (GitHub Actions)](#10-cicd-automation-pipeline-github-actions)

---

## 1. Testing Architecture & Pyramid

The project utilizes a 3-tier testing pyramid to guarantee stability, security, and checkout accuracy across the multi-package codebase:

```
                  / \
                 /   \
                / E2E \          Playwright (Critical User Journeys:
               / Tests \         Checkout, Payments, Slips, Admin)
              /---------\
             /           \
            / Integration \      Supertest, MSW, MongoDB Memory Server
           /  & API Tests  \     (API endpoints, session flow, gateways)
          /-----------------\
         /                   \
        /     Unit Tests      \  Vitest / Jest, React Testing Library
       /   (Models, Utils, UI) \ (Calculations, stores, forms, hashing)
      /-------------------------\
```

---

## 2. Recommended Testing Stack

| Layer | Tools & Libraries | Purpose |
| :--- | :--- | :--- |
| **Backend Test Runner** | Vitest / Jest | Fast ESM-native unit and service tests |
| **Backend API Testing** | `supertest` | HTTP assertions on Express endpoints |
| **Database Mocking** | `mongodb-memory-server` | Isolated in-memory MongoDB without polluting local DB |
| **Gateway Mocking** | `nock`, Stripe Mock | Emulating Stripe & eSewa HTTP endpoints offline |
| **Frontend Test Runner** | Vitest, `@testing-library/react` | Component rendering, state updates, user events |
| **API Mocking (Frontend)** | `msw` (Mock Service Worker) | Intercepting network requests in browser/node |
| **End-to-End (E2E)** | `@playwright/test` | Cross-browser automated tests (Chrome, Safari, Mobile) |
| **Load & Stress Testing** | `k6` | Validating concurrent checkout & eSewa hash throughput |

---

## 3. Backend API Test Suite (`backend/`)

### 3.1 Authentication & Session Services
* **File Under Test**: `services/session.js`, `route/auth.js`
* **Test Cases**:
  - `TC-BE-AUTH-01`: Register new user with valid name, email, and password (hashes password with bcrypt/argon2).
  - `TC-BE-AUTH-02`: Reject registration if email already exists in DB (HTTP 400/409).
  - `TC-BE-AUTH-03`: Sign in user with valid credentials, verify HTTP-only JWT cookie (`token`) is set.
  - `TC-BE-AUTH-04`: Reject login with invalid password or non-existent email (HTTP 401).
  - `TC-BE-AUTH-05`: `authenticate` middleware attaches `req.authUserId` when valid cookie token is provided.
  - `TC-BE-AUTH-06`: `authenticate` rejects expired or tampered tokens with HTTP 401.
  - `TC-BE-AUTH-07`: `optionalAuth` middleware populates `req.authUserId` if present, but permits guest users without error.
  - `TC-BE-AUTH-08`: Sign out clears the session cookie and returns HTTP 200.

---

### 3.2 Cart & Wishlist Engine
* **File Under Test**: `services/cartService.js`, `route/cart.js`, `route/wishlist.js`
* **Test Cases**:
  - `TC-BE-CART-01`: Add item with unique variant identifier (`productId|size|color`) to user's cart.
  - `TC-BE-CART-02`: Adding existing item increments its quantity instead of creating a duplicate row.
  - `TC-BE-CART-03`: Update quantity of existing item to positive integer.
  - `TC-BE-CART-04`: Removing item deletes the variant from cart.
  - `TC-BE-CART-05`: Clear cart empties the array for the user.
  - `TC-BE-CART-06`: Reject invalid quantity (e.g. `0`, negative numbers, non-integers).

---

### 3.3 Product Catalog & Inventory
* **File Under Test**: `module/product.js`, `route/products.js`
* **Test Cases**:
  - `TC-BE-PROD-01`: Retrieve active products (`active: true`) with pagination.
  - `TC-BE-PROD-02`: Retrieve single product by slug or valid ObjectId.
  - `TC-BE-PROD-03`: Return HTTP 404 for deactivated or non-existent product ID.
  - `TC-BE-PROD-04`: Search products by title/category keyword matching.

---

### 3.4 Order Processing & Lifecycle
* **File Under Test**: `module/order.js`, `services/orderService.js`, `route/orders.js`
* **Test Cases**:
  - `TC-BE-ORD-01`: Create order from active cart items, calculating subtotal and savings accurately.
  - `TC-BE-ORD-02`: Ensure cart is cleared automatically upon successful `createOrderFromCart`.
  - `TC-BE-ORD-03`: Persist delivery `address` and `phoneNumber` strings on the order document.
  - `TC-BE-ORD-04`: Verify schema backward compatibility: orders with empty `address` or `phoneNumber` do not throw validation errors on save.
  - `TC-BE-ORD-05`: Reject order creation if user cart is empty (HTTP 400).
  - `TC-BE-ORD-06`: Fetch user orders (`/api/orders/me`) returns only orders belonging to authenticated user.
  - `TC-BE-ORD-07`: Retrieve order by ID (`/api/orders/me/:orderId`) with linked payment metadata.

---

### 3.5 Stripe Payment Integration
* **File Under Test**: `services/stripeService.js`, `route/stripe.js`
* **Test Cases**:
  - `TC-BE-STRIPE-01`: `POST /api/stripe/create-checkout-session` generates valid Stripe hosted checkout URL.
  - `TC-BE-STRIPE-02`: Buy Now mode (`directItem` payload) creates an isolated single-item order without wiping the user's cart.
  - `TC-BE-STRIPE-03`: Standard Cart checkout passes all line items to Stripe session and creates associated Order.
  - `TC-BE-STRIPE-04`: Session metadata stores `orderId`, `address`, and `phoneNumber`.
  - `TC-BE-STRIPE-05`: `GET /api/stripe/verify-session/:sessionId` confirms paid session:
    - Sets order status from `pending` to `confirmed`.
    - Creates or updates record in `Payment` collection (`status: 'success'`, `paymentGateway: 'stripe'`).
    - Syncs `address` and `phoneNumber` from `session.metadata` if missing on order.
  - `TC-BE-STRIPE-06`: Handles fallback order reconstruction if initial order was interrupted before Stripe redirection.
  - `TC-BE-STRIPE-07`: Unpaid / cancelled Stripe sessions leave order in `pending` or delete dangling drafts.

---

### 3.6 eSewa Digital Wallet Integration
* **File Under Test**: `config/esewa.js`, `route/esewa.js`
* **Test Cases**:
  - `TC-BE-ESEWA-01`: Generate HMAC-SHA256 signature using `total_amount`, `transaction_uuid`, and `product_code`.
  - `TC-BE-ESEWA-02`: `POST /api/esewa/initialize` returns configuration payload (`form_url`, `signature`, `signed_field_names`).
  - `TC-BE-ESEWA-03`: `POST /api/esewa/initialize-item` (Buy Now) saves `address`, `phoneNumber`, variant `size` & `color` to direct order without clearing cart.
  - `TC-BE-ESEWA-04`: `GET /api/esewa/complete-payment` decodes base64 payload from eSewa callback.
  - `TC-BE-ESEWA-05`: Re-verifies HMAC-SHA256 signature against eSewa Secret Key; rejects tampered payloads (HTTP 400).
  - `TC-BE-ESEWA-06`: Updates Order status to `confirmed` and records payment in DB on verification success.
  - `TC-BE-ESEWA-07`: Redirects user browser to `${CLIENT_ORIGIN}/payment-success?orderId=...&gateway=esewa`.
  - `TC-BE-ESEWA-08`: Idempotency: Duplicate callback requests for the same transaction UUID do not create duplicate payments or orders.

---

### 3.7 Admin Protected Endpoints
* **File Under Test**: `route/orders.js`, `route/admin.js`
* **Test Cases**:
  - `TC-BE-ADM-01`: `GET /api/orders/all` requires `requireAdmin` middleware; rejects regular users with HTTP 403.
  - `TC-BE-ADM-02`: Returns list of all orders with populated customer details (`name`, `email`), `address`, and `phoneNumber`.
  - `TC-BE-ADM-03`: `PATCH /api/orders/:orderId/status` successfully transitions order status (`pending` -> `confirmed` -> `shipped` -> `delivered` -> `cancelled`).
  - `TC-BE-ADM-04`: Updating status of legacy orders without address fields completes smoothly without Mongoose validation errors.
  - `TC-BE-ADM-05`: Reject invalid status strings (HTTP 400).

---

## 4. Client Storefront Test Suite (`client/`)

### 4.1 State Stores & Contexts
* **File Under Test**: `lib/cart-store.ts`, `lib/wishlist-store.ts`, `app/components/auth-provider.tsx`
* **Test Cases**:
  - `TC-FE-STORE-01`: Cart calculates `itemCount` and `subtotal` accurately.
  - `TC-FE-STORE-02`: Item deduplication uses compound key `${productId}|${size}|${color}`.
  - `TC-FE-STORE-03`: Synchronizes local state with backend cart API upon user authentication.
  - `TC-FE-STORE-04`: Clear cart resets state to empty bag.
  - `TC-FE-STORE-05`: `formatRupees()` handles zero, integers, decimals, and negative amounts (`−Rs X`).

---

### 4.2 Core Components & Navigation
* **File Under Test**: `app/components/navbar.tsx`, `app/components/product-details.tsx`
* **Test Cases**:
  - `TC-FE-COMP-01`: Navbar renders bag badge count matching items in `cart-store`.
  - `TC-FE-COMP-02`: ProductDetails requires selecting size/color if product has variants before adding to bag.
  - `TC-FE-COMP-03`: "Buy Now" button redirects directly to `/checkout?buyNow=true&productId=...&size=...&color=...&quantity=...`.

---

### 4.3 Checkout & Delivery Information Form
* **File Under Test**: `app/checkout/page.tsx`
* **Test Cases**:
  - `TC-FE-CHK-01`: Renders Daraz-style 2-column Delivery Information card.
  - `TC-FE-CHK-02`: Country dropdown allows selecting **Nepal** (🇳🇵) or **United Kingdom** (🇬🇧).
  - `TC-FE-CHK-03`: When **Nepal** is selected, region dropdown populates with:
    - *Bagmati Province*
    - *Gandaki Province*
    - *Koshi Province*
    - *Lumbini Province*
    - *Madhesh Province*
    - *Karnali Province*
    - *Sudurpashchim Province*
  - `TC-FE-CHK-04`: When **United Kingdom** is selected, region dropdown populates with:
    - *England*, *Scotland*, *Wales*, *Northern Ireland*, *Greater London*, etc.
  - `TC-FE-CHK-05`: City field is a written text input (not a dropdown).
  - `TC-FE-CHK-06`: Street Address & Building fields accept user input.
  - `TC-FE-CHK-07`: Delivery label buttons toggle between `OFFICE` and `HOME` with active styling.
  - `TC-FE-CHK-08`: `[ SAVE ]` button validates required fields and displays green "Saved" checkmark.
  - `TC-FE-CHK-09`: Form validation: Clicking "Proceed to Pay" with empty Name, Phone, City, or Street halts submission and displays inline error.
  - `TC-FE-CHK-10`: Payment method selection switches between "Pay with Card" (Stripe) and "Pay with eSewa".
  - `TC-FE-CHK-11`: Single-item Buy Now mode displays "Single Item" badge and only calculates price for that specific product.
  - `TC-FE-CHK-12`: Standard Cart mode calculates combined items total and shipping charge (Free).

---

### 4.4 Payment Success Slip & Printable Layout
* **File Under Test**: `app/payment-success/page.tsx`
* **Test Cases**:
  - `TC-FE-SLIP-01`: Fetches and displays verified transaction data using `session_id` or `orderId`.
  - `TC-FE-SLIP-02`: Renders official receipt header: SATI logo, "OFFICIAL PAYMENT RECEIPT", reference ID, date.
  - `TC-FE-SLIP-03`: Displays **Delivery Details** section with:
    - 📍 `Delivery Address: [Full formatted address]`
    - 📞 `Phone: [Customer phone number]`
  - `TC-FE-SLIP-04`: Displays **Purchased Items** table with thumbnail, title, size, color, quantity, and price.
  - `TC-FE-SLIP-05`: Displays financial breakdown: Subtotal, Shipping (Free), Total Paid.
  - `TC-FE-SLIP-06`: Print stylesheet test: Clicking "Print Receipt Slip" invokes `window.print()` and applies `@media print` rules:
    - Navbar, footer, and action buttons are hidden (`.no-print`).
    - Slip takes full width without page breaks or background clipping.

---

### 4.5 Payment Failure & Error Boundaries
* **File Under Test**: `app/payment-failed/page.tsx`
* **Test Cases**:
  - `TC-FE-FAIL-01`: Reads cancellation or error message from URL query params (`reason`).
  - `TC-FE-FAIL-02`: Provides "Try Again" button linking back to `/checkout` and "Return to Shop".

---

## 5. Admin Portal Test Suite (`sati-admin/`)

### 5.1 Admin Auth & Security Guards
* **File Under Test**: `lib/admin-api.ts`, `app/page.tsx`
* **Test Cases**:
  - `TC-ADM-AUTH-01`: Unauthenticated user is redirected to `/login`.
  - `TC-ADM-AUTH-02`: Successfully logs in with admin credentials, sets session token.

---

### 5.2 Orders Management & Fulfillment
* **File Under Test**: `components/orders-management.tsx`, `lib/admin-api.ts`
* **Test Cases**:
  - `TC-ADM-ORD-01`: Fetches and displays all orders with ID, Customer, Items count, Total, Gateway, and Status badge.
  - `TC-ADM-ORD-02`: Search bar filters orders by customer name, email, or order ID.
  - `TC-ADM-ORD-03`: Expanding an order row reveals:
    - Purchased item details (images, variants, quantities).
    - Customer & Delivery card showing **Customer Name**, **Email**, **Phone number** (with icon), and **Full Delivery Address** (with MapPin icon).
  - `TC-ADM-ORD-04`: Status dropdown allows changing order status (`pending`, `confirmed`, `shipped`, `delivered`, `cancelled`).
  - `TC-ADM-ORD-05`: Successfully updates backend status via `PATCH /api/orders/:orderId/status` and refreshes table without throwing internal server error.

---

### 5.3 Official Payment Slip Modal
* **File Under Test**: `components/orders-management.tsx` (SlipModal component)
* **Test Cases**:
  - `TC-ADM-SLIP-01`: Clicking "View Official Slip" opens modal dialog.
  - `TC-ADM-SLIP-02`: Modal displays SATI company header, Order ID, Payment Gateway logo, and Transaction Reference.
  - `TC-ADM-SLIP-03`: Displays Delivery Details card (Address and Phone).
  - `TC-ADM-SLIP-04`: Displays itemized purchased products and totals.
  - `TC-ADM-SLIP-05`: Clicking Print inside modal prints the receipt slip cleanly.

---

## 6. End-to-End (E2E) Test Scenarios (Playwright)

### Journey 1: Customer Buy Now via Stripe (Card Payment)
1. User lands on `/product/ellis-day-dress`.
2. Selects Size **M**, Color **Cobalt**, Quantity **1**.
3. Clicks **"Buy Now"**.
4. Browser navigates to `/checkout?buyNow=true&productId=...`.
5. User enters delivery details:
   - Full name: `Aayush Sharma`
   - Phone: `+977 9841234567`
   - Country: `Nepal`
   - Region: `Bagmati Province`
   - City: `Kathmandu`
   - Street: `Thamel Marg, House 24`
   - Label: `HOME`
6. Selects **"Pay with Card"** (Stripe).
7. Clicks **"Proceed to Pay"**.
8. Stripe checkout completes (using Stripe test token `tok_visa`).
9. Browser returns to `/payment-success?session_id=...&gateway=stripe`.
10. Validates receipt slip renders with:
    - Status: `Verified`
    - Delivery Address: `Thamel Marg, House 24, Kathmandu, Bagmati Province, Nepal [HOME]`
    - Phone: `+977 9841234567`
    - Item: `Ellis Day Dress (Cobalt · Size M)`

### Journey 2: Customer Cart Checkout via eSewa
1. User adds 2 items to Bag from shop pages.
2. Opens Bag and clicks **"Checkout"**.
3. Enters delivery information with Country: `Nepal`, Region: `Gandaki Province`, City: `Pokhara`.
4. Selects **"Pay with eSewa"**.
5. Clicks **"Proceed to Pay"**.
6. Simulates eSewa payment approval on eSewa gateway simulator.
7. Redirects to `/payment-success?orderId=...&gateway=esewa`.
8. Verifies receipt slip displays `eSewa ePay Wallet`, customer phone, delivery address, and items.

### Journey 3: Admin Order Fulfillment & Receipt Verification
1. Admin signs into `http://localhost:3001` with administrator credentials.
2. Navigates to **Orders Management**.
3. Locates order created in Journey 1 or 2.
4. Clicks chevron to expand row; confirms phone number and address match.
5. Changes status from `confirmed` to `shipped`.
6. Clicks **"View Official Slip"**; confirms receipt modal contains identical address, items, and paid status.

---

## 7. Security, Fraud Prevention & Edge Cases

| ID | Test Scenario | Expected Outcome |
| :--- | :--- | :--- |
| **SEC-01** | eSewa callback with altered `total_amount` | Reject with HTTP 400; signature mismatch |
| **SEC-02** | eSewa callback with forged signature | Reject with HTTP 400; log security alert |
| **SEC-03** | Fake Stripe `session_id` passed to `/verify-session` | Stripe API throws error; HTTP 400/500 |
| **SEC-04** | User attempts to update order status without admin cookie | HTTP 403 Forbidden |
| **SEC-05** | Replaying same eSewa transaction UUID | Idempotent; no duplicate order or balance change |
| **SEC-06** | Negative item price / quantity manipulation | Rejected by backend validator (HTTP 400) |
| **SEC-07** | Special characters in delivery address (`<script>`, SQL quotes) | Sanitized properly; rendered as pure text |
| **SEC-08** | Order status update on legacy order missing address field | Passes validation with empty default (`""`) |

---

## 8. Performance & Load Testing

* **k6 Stress Scenarios**:
  - `50 concurrent users` simulating Buy Now initialization simultaneously.
  - `100 concurrent requests` generating eSewa HMAC-SHA256 signatures (`< 50ms` response time).
  - Target: **P95 response time < 350ms** on all checkout endpoints under peak traffic.

---

## 9. Sample Test Implementation Snippets

### Backend Supertest Example (`backend/test/orders.test.js`)
```javascript
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server.js';

describe('Order & Delivery Address API', () => {
  it('should accept and store address & phone number on order', async () => {
    const res = await request(app)
      .post('/api/orders/me')
      .set('Cookie', ['token=valid_test_jwt'])
      .send({
        address: 'House 14, Ward 3, Jhamsikhel, Lalitpur, Bagmati Province, Nepal [HOME]',
        phoneNumber: '+977 9841234567',
      });

    expect(res.status).toBe(201);
    expect(res.body.address).toContain('Jhamsikhel');
    expect(res.body.phoneNumber).toBe('+977 9841234567');
  });

  it('should allow admin to update order status even if address is empty', async () => {
    const res = await request(app)
      .patch('/api/orders/test_order_id/status')
      .set('Cookie', ['token=admin_jwt'])
      .send({ status: 'shipped' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('shipped');
  });
});
```

### Frontend Vitest Example (`client/test/checkout.test.tsx`)
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import CheckoutPage from '@/app/checkout/page';
import { describe, it, expect } from 'vitest';

describe('Checkout Delivery Information Form', () => {
  it('updates regions dynamically when country is switched from Nepal to UK', () => {
    render(<CheckoutPage />);

    const countrySelect = screen.getByLabelText(/Country/i);
    expect(screen.getByText(/Bagmati Province/i)).toBeInTheDocument();

    // Switch to United Kingdom
    fireEvent.change(countrySelect, { target: { value: 'United Kingdom' } });

    expect(screen.getByText(/England/i)).toBeInTheDocument();
    expect(screen.queryByText(/Bagmati Province/i)).not.toBeInTheDocument();
  });
});
```

---

## 10. CI/CD Automation Pipeline (GitHub Actions)

Add `.github/workflows/test.yml` to run all tests automatically on every `git push` and Pull Request:

```yaml
name: CI Test Suite

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  backend-test:
    name: Backend API & Gateway Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
        working-directory: ./backend
      - run: npm test
        working-directory: ./backend

  client-test:
    name: Storefront Client Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
        working-directory: ./client
      - run: npm run lint
        working-directory: ./client
      - run: npx tsc --noEmit
        working-directory: ./client

  admin-test:
    name: Admin Portal Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
        working-directory: ./sati-admin
      - run: npm run lint
        working-directory: ./sati-admin
      - run: npx tsc --noEmit
        working-directory: ./sati-admin

  e2e-playwright:
    name: Playwright End-to-End Tests
    needs: [backend-test, client-test, admin-test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci && npx playwright install --with-deps
        working-directory: ./client
      - run: npx playwright test
        working-directory: ./client
```

---

*Document generated for SATI Apparel E-Commerce Platform. Updated for Next.js 16, Express, Stripe, eSewa, and Daraz-style checkout flows.*
