import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronRight, Eye, EyeOff } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface MultiSelectFilterProps {
  title: string;
  items: string[];
  selectedItems: string[];
  onSelectionChange: (newSelection: string[]) => void;
  toggleFilter: (filterArray: string[], setFilterArray: React.Dispatch<React.SetStateAction<string[]>>, value: string) => void;
  isVisible: boolean;
  onVisibilityChange: (visible: boolean) => void;
}

export default function MultiSelectFilter({
  title,
  items,
  selectedItems,
  onSelectionChange,
  toggleFilter,
  isVisible,
  onVisibilityChange
}: MultiSelectFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleItemToggle = (item: string) => {
    toggleFilter(selectedItems, onSelectionChange, item);
  };

  if (!isVisible) return null;

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 shadow-sm">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between p-4 h-auto hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <div className="flex items-center gap-3">
              <span className="font-medium text-slate-700 dark:text-slate-200">{title}</span>
              {selectedItems.length > 0 && (
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-2 py-1 rounded-full">
                  {selectedItems.length}
                </span>
              )}
            </div>
            {isExpanded ? (
              <ChevronDown size={16} className="text-slate-500" />
            ) : (
              <ChevronRight size={16} className="text-slate-500" />
            )}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4 pt-0 max-h-60 overflow-y-auto">
            <div className="space-y-3">
              {items.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-2">
                  لا توجد خيارات متاحة
                </p>
              ) : (
                items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-3 space-x-reverse">
                    <Checkbox
                      id={`${title}-${index}`}
                      checked={selectedItems.includes(item)}
                      onCheckedChange={() => handleItemToggle(item)}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <label
                      htmlFor={`${title}-${index}`}
                      className="text-sm text-slate-700 dark:text-slate-200 cursor-pointer flex-1 select-none"
                    >
                      {item}
                    </label>
                  </div>
                ))
              )}
            </div>

            {selectedItems.length > 0 && (
              <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-700">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectionChange([])}
                  className="w-full text-xs hover:bg-red-50 hover:border-red-300 hover:text-red-700 dark:hover:bg-red-900/20"
                >
                  مسح الاختيار
                </Button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}