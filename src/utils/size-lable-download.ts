import jsPDF from "jspdf";
import JsBarcode from "jsbarcode";

// Re-using the Size interface from your provided code
interface Size {
  size_value: string;
  size_unit: string;
  price: number;
  sku?: string;
  pricePerCase?: any;
  price_per_case?: number;
  stock: number;
  quantity_per_case: number;
  rolls_per_case?: number;
  sizeSquanence?: number;
  shipping_cost?: number;
}

// Generate barcode as base64 image (re-using your existing helper)
const generateBarcode = (text: string): string => {
  const canvas = document.createElement("canvas");
  JsBarcode(canvas, text, {
    format: "CODE128",
    width: 1, // Reduced width for smaller labels
    height: 20, // Reduced height for smaller labels
    displayValue: false,
    fontSize: 7, // Smaller font for display value
    textMargin: 1,
  });
  return canvas.toDataURL("image/png");
};

/**
 * Generates a single PDF label (4x2 inch) for a specific product size.
 * The label includes company info, product name, size, quantity per case, and SKU barcode.
 * @param productName The name of the product.
 * @param size The single size object for which to generate the label.
 */
export const generateSingleProductLabelPDF = async (productName: string, size: Size) => {
  // Label dimensions in mm (4 inches = 101.6 mm, 2 inches = 50.8 mm)
  const labelWidth = 101.6; // 4 inches
  const labelHeight = 50.8; // 2 inches

  // Create a new jsPDF instance with custom page size for the label
  const doc = new jsPDF({
    orientation: "landscape", // Set landscape since width > height
    unit: "mm",
    format: [labelWidth, labelHeight], // Custom page format for the single label
  });

  doc.setFont("helvetica", "normal");

  let yPos = 8; // Starting Y position for text on the label
  const xCenter = labelWidth / 2; // Center X position

  // 9RX LLC (Company Name)
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("9RX LLC", xCenter, yPos, { align: "center" });
  yPos += 5;

  // www.9rx.com (Website)
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("www.9rx.com", xCenter, yPos, { align: "center" });
  yPos += 8;

  // product.name (Product Name)
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  const productNameLines = doc.splitTextToSize(productName || "Product Name", labelWidth - 10);
  doc.text(productNameLines, xCenter, yPos, { align: "center" });
  yPos += productNameLines.length * 4.5;

  // size.value size.unit (e.g., "110mm x 74m (4.33\" x243') unit")
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(`${size.size_value || "N/A"} ${size.size_unit || ""}`, xCenter, yPos, { align: "center" });
  yPos += 8;

  // quantity_per_case /case (e.g., "72 /case")
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`${size.quantity_per_case !== undefined && size.quantity_per_case !== null ? size.quantity_per_case : "N/A"} /case`, xCenter, yPos, { align: "center" });
  yPos += 3;

if (size.sku) {
  try {
    const barcodeData = generateBarcode(String(size.sku));

    const barcodeWidth = 45;
    const barcodeHeight = 12;
    const barcodeX = (labelWidth - barcodeWidth) / 2;

    // Add barcode image at current yPos
    doc.addImage(barcodeData, "PNG", barcodeX, yPos, barcodeWidth, barcodeHeight);

    // ✅ Move yPos down for the SKU text
    yPos += barcodeHeight + 1;

    // ✅ Add the SKU text below barcode
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(String(size.sku), labelWidth / 2, yPos, { align: "center" });

  } catch (error) {
    console.error(`Error generating barcode for SKU ${size.sku}:`, error);
    doc.setFontSize(6);
    doc.text(`SKU: ${size.sku}`, xCenter, yPos + 6, { align: "center" });
  }
} else {
  doc.setFontSize(8);
  doc.text("SKU: N/A", xCenter, yPos + 6, { align: "center" });
}



  // Sanitize product and SKU names for filename
  const fileNameProductName = productName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30); // Max 30 chars
  const fileNameSku = size.sku ? size.sku.replace(/[^a-zA-Z0-9]/g, '_') : 'UnknownSKU';

  doc.save(`Label_${fileNameProductName}_${fileNameSku}.pdf`);
};