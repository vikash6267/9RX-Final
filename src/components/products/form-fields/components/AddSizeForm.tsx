"use client"

import { FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, Package, DollarSign, Truck, CheckSquare } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CATEGORY_CONFIGS } from "@/App";
import type { NewSizeState } from "../../types/size.types"
import { Card, CardContent } from "@/components/ui/card"

interface AddSizeFormProps {
  newSize: NewSizeState
  onSizeChange: (newSize: NewSizeState) => void
  onAddSize: () => void
  setNewSize: (boolean) => void
  category: string
}

export const AddSizeForm = ({
  newSize,
  onSizeChange,
  onAddSize,
  category,
}: AddSizeFormProps) => {
  const categoryConfig =
    CATEGORY_CONFIGS[category as keyof typeof CATEGORY_CONFIGS] ||
    CATEGORY_CONFIGS.OTHER

  return (
  <Card className="border border-dashed border-purple-300 bg-white/50 backdrop-blur-sm">
    <CardContent className="p-4">
      <div className="flex flex-col gap-4">

    {/* ➤ Size and Unit in one row */}
<div className="flex gap-2 items-end">
  <div className="w-3/4">
    <FormLabel className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
      Size
    </FormLabel>
    <Input
      type="text"
      value={newSize.size_value}
      onChange={(e) =>
        onSizeChange({ ...newSize, size_value: e.target.value })
      }
      placeholder="500"
      className="h-9 text-sm"
    />
  </div>

  <div className="w-1/4">
    <FormLabel className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
      Unit
    </FormLabel>
    <Select
      value={newSize.size_unit}
      onValueChange={(value) =>
        onSizeChange({ ...newSize, size_unit: value })
      }
    >
      <SelectTrigger className="h-9 w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {categoryConfig?.sizeUnits.map((unit) => (
          <SelectItem key={unit} value={unit} className="uppercase">
            {unit}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
</div>


        {/* ➤ All other fields in grid layout */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* SKU */}
          <div>
            <FormLabel className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              SKU
            </FormLabel>
            <Input
              type="text"
              value={newSize.sku}
              onChange={(e) =>
                onSizeChange({ ...newSize, sku: e.target.value })
              }
              placeholder="SKU-001"
              className="h-9 text-sm font-mono"
            />
          </div>

          {/* Rolls per Case */}
          {categoryConfig?.hasRolls && (
            <div>
              <FormLabel className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1">
                <Package className="h-3 w-3" />
                Rolls/CS
              </FormLabel>
              <Input
                type="number"
                value={newSize.rolls_per_case}
                onChange={(e) =>
                  onSizeChange({
                    ...newSize,
                    rolls_per_case: e.target.value,
                  })
                }
                placeholder="18"
                className="h-9 text-sm"
              />
            </div>
          )}

          {/* Price Per Unit */}
          <div>
            <FormLabel className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              $/Unit
            </FormLabel>
            <Input
              type="number"
              value={newSize.pricePerCase}
              onChange={(e) =>
                onSizeChange({ ...newSize, pricePerCase: e.target.value })
              }
              placeholder="0.00"
              step="0.01"
              className="h-9 text-sm"
            />
          </div>

          {/* Price Per Case */}
          <div>
            <FormLabel className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1">
              <Package className="h-3 w-3" />
              $/CS
            </FormLabel>
            <Input
              type="number"
              value={newSize.price}
              onChange={(e) =>
                onSizeChange({ ...newSize, price: e.target.value })
              }
              placeholder="0.00"
              step="0.01"
              className="h-9 text-sm"
            />
          </div>

          {/* Shipping Cost */}
          <div>
            <FormLabel className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1">
              <Truck className="h-3 w-3" />
              Ship/CS
            </FormLabel>
            <Input
              type="number"
              value={newSize.shipping_cost}
              onChange={(e) =>
                onSizeChange({ ...newSize, shipping_cost: e.target.value })
              }
              placeholder="15.00"
              step="0.01"
              className="h-9 text-sm"
            />
          </div>

          {/* Sell Type */}
          <div>
            <FormLabel className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex gap-1">
              <CheckSquare className="h-3 w-3" />
              Sell Type
            </FormLabel>
            <div className="flex flex-col gap-1 text-xs text-gray-700 mt-1">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newSize.unit}
                  onChange={(e) =>
                    onSizeChange({ ...newSize, unit: e.target.checked })
                  }
                />
                Unit
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newSize.case}
                  onChange={(e) =>
                    onSizeChange({ ...newSize, case: e.target.checked })
                  }
                />
                Case
              </label>
            </div>
          </div>

          {/* Add Button */}
          <div className="flex items-end">
            <Button
              type="button"
              onClick={onAddSize}
              className="h-9 px-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
)

}
