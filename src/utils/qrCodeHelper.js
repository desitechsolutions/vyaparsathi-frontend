/**
 * QR Code Payload Helper Utility
 * Generates extensible structured JSON payloads or verification URLs for ERP business documents.
 */
export const generateQrPayload = ({
  documentType = 'DOCUMENT',
  documentNumber = '',
  shopId = 1,
  businessId = null,
  documentId = null,
  verificationUrl = null,
}) => {
  if (verificationUrl) {
    return verificationUrl;
  }

  const payload = {
    documentType,
    documentNumber,
    shopId,
    businessId: businessId || shopId,
    documentId: documentId || null,
    generatedAt: new Date().toISOString(),
    version: 1,
  };

  return JSON.stringify(payload);
};
