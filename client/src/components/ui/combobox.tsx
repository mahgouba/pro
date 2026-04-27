import * as React from "react"
import { Check, ChevronDown, ChevronUp, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

interface ComboboxProps {
  options: { label: string; value: string; logo?: string; secondaryLabel?: string }[]
  value?: string | string[]
  onValueChange: (value: any) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
  showSearch?: boolean
  multi?: boolean
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "اختر...",
  searchPlaceholder = "بحث...",
  emptyText = "لا توجد نتائج",
  className,
  disabled = false,
  showSearch = false, // Default to false for Listbox style
  multi = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const values = React.useMemo(() => {
    if (!value) return []
    return Array.isArray(value) ? value : [value]
  }, [value])

  const selectedOptions = options.filter((opt) => values.includes(opt.value))

  const handleSelect = (optionValue: string) => {
    if (multi) {
      const newValues = values.includes(optionValue)
        ? values.filter((v) => v !== optionValue)
        : [...values, optionValue]
      onValueChange(newValues)
    } else {
      onValueChange(optionValue)
      setOpen(false)
    }
  }

  const handleRemove = (e: React.MouseEvent, optionValue: string) => {
    e.stopPropagation()
    if (multi) {
      onValueChange(values.filter((v) => v !== optionValue))
    } else {
      onValueChange("")
    }
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-8 w-full justify-between bg-white border-slate-200 text-slate-900 hover:bg-slate-50 hover:text-slate-900 text-xs px-2 shadow-sm transition-all font-arabic rounded-md",
            open && "border-purple-500 ring-1 ring-purple-500",
            className
          )}
          disabled={disabled}
        >
          <div className="flex items-center gap-1.5 truncate w-full text-right" dir="rtl">
            {selectedOptions.length > 0 ? (
              <div className="flex items-center gap-1.5 truncate">
                {selectedOptions[0].logo && (
                  <img src={selectedOptions[0].logo} alt="" className="w-3.5 h-3.5 object-contain" />
                )}
                <span className="truncate">
                  {multi 
                    ? `${selectedOptions[0].label}${selectedOptions.length > 1 ? ` (+${selectedOptions.length - 1})` : ''}`
                    : selectedOptions[0].label
                  }
                </span>
              </div>
            ) : (
              <span className="text-slate-400">{placeholder}</span>
            )}
          </div>
          <ChevronDown className="h-3 w-3 text-slate-400 opacity-50 shrink-0" />
        </Button>
      </PopoverPrimitive.Trigger>
      
      <PopoverPrimitive.Content 
          className="p-1 z-[100] bg-white border border-slate-200 shadow-lg rounded-md animate-in fade-in-0 zoom-in-95 font-arabic w-full min-w-[200px]" 
          align="start"
          side="top"
          sideOffset={-40} // Overlaps the trigger (trigger height is approx 40px)
          dir="rtl"
          style={{ width: 'var(--radix-popover-trigger-width)' }}
        >
        <Command className="bg-transparent text-slate-900 w-full border-none" dir="rtl">
          {showSearch && (
            <div className="flex items-center border-b border-slate-100 px-2" dir="rtl">
              <Search className="h-3.5 w-3.5 shrink-0 text-slate-400 ml-2" />
              <CommandInput 
                placeholder={searchPlaceholder} 
                className="h-8 w-full bg-transparent border-none focus:ring-0 text-xs text-slate-900 placeholder:text-slate-400" 
              />
            </div>
          )}
          <CommandList className="max-h-[300px] w-full scrollbar-hide border-none">
            <CommandEmpty className="py-4 text-xs text-slate-500 text-center">{emptyText}</CommandEmpty>
            <CommandGroup className="p-1">
              {options.map((option) => {
                const isSelected = values.includes(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => handleSelect(option.value)}
                    className={cn(
                      "text-xs py-1.5 px-2 mb-0.5 rounded-sm cursor-pointer transition-all flex items-center justify-between",
                      isSelected 
                        ? "bg-slate-100 text-slate-900" 
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {option.logo && (
                        <img src={option.logo} alt="" className="w-3.5 h-3.5 object-contain flex-shrink-0" />
                      )}
                      <span className="truncate">{option.label}</span>
                    </div>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 flex-shrink-0 text-purple-600 ml-2" />
                    )}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Root>
  )
}
