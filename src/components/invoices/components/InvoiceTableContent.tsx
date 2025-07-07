
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Invoice } from "../types/invoice.types";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { InvoiceRowActions } from "./InvoiceRowActions";
import { InvoiceTableHeader } from "./InvoiceTableHeader";
import { SortConfig } from "../types/table.types";
import { motion } from "framer-motion";
import { Ban } from "lucide-react"


interface InvoiceTableContentProps {
  invoices: Invoice[];
  onSort: (key: string) => void;
  sortConfig: SortConfig | null;
  onActionComplete: () => void;
  onPreview: (invoice: Invoice) => void;
}

export function InvoiceTableContent({
  invoices,
  onSort,
  sortConfig,
  onActionComplete,
  onPreview
}: InvoiceTableContentProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <InvoiceTableHeader onSort={onSort} sortConfig={sortConfig} />
        <TableBody>
  {invoices.map((invoice, index) => (
    <motion.tr
      key={invoice.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="hover:bg-muted/50 cursor-pointer"
      onClick={() => onPreview(invoice)}
    >
      <TableCell className="text-center">{invoice.invoice_number}</TableCell>
      <TableCell className="text-center">{invoice.orders?.order_number}</TableCell>
   <TableCell className="text-center">
  <div className="flex flex-col items-center justify-center">
    <span className="text-base font-semibold text-gray-800">
      {typeof invoice.customer_info === "object" &&
      invoice.customer_info !== null &&
      "name" in invoice.customer_info
        ? invoice.customer_info.name
        : `${invoice.profiles?.first_name ?? ""} ${invoice.profiles?.last_name ?? ""}`.trim()}
    </span>

    {invoice.void && (
      <div className="mt-1 flex items-center gap-1 text-red-600 text-xs font-medium bg-red-100 px-2 py-1 rounded-full">
        <Ban size={14} className="stroke-[2.5]" />
        Voided
      </div>
    )}
  </div>
</TableCell>
      <TableCell className="text-center">${invoice.amount.toFixed(2)}</TableCell>
      <TableCell className="text-center">
        <InvoiceStatusBadge status={invoice.payment_status} />
      </TableCell>
      <TableCell className="text-center">
        {/* {new Date(invoice.created_at).toLocaleDateString()}  */}

        {(() => {
                const dateObj = new Date(invoice.created_at);
                const formattedDate = dateObj.toLocaleDateString("en-US", {
                  month: "short",
                  day: "2-digit",
                  year: "numeric",
                });
                const formattedTime = dateObj.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                });
                return (
                  <>
                    {formattedDate} <br />
                   
                  </>
                );
              })()}
      </TableCell>
      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
        <InvoiceRowActions invoice={invoice} onPreview={onPreview} onActionComplete={onActionComplete} />
      </TableCell>
    </motion.tr>
  ))}
  {invoices.length === 0 && (
    <TableRow>
      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
        No invoices found
      </TableCell>
    </TableRow>
  )}
</TableBody>

      </Table>
    </div>
  );
}
