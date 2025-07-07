import jsPDF from "jspdf"
import JsBarcode from "jsbarcode"

interface WorkOrderData {
  id: string
  invoice_number: string
  order_id: string
  status: string
  amount: number
  tax_amount: number
  total_amount: number
  due_date: string
  created_at: string
  items: Array<{
    name: string
    price: number
    quantity: number
    sizes: Array<{
      id: string
      sku: string
      size_value: string
      size_unit: string
      quantity: number
      price: number
      quantity_per_case: number
    }>
  }>
  customer_info: {
    name: string
    type: string
    email: string
    phone: string
    address: {
      street: string
      city: string
      state: string
      zip_code: string
    }
  }
  shipping_info: {
    fullName: string
    email: string
    phone: string
    address: {
      street: string
      city: string
      state: string
      zip_code: string
    }
  }
  orders: {
    order_number: string
  }
  profiles: {
    first_name: string
    last_name: string
    company_name: string
    email: string
  }
}

interface PackingSlipData {
  shipVia: string
  notes: string
  cartons: string
  masterCases: string
  weight: string
  shippingClass: string
}

// Generate barcode as base64 image
const generateBarcode = (text: string): string => {
  const canvas = document.createElement("canvas")
  JsBarcode(canvas, text, {
    format: "CODE128",
    width: 1.5,
    height: 25,
    displayValue: true,
    fontSize: 8,
    textMargin: 2,
  })
  return canvas.toDataURL("image/png")
}

export const generateWorkOrderPDF = (workOrderData: WorkOrderData, packingData: PackingSlipData) => {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  let yPosition = 25 // Increased top margin

  const currentDate = new Date().toLocaleDateString()

  // RIGHT SIDE TOP SECTION
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("Packing Slip / Bill Of Landing", pageWidth - 15, yPosition, { align: "right" })

  let rightYPosition = yPosition + 8
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.text(`Date: ${currentDate}`, pageWidth - 15, rightYPosition, { align: "right" })
  rightYPosition += 5
  doc.text(`Packing Slip #: PS-${workOrderData.orders.order_number}`, pageWidth - 15, rightYPosition, {
    align: "right",
  })
  rightYPosition += 5
  doc.text(`Invoice #: ${workOrderData.invoice_number}`, pageWidth - 15, rightYPosition, { align: "right" })
  rightYPosition += 8

  // BARCODE - Right side
  try {
    const barcodeData = generateBarcode(workOrderData.orders.order_number)
    doc.addImage(barcodeData, "PNG", pageWidth - 65, rightYPosition, 45, 12)
    rightYPosition += 15
  } catch (error) {
    console.error("Barcode generation failed:", error)
    doc.text(`Barcode: ${workOrderData.orders.order_number}`, pageWidth - 15, rightYPosition, { align: "right" })
    rightYPosition += 10
  }

  // ADD PROPER GAP AFTER HEADER
  yPosition = yPosition + 35 // Increased gap after header

  // FROM Section - Left side
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text("FROM", 15, yPosition)
  yPosition += 6
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.text("9RX LLC", 15, yPosition)
  yPosition += 5
  doc.text("724 Montana drive,", 15, yPosition)
  yPosition += 5
  doc.text("Ste A - 1", 15, yPosition)
  yPosition += 5
  doc.text("Charlotte, NC 28216", 15, yPosition)
  yPosition += 15

  // TO Section - Right side (starting from same level as FROM)
  let toYPosition = yPosition - 35 // Start TO at same level as FROM
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text("TO", pageWidth - 85, toYPosition)
  toYPosition += 6
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.text(workOrderData.customer_info.name, pageWidth - 85, toYPosition)
  toYPosition += 5
  if (workOrderData.profiles.company_name) {
    doc.text(workOrderData.profiles.company_name, pageWidth - 85, toYPosition)
    toYPosition += 5
  }
  doc.text(workOrderData.shipping_info.address.street, pageWidth - 85, toYPosition)
  toYPosition += 5
  doc.text(
    `${workOrderData.shipping_info.address.city}, ${workOrderData.shipping_info.address.state} ${workOrderData.shipping_info.address.zip_code}`,
    pageWidth - 85,
    toYPosition,
  )

  // Use the maximum yPosition from both sides
  yPosition = Math.max(yPosition, toYPosition + 15)

  // Ship Via Section
  doc.setFontSize(9)
  doc.text(`Ship Via: ${packingData.shipVia}`, 15, yPosition)
  yPosition += 15

  // TABLE SECTION - ONLY FOR ITEMS
  const tableStartY = yPosition
  const tableStartX = 15
  const tableWidth = pageWidth - 30
  const rowHeight = 8

  // Table headers and column widths
  const headers = ["ITEMS", "DESCRIPTION", "QTY/CS", "Shipped QTY", "IN CASE"]
  const colWidths = [25, 85, 20, 25, 20]
  const colPositions = [tableStartX]

  // Calculate column positions
  for (let i = 0; i < colWidths.length - 1; i++) {
    colPositions.push(colPositions[i] + colWidths[i])
  }

  // Draw table header background
  doc.setFillColor(240, 240, 240)
  doc.rect(tableStartX, yPosition - 2, tableWidth, rowHeight, "F")

  // Draw table header text
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  headers.forEach((header, index) => {
    doc.text(header, colPositions[index] + 2, yPosition + 4)
  })

  // Draw header border
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.5)
  doc.rect(tableStartX, yPosition - 2, tableWidth, rowHeight)

  // Draw vertical lines for header
  colPositions.forEach((pos, index) => {
    if (index > 0) {
      doc.line(pos, yPosition - 2, pos, yPosition + 6)
    }
  })

  yPosition += rowHeight

  // Items data - only actual items, no extra rows
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)

  let rowCount = 0
  workOrderData.items.forEach((item) => {
    item.sizes.forEach((size) => {
      // Check if we need a new page
      if (yPosition + rowHeight > pageHeight - 40) {
        doc.addPage()
        yPosition = 25
      }

      // Draw row background (alternating)
      if (rowCount % 2 === 1) {
        doc.setFillColor(250, 250, 250)
        doc.rect(tableStartX, yPosition, tableWidth, rowHeight, "F")
      }

      // Draw row border
      doc.setDrawColor(0, 0, 0)
      doc.rect(tableStartX, yPosition, tableWidth, rowHeight)

      // Draw vertical lines
      colPositions.forEach((pos, index) => {
        if (index > 0) {
          doc.line(pos, yPosition, pos, yPosition + rowHeight)
        }
      })

      // Add data to cells
      const rowData = [
        size.sku,
        `${item.name} - ${size.size_value} ${size.size_unit}`,
        size.quantity_per_case.toString(),
        size.quantity.toString(),
        "_____",
      ]

      rowData.forEach((data, index) => {
        const cellWidth = colWidths[index] - 4
        const lines = doc.splitTextToSize(data, cellWidth)
        doc.text(lines, colPositions[index] + 2, yPosition + 5)
      })

      yPosition += rowHeight
      rowCount++
    })
  })

  yPosition += 15

  // NOTES Section - SIMPLE TEXT (NO TABLE)
  if (packingData.notes) {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.text("NOTES:", 15, yPosition)
    yPosition += 8

    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    const notesLines = doc.splitTextToSize(packingData.notes, pageWidth - 30)
    doc.text(notesLines, 15, yPosition)
    yPosition += notesLines.length * 5 + 15
  }

  // Bottom section - SIMPLE TEXT (NO TABLE)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.text(`Cartons: ${packingData.cartons}`, 15, yPosition)
  doc.text(`Master cases: ${packingData.masterCases}`, 100, yPosition)
  yPosition += 8
  doc.text(`Weight: ${packingData.weight}`, 15, yPosition)
  doc.text(`Shipping class: ${packingData.shippingClass}`, 100, yPosition)
  yPosition += 20

  // Signature section
  doc.text("Signature: _________________________________", 15, yPosition)
  doc.text("Date: _______________", 130, yPosition)

  // Save the PDF
  doc.save(`PackingSlip_${workOrderData.orders.order_number}_${workOrderData.invoice_number}.pdf`)
}
