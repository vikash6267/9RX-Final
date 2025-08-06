import jsPDF from "jspdf";
import JsBarcode from "jsbarcode";

// Updated Size interface with the required fields
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
  lot_number?: string;
  ndc_number?: string;
  expiry_date?: string;
}

// Generate barcode as base64 image
const generateBarcode = (text: string): string => {
  const canvas = document.createElement("canvas");
  JsBarcode(canvas, text, {
    format: "CODE128",
    width: 2,
    height: 30,
    displayValue: false,
    fontSize: 8,
    textMargin: 2,
  });
  return canvas.toDataURL("image/png");
};

/**
 * Generates a single PDF label (4x2 inch) matching the exact format shown in the image
 * @param productName The name of the product
 * @param size The single size object for which to generate the label
 */
export const generateSingleProductLabelPDF = async (
  productName: string,
  size: Size,
  productUPCcode: string,
  productNdcCode: string,
  productExpiry: string,
  productLotNumber: string
) => {
  // Label dimensions in mm (4 inches = 101.6 mm, 2 inches = 50.8 mm)
  const labelWidth = 101.6; // 4 inches
  const labelHeight = 50.8; // 2 inches

  // Create a new jsPDF instance with custom page size for the label
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [labelWidth, labelHeight],
  });

  // Draw rounded rectangle border
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.roundedRect(2, 2, labelWidth - 4, labelHeight - 4, 3, 3);

  // Header section - smaller fonts
  let yPos = 8;
  const headerFontSize = 9; // Reduced from 12
  const websiteFontSize = 8; // Reduced from 10

  // Left side: 9RX LLC
  doc.setFontSize(headerFontSize);
  doc.setFont("helvetica", "bold");
  doc.text("9RX LLC", 6, yPos);

  // Right side: Phone number
  doc.setFontSize(headerFontSize);
  doc.setFont("helvetica", "bold");
  doc.text("1 800 969 6295", labelWidth - 6, yPos, { align: "right" });
  yPos += 3.5; // Adjusted spacing

  // Website
  doc.setFontSize(websiteFontSize);
  doc.setFont("helvetica", "normal");
  doc.text("WWW.9RX.COM", 6, yPos);
  yPos += 2.5; // Adjusted spacing

  // Horizontal line separator
  doc.setLineWidth(0.3);
  doc.line(6, yPos, labelWidth - 6, yPos);
  yPos += 6; // Adjusted spacing after line

  // Left column content - show only values, no labels
  const leftX = 8;
  const rightX = labelWidth / 2 + 5; // Start of right column content

  // Product Name (just the value, no label)
  doc.setFontSize(9); // Reduced from 10
  doc.setFont("helvetica", "bold");
  const productNameLines = doc.splitTextToSize(
    productName || "PRODUCT NAME",
    labelWidth / 2 - leftX - 2 // Max width for product name, considering left margin and some padding
  );
  doc.text(productNameLines, leftX, yPos);
  yPos += productNameLines.length * 3.5 + 2; // Adjusted line height and spacing

  // Size (just the value, no label)
  doc.setFontSize(8); // Reduced from 9
  doc.setFont("helvetica", "normal");
  const sizeText = `${size.size_value || "N/A"} ${size.size_unit || ""}`;
  const sizeLines = doc.splitTextToSize(
    sizeText,
    labelWidth / 2 - leftX - 2 // Same width as product name
  );
  doc.text(sizeLines, leftX, yPos);
  yPos += sizeLines.length * 3.5 + 2; // Adjusted spacing

  // Quantity per case (just the value, no label)
  doc.setFontSize(8); // Reduced from 9
  doc.setFont("helvetica", "normal");
  doc.text(
    `${
      size.quantity_per_case !== undefined && size.quantity_per_case !== null
        ? size.quantity_per_case
        : "N/A"
    }`,
    leftX,
    yPos
  );

  // Right column content
  let rightYPos = 18; // Adjusted starting Y position for right column

  // LOT# (bold label)
  doc.setFontSize(9); // Reduced from 10
  doc.setFont("helvetica", "bold");
  doc.text("LOT#", rightX, rightYPos);
  doc.setFontSize(8); // Reduced from 9
  doc.setFont("helvetica", "normal");
  doc.text(productLotNumber || "", rightX + 12, rightYPos);
  rightYPos += 4.5; // Adjusted spacing

  // NDC# (bold label)
  doc.setFontSize(9); // Reduced from 10
  doc.setFont("helvetica", "bold");
  doc.text("NDC#", rightX, rightYPos);
  doc.setFontSize(8); // Reduced from 9
  doc.setFont("helvetica", "normal");
  doc.text(productNdcCode || "", rightX + 12, rightYPos);
  rightYPos += 4.5; // Adjusted spacing

  // EXPIRY: (bold label)
  doc.setFontSize(9); // Reduced from 10
  doc.setFont("helvetica", "bold");
  doc.text("EXPIRY:", rightX, rightYPos);
  doc.setFontSize(8); // Reduced from 9
  doc.setFont("helvetica", "normal");
  doc.text(productExpiry || "", rightX + 18, rightYPos);
  rightYPos += 6; // Adjusted spacing before barcode

  // Generate and add barcode
  if (productUPCcode) {
    try {
      const barcodeData = generateBarcode(String(productUPCcode));
      const barcodeWidth = 35;
      const barcodeHeight = 8;
      const barcodeX = labelWidth - 6 - barcodeWidth; // Align barcode to the right edge with 6mm margin
      // Add barcode image
      doc.addImage(
        barcodeData,
        "PNG",
        barcodeX, // Use calculated X for right alignment
        rightYPos,
        barcodeWidth,
        barcodeHeight
      );
      rightYPos += barcodeHeight + 1.5; // Adjusted spacing for text below barcode

      // Add the SKU text below barcode
      doc.setFontSize(7); // Reduced from 8
      doc.setFont("helvetica", "normal");
      doc.text(String(productUPCcode), barcodeX + barcodeWidth / 2, rightYPos, {
        align: "center",
      });
    } catch (error) {
      console.error(`Error generating barcode for SKU ${size.sku}:`, error);
      doc.setFontSize(7);
      doc.text(`${size.sku}`, rightX, rightYPos);
    }
  }

  // Sanitize product and SKU names for filename
  const fileNameProductName = productName
    .replace(/[^a-zA-Z0-9]/g, "_")
    .substring(0, 30);
  const fileNameSku = size.sku
    ? size.sku.replace(/[^a-zA-Z0-9]/g, "_")
    : "UnknownSKU";
  doc.save(`Label_${fileNameProductName}_${fileNameSku}.pdf`);
};
