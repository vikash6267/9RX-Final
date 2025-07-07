
import { useState, useEffect } from "react";
import { Invoice, InvoiceStatus, isInvoice, InvoiceRealtimePayload } from "../types/invoice.types";
import { InvoicePreview } from "../InvoicePreview";
import { Sheet } from "@/components/ui/sheet";
import { InvoiceTableContent } from "./InvoiceTableContent";
import { InvoiceFilters } from "./InvoiceFilters";
import { ExportOptions } from "./ExportOptions";
import { useToast } from "@/hooks/use-toast";
import { SortConfig } from "../types/table.types";
import { FilterValues, isValidFilterValues } from "../types/filter.types";
import { sortInvoices } from "../utils/sortUtils";
import { supabase } from "@/integrations/supabase/client";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { Skeleton } from "@/components/ui/skeleton";
import { CSVLink } from "react-csv";

interface DataTableProps {
  filterStatus?: InvoiceStatus;
}

export function InvoiceTableContainer({ filterStatus }: DataTableProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [filters, setFilters] = useState<FilterValues>({
    status: filterStatus || null,
  });
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

 const fetchInvoices = async () => {
  setLoading(true);
  const role = sessionStorage.getItem('userType');
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    toast({
      title: "Error",
      description: "Please log in to view orders",
      variant: "destructive",
    });
    return;
  }

  try {
    let query = supabase
      .from("invoices")
      .select(`
        *,
        payment_status,
        orders (order_number),
        profiles (first_name, last_name, email, company_name)
      `)
      .order("created_at", { ascending: false });

    if (role === "pharmacy") {
      query.eq('profile_id', session.user.id);
    }

    if (role === "group") {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("group_id", session.user.id);

      if (profileError) {
        console.error("Failed to fetch customer information:", profileError);
        throw new Error("Failed to fetch customer information: " + profileError.message);
      }

      if (!profileData || profileData.length === 0) {
        throw new Error("No customer information found.");
      }

      const userIds = profileData.map(user => user.id);
      query.in("profile_id", userIds);
    }

    // Remove search filter from query — it will be applied client-side
    if (filters.status && filters.status !== "all") {
      let payStatus = filters.status === "pending" ? "unpaid" : filters.status;
      query = query.eq("payment_status", payStatus);
    }

    if (filters.dateFrom) {
      query = query.gte("due_date", filters.dateFrom);
    }

    if (filters.dateTo) {
      query = query.lte("due_date", filters.dateTo);
    }

    if (filters.amountMin) {
      query = query.gte("amount", filters.amountMin);
    }

    if (filters.amountMax) {
      query = query.lte("amount", filters.amountMax);
    }

    const { data, error } = await query;
    console.log("Raw Data from Supabase:", data);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch invoices.",
        variant: "destructive",
      });
      console.error("Error fetching invoices:", error);
      return;
    }

    // Apply client-side search filter
    let filteredInvoices = data || [];

    if (filters.search) {
      const searchQuery = filters.search.toLowerCase();

      filteredInvoices = filteredInvoices.filter((invoice) => {
        const invoiceNumber = invoice.invoice_number?.toLowerCase() || "";
        const orderNumber = invoice.orders?.order_number?.toLowerCase() || "";
        const firstName = invoice.profiles?.first_name?.toLowerCase() || "";
        const lastName = invoice.profiles?.last_name?.toLowerCase() || "";
        const email = invoice.profiles?.email?.toLowerCase() || "";
        const company = invoice.profiles?.company_name?.toLowerCase() || "";

        return (
          invoiceNumber.includes(searchQuery) ||
          orderNumber.includes(searchQuery) ||
          firstName.includes(searchQuery) ||
          lastName.includes(searchQuery) ||
          email.includes(searchQuery) ||
          company.includes(searchQuery)
        );
      });
    }

    // Validate the response data
    const validInvoices = filteredInvoices.filter(isInvoice);
    if (validInvoices.length !== filteredInvoices.length) {
      console.warn("Some invoices failed validation:",
        filteredInvoices.filter((invoice) => !isInvoice(invoice))
      );
    }

    setInvoices(validInvoices);
  } catch (error) {
    console.error("Error in fetchInvoices:", error);
    toast({
      title: "Error",
      description: "An unexpected error occurred while fetching invoices.",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    const channel = supabase
      .channel('invoice-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices'
        },
        (payload: RealtimePostgresChangesPayload<Invoice>) => {
          console.log('Received real-time update:', payload);

          setRefreshTrigger(prev => prev + 1);

          const eventMessages = {
            INSERT: 'New invoice created',
            UPDATE: 'Invoice updated',
            DELETE: 'Invoice deleted'
          };

          const invoiceNumber =
            (payload.new as Invoice | undefined)?.invoice_number ||
            (payload.old as Invoice | undefined)?.invoice_number ||
            'Unknown';

          toast({
            title: eventMessages[payload.eventType as keyof typeof eventMessages] || 'Invoice Changed',
            description: `Invoice ${invoiceNumber} has been modified.`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [filters, refreshTrigger]);

  const handleSort = (key: string) => {
    setSortConfig((currentSort) => {
      if (!currentSort || currentSort.key !== key) {
        return { key, direction: "asc" };
      }
      if (currentSort.direction === "asc") {
        return { key, direction: "desc" };
      }
      return null;
    });
  };

  const handleActionComplete = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleFilterChange = (newFilters: FilterValues) => {
    if (true) {
      setFilters(newFilters);
    } else {
      console.error("Invalid filter values:", newFilters);
      toast({
        title: "Error",
        description: "Invalid filter values provided.",
        variant: "destructive",
      });
    }
  };

  const sortedInvoices = sortInvoices(invoices, sortConfig);

  const transformInvoiceForPreview = (invoice: Invoice) => {
    console.log(invoice)
    try {
      const items = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items;
      const customerInfo = typeof invoice.customer_info === 'string'
        ? JSON.parse(invoice.customer_info)
        : invoice.customer_info;
      const shippingInfo = typeof invoice.shipping_info === 'string'
        ? JSON.parse(invoice.shipping_info)
        : invoice.shipping_info;
      console.log(invoice)
      return {
        invoice_number: invoice.invoice_number,
        order_number: invoice.orders.order_number,
        id: invoice.id,
        customerInfo,
        shippingInfo,
        profile_id: invoice.profile_id,
        payment_status: invoice.payment_status, // ✅ Extracted correctly
        created_at: invoice.created_at,
        payment_transication: invoice.payment_transication,
        payment_notes: invoice.payment_notes,
        payment_method: invoice.payment_method,
        shippin_cost:invoice.shippin_cost,
        items,
        subtotal: invoice.subtotal,
        tax: invoice.tax_amount,
        total: invoice.total_amount
      };
    } catch (error) {
      console.error("Error transforming invoice for preview:", error);
      toast({
        title: "Error",
        description: "Failed to process invoice data for preview.",
        variant: "destructive",
      });
      return null;
    }
  };


const exportInvoicesToCSV = () => {
  // ✅ Filter out invoices with voided orders
  const filteredInvoices = invoices?.filter(
    (invoice) => invoice.void === false
  );

  const csvData = filteredInvoices?.map((invoice) => ({
    "Invoice Number": invoice.invoice_number,
    "Order Number": invoice.orders?.order_number || "",
    "Customer Name": `${invoice.profiles?.first_name || ""} ${invoice.profiles?.last_name || ""}`,
    "Email": invoice.profiles?.email || "",
    "Company Name": (invoice.profiles as any)?.company_name || "",

    "Tax": invoice.tax_amount,
    "Subtotal": invoice.subtotal,
    "Payment Status": invoice.payment_status,
    "Created At": invoice.created_at,
    "Shipping Address": invoice.shipping_info
      ? `${invoice.shipping_info.street}, ${invoice.shipping_info.city}, ${invoice.shipping_info.state}, ${invoice.shipping_info.zip_code}`
      : "",
  }));

  return csvData;
};



  return (
    <>
  <div className="flex flex-col p-4 sm:flex-row justify-between items-center bg-white  border border-gray-200 rounded-lg ">
  <div className="w-full sm:w-auto  sm:mb-0">
    <InvoiceFilters onFilterChange={handleFilterChange} exportInvoicesToCSV={exportInvoicesToCSV} />
  </div>

  <div className="flex gap-3">
    <ExportOptions invoices={invoices} />

    {/* {invoices.length > 0 && (
      <CSVLink
        data={exportInvoicesToCSV()}
        filename={`invoices_${new Date().toISOString()}.csv`}
        className="px- py-2 w-full bg-blue-600 text-white rounded-lg shadow-md transition-all hover:bg-blue-700 hover:scale-105"
      >
        Export CSV
      </CSVLink>
    )} */}
  </div>
</div>


      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <Skeleton key={index} className="w-full h-16" />
          ))}
        </div>
      ) : (
        <InvoiceTableContent
          invoices={sortedInvoices}
          onSort={handleSort}
          sortConfig={sortConfig}
          onActionComplete={handleActionComplete}
          onPreview={setSelectedInvoice}
        />
      )}

      <Sheet open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        {selectedInvoice && (
          <InvoicePreview
            invoice={transformInvoiceForPreview(selectedInvoice) || undefined}
          />
        )}
      </Sheet>
    </>
  );
}
