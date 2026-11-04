// PDF utility: Billing/invoice PDF generation was removed from the system.
// These stub functions are kept for backward compatibility only.
// The system now uses booking package downloads with jsPDF for guest-facing PDFs.

export const generateBillPDF = async (billData) => {
  // Previously this generated an invoice PDF
  // Billing features have been removed repository-wide
  return Buffer.from('');
};

export const generateReceiptPDF = async (receiptData) => {
  // Receipt PDF generation removed — stub for compatibility
  return Buffer.from('');
};

