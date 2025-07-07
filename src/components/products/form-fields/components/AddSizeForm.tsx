"use client"

import { FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, Package, DollarSign, Truck } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CATEGORY_CONFIGS } from "../../schemas/productSchema"
import type { NewSizeState } from "../../types/size.types"
import { Card, CardContent } from "@/components/ui/card"

interface AddSizeFormProps {
  newSize: NewSizeState
  onSizeChange: (newSize: NewSizeState) => void
  onAddSize: () => void
  setNewSize: (boolean) => void
  category: string
}

export const AddSizeForm = ({ newSize, onSizeChange, onAddSize, category }: AddSizeFormProps) => {
  const categoryConfig = CATEGORY_CONFIGS[category as keyof typeof CATEGORY_CONFIGS] || CATEGORY_CONFIGS.OTHER

  return (
    <Card className="border border-dashed border-purple-300 bg-white/50 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Size Value & Unit - Combined */}
          <div className="flex-1 min-w-[120px]">
            <FormLabel className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Size</FormLabel>
            <div className="flex gap-1">
              <Input
                type="text"
                value={newSize.size_value}
                onChange={(e) => onSizeChange({ ...newSize, size_value: e.target.value })}
                placeholder="500"
                className="h-9 text-sm"
              />
              <Select
                value={newSize.size_unit}
                onValueChange={(value) => onSizeChange({ ...newSize, size_unit: value })}
              >
                <SelectTrigger className="h-9 w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryConfig.sizeUnits.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* SKU */}
          <div className="flex-1 min-w-[100px]">
            <FormLabel className="text-xs font-semibold text-gray-600 uppercase tracking-wide">SKU</FormLabel>
            <Input
              type="text"
              value={newSize.sku}
              onChange={(e) => onSizeChange({ ...newSize, sku: e.target.value })}
              placeholder="SKU-001"
              className="h-9 text-sm font-mono"
            />
          </div>

          {/* Rolls per Case - Conditional */}
          {categoryConfig.hasRolls && (
            <div className="flex-1 min-w-[80px]">
              <FormLabel className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1">
                <Package className="h-3 w-3" />
                Rolls/CS
              </FormLabel>
              <Input
                type="number"
                value={newSize.rolls_per_case}
                onChange={(e) => onSizeChange({ ...newSize, rolls_per_case: e.target.value })}
                placeholder="18"
                className="h-9 text-sm"
              />
            </div>
          )}

          {/* Price per Unit */}
          <div className="flex-1 min-w-[90px]">
            <FormLabel className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              $/Unit
            </FormLabel>
            <Input
              type="number"
              value={newSize.pricePerCase}
              onChange={(e) => onSizeChange({ ...newSize, pricePerCase: e.target.value })}
              placeholder="0.00"
              step="0.01"
              className="h-9 text-sm"
            />
          </div>

          {/* Price per Case */}
          <div className="flex-1 min-w-[90px]">
            <FormLabel className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1">
              <Package className="h-3 w-3" />
              $/CS
            </FormLabel>
            <Input
              type="number"
              value={newSize.price}
              onChange={(e) => onSizeChange({ ...newSize, price: e.target.value })}
              placeholder="0.00"
              step="0.01"
              className="h-9 text-sm"
            />
          </div>

          {/* Shipping Cost */}
          <div className="flex-1 min-w-[90px]">
            <FormLabel className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1">
              <Truck className="h-3 w-3" />
              Ship/CS
            </FormLabel>
            <Input
              type="number"
              value={newSize.shipping_cost}
              onChange={(e) => onSizeChange({ ...newSize, shipping_cost: e.target.value })}
              placeholder="15.00"
              step="0.01"
              className="h-9 text-sm"
            />
          </div>

          {/* Add Button */}
          <Button
            type="button"
            onClick={onAddSize}
            className="h-9 px-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
