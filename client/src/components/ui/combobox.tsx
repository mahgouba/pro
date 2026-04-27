import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface ComboboxOption {
  label: string
  value: string
  logo?: string
  secondaryLabel?: string
}

interface ComboboxProps {
  options: ComboboxOption[]
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
  emptyText = "لا توجد نتائج",
  className,
  disabled = false,
}: ComboboxProps) {
  const currentValue = Array.isArray(value) ? value[0] ?? "" : value ?? ""

  return (
    <Select
      value={currentValue || undefined}
      onValueChange={(v) => onValueChange(v)}
      disabled={disabled}
    >
      <SelectTrigger className={cn("font-arabic", className)} dir="rtl">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent dir="rtl">
        {options.length === 0 ? (
          <div className="py-6 text-sm text-slate-500 text-center font-arabic">
            {emptyText}
          </div>
        ) : (
          options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                {option.logo && (
                  <img
                    src={option.logo}
                    alt=""
                    className="w-4 h-4 object-contain flex-shrink-0"
                  />
                )}
                <span className="truncate">{option.label}</span>
                {option.secondaryLabel && (
                  <span className="text-xs text-slate-400 truncate">
                    {option.secondaryLabel}
                  </span>
                )}
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  )
}
