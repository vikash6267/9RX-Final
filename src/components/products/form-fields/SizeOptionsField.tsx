// Assuming this is in SizeOptionsField.tsx
"use client";

import { FormField, FormItem, FormMessage } from "@/components/ui/form";

import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { AddSizeForm } from "./components/AddSizeForm";
import { SizeList } from "./components/SizeList";
import type { SizeOptionsFieldProps, NewSizeState } from "../types/size.types";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ruler } from "lucide-react";
import Swal from "sweetalert2";
import { ConfirmDialog } from "./components/ConfirmDeleteSize";
import { CATEGORY_CONFIGS } from "@/App";

export const SizeOptionsField = ({ form, isEditing }: SizeOptionsFieldProps) => {
  const category = form.watch("category");
  const categoryConfig = CATEGORY_CONFIGS[category as keyof typeof CATEGORY_CONFIGS] || CATEGORY_CONFIGS.OTHER;

  const [newSize, setNewSize] = useState<NewSizeState>({
    size_value: "",
    size_unit: categoryConfig?.defaultUnit || "",
    price: "",
    sku: "",
    pricePerCase: "",
    stock: "",
    price_per_case: "",
    quantity_per_case: "100",
    rolls_per_case: "",
    shipping_cost: "0",
    image: "",
    groupIds: [], // Initialize as an empty array
    sizeSquanence: "",
    unit: false, // default selected
    case: true,
  });

  const handleAddSize = () => {
    if (!newSize.size_value || !newSize.price) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required size fields",
        variant: "destructive",
      });
      return;
    }

    const currentSizes = form.getValues("sizes") || [];
    const PPC = (Number.parseFloat(newSize.price) / Number.parseFloat(newSize.quantity_per_case || "1")).toFixed(2);

    const sizeToAdd = {
      size_value: newSize.size_value,
      sku: newSize.sku || "",
      sizeSquanence: newSize.sizeSquanence || "",
      image: newSize.image || "",
      size_unit: newSize.size_unit || categoryConfig.defaultUnit,
      price: Number.parseFloat(newSize.price) || 0,
      stock: Number.parseInt(newSize.stock) || 0,
      quantity_per_case: Number.parseFloat(newSize.quantity_per_case) || 0,
      pricePerCase: Number.parseFloat(newSize.price_per_case) || 0,
      price_per_case: Number.parseFloat(PPC) || 0,
      rolls_per_case: Number.parseInt(newSize.rolls_per_case) || 0,
      shipping_cost: Number.parseFloat(newSize.shipping_cost) || 15,
      unit: newSize.unit || false,
      case: newSize.case || false,
      groupIds: newSize.groupIds || [], // Ensure groupIds are passed
    } as const;

    if (!sizeToAdd.size_value || !sizeToAdd.size_unit) {
      toast({
        title: "Validation Error",
        description: "Size value and unit are required",
        variant: "destructive",
      });
      return;
    }

    form.setValue("sizes", [...currentSizes, sizeToAdd], {
      shouldValidate: true,
      shouldDirty: true,
    });

    setNewSize({
      size_value: "",
      size_unit: categoryConfig.defaultUnit,
      price: "",
      sku: "",
      pricePerCase: "",
      price_per_case: "",
      stock: "",
      quantity_per_case: "",
      rolls_per_case: "",
      sizeSquanence: "",
      shipping_cost: "0",
      image: "",
      groupIds: [], // Reset groupIds after adding
    });

    toast({
      title: "Size Added",
      description: "New size variation has been added successfully.",
    });
  };

  const [confirmIndex, setConfirmIndex] = useState<number | null>(null);

  const handleRemoveSize = async (index: number) => {
    setConfirmIndex(index);
  };

  const confirmDelete = async () => {
    if (confirmIndex === null) return;

    const currentSizes = form.getValues("sizes") || [];
    const newSizes = [...currentSizes];
    const removedSize = newSizes[confirmIndex];

    newSizes.splice(confirmIndex, 1);
    form.setValue("sizes", newSizes, {
      shouldValidate: true,
      shouldDirty: true,
    });

    if (isEditing && removedSize?.id) {
      const { error: deleteError } = await supabase
        .from("product_sizes")
        .delete()
        .eq("id", removedSize.id);

      if (deleteError) {
        toast({
          title: "Error",
          description: "Failed to remove size.",
        });
        setConfirmIndex(null);
        return;
      }
    }

    toast({
      title: "Size Removed",
      description: "Size variation has been removed.",
    });
    setConfirmIndex(null);
  };



  const handleUpdateSize = (index: number, field: string, value: string | number | string[]) => { // Updated type for value
    const currentSizes = form.getValues("sizes") || [];
    const updatedSizes = [...currentSizes];

    let newPrice = updatedSizes[index].price;
    let newQuantity = updatedSizes[index].quantity_per_case;
    let rollsPerCase = updatedSizes[index].rolls_per_case;

    if (field === "price") {
      newPrice = Number.parseFloat(value as string);
    }
    if (field === "quantity_per_case") {
      newQuantity = Number.parseFloat(value as string);
    }
    if (field === "rolls_per_case") {
      rollsPerCase = Number.parseFloat(value as string);
    }

    // Avoid division by zero
    const PPC = rollsPerCase > 0 && newQuantity > 0
      ? (newPrice / rollsPerCase / newQuantity).toFixed(2)
      : "0.00";

    updatedSizes[index] = {
      ...updatedSizes[index],
      price: newPrice,
      quantity_per_case: newQuantity,
      rolls_per_case: rollsPerCase,
      price_per_case: Number(PPC),
    };


    // Handle groupIds separately as it's an array
    // Handle groupIds separately as it's an array
    if (field === "groupIds") {
      updatedSizes[index] = {
        ...updatedSizes[index],
        [field]: value as string[], // Cast to string[]
      };
    } else {
      const parsedValue =
        typeof value === "string" &&
          field !== "size_value" &&
          field !== "size_unit" &&
          field !== "sku" &&
          field !== "image"
          ? Number.parseFloat(value) || 0
          : value;

      updatedSizes[index] = {
        ...updatedSizes[index],
        [field]: parsedValue,
      };
    }

    form.setValue("sizes", updatedSizes, {
      shouldValidate: true,
      shouldDirty: true,
    });

    form.trigger("sizes");
  };

  return (
    <Card className="border-0 shadow-none bg-gradient-to-br from-purple-50 to-blue-50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
            <Ruler className="h-4 w-4 text-white" />
          </div>
          Size Variations & Pricing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pass groups and setGroups to AddSizeForm so it can display the dropdown */}
        <AddSizeForm
          newSize={newSize}
          onSizeChange={setNewSize}
          onAddSize={handleAddSize}
          category={category}
          setNewSize={setNewSize}
        // You might need to pass `groups` and `loadingGroups` to `AddSizeForm` if it also needs to display the group dropdown
        />

        <FormField
          control={form.control}
          name="sizes"
          render={({ field }) => (
            <FormItem>
              <SizeList
                sizes={(field.value || []).map((size) => ({
                  ...size,
                  size_value: size.size_value || "",
                  sizeSquanence: size.sizeSquanence || 0,
                  size_unit: size.size_unit || categoryConfig.defaultUnit,
                  price: size.price || 0,
                  quantity_per_case: size?.quantity_per_case || 0,
                  stock: size.stock || 0,
                  groupIds: size.groupIds || [], // Ensure groupIds are initialized
                }))}
                onRemoveSize={handleRemoveSize}
                onUpdateSize={handleUpdateSize}
                category={category}
                setNewSize={setNewSize}
                form={form}
              />
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
      <ConfirmDialog
        open={confirmIndex !== null}
        message="This size will be permanently deleted. Are you sure?"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmIndex(null)}
      />

    </Card>
  );
};