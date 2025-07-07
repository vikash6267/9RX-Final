import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StatusFilterProps {
  value: string;
  onValueChange: (value: string) => void;
}

export const StatusFilter = ({ value, onValueChange }: StatusFilterProps) => {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Filter by status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Orders</SelectItem>
        <SelectItem value="paid">Paid</SelectItem>
        <SelectItem value="unpaid">Pending</SelectItem>
        {/* <SelectItem value="shipped">Shipped</SelectItem> */}
      </SelectContent>
    </Select>
  );
};