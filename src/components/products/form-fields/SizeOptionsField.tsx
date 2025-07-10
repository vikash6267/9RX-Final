"use client"

import { FormField, FormItem, FormMessage } from "@/components/ui/form"
import { CATEGORY_CONFIGS } from "../schemas/productSchema"
import { useState } from "react"
import { toast } from "@/hooks/use-toast"
import { AddSizeForm } from "./components/AddSizeForm"
import { SizeList } from "./components/SizeList"
import type { SizeOptionsFieldProps, NewSizeState } from "../types/size.types"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Ruler } from "lucide-react"

export const SizeOptionsField = ({ form, isEditing }: SizeOptionsFieldProps) => {
  const category = form.watch("category")
  const categoryConfig = CATEGORY_CONFIGS[category as keyof typeof CATEGORY_CONFIGS] || CATEGORY_CONFIGS.OTHER

  const [newSize, setNewSize] = useState<NewSizeState>({
    size_value: "",
    size_unit: categoryConfig.defaultUnit,
    price: "",
    sku: "",
    pricePerCase: "",
    stock: "",
    price_per_case: "",
    quantity_per_case: "100",
    rolls_per_case: "",
    shipping_cost: "0",
    image: "",
    sizeSquanence: "",
      unit: false, // default selected
  case: true,
  })

  const handleAddSize = () => {
    if (!newSize.size_value || !newSize.price) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required size fields",
        variant: "destructive",
      })
      return
    }

    const currentSizes = form.getValues("sizes") || []
    const PPC = (Number.parseFloat(newSize.price) / Number.parseFloat(newSize.quantity_per_case || "1")).toFixed(2)

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
    } as const

    if (!sizeToAdd.size_value || !sizeToAdd.size_unit) {
      toast({
        title: "Validation Error",
        description: "Size value and unit are required",
        variant: "destructive",
      })
      return
    }

    form.setValue("sizes", [...currentSizes, sizeToAdd], {
      shouldValidate: true,
      shouldDirty: true,
    })

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
    })

    toast({
      title: "Size Added",
      description: "New size variation has been added successfully.",
    })
  }

  const handleRemoveSize = async (index: number) => {
    const currentSizes = form.getValues("sizes") || []
    const newSizes = [...currentSizes]
    const removedSize = newSizes[index]

    newSizes.splice(index, 1)
    form.setValue("sizes", newSizes, {
      shouldValidate: true,
      shouldDirty: true,
    })

    if (isEditing && removedSize?.id) {
      const { error: deleteError } = await supabase.from("product_sizes").delete().eq("id", removedSize.id)

      if (deleteError) {
        console.error("Error removing size:", deleteError)
        toast({
          title: "Error",
          description: "Failed to remove size.",
        })
        return
      }
    }

    toast({
      title: "Size Removed",
      description: "Size variation has been removed.",
    })
  }

  const handleUpdateSize = (index: number, field: string, value: string | number) => {
    const currentSizes = form.getValues("sizes") || []
    const updatedSizes = [...currentSizes]

    if (field === "price" || field === "quantity_per_case") {
      const newPrice = field === "price" ? Number.parseFloat(value as string) : updatedSizes[index].price
      const newQuantity =
        field === "quantity_per_case" ? Number.parseFloat(value as string) : updatedSizes[index].quantity_per_case

      const PPC = newQuantity > 0 ? (newPrice / newQuantity).toFixed(2) : "0.00"

      updatedSizes[index] = {
        ...updatedSizes[index],
        price_per_case: Number(PPC),
      }
    }

    const parsedValue =
      typeof value === "string" &&
      field !== "size_value" &&
      field !== "size_unit" &&
      field !== "sku" &&
      field !== "image"
        ? Number.parseFloat(value) || 0
        : value

    updatedSizes[index] = {
      ...updatedSizes[index],
      [field]: parsedValue,
    }

    form.setValue("sizes", updatedSizes, {
      shouldValidate: true,
      shouldDirty: true,
    })

    form.trigger("sizes")
  }

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
        <AddSizeForm
          newSize={newSize}
          onSizeChange={setNewSize}
          onAddSize={handleAddSize}
          category={category}
          setNewSize={setNewSize}
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
                }))}
                onRemoveSize={handleRemoveSize}
                onUpdateSize={handleUpdateSize}
                category={category}
                setNewSize={setNewSize}
              />
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  )
}
