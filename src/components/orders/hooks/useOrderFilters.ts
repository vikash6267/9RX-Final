import { useState } from "react";
import { OrderFormValues } from "../schemas/orderSchema";

export const useOrderFilters = (orders: OrderFormValues[],po:boolean = true) => {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
console.log(orders)
  const filteredOrders = (orders || [])
  .filter(order =>
    statusFilter === "all" ? true : order.payment_status === statusFilter
  )
 .filter(order => {
  if (!searchQuery) return true;

  const query = searchQuery.toLowerCase();

  // Destructure values from customerInfo
  const { customerInfo = {}, id = "" } = order;
  const {
    name = "",
    email = "",
    phone = "",
    type = "",
    address = {}
  } = customerInfo;
  const { street = "", city = "", state = "", zip_code = "" } = address;

  // Check if any field matches the search query
  return (
    id.toLowerCase().includes(query) ||
    name.toLowerCase().includes(query) ||
    email.toLowerCase().includes(query) ||
    phone.toLowerCase().includes(query) ||
    type.toLowerCase().includes(query) ||
    street.toLowerCase().includes(query) ||
    city.toLowerCase().includes(query) ||
    state.toLowerCase().includes(query) ||
    zip_code.toLowerCase().includes(query)
  );
})

  .filter(order => {
    if (!dateRange.from || !dateRange.to) return true;
    const orderDate = new Date(order.date);
    return orderDate >= dateRange.from && orderDate <= dateRange.to;
  })
  .filter(order => order.poAccept === !po); // 🔥 This filters based on po value


  return {
    statusFilter,
    searchQuery,
    dateRange,
    setStatusFilter,
    setSearchQuery,
    setDateRange,
    filteredOrders
  };
};