import { useEffect } from 'react';

const PrintableBill = ({ bill, onAfterPrint }) => {
  useEffect(() => {
    if (!bill) return;

    let didPrint = false;

    // Helper function to safely format money values
    function safeMoney(val) {
      const num = Number(val ?? 0);
      return isNaN(num) ? '0.00' : num.toFixed(2);
    }

    const printWindow = window.open('', '_blank', 'width=420,height=620');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Bill #${bill.id} - Famous Cafe</title>
            <style>
              body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; margin: 0; }
              .receipt { padding: 24px; max-width: 350px; margin: 0 auto; }
              h2 { text-align: center; margin-bottom: 0.7em; }
              hr { border: 0; border-top: 1px solid #eee; margin: 14px 0; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 1em;}
              th, td { padding: 7px 2px; text-align: left; }
              th { background: #f8f4ec; }
              tr:nth-child(even) { background: #f9f5f2;}
              .totals p { display: flex; justify-content: space-between; }
              .grandTotal { font-size: 1.12em; font-weight: 700; }
              .footer { text-align: center; margin-top: 18px; font-size: 1.01em; color: #917155; }
              @media print { body { background: #fff !important; } }
            </style>
          </head>
          <body>
            <div class="receipt">
              <h2>Famous Cafe</h2>
              <p><strong>Bill ID:</strong> #${bill.id}</p>
              <p><strong>Table:</strong> ${bill.table_number}</p>
              <p><strong>Date:</strong> ${new Date(bill.created_at).toLocaleString()}</p>
              <hr/>
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    (bill.orders || [])
                      .flatMap(order => order.items || [])
                      .map(item => {
                        const price = Number(item.dish?.price ?? 0);
                        const quantity = Number(item.quantity ?? 0);
                        const total = price * quantity;
                        return `
                          <tr>
                            <td>${item.dish?.name || 'Unknown Item'}</td>
                            <td>${quantity}</td>
                            <td>₹${isNaN(price) ? '0.00' : price.toFixed(2)}</td>
                            <td>₹${isNaN(total) ? '0.00' : total.toFixed(2)}</td>
                          </tr>
                        `;
                      })
                      .join('')
                  }
                </tbody>
              </table>
              <hr/>
              <div class="totals">
                <p><strong>Subtotal:</strong> <span>₹${safeMoney(bill.total_amount)}</span></p>
                <p><strong>Taxes (5%):</strong> <span>₹${safeMoney(Number(bill.total_amount) * 0.05)}</span></p>
                <p class="grandTotal"><strong>Grand Total:</strong> <span>₹${safeMoney(Number(bill.total_amount) * 1.05)}</span></p>
              </div>
              <p class="footer">Thank you for dining with us!</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();

      printWindow.onload = () => {
        if (didPrint) return;
        didPrint = true;
        printWindow.focus();
        printWindow.print();
        printWindow.close();
        if (onAfterPrint) onAfterPrint();
      };

      setTimeout(() => {
        if (didPrint) return;
        didPrint = true;
        printWindow.focus();
        printWindow.print();
        printWindow.close();
        if (onAfterPrint) onAfterPrint();
      }, 1000);
    }
  }, [bill, onAfterPrint]);

  return null;
};

export default PrintableBill;
