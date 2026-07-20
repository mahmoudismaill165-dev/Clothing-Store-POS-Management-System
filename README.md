# Saqr Apparel POS & Store Management System

A highly professional, full-stack Point of Sale (POS) and inventory management system custom-built for apparel and clothing retail/wholesale stores. Engineered with a focus on real-time multi-device cloud synchronization, offline-first reliability, high visual contrast design, and multi-currency billing.

---

## Design Philosophy & Visual Identity

The user interface follows modern design principles, maximizing legibility, minimizing eye strain, and ensuring a fast, intuitive workflow for store operators:
- **True Bilingual Experience (English/Arabic):** Seamless one-click translation switching with dynamic RTL (Right-to-Left) and LTR (Left-to-Right) layout adjustments.
- **Eye-Safe Color Schemes:** Custom-tailored dark and light interfaces configured using soft charcoal grays, deep slates, and clean primary accents that elevate the screen experience.
- **Tactile Micro-Animations:** Fluid layout transitions powered by `motion/react` to confirm successful actions (such as dropping items into the cart or celebrating a reached monthly target).
- **Responsive Layout:** Beautiful, flexible layouts tailored for desktop screens, retail monitors, and tablet displays.

---

## Core Features Map

### 1. 🛒 Smart POS Terminal (Point of Sale)
- **Retail & Wholesale Modes:** Toggle prices instantly to accommodate general retail walk-ins or bulk wholesale business clients.
- **Elastic Shopping Cart:** Add items easily via visual catalog navigation or fast laser barcode scanner simulation. Adjust quantity, apply item-specific discounts, or view variant stock availability in one click.
- **Split & Multi-Channel Payments:** Process transactions with flexible payment methods: Cash, Credit Card (Visa/Mastercard), Vodafone Cash, Instapay, or split an invoice across multiple payment types simultaneously.
- **Tax & Invoice Discounts:** Live computation of value-added tax (defaulted to the Egyptian 14% VAT standard) and global invoice-level discounts (percentage or flat currency rate).

### 2.Advanced Apparel & Variant Inventory Control
- **Multidimensional Variants (Size & Color):** Every clothing item tracks custom combinations of sizes and colors (rendered with live interactive hex color chips).
- **Unique Barcode / SKU Generator:** Automatic or custom barcode assignment for individual color/size variants to guarantee precise inventory counts and speed up scanning checkout.
- **Seasonal Categorization:** Catalog items by season (Summer, Winter, Spring, Autumn) and category (Men, Women, Kids, Unisex) for smarter reporting and purchasing.
- **Safety Levels & Threshold Alerts:** Set alerts when variant quantities cross specific stock limits.

### 3.Customer Relationship & Loyalty Ledger (CRM)
- **Comprehensive Customer Profiles:** Log contact details, addresses, and purchase histories.
- **Loyalty Points Engine:** Automatically award points based on total order spending, enabling store owners to reward returning patrons with custom discounts or credits.

### 4.Supplier Ledger & Wholesalers Hub
- **Supplier Directory:** Register textile manufacturers, sewing workshops, and wholesale offices.
- **Debit/Credit Ledger:** Keep track of open credit balances and outstanding debts with suppliers, log cash payments made to clear debts, and monitor historical shipments.

### 5.Expenses & Net Profit Analyzer
- **Operating Expense Registry:** Classify day-to-day outlays (rents, electricity bills, employee salaries, upkeep costs) to accurately balance the store ledger.
- **True Net Margin Calculations:** Subtract the Cost of Goods Sold (COGS) and operational expenses from gross revenues to reveal actual net margins.

### 6.Visual Analytics & Performance Dashboard
- **Interactive Visualizations:** High-quality analytical widgets reflecting income, profit margins, and daily sales trends.
- **Sales Target Progress Indicator:** A monthly gamified target tracker that displays a visual progress bar indicating closeness to the monthly sales goal, triggering celebration effects upon achievement.

### 7.Proactive Notification & Low Stock Engine
- **Pre-emptive Warnings:** Real-time stock alerts for items under danger thresholds.
- **Low-Stock Modal:** Displays a summarized alert popup to store clerks immediately on app load, urging timely restocking of top-selling items.

---

## Tech Stack & Architecture

- **Front-end Library:** `React 19` for clean state management and performance.
- **Build System:** `Vite 6` for fast hot module loading and highly optimized production assets.
- **Style Framework:** `Tailwind CSS 4` for utility-first styling.
- **Interaction Engine:** `motion/react` for elegant transitions.
- **Vector Iconography:** `lucide-react` for a unified icon library.
- **Database Synchronization:** `Firebase Firestore SDK v12` providing real-time synchronization between store-floor terminal devices.

---

## Database & Offline Sync Engine

The application implements a resilient, dual-layered sync protocol:
1. **Offline Persistence (Local Cache):** App states are persistently backed up to the browser's `localStorage` to safeguard operational continuity.
2. **Real-Time Snapshot Observers:** The application registers live `onSnapshot` queries against Firebase collections, instantly reflecting updates made from other devices.
3. **Automated Seeding System:** On empty Firestore installations, the system automatically seeds default structural configurations and mock items to bootstrap the application.

### Firestore Collections Schema:
- `/cloth_pos_users/{userId}`: Cashier and admin credentials, names, and access control roles (Owner, Manager, Cashier).
- `/cloth_pos_products/{productId}`: Product names, seasonal labels, base pricing, and nested color/size variant arrays.
- `/cloth_pos_customers/{customerId}`: Loyalty points tracker, basic info, and lifetime purchase metrics.
- `/cloth_pos_suppliers/{supplierId}`: Supplier profiles, outstanding financial debts, and transaction records.
- `/cloth_pos_sales/{saleId}`: Immutable logs of checkout receipts, total amounts, taxes, discounts, cashier details, and products sold.
- `/cloth_pos_expenses/{expenseId}`: Store expenditure logs.
- `/cloth_pos_history/{historyId}`: Audit trail of stock adjustments (logs modifications, timestamps, reasons, and the staff member responsible).
- `/cloth_pos_config/settings`: Store metadata, currency labels, default tax rates, branding logos, and monthly financial sales goals.

---

## Local Installation & Setup

### Prerequisites:
- [Node.js](https://nodejs.org/) installed (v18 or higher recommended).

### Setup Steps:

1. **Clone the repository and navigate into the workspace:**
   ```bash
   cd react-example
   ```

2. **Install all required dependencies:**
   ```bash
   npm install
   ```

3. **Configure your Firebase Credentials:**
   Ensure the `firebase-applet-config.json` file is present in the project's root directory with valid credentials:
   ```json
   {
     "apiKey": "YOUR_API_KEY",
     "authDomain": "YOUR_AUTH_DOMAIN",
     "projectId": "YOUR_PROJECT_ID",
     "storageBucket": "YOUR_STORAGE_BUCKET",
     "messagingSenderId": "YOUR_MESSAGING_SENDER_ID",
     "appId": "YOUR_APP_ID",
     "firestoreDatabaseId": "YOUR_DATABASE_ID"
   }
   ```

4. **Launch the local development server:**
   ```bash
   npm run dev
   ```
   The application will be accessible in your browser at: `http://localhost:3000`

---

## Compiling for Production

To assemble optimized, static HTML/CSS/JS assets ready for distribution:

```bash
npm run build
```
The compiled, production-ready bundle will be exported to the `/dist` directory.

---

## License & Ownership

Proprietary enterprise-ready software designed for modern apparel store operations. Open for tailored internal configurations.
