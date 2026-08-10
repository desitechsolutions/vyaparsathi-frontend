import React from 'react';
import dayjs from 'dayjs';

/**
 * Issue 3 Fix: Rewritten with native HTML + inline styles (not MUI components).
 * MUI components inject emotion-CSS class styles that don't apply inside react-to-print's
 * isolated print iframe, causing collapsed/blank output.
 * Native HTML elements with inline styles + @media print CSS are fully reliable.
 */
const PrintableDelivery = React.forwardRef((props, ref) => {
  const { delivery } = props;

  return (
    <div
      ref={ref}
      className="printable-document-container"
      style={{ fontFamily: 'Arial, sans-serif', color: '#000', padding: '32px', maxWidth: '800px', margin: '0 auto' }}
    >
      {/* Self-contained @media print styles — forces visibility of container and all children */}
      <style>{`
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { margin: 0 !important; background: #fff !important; }
          .printable-document-container,
          .printable-document-container * { visibility: visible !important; }
          .delivery-slip-root { display: block !important; visibility: visible !important; padding: 24px !important; }
          .delivery-slip-items td, .delivery-slip-items th { border: 1px solid #bbb !important; }
        }
      `}</style>

      <div className="delivery-slip-root">
        {delivery ? (
          <>
            {/* Header */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #333', paddingBottom: '12px', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', letterSpacing: '0.5px' }}>DELIVERY SLIP</h2>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#555' }}>
                Order #: <strong>{delivery.invoiceNumber || delivery.saleId || '—'}</strong>
              </p>
            </div>

            {/* Customer + Delivery Meta */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', gap: '24px' }}>
              {/* Left: Customer Details */}
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', color: '#333' }}>Customer Details</p>
                <p style={{ margin: '0 0 2px', fontSize: '15px', fontWeight: 600 }}>{delivery.customerName || 'N/A'}</p>
                {delivery.customerPhone && (
                  <p style={{ margin: '0 0 2px', fontSize: '13px' }}>📞 {delivery.customerPhone}</p>
                )}
                {delivery.deliveryAddress && (
                  <p style={{ margin: '0 0 2px', fontSize: '13px', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                    📍 {delivery.deliveryAddress}
                  </p>
                )}
              </div>

              {/* Right: Delivery Meta */}
              <div style={{ flex: 1, textAlign: 'right' }}>
                <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', color: '#333' }}>Delivery Info</p>
                <p style={{ margin: '0 0 2px', fontSize: '13px' }}>
                  <strong>Delivery ID:</strong> {delivery.deliveryId || '—'}
                </p>
                <p style={{ margin: '0 0 2px', fontSize: '13px' }}>
                  <strong>Date:</strong> {delivery.createdAt ? dayjs(delivery.createdAt).format('DD MMM YYYY') : '—'}
                </p>
                <p style={{ margin: '0 0 2px', fontSize: '13px' }}>
                  <strong>Status:</strong>{' '}
                  <span style={{
                    display: 'inline-block', padding: '1px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700,
                    background: delivery.deliveryStatus === 'DELIVERED' ? '#dcfce7' : '#fef9c3',
                    color: delivery.deliveryStatus === 'DELIVERED' ? '#166534' : '#92400e',
                    border: '1px solid currentColor'
                  }}>
                    {delivery.deliveryStatus || 'PENDING'}
                  </span>
                </p>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '16px 0' }} />

            {/* Delivery Charges & Agent */}
            <div style={{ marginBottom: '20px', fontSize: '13px' }}>
              {(delivery.deliveryCharge > 0 || delivery.deliveryCharge != null) && (
                <p style={{ margin: '0 0 4px' }}>
                  <strong>Delivery Charge:</strong> ₹{Number(delivery.deliveryCharge || 0).toFixed(2)}
                  {delivery.deliveryPaidBy && ` — Paid by: ${delivery.deliveryPaidBy}`}
                </p>
              )}
              {delivery.deliveryNotes && (
                <p style={{ margin: '0 0 4px' }}>
                  <strong>Notes:</strong> {delivery.deliveryNotes}
                </p>
              )}
              {delivery.deliveryPerson && (
                <p style={{ margin: '0 0 4px' }}>
                  <strong>Delivery Agent:</strong> {delivery.deliveryPerson.name}
                  {delivery.deliveryPerson.phone && ` | 📞 ${delivery.deliveryPerson.phone}`}
                </p>
              )}
            </div>

            {/* Items Table (if sale items available via delivery data) */}
            {Array.isArray(delivery.saleItems) && delivery.saleItems.length > 0 && (
              <>
                <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '16px 0' }} />
                <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase' }}>Items</p>
                <table className="delivery-slip-items" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f5f5f5' }}>
                      <th style={{ border: '1px solid #bbb', padding: '6px 10px', textAlign: 'left' }}>#</th>
                      <th style={{ border: '1px solid #bbb', padding: '6px 10px', textAlign: 'left' }}>Item</th>
                      <th style={{ border: '1px solid #bbb', padding: '6px 10px', textAlign: 'center' }}>Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {delivery.saleItems.map((item, i) => (
                      <tr key={i}>
                        <td style={{ border: '1px solid #bbb', padding: '5px 10px' }}>{i + 1}</td>
                        <td style={{ border: '1px solid #bbb', padding: '5px 10px' }}>{item.itemName || item.name}</td>
                        <td style={{ border: '1px solid #bbb', padding: '5px 10px', textAlign: 'center' }}>{item.qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {/* Signature Box */}
            <div style={{ marginTop: '48px', display: 'flex', gap: '40px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ borderBottom: '1px solid #aaa', marginBottom: '4px', height: '36px' }} />
                <p style={{ margin: 0, fontSize: '12px', color: '#555' }}>Received By (Signature)</p>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ borderBottom: '1px solid #aaa', marginBottom: '4px', height: '36px' }} />
                <p style={{ margin: 0, fontSize: '12px', color: '#555' }}>Date / Time</p>
              </div>
            </div>

            {/* Footer */}
            <p style={{ textAlign: 'center', marginTop: '32px', fontSize: '11px', color: '#999' }}>
              This is a computer-generated delivery slip. No signature required if delivered by courier.
            </p>
          </>
        ) : (
          <p style={{ textAlign: 'center', color: '#888', fontSize: '16px', marginTop: '40px' }}>
            No delivery selected for printing.
          </p>
        )}
      </div>
    </div>
  );
});

PrintableDelivery.displayName = 'PrintableDelivery';
export default PrintableDelivery;