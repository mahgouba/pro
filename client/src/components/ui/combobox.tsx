import * as React from "react"
import { Check, ChevronDown, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import * as PopoverPrimitive from "@radix-ui/react-popover"

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
  searchPlaceholder = "بحث...",
  emptyText = "لا توجد نتائج",
  className,
  disabled = false,
  showSearch = false,
  multi = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")

  React.useEffect(() => {
    if (!open) setQuery("")
  }, [open])

  const values = React.useMemo(() => {
    if (value === undefined || value === null || value === "") return []
    return Array.isArray(value) ? value : [value]
  }, [value])

  const selectedOptions = React.useMemo(
    () => options.filter((opt) => values.includes(opt.value)),
    [options, values]
  )

  const filteredOptions = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.secondaryLabel?.toLowerCase().includes(q) ?? false)
    )
  }, [options, query])

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

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onValueChange(multi ? [] : "")
  }

  const triggerLabel = (() => {
    if (selectedOptions.length === 0) return null
    if (multi && selectedOptions.length > 1) {
      return `${selectedOptions[0].label} (+${selectedOptions.length - 1})`
    }
    return selectedOptions[0].label
  })()

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-9 w-full justify-between bg-white border-slate-200 text-slate-900 hover:bg-slate-50 hover:text-slate-900 text-sm px-3 shadow-sm font-arabic rounded-md",
            open && "border-purple-500 ring-1 ring-purple-500",
            className
          )}
          disabled={disabled}
          data-testid="button-combobox-trigger"
        >
          <div
            className="flex items-center gap-2 truncate w-full text-right"
            dir="rtl"
          >
            {selectedOptions.length > 0 ? (
              <>
                {selectedOptions[0].logo && (
                  <img
                    src={selectedOptions[0].logo}
                    alt=""
                    className="w-4 h-4 object-contain flex-shrink-0"
                  />
                )}
                <span className="truncate">{triggerLabel}</span>
              </>
            ) : (
              <span className="text-slate-400 truncate">{placeholder}</span>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {selectedOptions.length > 0 && !disabled && (
              <span
                role="button"
                tabIndex={-1}
                onClick={handleClear}
                onPointerDown={(e) => e.stopPropagation()}
                className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
                data-testid="button-combobox-clear"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
            <ChevronDown className="h-4 w-4 text-slate-400 opacity-60" />
          </div>
        </Button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className="z-[100] bg-white border border-slate-200 shadow-lg rounded-md font-arabic overflow-hidden"
          align="start"
          side="bottom"
          sideOffset={4}
          dir="rtl"
          style={{ width: "var(--radix-popover-trigger-width)" }}
          onOpenAutoFocus={(e) => {
            if (!showSearch) e.preventDefault()
          }}
        >
          {showSearch && (
            <div
              className="flex items-center border-b border-slate-100 px-2"
              dir="rtl"
            >
              <Search className="h-4 w-4 text-slate-400 ml-2 flex-shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-9 w-full bg-transparent border-none focus:outline-none text-sm text-slate-900 placeholder:text-slate-400"
                data-testid="input-combobox-search"
              />
            </div>
          )}

          <div className="max-h-[260px] overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-sm text-slate-500 text-center">
                {emptyText}
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = values.includes(option.value)
                return (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      "w-full text-sm py-2 px-2 mb-0.5 rounded-sm cursor-pointer flex items-center justify-between gap-2 text-right",
                      isSelected
                        ? "bg-purple-50 text-purple-900"
                        : "text-slate-700 hover:bg-slate-100"
                    )}
                    data-testid={`option-combobox-${option.value}`}
                  >
                    <div className="flex items-center gap-2 truncate min-w-0">
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
                    {isSelected && (
                      <Check className="h-4 w-4 flex-shrink-0 text-purple-600" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
