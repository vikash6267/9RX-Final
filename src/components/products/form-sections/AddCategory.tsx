import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  open: boolean;
  onOpenChange: (val: boolean) => void;
  onAddSuccess?: () => void;
}

const DEFAULT_UNITS = ["unit", "OZ", "mm", "mL", "cc", "inch", "gram", "dram", "ROLL"];

const CategoryAddDialog: React.FC<Props> = ({ open, onOpenChange, onAddSuccess }) => {
  const [categoryName, setCategoryName] = useState('');
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [defaultUnit, setDefaultUnit] = useState('');
  const [hasRolls, setHasRolls] = useState(false);
  const [requiresCase, setRequiresCase] = useState(false);
  const [customUnit, setCustomUnit] = useState('');
  const [loading, setLoading] = useState(false);

  const addCustomUnit = () => {
    if (customUnit && !selectedUnits.includes(customUnit)) {
      setSelectedUnits([...selectedUnits, customUnit]);
      setCustomUnit('');
    }
  };

  const toggleUnit = (unit: string) => {
    setSelectedUnits(prev =>
      prev.includes(unit) ? prev.filter(u => u !== unit) : [...prev, unit]
    );
  };

  const handleSubmit = async () => {
    if (!categoryName || selectedUnits.length === 0 || !defaultUnit) {
      toast.error('All fields are required');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('category_configs').insert({
      category_name: categoryName,
      size_units: selectedUnits,
      default_unit: defaultUnit,
      has_rolls: hasRolls,
      requires_case: requiresCase,
    });
    setLoading(false);
    if (error) return toast.error('Failed to add category');

    toast.success('Category added');
    setCategoryName('');
    setSelectedUnits([]);
    setDefaultUnit('');
    setHasRolls(false);
    setRequiresCase(false);
    onOpenChange(false);
    onAddSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Product Category</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Category Name"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
          />

          <div>
            <Label className="block mb-2">Select Size Units</Label>
            <ScrollArea className="h-32 border rounded p-2">
              <div className="grid grid-cols-2 gap-2">
                {DEFAULT_UNITS.map(unit => (
                  <div key={unit} className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedUnits.includes(unit)}
                      onCheckedChange={() => toggleUnit(unit)}
                      id={unit}
                    />
                    <Label htmlFor={unit}>{unit}</Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="flex items-center space-x-2 mt-2">
              <Input
                placeholder="Add new unit"
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value)}
              />
              <Button type="button" onClick={addCustomUnit}>Add</Button>
            </div>
          </div>

          <div>
            <Label className="block mb-2">Default Unit</Label>
            <Select value={defaultUnit} onValueChange={setDefaultUnit}>
              <SelectTrigger>
                <SelectValue placeholder="Select default unit" />
              </SelectTrigger>
              <SelectContent>
                {selectedUnits.map(unit => (
                  <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox id="rolls" checked={hasRolls} onCheckedChange={() => setHasRolls(!hasRolls)} />
            <Label htmlFor="rolls">Has Rolls</Label>

            <Checkbox id="case" checked={requiresCase} onCheckedChange={() => setRequiresCase(!requiresCase)} />
            <Label htmlFor="case">Requires Case</Label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Adding...' : 'Add Category'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryAddDialog;
