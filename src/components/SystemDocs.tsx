import React from 'react';
import { BookOpen, RefreshCw, Layers, Shield, FileText, Database, Compass, CheckCircle } from 'lucide-react';

interface SystemDocsProps {
  isArabic: boolean;
}

export default function SystemDocs({ isArabic }: SystemDocsProps) {
  return (
    <div className="space-y-8 max-h-[75vh] overflow-y-auto pr-2" id="system-docs-container">
      {/* Intro Header */}
      <div className="p-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
        <h2 className="text-xl font-bold text-indigo-400 flex items-center gap-2 mb-2">
          <BookOpen className="w-5 h-5 animate-pulse" />
          {isArabic ? 'دليل ومواصفات كود النظام الفني' : 'Technical System Documentation'}
        </h2>
        <p className="text-sm text-gray-300 leading-relaxed">
          {isArabic 
            ? 'هذا الدليل الفني يوثق بنية نظام الملابس ونقاط البيع POS بالكامل من تصميم الواجهات، قواعد البيانات، دورات الاستخدام، وهيكلة المجلدات المعتمدة كـ Production Ready.' 
            : 'This technical document defines the clothing store management and POS system, database architecture, workflows, folder structure, and layout specs.'}
        </p>
      </div>

      {/* Grid of Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* SECTION 1: PRD */}
        <div className="p-5 rounded-2xl bg-gray-800/40 border border-gray-700/50 space-y-3">
          <h3 className="text-lg font-bold text-sky-400 flex items-center gap-2 border-b border-gray-700/60 pb-2">
            <FileText className="w-5 h-5 text-sky-400" />
            <span>1. Product Requirements (PRD)</span>
          </h3>
          <ul className="space-y-2 text-xs text-gray-300">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>POS Transaction Speed:</strong> Checkout in under 3 actions. Supports rapid search & instant barcode matching.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Variant Architecture:</strong> Multi-variant matrix (Size x Color) for single apparel products. Individual SKU, Barcode, and Qty per variant.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Offline Reliability:</strong> Automatic storage synchronization. Operates perfectly without internet, queuing sales to local DB.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>CRM & Loyalty:</strong> Automated points accrual (10% of sale value is translated to redeemable reward points).</span>
            </li>
          </ul>
        </div>

        {/* SECTION 2: App & User Flows */}
        <div className="p-5 rounded-2xl bg-gray-800/40 border border-gray-700/50 space-y-3">
          <h3 className="text-lg font-bold text-sky-400 flex items-center gap-2 border-b border-gray-700/60 pb-2">
            <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin-slow" />
            <span>2. App & User Flow</span>
          </h3>
          <div className="space-y-3 text-xs text-gray-300">
            <div>
              <span className="text-emerald-400 font-semibold block">App Route Flow:</span>
              <p className="text-gray-400">Login ➔ Auth Guard ➔ App Shell ➔ Universal Search / Dashboard ➔ POS Terminal ➔ Instant Receipt Generation ➔ Automatic Inventory Updates.</p>
            </div>
            <div>
              <span className="text-emerald-400 font-semibold block">Cashier Checkout Flow:</span>
              <p className="text-gray-400">1. Locate Product (Barcode or Text Search) ➔ 2. Select Size/Color variant ➔ 3. Add to Cart ➔ 4. Apply Discount / Associate Customer ➔ 5. Choose Payment Method (Split/Instapay etc) ➔ 6. Push Print (Stock level syncs instantly).</p>
            </div>
          </div>
        </div>

        {/* SECTION 3: Folder Structure */}
        <div className="p-5 rounded-2xl bg-gray-800/40 border border-gray-700/50 space-y-3 md:col-span-2">
          <h3 className="text-lg font-bold text-purple-400 flex items-center gap-2 border-b border-gray-700/60 pb-2">
            <Layers className="w-5 h-5 text-purple-400" />
            <span>3. Production Folder Structure</span>
          </h3>
          <pre className="text-[11px] font-mono text-pink-300 bg-black/30 p-3 rounded-lg overflow-x-auto">
{`├── /.env.example            # Environment declarations for key parameters
├── /index.html              # Core single-page HTML frame
├── /metadata.json           # App identifier & required hardware permissions
├── /package.json            # Node.js manifest with ESM & dependencies
├── /src
│   ├── /main.tsx            # App bootstrapping (StrictMode, Mount root)
│   ├── /index.css           # Global typography loading Cairo & Inter + Tailwind
│   ├── /types.ts            # Absolute type declarations (User, Product, Sale, Supplier)
│   ├── /data.ts             # LocalStorage relational database simulation with full schemas
│   ├── /App.tsx             # Root router, Auth guardian, Global states & search
│   └── /components
│       ├── Login.tsx        # High fidelity authentication portal with dynamic roles
│       ├── Layout.tsx       # Sidebar, Navbar, fast universal search & clock widgets
│       ├── Dashboard.tsx    # Key indicators, low stock, best sellers, active indicators
│       ├── POS.tsx          # Fast terminal, cash desk, custom variant matrix & invoices
│       ├── Products.tsx     # Variant matrices, SKU allocation, edit forms
│       ├── Inventory.tsx    # Real-time adjustments & historical stock audits
│       ├── Customers.tsx    # CRM lists, purchase logs, points redemption
│       ├── Suppliers.tsx    # Vendor registry, debt schedules, material deliveries
│       ├── Reports.tsx      # SVG Analytics charts, sizes/colors heatmaps, expense tracking
│       ├── Settings.tsx     # Tax configs, Egyptian Pound currency setups, full backup
│       └── SystemDocs.tsx   # Visual representation of technical architecture (This view)`}
          </pre>
        </div>

        {/* SECTION 4: Database Schema (SQL Blueprint) */}
        <div className="p-5 rounded-2xl bg-gray-800/40 border border-gray-700/50 space-y-3 md:col-span-2">
          <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2 border-b border-gray-700/60 pb-2">
            <Database className="w-5 h-5 text-amber-400" />
            <span>4. Database Schema (Production relational SQL Blueprint)</span>
          </h3>
          <p className="text-xs text-gray-300">
            The schema below outlines how data is organized, mirroring our in-memory LocalStorage engine and fully compatible with PostgreSQL:
          </p>
          <pre className="text-[11px] font-mono text-amber-200 bg-black/40 p-3 rounded-lg overflow-x-auto max-h-60">
{`-- Relational SQL Schema for Clothing POS --

CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  role VARCHAR(20) CHECK (role IN ('Owner', 'Manager', 'Cashier')),
  avatar VARCHAR(255),
  active BOOLEAN DEFAULT TRUE
);

CREATE TABLE products (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(100),
  category VARCHAR(100),
  apparel_type VARCHAR(20) CHECK (apparel_type IN ('mens', 'womens', 'kids', 'unisex')),
  season VARCHAR(30),
  purchase_price DECIMAL(10,2) NOT NULL,
  selling_price DECIMAL(10,2) NOT NULL,
  discount DECIMAL(5,2) DEFAULT 0.00,
  barcode VARCHAR(50) UNIQUE,
  image_url VARCHAR(255),
  stock_alert_level INT DEFAULT 5,
  notes TEXT
);

CREATE TABLE product_variants (
  id VARCHAR(50) PRIMARY KEY,
  product_id VARCHAR(50) REFERENCES products(id) ON DELETE CASCADE,
  size VARCHAR(20) NOT NULL,
  color VARCHAR(50) NOT NULL,
  color_hex VARCHAR(10),
  quantity INT NOT NULL DEFAULT 0,
  barcode VARCHAR(50) UNIQUE NOT NULL,
  sku VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE customers (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  address TEXT,
  orders_count INT DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0.00,
  loyalty_points INT DEFAULT 0,
  last_purchase_date TIMESTAMP
);

CREATE TABLE suppliers (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT,
  debt DECIMAL(12,2) DEFAULT 0.00,
  products_count INT DEFAULT 0,
  last_order_date TIMESTAMP
);

CREATE TABLE sales (
  id VARCHAR(50) PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id VARCHAR(50) REFERENCES customers(id),
  cashier_id VARCHAR(50) REFERENCES users(id),
  subtotal DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  tax_amount DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(30) NOT NULL, -- 'Cash', 'Visa', 'Vodafone Cash', 'Instapay', 'Split'
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sale_items (
  id VARCHAR(50) PRIMARY KEY,
  sale_id VARCHAR(50) REFERENCES sales(id) ON DELETE CASCADE,
  product_id VARCHAR(50) REFERENCES products(id),
  variant_id VARCHAR(50) REFERENCES product_variants(id),
  size VARCHAR(20) NOT NULL,
  color VARCHAR(50) NOT NULL,
  quantity INT NOT NULL,
  purchase_price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) NOT NULL,
  final_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL
);

CREATE TABLE stock_history (
  id VARCHAR(50) PRIMARY KEY,
  product_id VARCHAR(50) REFERENCES products(id),
  variant_id VARCHAR(50) REFERENCES product_variants(id),
  type VARCHAR(30) NOT NULL, -- 'In', 'Out', 'Adjustment', 'Sale', 'Return'
  quantity INT NOT NULL,
  previous_qty INT NOT NULL,
  new_qty INT NOT NULL,
  reason TEXT,
  operator VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`}
          </pre>
        </div>

        {/* SECTION 5: Design System & Permissions */}
        <div className="p-5 rounded-2xl bg-gray-800/40 border border-gray-700/50 space-y-3">
          <h3 className="text-lg font-bold text-indigo-400 flex items-center gap-2 border-b border-gray-700/60 pb-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            <span>5. Role-Based Permissions (ACL)</span>
          </h3>
          <div className="space-y-2 text-xs text-gray-300">
            <div className="flex justify-between border-b border-gray-800 pb-1">
              <span className="font-bold text-rose-400">Owner (المالك):</span>
              <span className="text-gray-400">All rights + Settings, Users, Inventory adjustments, Net profits.</span>
            </div>
            <div className="flex justify-between border-b border-gray-800 pb-1">
              <span className="font-bold text-amber-400">Manager (المدير):</span>
              <span className="text-gray-400">Product management, Suppliers, Customer records, Stock additions. No Owner settings or profit margin details.</span>
            </div>
            <div className="flex justify-between pb-1">
              <span className="font-bold text-emerald-400">Cashier (كاشير):</span>
              <span className="text-gray-400">POS checkout operations, Invoice print, customer add. Strictly blocked from reports, margins, supplier debt.</span>
            </div>
          </div>
        </div>

        {/* SECTION 6: UI Style & Design System */}
        <div className="p-5 rounded-2xl bg-gray-800/40 border border-gray-700/50 space-y-3">
          <h3 className="text-lg font-bold text-pink-400 flex items-center gap-2 border-b border-gray-700/60 pb-2">
            <Compass className="w-5 h-5 text-pink-400" />
            <span>6. Design System</span>
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
            <div>
              <span className="text-pink-400 font-semibold block">Colors (Dark Glass):</span>
              <p className="text-gray-400">Canvas: #0B0F19, Panel: rgba(17, 24, 39, 0.45) with blur-md, Accent: Indigo-500, Rose-500, Emerald-500.</p>
            </div>
            <div>
              <span className="text-pink-400 font-semibold block">Colors (Light Glass):</span>
              <p className="text-gray-400">Canvas: #F3F4F6, Panel: rgba(255, 255, 255, 0.7) with blur-lg, Text: Charcoal Slate.</p>
            </div>
            <div>
              <span className="text-pink-400 font-semibold block">Typography:</span>
              <p className="text-gray-400">Cairo (Arabic legibility, high rhythm) paired with Inter for international numerical operations.</p>
            </div>
            <div>
              <span className="text-pink-400 font-semibold block">Components:</span>
              <p className="text-gray-400">Pill badges, skeletal loadings, custom SVG heat charts, animated page transitions.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
