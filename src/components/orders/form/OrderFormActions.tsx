import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderFormValues } from "../schemas/orderSchema";
import { OrderPreview } from "../OrderPreview";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { calculateOrderTotal } from "../utils/orderUtils";
import axios from "../../../../axiosconfig";

interface OrderFormActionsProps {
  orderData: OrderFormValues;
  form: any;
  isSubmitting?: boolean;
  isValidating?: boolean; // Added this prop
  isEditing?: boolean; // Added this prop
  setModalIsOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  setIsCus?: React.Dispatch<React.SetStateAction<boolean>>;
  isCus?: boolean;
  poIs?: boolean;
}

export function OrderFormActions({
  orderData,
  isSubmitting,
  isValidating,
  isEditing,
  form,
  setModalIsOpen,
  setIsCus, // ✅ Added missing prop
  isCus, // ✅ Added missing prop
  poIs=false
}: OrderFormActionsProps) {
  const { toast } = useToast();
  const userType = sessionStorage.getItem("order_pay");
  const userRole = sessionStorage.getItem('userType');
console.log(orderData)
  const onSubmit = async () => {
    console.log(orderData)

    const calculatedTotal = calculateOrderTotal(
      orderData.items,
      orderData.shipping.cost
    );

    const { data, error } = await supabase
      .from("profiles")
      .select("taxPercantage")
      .eq("id", orderData.customer)
      .maybeSingle();

    if (error) {
      console.error("🚨 Supabase Fetch Error:", error);
      return;
    }

    if (!data) {
      console.warn("⚠️ No user found for this email.");
      return;
    }

    console.log(orderData)

    const newtax = (calculatedTotal * Number(data.taxPercantage)) / 100;
    console.log(newtax)


    const updatedData = orderData;
    const orderId = orderData.id;
    try {
      const { data:newOrder, error } = await supabase
        .from("orders")
        .update({
          profile_id: updatedData.customer || null, // Ensure profile_id is valid
          customerInfo: updatedData.customerInfo || null,
          updated_at: new Date().toISOString(),
          items: updatedData.items || [], // Ensure it's a valid JSON array
          total_amount: calculatedTotal + newtax || 0,
          tax_amount: newtax || 0,

        })
        .eq("id", orderId)
        .select("*").maybeSingle();

      if (error) {
        console.error("Error updating order:", error);
        throw error;
      }



      const { error:Inerror } = await supabase
      .from("invoices")
      .update({
        profile_id: updatedData.customer || null, // Ensure profile_id is valid
        customer_info: updatedData.customerInfo || null,
        updated_at: new Date().toISOString(),
        items: updatedData.items || [], // Ensure it's a valid JSON array
        amount: calculatedTotal + newtax || 0,
        subtotal: calculatedTotal + newtax || 0,
        total_amount: calculatedTotal + newtax || 0,
        tax_amount: newtax || 0,

      })
      .eq("order_id", orderId);

    if (Inerror) {
      console.error("Error updating order:", Inerror);
      throw error;
    }

      console.log("Order updated successfully!");
      toast({
        title: "Order Status !",
        description: "Order updated successfully!",
      });


          const logsData = {
                  user_id: orderData.customer,
                  order_id: orderData.order_number,
                  action: 'order_edited',
                  details: {
                    message: `Order Edited : ${orderData.order_number}`,
                    oldOrder: orderData,
                    updateOrder:newOrder
                  },
                };
                try {
                  await axios.post("/logs/create", logsData);
                  console.log("LOGS STORED SUCCESSFULLYY");
                } catch (apiError) {
                  console.error("Failed to store logs:", apiError);
                }

      setTimeout(() => {
        window.location.href = "/admin/orders"; // Option 2: Redirect with refresh
      }, 500);
      return { success: true };
    } catch (error) {
      console.error("Update order error:", error);
      return { success: false, error };
    }
  };

  useEffect(() => {
    const storedOrderPay = sessionStorage.getItem("order_pay");
    console.log(storedOrderPay + " Check section");
  }, []);

  return (
    <div className="flex flex-col md:flex-row justify-end gap-2">
      <OrderPreview form={form} orderData={orderData} setIsCus={setIsCus} isCus={isCus} isEditing={isEditing} />

      {!isEditing &&  (
        <>
          {(userType === "true" || userType === null || userRole.toLocaleLowerCase() === "admin") ? (<Button
            type="submit"
            size="lg"
            disabled={isSubmitting || isValidating}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {isSubmitting
  ? "Creating Order..."
  : poIs
    ? "Create Purchase Order"
    : "Create Order"}

          </Button>) :

            <p
              onClick={() => setModalIsOpen(true)}
              className="flex items-center gap-3 text-center justify-center px-4 py-2 text-white bg-blue-600 rounded-lg cursor-pointer hover:bg-blue-700 transition duration-300 active:scale-95 select-none"
            >
              <ShoppingCart className="h-5 w-5" /> Pay And Order
            </p>

          }

          {userRole.toLocaleLowerCase() === "admin" && !poIs&&
            <p
              onClick={() => setModalIsOpen(true)}
              className="flex items-center gap-3 text-center justify-center px-4 py-2 text-white bg-blue-600 rounded-lg cursor-pointer hover:bg-blue-700 transition duration-300 active:scale-95 select-none"
            >
              <ShoppingCart className="h-5 w-5" /> Pay And Order
            </p>
          }
        </>
      )}

      {isEditing && (
        <p
          onClick={onSubmit}
          className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg cursor-pointer hover:bg-blue-700 transition duration-300 active:scale-95 select-none"
        >
          <ShoppingCart className="h-5 w-5" />
          {isSubmitting ? "Updating Order..." : "Update Order"}
        </p>
      )}
    </div>
  );
}
