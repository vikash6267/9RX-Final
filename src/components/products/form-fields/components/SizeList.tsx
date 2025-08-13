"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Edit3, Package, DollarSign, Warehouse, BarChart3, Printer } from "lucide-react";
import { CATEGORY_CONFIGS } from "@/App";
import { SizeImageUploader } from "../SizeImageUploader";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { generateSingleProductLabelPDF } from "@/utils/size-lable-download";
import { supabase } from "@/integrations/supabase/client";
import Select from "react-select";

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
  groupIds?: string[];
  disAllogroupIds?: string[];
  unit?: boolean;
  case?: boolean;
}

interface SizeListProps {
  sizes: Size[];
  onRemoveSize: (index: number) => void;
  setNewSize: (boolean: boolean) => void;
  onUpdateSize: (index: number, field: string, value: string | number | boolean | string[]) => void;
  category: string;
  form?: any;
}

export const SizeList = ({ 
  sizes = [], 
  onRemoveSize, 
  onUpdateSize, 
  category, 
  setNewSize, 
  form 
}: SizeListProps) => {
  
  // ⚠️ IMPORTANT: Sabhi hooks TOP pe declare karo, kisi bhi condition se pehle!
  const categoryConfig = CATEGORY_CONFIGS[category as keyof typeof CATEGORY_CONFIGS] || CATEGORY_CONFIGS.OTHER;
  
  // State hooks - ALWAYS top pe rakho
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);

  // Form values - ye bhi top pe
  const productName = form?.getValues("name") || "Product";
  const productUPCcode = form?.getValues("upcCode") || "";
  const productNdcCode = form?.getValues("ndcCode") || "";
  const productExpiry = form?.getValues("exipry") || "";
  const productLotNumber = form?.getValues("lotNumber") || "";

  console.log("category:", category);
  console.log("productUPCcode:", productUPCcode);

  // ⚠️ useEffect MUST be before any return statement
  useEffect(() => {
    // Function ko useEffect ke andar define karo to avoid re-creation
    const fetchGroupPricings = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("group_pricing")
          .select("id, name")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setGroups(data || []);
      } catch (error) {
        console.error("Error fetching group pricings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupPricings();
  }, []); // Empty dependency array - sirf component mount pe chalega

  // ✅ Ab aap conditional return kar sakte ho
  if (sizes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p className="text-sm">No size variations added yet</p>
        <p className="text-xs text-gray-400">Add your first size variation above</p>
      </div>
    );
  }

  // Main component render
  return (
    <div className="space-y-3">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Size Variations ({sizes.length})
        </h4>
      </div>

      {/* Size Cards Mapping */}
      {sizes.map((size, index) => (
        <Card
          key={index}
          className="border border-gray-200 hover:border-purple-300 transition-all duration-200 bg-white/80 backdrop-blur-sm"
        >
          <CardContent className="p-4">
            {/* Single Line Display - Collapsed View */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4 flex-1">
                {/* Size Badge */}
                <Badge className="bg-gradient-to-r text-white px-3 py-1 text-sm font-medium text-black">
                  {size.size_value} {size.size_unit}
                </Badge>

                {/* SKU Badge */}
                {size.sku && (
                  <Badge variant="outline" className="font-mono text-xs">
                    {size.sku}
                  </Badge>
                )}

                {/* Price Information */}
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1 text-green-600 font-medium">
                    <DollarSign className="h-3 w-3" />${size.price}/CS
                  </span>
                  <span className="flex items-center gap-1 text-blue-600 font-medium">
                    <Package className="h-3 w-3" />${size.price_per_case || 0}/Unit
                  </span>
                  <span className="flex items-center gap-1 text-orange-600 font-medium">
                    <Warehouse className="h-3 w-3" />
                    {size.stock} Stock
                  </span>
                </div>

                {/* Conditional Rolls Display */}
                {categoryConfig?.hasRolls && size.rolls_per_case && (
                  <Badge variant="secondary" className="text-xs">
                    {size.rolls_per_case} Rolls/CS
                  </Badge>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Download Label Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    try {
                      await generateSingleProductLabelPDF(
                        productName,
                        size,
                        productUPCcode,
                        productNdcCode,
                        productExpiry,
                        productLotNumber
                      );
                      console.log(`Label for ${size.sku || size.size_value} downloaded!`);
                    } catch (error) {
                      console.error("Failed to download label:", error);
                    }
                  }}
                  className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                  title="Download Label"
                >
                  <Printer className="h-4 w-4" />
                </Button>

                {/* Edit Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                  className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>

                {/* Delete Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveSize(index)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Expanded Edit Form - Shows when editing */}
            {editingIndex === index && (
              <div className="border-t pt-4 mt-4 bg-gray-50/50 -mx-4 px-4 pb-4 rounded-b-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Size Value Input */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Size Value
                    </label>
                    <Input
                      type="text"
                      value={size.size_value}
                      onChange={(e) => onUpdateSize(index, "size_value", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>

                  {/* SKU Input */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      SKU
                    </label>
                    <Input
                      type="text"
                      value={size.sku || ""}
                      onChange={(e) => onUpdateSize(index, "sku", e.target.value)}
                      className="h-8 text-sm font-mono"
                    />
                  </div>

                  {/* Price per Case */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      $/CS
                    </label>
                    <Input
                      type="number"
                      value={size.price}
                      onChange={(e) => onUpdateSize(index, "price", parseFloat(e.target.value) || 0)}
                      className="h-8 text-sm"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  {/* Price per Unit */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      $/Unit
                    </label>
                    <Input
                      type="number"
                      value={size.price_per_case || 0}
                      onChange={(e) => onUpdateSize(index, "price_per_case", parseFloat(e.target.value) || 0)}
                      className="h-8 text-sm"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  {/* Stock Input */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Stock
                    </label>
                    <Input
                      type="number"
                      value={size.stock}
                      onChange={(e) => onUpdateSize(index, "stock", parseInt(e.target.value) || 0)}
                      className="h-8 text-sm"
                      min="0"
                    />
                  </div>

                  {/* Quantity per Case */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      {category === "RX LABELS" ? "Q.Per Roll" : "Q.Per Case"}
                    </label>
                    <Input
                      type="number"
                      value={size.quantity_per_case || 15}
                      onChange={(e) => onUpdateSize(index, "quantity_per_case", parseInt(e.target.value) || 0)}
                      className="h-8 text-sm"
                      min="0"
                      step="1"
                    />
                  </div>

                  {/* Shipping Cost */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Shipping/CS
                    </label>
                    <Input
                      type="number"
                      value={size.shipping_cost || 0}
                      onChange={(e) => onUpdateSize(index, "shipping_cost", parseFloat(e.target.value) || 0)}
                      className="h-8 text-sm"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  {/* Size Sequence */}
                  {/* <div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Sequence
                    </label>
                    <Input
                      type="number"
                      value={size.sizeSquanence || 0}
                      onChange={(e) => onUpdateSize(index, "sizeSquanence", parseInt(e.target.value) || 0)}
                      className="h-8 text-sm"
                      min="0"
                    />
                  </div> */}

                  {/* Conditional Rolls per Case */}
                  {categoryConfig?.hasRolls && (
                    <div>
                      <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                        Rolls/CS
                      </label>
                      <Input
                        type="number"
                        value={size.rolls_per_case || 0}
                        onChange={(e) => onUpdateSize(index, "rolls_per_case", parseInt(e.target.value) || 0)}
                        className="h-8 text-sm"
                        min="0"
                      />
                    </div>
                  )}

                  {/* Sell Type Checkboxes */}
                  <div className="col-span-2 flex items-center gap-4 mt-3">
                    <label className="flex items-center gap-2 text-xs text-gray-700">
                      <input
                        type="checkbox"
                        checked={!!size.unit}
                        onChange={(e) => onUpdateSize(index, "unit", e.target.checked)}
                      />
                      Sell by Unit
                    </label>
                    <label className="flex items-center gap-2 text-xs text-gray-700">
                      <input
                        type="checkbox"
                        checked={!!size.case}
                        onChange={(e) => onUpdateSize(index, "case", e.target.checked)}
                      />
                      Sell by Case
                    </label>
                  </div>

                  {/* Allowed Groups Multi-Select */}
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1 block">
                      Allowed Groups
                    </label>
                    <Select
                      isMulti
                      isLoading={loading}
                      options={groups.map((group) => ({
                        label: group.name,
                        value: group.id,
                      }))}
                      value={(size.groupIds || []).map((id) => {
                        const group = groups.find((g) => g.id === id);
                        return group ? { label: group.name, value: group.id } : null;
                      }).filter(Boolean)}
                      onChange={(selected) => {
                        const selectedIds = selected ? selected.map((option) => option.value) : [];
                        onUpdateSize(index, "groupIds", selectedIds);
                      }}
                      className="react-select-container text-sm"
                      classNamePrefix="react-select"
                      placeholder="Select groups..."
                    />
                  </div>

                  {/* Disallowed Groups Multi-Select */}
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1 block">
                      Disallowed Groups
                    </label>
                    <Select
                      isMulti
                      isLoading={loading}
                      options={groups.map((group) => ({
                        label: group.name,
                        value: group.id,
                      }))}
                      value={(size.disAllogroupIds || []).map((id) => {
                        const group = groups.find((g) => g.id === id);
                        return group ? { label: group.name, value: group.id } : null;
                      }).filter(Boolean)}
                      onChange={(selected) => {
                        const selectedIds = selected ? selected.map((option) => option.value) : [];
                        onUpdateSize(index, "disAllogroupIds", selectedIds);
                      }}
                      className="react-select-container text-sm"
                      classNamePrefix="react-select"
                      placeholder="Select groups..."
                    />
                  </div>
                </div>

                {/* Image Uploader Section */}
                <div className="mt-4">
                  <SizeImageUploader
                    form={size}
                    indexValue={index}
                    onUpdateSize={onUpdateSize}
                    validateImage={(file) => {
                      const maxSize = 5 * 1024 * 1024; // 5MB
                      if (file.size > maxSize) {
                        return "Image size should be less than 5MB";
                      }
                      const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
                      if (!allowedTypes.includes(file.type)) {
                        return "Only JPG, PNG and GIF images are allowed";
                      }
                      return null;
                    }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};