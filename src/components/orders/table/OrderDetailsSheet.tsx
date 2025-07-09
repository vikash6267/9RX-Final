import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Edit, CreditCard, Download, LoaderCircle, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateOrderForm } from "../CreateOrderForm";
import { OrderFormValues } from "../schemas/orderSchema";
import { OrderCustomerInfo } from "../details/OrderCustomerInfo";
import { OrderItemsList } from "../details/OrderItemsList";
import { OrderPaymentInfo } from "../details/OrderPaymentInfo";
import { OrderWorkflowStatus } from "../workflow/OrderWorkflowStatus";
import { OrderActions } from "./OrderActions";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { processACHPayment } from "../utils/authorizeNetUtils";
import { supabase } from "@/supabaseClient";
import PaymentForm from "@/components/PaymentModal";
import axios from "../../../../axiosconfig";
import { Link } from "react-router-dom";

import { useCart } from "@/hooks/use-cart";
import jsPDF from "jspdf";
import { current } from "@reduxjs/toolkit";
import JsBarcode from "jsbarcode"
import Swal from "sweetalert2";
import { ChargesDialog } from "./ChargesDialog";

interface OrderDetailsSheetProps {
  order: OrderFormValues;
  isEditing: boolean;
  poIs?: boolean;
  setIsEditing: (value: boolean) => void;
  loadOrders?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProcessOrder?: (orderId: string) => void;
  onShipOrder?: (orderId: string) => void;
  onConfirmOrder?: (orderId: string) => void;
  onDeleteOrder?: (orderId: string) => Promise<void>;
  userRole?: "admin" | "pharmacy" | "group" | "hospital";
}

export const OrderDetailsSheet = ({
  order,
  isEditing,
  setIsEditing,
  open,
  onOpenChange,
  onProcessOrder,
  onShipOrder,
  onConfirmOrder,
  onDeleteOrder,
  poIs = false,
  loadOrders,
  userRole = "pharmacy",
}: OrderDetailsSheetProps) => {
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const { toast } = useToast();
  const [currentOrder, setCurrentOrder] = useState<OrderFormValues>(order);
  const pdfTemplateRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [loading, setLoading] = useState(false);

  // Update currentOrder when order prop changes
  useEffect(() => {
    setCurrentOrder(order);
    console.log(order)
  }, [order]);

  const handleStatusUpdate = async (action: "process" | "ship" | "confirm") => {
    if (!currentOrder.id) return;

    try {
      switch (action) {
        case "process":
          if (onProcessOrder) {
            await onProcessOrder(currentOrder.id);
            setCurrentOrder((prev) => ({ ...prev, status: "processing" }));
          }
          break;
        case "ship":
          if (onShipOrder) {
            await onShipOrder(currentOrder.id);
            setCurrentOrder((prev) => ({ ...prev, status: "shipped" }));
          }
          break;
        case "confirm":
          if (onConfirmOrder) {
            await onConfirmOrder(currentOrder.id);
            setCurrentOrder((prev) => ({ ...prev, status: "pending" }));
          }
          break;
      }
    } catch (error) {
      console.error(`Error updating order status:`, error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };
  const [loadingQuick, setLoadingQuick] = useState(false);
  const [componyName, setComponyName] = useState("");

  const sendMail = async () => {
    setLoading(true);
    try {
      await axios.post("/paynow-user", order);
      console.log("Order status sent successfully to backend.");
      toast({
        title: "Payment Link sent successfully",
        description: "",
        variant: "default",
      });
    } catch (apiError) {
      console.error("Failed to send order status to backend:", apiError);
    }
    setLoading(false);
  };

  const fetchUser = async () => {
    try {
      if (!currentOrder || !currentOrder.customer) return;

      const userID = currentOrder.customer;

      const { data, error } = await supabase
        .from("profiles")
        .select("company_name")
        .eq("id", userID)
        .maybeSingle();

      if (error) {
        console.error("🚨 Supabase Fetch Error:", error);
        return;
      }

      if (!data) {
        console.warn("⚠️ No user found for this email.");
        return;
      }

      console.log("✅ User Data:", data);
      setComponyName(data.company_name || "");
    } catch (error) { }
  };

  useEffect(() => {
    fetchUser();
  }, [currentOrder]);

  const { clearCart } = useCart();

  useEffect(() => {
    console.log(isEditing);

    const clearCartIfEditing = async () => {
      if (isEditing) {
        console.log("object");
        await clearCart();
      }
    };

    clearCartIfEditing();
  }, [isEditing]);

  console.log(currentOrder);

  const quickBookUpdate = async () => {
    setLoadingQuick(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          profiles (
            first_name, 
            last_name, 
            email, 
            mobile_phone, 
            type, 
            company_name
          )
          `
        )
        .eq("id", currentOrder.id)
        .single();

      if (error) {
        console.error("Error fetching order:", error);
      } else {
        console.log("Order data:", data);
        const quickBook = await axios.post("/invoice-quickbook", data);

        if (quickBook?.status === 200) {
          const invoiceId = quickBook?.data?.data?.Invoice?.Id;
          console.log("QuickBooks Invoice ID:", invoiceId);

          const { error: updateError } = await supabase
            .from("orders")
            .update({ quickBooksID: invoiceId }) // Make sure column name matches
            .eq("id", currentOrder.id);

          if (updateError) {
            console.error(
              "Error updating order with QuickBooks ID:",
              updateError
            );
          } else {
            console.log("Order updated with QuickBooks ID successfully.");
            await loadOrders();
            const updatedData = {
              ...currentOrder,
              quickBooksID: invoiceId, // ya jis variable me ID hai
            };

            setCurrentOrder(updatedData);
          }
        }
      }
    } catch (error) {
      console.error("Error in quickBookUpdate:", error);
    } finally {
      setLoadingQuick(false);
    }
  };

  const formattedDate = new Date(currentOrder.date).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "UTC",
    }
  );

  // This is a proposed modification based on the analysis.
  // It assumes currentOrder object contains the necessary data fields.
  const generateBarcode = (text: string): string => {
    const canvas = document.createElement("canvas")
    JsBarcode(canvas, text, {
      format: "CODE128",
      width: 2,
      height: 40,
      displayValue: false,
      margin: 0,
    })
    return canvas.toDataURL("image/png")
  }





const handleDownloadPDF = async () => {
  console.log(currentOrder)
  setIsGeneratingPDF(true);
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    doc.setFont("helvetica");

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let currentY = margin;

    const barcodeData = currentOrder.order_number || "123456789";
    const barcodeImage = generateBarcode(barcodeData);

    const barcodeWidth = 40;
    const barcodeHeight = 15;
    doc.addImage(barcodeImage, "PNG", pageWidth - margin - barcodeWidth, currentY, barcodeWidth, barcodeHeight);

    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("PURCHASE ORDER", margin, currentY + 15);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const dateString = new Date(currentOrder.date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    doc.text(`Date: ${dateString}`, pageWidth - margin - doc.getTextWidth(`Date: ${dateString}`), currentY + 25);

    currentY += 35;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 15;

    const infoStartY = currentY;
    const columnWidth = (contentWidth - 10) / 2;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("SOLD TO", margin, infoStartY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    let soldToY = infoStartY + 8;
    doc.text(currentOrder.customerInfo?.name || "N/A", margin, soldToY);
    soldToY += 5;
    doc.text(currentOrder.customerInfo?.phone || "N/A", margin, soldToY);
    soldToY += 5;
    doc.text(currentOrder.customerInfo?.email || "N/A", margin, soldToY);
    soldToY += 5;

    const soldToAddress = [
      currentOrder.customerInfo?.address?.street || "",
      currentOrder.customerInfo?.address?.city || "",
      `${currentOrder.customerInfo?.address?.state || ""} ${currentOrder.customerInfo?.address?.zip_code || ""}`,
    ].filter(Boolean).join(", ");
    doc.text(doc.splitTextToSize(soldToAddress, columnWidth), margin, soldToY);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("SHIP TO", margin + columnWidth + 10, infoStartY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    let shipToY = infoStartY + 8;
    doc.text(currentOrder.shippingAddress?.fullName || "N/A", margin + columnWidth + 10, shipToY);
    shipToY += 5;
    doc.text(currentOrder.shippingAddress?.phone || "N/A", margin + columnWidth + 10, shipToY);
    shipToY += 5;
    doc.text(currentOrder.shippingAddress?.email || "N/A", margin + columnWidth + 10, shipToY);
    shipToY += 5;

    const shipToAddress = [
      currentOrder.shippingAddress?.address?.street || "",
      currentOrder.shippingAddress?.address?.city || "",
      `${currentOrder.shippingAddress?.address?.state || ""} ${currentOrder.shippingAddress?.address?.zip_code || ""}`,
    ].filter(Boolean).join(", ");
    doc.text(doc.splitTextToSize(shipToAddress, columnWidth), margin + columnWidth + 10, shipToY);

    currentY = Math.max(soldToY + 15, shipToY + 15);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 15;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    doc.text(`Order #: ${currentOrder.order_number || "N/A"}`, margin, currentY);
    doc.text(`Terms: ${currentOrder.payment?.notes || "Net 30"}`, margin, currentY + 6);
    doc.text(`Due Date: ${new Date(Date.now() + 30 * 86400000).toLocaleDateString()}`, margin, currentY + 12);

    const col2X = margin + contentWidth / 3;
    doc.text(`Transaction #: ${currentOrder.payment?.transactionId || "N/A"}`, col2X, currentY);
    doc.text(`Ship via: ${currentOrder.shipping?.method || "Standard"}`, col2X, currentY + 6);
    doc.text(`Tracking: ${currentOrder.shipping?.trackingNumber || "N/A"}`, col2X, currentY + 12);

    currentY += 25;
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 10;

    const tableHead = [["Item#", "Description", "Size", "UoM", "Price", "Qty", "Total"]];
    const tableBody = [];

    currentOrder?.items?.forEach((item, itemIndex) => {
      if (item.sizes && item.sizes.length > 0) {
        item.sizes.forEach((size) => {
          tableBody.push([
            (itemIndex + 1).toString(),
            item.name || "N/A",
            `${size.size_value} ${size.size_unit}` || "",
            "", // UoM empty
            `$${Number(size.price || 0).toFixed(2)}`,
            (size.quantity || 0).toString(),
            `$${(Number(size.price) * Number(size.quantity)).toFixed(2)}`
          ]);
        });
      } else {
        tableBody.push([
          (itemIndex + 1).toString(),
          item.name || "N/A",
          "",
          "", // UoM empty
          `$${Number(item.price || 0).toFixed(2)}`,
          (item.quantity || 0).toString(),
          `$${(Number(item.price) * Number(item.quantity)).toFixed(2)}`
        ]);
      }
    });

    doc.autoTable({
      head: tableHead,
      body: tableBody,
      startY: currentY,
      margin: { left: margin, right: margin },
      styles: { fontSize: 10, cellPadding: 4, lineColor: [0, 0, 0], lineWidth: 0.1 },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 15, halign: "center" },
        1: { cellWidth: "auto" },
        2: { cellWidth: 20, halign: "center" },
        3: { cellWidth: 15, halign: "center" },
        4: { cellWidth: 25, halign: "right" },
        5: { cellWidth: 20, halign: "center" },
        6: { cellWidth: 25, halign: "right" },
      },
      theme: "grid",
    });

    currentY = doc.lastAutoTable.finalY + 15;
    if (currentY + 60 > pageHeight - margin) {
      doc.addPage();
      currentY = margin;
    }

    const summaryX = pageWidth - margin - 60;
    let summaryY = currentY;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const subtotal = tableBody.reduce((sum, row) => sum + Number(row[6].replace('$', '')), 0);
    const handling = Number(currentOrder?.po_handling_charges || 0);
    const fred = Number(currentOrder?.po_fred_charges || 0);
    const shipping = Number(currentOrder?.shipping_cost || 0);
    const tax = Number(currentOrder?.tax_amount || 0);

    doc.text("Sub Total:", summaryX, summaryY);
    doc.text(`$${subtotal.toFixed(2)}`, summaryX + 60 - doc.getTextWidth(`$${subtotal.toFixed(2)}`), summaryY);
    summaryY += 6;

    doc.text("Handling Charges:", summaryX, summaryY);
    doc.text(`$${handling.toFixed(2)}`, summaryX + 60 - doc.getTextWidth(`$${handling.toFixed(2)}`), summaryY);
    summaryY += 6;

    doc.text("Fred Charges:", summaryX, summaryY);
    doc.text(`$${fred.toFixed(2)}`, summaryX + 60 - doc.getTextWidth(`$${fred.toFixed(2)}`), summaryY);
    summaryY += 6;

    doc.text("Shipping:", summaryX, summaryY);
    doc.text(`$${shipping.toFixed(2)}`, summaryX + 60 - doc.getTextWidth(`$${shipping.toFixed(2)}`), summaryY);
    summaryY += 6;

    doc.text("Tax:", summaryX, summaryY);
    doc.text(`$${tax.toFixed(2)}`, summaryX + 60 - doc.getTextWidth(`$${tax.toFixed(2)}`), summaryY);
    summaryY += 8;

    doc.setLineWidth(0.5);

// Shift line up to stay above "Invoice Total"
const lineY = summaryY - 4;
doc.line(summaryX, lineY, summaryX + 60, lineY);

doc.setFont("helvetica", "bold");

    const totalAmount = subtotal + handling + fred + shipping + tax;
    doc.text("Invoice Total:", summaryX, summaryY);
    doc.text(`$${totalAmount.toFixed(2)}`, summaryX + 60 - doc.getTextWidth(`$${totalAmount.toFixed(2)}`), summaryY);
    summaryY += 8;

    doc.setFont("helvetica", "normal");
    const isPaid = currentOrder?.payment_status === "paid";
    doc.text("PrePayment:", summaryX, summaryY);
    doc.text(`$${isPaid ? totalAmount.toFixed(2) : "0.00"}`, summaryX + 60 - doc.getTextWidth(`$${isPaid ? totalAmount.toFixed(2) : "0.00"}`), summaryY);
    summaryY += 6;

    doc.setFont("helvetica", "bold");
    const balance = isPaid ? 0 : totalAmount;
    doc.text("Balance Due:", summaryX, summaryY);
    doc.text(`$${balance.toFixed(2)}`, summaryX + 60 - doc.getTextWidth(`$${balance.toFixed(2)}`), summaryY);

    doc.save(`Invoice_${currentOrder.order_number || currentOrder.id}.pdf`);

    toast({ title: "Success", description: "Invoice downloaded successfully" });
  } catch (error) {
    console.error("Error generating PDF:", error);
    toast({ title: "Error", description: "Failed to generate PDF", variant: "destructive" });
  } finally {
    setIsGeneratingPDF(false);
  }
};











  const updateSizeQuantities = async (orderItems, isApprove = true) => {
    for (const item of orderItems) {
      if (item.sizes && item.sizes.length > 0) {
        for (const size of item.sizes) {
          // Fetch current stock for this size
          const { data: currentSize, error: fetchError } = await supabase
            .from("product_sizes")
            .select("stock")
            .eq("id", size.id)
            .single();

          if (fetchError || !currentSize) {
            console.warn(`⚠️ Size not found in Supabase for ID: ${size.id}, skipping...`);
            continue;
          }

          const newQuantity = isApprove
            ? currentSize.stock + size.quantity
            : currentSize.stock - size.quantity;

          // Update stock
          const { error: updateError } = await supabase
            .from("product_sizes")
            .update({ stock: newQuantity })
            .eq("id", size.id);

          if (updateError) {
            console.error(`❌ Failed to update stock for size ID: ${size.id}`, updateError);
            throw new Error("Failed to update size quantity");
          } else {
            console.log(`✅ Updated stock for size ID: ${size.id}`);
          }
        }
      }
    }
  };


  const [chargesOpen, setChargesOpen] = useState(false);

 const handleApprove = async () => {
  setChargesOpen(true);
};


const submitCharges = async (handling, fred) => {
  try {
    Swal.fire({
      title: 'Approving Order...',
      text: 'Please wait while we update the stock.',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading(),
    });

    await updateSizeQuantities(order.items, true);

    await supabase
      .from("orders")
      .update({
        poApproved: true,
        po_handling_charges: handling,
        po_fred_charges: fred,
      })
      .eq("id", order.id);

    onOpenChange(false);
    Swal.close();

    Swal.fire({
      title: 'Order Approved ✅',
      icon: 'success',
    }).then(() => window.location.reload());
  } catch (error) {
    Swal.close();
    Swal.fire({
      title: 'Error',
      text: 'Approval failed',
      icon: 'error',
    });
  }
};



  const handleReject = async () => {
  try {
    Swal.fire({
      title: 'Rejecting Order...',
      text: 'Please wait while we update the stock.',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
      background: '#f9fafb',
      customClass: {
        popup: 'z-[99999] rounded-xl shadow-lg',
        title: 'text-lg font-semibold',
      },
    });

    await updateSizeQuantities(order.items, false);
    await supabase
      .from("orders")
      .update({
        poApproved: false,
        po_handling_charges: 0,  // ✅ set to 0
        po_fred_charges: 0,      // ✅ set to 0
      })
      .eq("id", order.id);

    onOpenChange(false);
    Swal.close();

    Swal.fire({
      title: 'Order Rejected ❌',
      text: 'Stock has been reduced successfully!',
      icon: 'warning',
      confirmButtonText: 'OK',
      confirmButtonColor: '#f59e0b',
      background: '#fff7ed',
      color: '#78350f',
      customClass: {
        popup: 'z-[99999] rounded-xl shadow-lg',
      },
    }).then(() => {
      window.location.reload();
    });
  } catch (error) {
    Swal.close();
    Swal.fire({
      title: 'Error',
      text: 'Something went wrong while rejecting the order.',
      icon: 'error',
      confirmButtonText: 'OK',
      confirmButtonColor: '#ef4444',
      customClass: {
        popup: 'z-[99999] rounded-xl shadow-lg',
      },
    });
  }
};






  if (!currentOrder) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-full md:max-w-3xl overflow-y-auto z-50 p-4 md:p-6">
        <SheetHeader>
          <SheetTitle className="text-lg md:text-xl">Order Details</SheetTitle>
          <SheetDescription className="text-sm md:text-base">
            {isEditing ? "Edit order details" : "View order details"}
          </SheetDescription>
        </SheetHeader>

        {false && !currentOrder?.quickBooksID && (
          <div className="w-full flex justify-end items-end flex-1">
            <Button
              variant="outline"
              onClick={quickBookUpdate}
              disabled={loadingQuick}
              className={`
        px-5 py-2 rounded-3xl font-semibold transition-all duration-300 
        flex items-center gap-2 
        ${loadingQuick
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600"
                } 
        text-white
      `}
            >
              {loadingQuick ? (
                <>
                  <LoaderCircle className="animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                "QUICK BOOKS UPDATE"
              )}
            </Button>
          </div>
        )}

        {isEditing ? (
          <div className="mt-6">
            <CreateOrderForm initialData={currentOrder} isEditing={isEditing} />
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              className="mt-4 w-full md:w-auto"
            >
              Cancel Edit
            </Button>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
              {!poIs && (
                <h3 className="text-base md:text-lg font-semibold">
                  Order Status
                </h3>
              )}
              <span className="text-sm md:text-base">
                Order Number: {currentOrder.order_number}
              </span>
              {userRole === "admin" && (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  size="sm"
                  className="w-full md:w-auto"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Order
                </Button>
              )}
            </div>

            {!poIs && <OrderWorkflowStatus status={currentOrder.status} />}

            {currentOrder.payment_status !== "paid" && !poIs && (
              <div>
                <div className="flex gap-3 justify-center items-center min-w-full">
                  <Link
                    to={`/pay-now?orderid=${currentOrder.id}`}
                    className="px-4 py-2 bg-red-600 text-white font-semibold text-sm md:text-base rounded-lg hover:bg-red-700 transition duration-300"
                  >
                    Create Payment Link
                  </Link>
                  <button
                    onClick={sendMail}
                    disabled={loading}
                    className={`px-4 py-2 font-semibold text-sm md:text-base rounded-lg transition duration-300 ${loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700 text-white"
                      }`}
                  >
                    {loading ? "Sending..." : "Send Payment Link"}
                  </button>
                </div>

                <div className="flex w-full mt-2 justify-center">
                  <span className="text-red-700 font-semibold text-sm md:text-base bg-red-200 px-3 py-1 rounded-md">
                    Unpaid
                  </span>
                </div>
              </div>
            )}

            {userRole === "admin" && !poIs && (
              <div className="flex justify-end">
                <OrderActions
                  order={currentOrder}
                  onProcessOrder={() => handleStatusUpdate("process")}
                  onShipOrder={() => handleStatusUpdate("ship")}
                  onConfirmOrder={() => handleStatusUpdate("confirm")}
                  onDeleteOrder={onDeleteOrder}
                />
              </div>
            )}

            <OrderCustomerInfo
              customerInfo={currentOrder.customerInfo}
              shippingAddress={currentOrder.shippingAddress}
              componyName={componyName}
            />
            <OrderItemsList items={currentOrder.items} />
            <OrderPaymentInfo
              payment={currentOrder.payment}
              specialInstructions={currentOrder.specialInstructions}
            />
          </div>
        )}

        {poIs && (
          <div className="flex w-full justify-end mt-6 gap-3">
            {/* Download PDF */}
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow hover:shadow-lg transition duration-300"
            >
              <Download size={18} />
              Download PDF
            </button>

            {/* Approve / Reject Buttons */}
            {order?.poApproved ? (
              <button
                onClick={handleReject}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg shadow hover:shadow-lg transition duration-300"
              >
                <XCircle size={18} className="text-white" />
                Reject Purchase
              </button>
            ) : (
              <button
                onClick={handleApprove}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg shadow hover:shadow-lg transition duration-300"
              >
                <CheckCircle size={18} className="text-white" />
                Approve Purchase
              </button>
            )}

          </div>
        )}


        <ChargesDialog
  open={chargesOpen}
  onOpenChange={setChargesOpen}
  onSubmit={submitCharges}
/>


      </SheetContent>
    </Sheet>
  );
};
