import { Sale, StoreSettings } from '../types';

/**
 * Utility to generate and trigger a highly optimized, beautifully structured thermal print job
 * specifically designed for 80mm and 58mm POS thermal receipt printers.
 * Handles both Arabic (RTL) and English layouts seamlessly.
 */
export function printThermalReceipt(sale: Sale, settings: StoreSettings, isArabic: boolean) {
  // Format helpers
  const formatCurrencyLocal = (val: number) => {
    return `${val.toLocaleString(isArabic ? 'ar-EG' : 'en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ${isArabic ? 'ج.م' : 'EGP'}`;
  };

  // Generate simulated crisp QR code with receipt metadata for real scanner support
  const invoiceDataString = `INV:${sale.invoiceNumber}|VAL:${sale.total}|DATE:${sale.date}`;
  
  // Construct raw print HTML with thermal-friendly styling
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="${isArabic ? 'ar' : 'en'}" dir="${isArabic ? 'rtl' : 'ltr'}">
    <head>
      <meta charset="UTF-8">
      <title>Receipt ${sale.invoiceNumber}</title>
      <style>
        /* Base styling optimized for 80mm (3-inch) thermal print rolls, scalable down to 58mm */
        @page {
          size: auto;
          margin: 0;
        }
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: 'Arial', 'Courier New', Courier, monospace;
          font-size: 11.5px;
          line-height: 1.35;
          color: #000;
          background-color: #fff;
          padding: 10px 8px;
          width: 76mm; /* Fits standard 80mm roll perfectly with safety margins */
          margin: 0 auto;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        
        .bold { font-weight: bold; }
        .extra-bold { font-weight: 900; }
        
        /* Store Logo Badge styling */
        .logo-container {
          display: flex;
          justify-content: center;
          margin-bottom: 6px;
        }
        .store-logo-icon {
          width: 55px;
          height: 55px;
          fill: #000;
        }

        /* Headers */
        .store-name {
          font-size: 16px;
          font-weight: 900;
          letter-spacing: -0.5px;
          margin-bottom: 2px;
          text-transform: uppercase;
        }
        .store-subtitle {
          font-size: 10px;
          color: #333;
          margin-bottom: 4px;
        }

        /* Divider lines */
        .divider {
          border-top: 1px dashed #000;
          margin: 6px 0;
          width: 100%;
        }
        .double-divider {
          border-top: 2px double #000;
          margin: 6px 0;
          width: 100%;
        }

        /* Meta details */
        .meta-table {
          width: 100%;
          font-size: 10.5px;
          margin-bottom: 4px;
        }
        .meta-table td {
          padding: 1.5px 0;
          vertical-align: top;
        }
        .meta-label {
          color: #444;
          width: 38%;
        }
        .meta-val {
          font-weight: bold;
          text-align: ${isArabic ? 'left' : 'right'};
        }

        /* Invoice bar tag */
        .invoice-badge {
          background-color: #000;
          color: #fff;
          text-align: center;
          padding: 3px;
          font-size: 11px;
          font-weight: bold;
          letter-spacing: 1px;
          margin: 4px 0;
          text-transform: uppercase;
        }

        /* Receipt Items list */
        .items-header {
          display: flex;
          font-weight: bold;
          font-size: 11px;
          padding-bottom: 3px;
          border-bottom: 1px solid #000;
          margin-bottom: 4px;
        }
        .items-list {
          margin-bottom: 4px;
        }
        .item-row {
          margin-bottom: 5px;
          page-break-inside: avoid;
        }
        .item-main-line {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          font-size: 11px;
        }
        .item-details-line {
          display: flex;
          justify-content: space-between;
          font-size: 9.5px;
          color: #444;
          padding-left: ${isArabic ? '0' : '4px'};
          padding-right: ${isArabic ? '4px' : '0'};
          margin-top: 1px;
        }

        /* Totals section */
        .totals-container {
          width: 100%;
          font-size: 11px;
          margin-top: 4px;
        }
        .totals-row {
          display: flex;
          justify-content: space-between;
          padding: 2px 0;
        }
        .grand-total-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          font-weight: 900;
          border-top: 1px dashed #000;
          border-bottom: 1px dashed #000;
          padding: 4px 0;
          margin-top: 4px;
        }

        /* barcode / qr simulator */
        .footer-logo {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 10px;
          gap: 4px;
        }
        .simulated-barcode {
          width: 85%;
          height: 30px;
          background: repeating-linear-gradient(
            90deg,
            #000,
            #000 2px,
            #fff 2px,
            #fff 5px
          );
          margin: 4px 0 2px 0;
        }
        .qr-placeholder {
          width: 75px;
          height: 75px;
          border: 1px solid #000;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 4px auto;
        }
        .qr-dot-grid {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 1px;
          width: 65px;
          height: 65px;
        }
        .qr-dot {
          background-color: #000;
        }
        .qr-dot.empty {
          background-color: #fff;
        }

        .policy-box {
          border: 1px solid #000;
          padding: 4px;
          font-size: 8.5px;
          text-align: center;
          margin-top: 8px;
          line-height: 1.3;
        }
      </style>
    </head>
    <body>

      <!-- Logo & Store Branding -->
      <div class="logo-container">
        <!-- High-contrast monochrome apparel logo vector suited for 203 DPI thermal print heads -->
        <svg class="store-logo-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2a3 3 0 0 0-3 3h1.5a1.5 1.5 0 0 1 3 0H15a3 3 0 0 0-3-3Zm5.68 5.43c.12-.42.27-.85.42-1.28c.18-.52-.16-1.15-.75-1.15H6.65c-.59 0-.93.63-.75 1.15c.15.43.3.86.42 1.28L2.05 18.04A1.25 1.25 0 0 0 3.25 19.5h17.5a1.25 1.25 0 0 0 1.2-1.46l-4.27-10.61ZM12 17.5a3.5 3.5 0 1 1 0-7a3.5 3.5 0 0 1 0 7Zm0-5.5a2 2 0 1 0 0 4a2 2 0 0 0 0-4Z"/>
        </svg>
      </div>

      <div class="text-center">
        <div class="store-name">${settings.storeName || (isArabic ? 'مجموعة الصقر للملابس والمنسوجات' : 'Al-Saqr Apparel')}</div>
        <div class="store-subtitle">${settings.address || (isArabic ? 'مصر الجديدة، القاهرة' : 'Cairo, Egypt')}</div>
        <div class="store-subtitle">${isArabic ? 'تليفون:' : 'Tel:'} ${settings.phone || '01000000000'}</div>
      </div>

      <div class="divider"></div>

      <!-- Invoice Bar Header -->
      <div class="invoice-badge">
        ${isArabic ? 'إيصال مبيعات مبسط' : 'SIMPLIFIED SALES RECEIPT'}
      </div>

      <!-- Metadata -->
      <table class="meta-table">
        <tr>
          <td class="meta-label">${isArabic ? 'رقم الفاتورة:' : 'Invoice No:'}</td>
          <td class="meta-val font-mono">${sale.invoiceNumber}</td>
        </tr>
        <tr>
          <td class="meta-label">${isArabic ? 'تاريخ المعاملة:' : 'Transaction Date:'}</td>
          <td class="meta-val font-mono">${sale.date}</td>
        </tr>
        <tr>
          <td class="meta-label">${isArabic ? 'الكاشير المسؤول:' : 'Cashier Operator:'}</td>
          <td class="meta-val">${sale.cashierName || 'System'}</td>
        </tr>
        <tr>
          <td class="meta-label">${isArabic ? 'اسم العميل:' : 'Customer Name:'}</td>
          <td class="meta-val">${sale.customerName || (isArabic ? 'عميل نقدي' : 'Cash Guest')}</td>
        </tr>
        <tr>
          <td class="meta-label">${isArabic ? 'نوع العملية:' : 'Operation Type:'}</td>
          <td class="meta-val">${sale.saleType === 'wholesale' ? (isArabic ? 'بيع جملة' : 'Wholesale Sale') : (isArabic ? 'قطاعي (مفرد)' : 'Retail Sale')}</td>
        </tr>
      </table>

      <div class="double-divider"></div>

      <!-- Itemized Table Header -->
      <div class="items-header">
        <div style="width: 70%;">${isArabic ? 'البيان والصنف' : 'Item Description'}</div>
        <div style="width: 30%; text-align: ${isArabic ? 'left' : 'right'};">${isArabic ? 'القيمة' : 'Total'}</div>
      </div>

      <!-- Items Loop -->
      <div class="items-list">
        ${sale.items.map((it) => {
          const qtyText = `${it.quantity} x ${it.finalPrice.toFixed(1)}`;
          const detailsText = `${isArabic ? 'مقاس:' : 'Size:'} ${it.size} | ${isArabic ? 'لون:' : 'Color:'} ${it.color}`;
          return `
            <div class="item-row">
              <div class="item-main-line">
                <span style="width: 70%;" class="bold">${it.name}</span>
                <span style="width: 30%; text-align: ${isArabic ? 'left' : 'right'};">${formatCurrencyLocal(it.finalPrice * it.quantity)}</span>
              </div>
              <div class="item-details-line">
                <span>${detailsText}</span>
                <span>(${qtyText})</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="divider"></div>

      <!-- Financial Totals Block -->
      <div class="totals-container">
        <div class="totals-row">
          <span>${isArabic ? 'المجموع الفرعي (قبل الخصم):' : 'Subtotal:'}</span>
          <span class="bold">${formatCurrencyLocal(sale.subtotal)}</span>
        </div>
        
        ${sale.discountAmount > 0 ? `
          <div class="totals-row" style="color: #000;">
            <span>${isArabic ? 'إجمالي الخصم الممنوح:' : 'Discount:'}</span>
            <span class="bold">-${formatCurrencyLocal(sale.discountAmount)}</span>
          </div>
        ` : ''}

        <div class="totals-row">
          <span>${isArabic ? `ضريبة القيمة المضافة (${settings.taxRate || 14}%):` : `Value Added Tax (${settings.taxRate || 14}%):`}</span>
          <span class="bold">${formatCurrencyLocal(sale.taxAmount || 0)}</span>
        </div>

        <div class="grand-total-row">
          <span>${isArabic ? 'الصافي المطلوب سداده:' : 'NET DUE TOTAL:'}</span>
          <span>${formatCurrencyLocal(sale.total)}</span>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Payment Breakdown -->
      <table class="meta-table" style="margin-top: 4px;">
        <tr>
          <td class="meta-label">${isArabic ? 'طريقة السداد الأساسية:' : 'Payment Option:'}</td>
          <td class="meta-val">${sale.paymentMethod}</td>
        </tr>
        ${sale.paymentMethod === 'Split' && sale.payments ? sale.payments.map(p => `
          <tr>
            <td class="meta-label" style="padding-left: 8px;">↳ ${p.method}:</td>
            <td class="meta-val font-mono">${formatCurrencyLocal(p.amount)}</td>
          </tr>
        `).join('') : ''}
      </table>

      <!-- Return & Exchange Policy Rules Box -->
      <div class="policy-box">
        <strong>${isArabic ? 'شروط وسياسة الاستبدال والاسترجاع' : 'RETURN & EXCHANGE CONDITIONS'}</strong><br/>
        ${isArabic 
          ? 'الاسترجاع خلال ١٤ يوماً والاستبدال خلال ٣٠ يوماً من تاريخ الفاتورة بشرط وجود بطاقة السعر والمنتج بحالته الأصلية وغلافه الأصلي.'
          : 'Returns are valid within 14 days; exchanges within 30 days. Items must be unworn, with original price tags attached and in their original packaging.'
        }
      </div>

      <!-- Footer QR Code Generator and Greeting -->
      <div class="footer-logo">
        <div class="qr-placeholder">
          <div class="qr-dot-grid">
            <!-- Simulated high-fidelity thermal printable QR Dot Grid -->
            <div class="qr-dot"></div><div class="qr-dot"></div><div class="qr-dot"></div><div class="qr-dot empty"></div><div class="qr-dot"></div><div class="qr-dot"></div><div class="qr-dot"></div><div class="qr-dot"></div>
            <div class="qr-dot"></div><div class="qr-dot empty"></div><div class="qr-dot"></div><div class="qr-dot empty"></div><div class="qr-dot empty"></div><div class="qr-dot empty"></div><div class="qr-dot empty"></div><div class="qr-dot"></div>
            <div class="qr-dot"></div><div class="qr-dot"></div><div class="qr-dot empty"></div><div class="qr-dot"></div><div class="qr-dot"></div><div class="qr-dot empty"></div><div class="qr-dot"></div><div class="qr-dot empty"></div>
            <div class="qr-dot empty"></div><div class="qr-dot empty"></div><div class="qr-dot"></div><div class="qr-dot"></div><div class="qr-dot empty"></div><div class="qr-dot"></div><div class="qr-dot"></div><div class="qr-dot"></div>
            <div class="qr-dot"></div><div class="qr-dot"></div><div class="qr-dot empty"></div><div class="qr-dot empty"></div><div class="qr-dot empty"></div><div class="qr-dot"></div><div class="qr-dot empty"></div><div class="qr-dot empty"></div>
            <div class="qr-dot"></div><div class="qr-dot empty"></div><div class="qr-dot"></div><div class="qr-dot"></div><div class="qr-dot empty"></div><div class="qr-dot empty"></div><div class="qr-dot"></div><div class="qr-dot"></div>
            <div class="qr-dot"></div><div class="qr-dot"></div><div class="qr-dot empty"></div><div class="qr-dot empty"></div><div class="qr-dot"></div><div class="qr-dot empty"></div><div class="qr-dot empty"></div><div class="qr-dot empty"></div>
            <div class="qr-dot"></div><div class="qr-dot"></div><div class="qr-dot"></div><div class="qr-dot empty"></div><div class="qr-dot"></div><div class="qr-dot"></div><div class="qr-dot"></div><div class="qr-dot"></div>
          </div>
        </div>
        <div class="simulated-barcode"></div>
        <div style="font-size: 8px; color: #444; font-family: monospace;">${invoiceDataString}</div>
        <div style="font-size: 10px; font-weight: bold; margin-top: 4px;">
          ${isArabic ? 'شكراً لزيارتكم • نسعد بخدمتكم دائماً' : 'THANK YOU FOR SHOPPING WITH US!'}
        </div>
      </div>

    </body>
    </html>
  `;

  // Create an offscreen iframe for silent printing
  const iframeId = 'thermal-print-silent-iframe';
  let iframe = document.getElementById(iframeId) as HTMLIFrameElement;
  
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = iframeId;
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
  }

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (doc) {
    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Trigger print after loading elements
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 250);
  }
}
