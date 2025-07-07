import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Edit, CreditCard, Download, LoaderCircle } from "lucide-react";
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
    } catch (error) {}
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

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);

    try {
      // Create a new PDF document
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Set font
      doc.setFont("helvetica");

      // Page dimensions
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pageWidth - margin * 2;

      // Add company logo
      if (true) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = "/lovable-uploads/0b13fa53-b941-4c4c-9dc4-7d20221c2770.png";

        await new Promise((resolve) => {
          img.onload = resolve;
        });

        // Calculate logo dimensions (max height 20mm)
        const logoHeight = 25;
        const logoWidth = (img.width / img.height) * logoHeight;

        // Position logo at top center
        doc.addImage(
          img,
          "PNG",
          pageWidth / 2 - logoWidth / 2,
          margin,
          logoWidth,
          logoHeight
        );
      }

      // Add currentOrder title and details
      doc.setFontSize(15);
      doc.text("PURCHASE ORDER", pageWidth - margin - 45, margin + 10);

      doc.setFontSize(10);

      doc.text(
        `ORDER - ${currentOrder.order_number}`,
        pageWidth - margin - 40,
        margin + 20
      );
      doc.text(`Date - ${formattedDate}`, pageWidth - margin - 40, margin + 25);

      // Company details
      doc.setFontSize(9);
      doc.text("Tax ID : 99-0540972", margin, margin + 5);
      doc.text("936 Broad River Ln,", margin, margin + 10);
      doc.text("Charlotte, NC 28211", margin, margin + 15);
      doc.text("+1 800 969 6295", margin, margin + 20);
      doc.text("info@9rx.com", margin, margin + 25);
      doc.text("www.9rx.com", margin, margin + 30);

      // Horizontal line
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, margin + 40, pageWidth - margin, margin + 40);

      // Customer and shipping info
      const infoStartY = margin + 50;

      // Bill To
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Bill To", margin, infoStartY);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(componyName, margin, infoStartY + 5);
      doc.text(
        currentOrder.customerInfo?.name || "N/A",
        margin,
        infoStartY + 10
      );
      doc.text(
        currentOrder.customerInfo?.phone || "N/A",
        margin,
        infoStartY + 15
      );
      doc.text(
        currentOrder.customerInfo?.email || "N/A",
        margin,
        infoStartY + 20
      );
      doc.text(
        `${currentOrder.customerInfo.address?.street || "N/A"}, ${
          currentOrder.customerInfo.address?.city || "N/A"
        }, ${currentOrder.customerInfo.address?.state || "N/A"} ${
          currentOrder.customerInfo.address?.zip_code || "N/A"
        }`,
        margin,
        infoStartY + 25,
        { maxWidth: contentWidth / 2 - 5 }
      );

      // Ship To
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Ship To", pageWidth / 2, infoStartY);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(componyName, pageWidth / 2, infoStartY + 5);
      doc.text(
        currentOrder.shippingAddress?.fullName || "N/A",
        pageWidth / 2,
        infoStartY + 10
      );
      doc.text(
        currentOrder.shippingAddress?.phone || "N/A",
        pageWidth / 2,
        infoStartY + 15
      );
      doc.text(
        currentOrder.shippingAddress?.email || "N/A",
        pageWidth / 2,
        infoStartY + 20
      );
      doc.text(
        `${currentOrder.shippingAddress.address?.street || "N/A"}, ${
          currentOrder.shippingAddress.address?.city || "N/A"
        }, ${currentOrder.shippingAddress.address?.state || "N/A"} ${
          currentOrder.shippingAddress.address?.zip_code || "N/A"
        }`,
        pageWidth / 2,
        infoStartY + 25,
        { maxWidth: contentWidth / 2 - 5 }
      );

      // Horizontal line
      doc.line(margin, infoStartY + 35, pageWidth - margin, infoStartY + 35);

      // Items table
      const tableStartY = infoStartY + 45;

      // Prepare table data
      const tableHead = [["Description", "Sizes", "Qty", "Amount"]];
      const tableBody =
        currentOrder?.items?.map((item) => [
          item.name,
          item.sizes
            ?.map((size) => `${size.size_value} ${size.size_unit}`)
            .join(", "),
          item.quantity.toString(),
          `$${item.price}`,
        ]) || [];

      // Add table
      (doc as any).autoTable({
        head: tableHead,
        body: tableBody,
        startY: tableStartY,
        margin: { left: margin, right: margin },
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: {
          fillColor: [220, 220, 220],
          textColor: [0, 0, 0],
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: "auto" },
          1: { cellWidth: "auto" },
          2: { cellWidth: 20, halign: "right" },
          3: { cellWidth: 30, halign: "right" },
        },
        theme: "grid",
      });

      // Get the final Y position after the table
      const finalY = (doc as any).lastAutoTable.finalY + 10;

      // Payment status and summary section
      const paymentStatusX = margin;
      const paymentStatusWidth = contentWidth / 3;
      const summaryX = margin + paymentStatusWidth + 10;
      const summaryWidth = contentWidth - paymentStatusWidth - 10;

      // Payment status box
      // doc.setFillColor(240, 240, 240)
      // doc.rect(paymentStatusX, finalY, paymentStatusWidth, 40, "F")
      // doc.setDrawColor(200, 200, 200)
      // doc.rect(paymentStatusX, finalY, paymentStatusWidth, 40, "S")

      // Payment status label
      // if (currentOrder?.payment_status === "paid") {
      //   doc.setFillColor(39, 174, 96)
      //   doc.setTextColor(255, 255, 255)
      // } else {
      //   doc.setFillColor(231, 76, 60)
      //   doc.setTextColor(255, 255, 255)
      // }

      // doc.roundedRect(paymentStatusX + 5, finalY + 5, 50, 10, 5, 5, "F")
      // doc.setFontSize(8)
      // doc.setFont("helvetica", "bold")
      // doc.text(currentOrder?.payment_status === "paid" ? "Paid" : "Unpaid", paymentStatusX + 10, finalY + 11)

      // Payment details if paid
      // if (currentOrder?.payment_status === "paid") {
      //   doc.setTextColor(0, 0, 0)
      //   doc.setFontSize(8)
      //   doc.setFont("helvetica", "bold")
      //   doc.text(
      //     currentOrder.payment_method === "card" ? "Transaction ID:" : "Payment Notes:",
      //     paymentStatusX + 5,
      //     finalY + 25,
      //   )

      //   doc.setFont("helvetica", "normal")
      //   doc.text(
      //     currentOrder.payment_method === "card" ? currentOrder?.payment_transication : currentOrder?.payment_notes,
      //     paymentStatusX + 5,
      //     finalY + 30,
      //     { maxWidth: paymentStatusWidth - 10 },
      //   )
      // }

      // Summary box
      doc.setFillColor(255, 255, 255);
      doc.setTextColor(0, 0, 0);
      doc.rect(summaryX, finalY, summaryWidth, 40, "F");
      doc.setDrawColor(200, 200, 200);
      doc.rect(summaryX, finalY, summaryWidth, 40, "S");

      // Summary content
      const summaryLeftX = summaryX + 5;
      const summaryRightX = summaryX + summaryWidth - 5;
      let summaryY = finalY + 10;

      // Sub Total
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Sub Total", summaryLeftX, summaryY);
      doc.text(
        `$${
          (
            Number(currentOrder?.total) -
            currentOrder?.tax_amount -
            Number(currentOrder.shipping_cost)
          )?.toFixed(2) || "0.00"
        }`,
        summaryRightX,
        summaryY,
        {
          align: "right",
        }
      );

      // Tax
      summaryY += 5;
      doc.text(`Tax `, summaryLeftX, summaryY);
      doc.text(
        `$${Number(currentOrder?.tax_amount)?.toFixed(2) || "0.00"}`,
        summaryRightX,
        summaryY,
        { align: "right" }
      );
      summaryY += 5;
      doc.text(`Shipping `, summaryLeftX, summaryY);
      doc.text(
        `$${Number(currentOrder?.shipping_cost)?.toFixed(2) || "0.00"}`,
        summaryRightX,
        summaryY,
        { align: "right" }
      );

      // Divider
      summaryY += 3;
      doc.line(summaryLeftX, summaryY, summaryRightX, summaryY);

      // Total
      summaryY += 5;
      doc.setFont("helvetica", "bold");
      doc.text("Total", summaryLeftX, summaryY);
      doc.text(
        `$${Number(currentOrder?.total)?.toFixed(2) || "0.00"}`,
        summaryRightX,
        summaryY,
        { align: "right" }
      );

      // Balance Due
      summaryY += 5;
      // doc.setTextColor(231, 76, 60)
      // doc.text("Balance Due", summaryLeftX, summaryY)
      // doc.text(
      //   currentOrder?.payment_status === "paid" ? "$0" : `$${Number(currentOrder?.total)?.toFixed(2) || "0.00"}`,
      //   summaryRightX,
      //   summaryY,
      //   { align: "right" },
      // )

      // Save the PDF
      doc.save(`Invoice_${currentOrder.id}.pdf`);

      toast({
        title: "Success",
        description: "Invoice downloaded successfully",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
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
        ${
          loadingQuick
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
                    className={`px-4 py-2 font-semibold text-sm md:text-base rounded-lg transition duration-300 ${
                      loading
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
          <div className="flex w-full justify-end mt-6">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow hover:shadow-lg transition duration-300"
            >
              <Download size={18} />
              Download PDF
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
