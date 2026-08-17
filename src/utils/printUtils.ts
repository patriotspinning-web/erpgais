/**
 * Print utility for Patriot Spinning Mills ERP
 * Provides reliable cross-browser and iframe-safe printing
 */

export function triggerAppPrint() {
  try {
    // Ensure document focus before calling print
    if (window && typeof window.print === 'function') {
      window.focus();
      window.print();
    } else {
      throw new Error('window.print is not available');
    }
  } catch (error) {
    console.warn('Direct window.print failed, attempting iframe-safe fallback:', error);
    tryFallbackPrint();
  }
}

/**
 * Fallback print mechanism for sandboxed iframes or restricted environments
 */
function tryFallbackPrint() {
  try {
    const mainContent = document.querySelector('main');
    if (!mainContent) {
      window.print();
      return;
    }

    // Create an isolated printable iframe
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow?.document;
    if (!doc) return;

    // Collect all stylesheets
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((el) => el.outerHTML)
      .join('\n');

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Patriot Spinning Mills Ltd. - Report</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          ${styles}
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 10mm 12mm 10mm;
            }
            body {
              background: #ffffff !important;
              color: #0f172a !important;
              font-family: ui-sans-serif, system-ui, -apple-system, sans-serif !important;
              margin: 8mm 6mm !important;
              padding: 0 !important;
            }
            .no-print, nav, aside, header, button, input, select, textarea {
              display: none !important;
            }
            .print-only {
              display: block !important;
            }
            table {
              width: 100% !important;
              border-collapse: collapse !important;
            }
            th, td {
              border: 1px solid #cbd5e1 !important;
              padding: 6px 8px !important;
            }
            th {
              background-color: #f1f5f9 !important;
              font-weight: bold !important;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${mainContent.innerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
      setTimeout(() => {
        try {
          document.body.removeChild(printFrame);
        } catch (_) {}
      }, 2000);
    }, 300);
  } catch (err) {
    console.error('Print fallback failed:', err);
    // Last resort
    window.print();
  }
}
