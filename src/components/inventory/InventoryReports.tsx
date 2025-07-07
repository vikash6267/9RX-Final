import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InventoryItem } from "@/hooks/use-inventory-tracking";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, ChevronUp } from "lucide-react";

interface InventoryReportsProps {
  inventoryData: InventoryItem[];
}

export const InventoryReports = ({ inventoryData }: InventoryReportsProps) => {
  const [products, setProducts] = useState([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data: productsData, error } = await supabase
          .from("products")
          .select("*, product_sizes(*)");

        if (error) {
          throw error;
        }

        const mappedProducts = productsData.map((item) => ({
          id: item.id,
          name: item.name,
          sku: item.sku,
          customization: {
            allowed: item.customization?.allowed || false,
            options: item.customization?.options || [],
            basePrice: item.customization?.price || 0,
          },
          sizes: item.product_sizes?.map((size) => ({
            size_value: size.size_value,
            size_unit: size.size_unit,
            price: size.price,
            sku: size.sku || "",
            quantity_per_case: size.quantity_per_case,
            stock: size.stock,
          })),
        }));

        setProducts(mappedProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, []);

  return (
    <Card className="transition-all duration-300 hover:shadow-lg border border-gray-200 rounded-lg">
      <CardHeader className="bg-gray-100 rounded-t-lg px-6 py-4 border-b">
        <CardTitle className="text-lg font-semibold text-gray-800">
          Inventory Reports
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[450px] rounded-md border bg-white">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 bg-gray-100 text-gray-700 border-b shadow-sm">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Product Name</th>
                  <th className="px-5 py-3 text-left font-medium">SKU</th>
                  <th className="px-5 py-3 text-left font-medium">Total Sizes</th>
                  <th className="px-5 py-3 text-left font-medium">Expand</th>
                </tr>
              </thead>
              <tbody>
                {products.map((item, index) => (
                  <>
                    <tr
                      key={item.id}
                      className={`border-b ${
                        index % 2 === 0 ? "bg-gray-50" : "bg-white"
                      } hover:bg-gray-100 transition-colors`}
                    >
                      <td className="px-5 py-4 font-medium">{item.name}</td>
                      <td className="px-5 py-4">{item.sku}</td>
                      <td className="px-5 py-4 text-center">{item.sizes.length}</td>
                      <td
                        className="px-5 py-4 text-center cursor-pointer hover:text-blue-600 transition"
                        onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                      >
                        {expanded === item.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </td>
                    </tr>
                    {expanded === item.id && (
                      <tr>
                        <td colSpan={4} className="px-5 py-4 bg-gray-50">
                          <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                            <h4 className="font-semibold text-gray-700 mb-2">Size Details</h4>
                            <ul className="space-y-3">
                              {item.sizes.map((size, index) => (
                                <li key={index} className="flex justify-between p-3 border rounded-lg bg-gray-50 shadow-sm">
                                  <span className="font-medium text-gray-700">
                                    {size.size_value} {size.size_unit.toUpperCase()}
                                  </span>
                                  <span className="text-gray-600">Stock: {size.stock}</span>
                                  <span className="text-gray-600">Price: ${size.price}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
