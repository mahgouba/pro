import React, { useRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface PickerItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface IOSVerticalPickerProps {
  items: PickerItem[];
  selectedValue?: string;
  onSelectionChange?: (value: string) => void;
  className?: string;
  itemHeight?: number;
  visibleItems?: number;
}

export default function IOSVerticalPicker({
  items,
  selectedValue,
  onSelectionChange,
  className,
  itemHeight = 60,
  visibleItems = 5,
}: IOSVerticalPickerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [centerIndex, setCenterIndex] = useState(0);

  const containerHeight = visibleItems * itemHeight;
  const totalHeight = items.length * itemHeight;

  // Find initial selected index
  useEffect(() => {
    if (selectedValue) {
      const index = items.findIndex(item => item.value === selectedValue);
      if (index !== -1) {
        setCenterIndex(index);
        scrollToIndex(index);
      }
    }
  }, [selectedValue, items]);

  const scrollToIndex = useCallback((index: number) => {
    if (!scrollRef.current) return;
    
    const targetScrollTop = index * itemHeight - (containerHeight - itemHeight) / 2;
    scrollRef.current.scrollTo({
      top: Math.max(0, Math.min(targetScrollTop, totalHeight - containerHeight)),
      behavior: 'smooth'
    });
  }, [itemHeight, containerHeight, totalHeight]);

  const updateCenterItem = useCallback(() => {
    if (!scrollRef.current) return;
    
    const scrollTop = scrollRef.current.scrollTop;
    const centerY = scrollTop + containerHeight / 2;
    const newCenterIndex = Math.round(centerY / itemHeight);
    const clampedIndex = Math.max(0, Math.min(newCenterIndex, items.length - 1));
    
    if (clampedIndex !== centerIndex) {
      setCenterIndex(clampedIndex);
      if (onSelectionChange && items[clampedIndex]) {
        onSelectionChange(items[clampedIndex].value);
      }
    }
  }, [centerIndex, containerHeight, itemHeight, items, onSelectionChange]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartY(e.touches[0].pageY);
    setScrollTop(scrollRef.current.scrollTop);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !scrollRef.current) return;
    
    const y = e.touches[0].pageY;
    const walk = (startY - y) * 1.5; // Touch scroll speed
    scrollRef.current.scrollTop = scrollTop + walk;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    // Snap to nearest item after drag ends
    setTimeout(() => {
      if (scrollRef.current) {
        const scrollTop = scrollRef.current.scrollTop;
        const centerY = scrollTop + containerHeight / 2;
        const nearestIndex = Math.round(centerY / itemHeight);
        const clampedIndex = Math.max(0, Math.min(nearestIndex, items.length - 1));
        scrollToIndex(clampedIndex);
      }
    }, 100);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartY(e.pageY);
    setScrollTop(scrollRef.current.scrollTop);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    
    const y = e.pageY;
    const walk = (startY - y) * 1.5;
    scrollRef.current.scrollTop = scrollTop + walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    // Snap to nearest item after drag ends
    setTimeout(() => {
      if (scrollRef.current) {
        const scrollTop = scrollRef.current.scrollTop;
        const centerY = scrollTop + containerHeight / 2;
        const nearestIndex = Math.round(centerY / itemHeight);
        const clampedIndex = Math.max(0, Math.min(nearestIndex, items.length - 1));
        scrollToIndex(clampedIndex);
      }
    }, 100);
  };

  const handleScroll = () => {
    if (!isDragging) {
      updateCenterItem();
    }
  };

  const handleItemClick = (index: number) => {
    setCenterIndex(index);
    scrollToIndex(index);
    if (onSelectionChange && items[index]) {
      onSelectionChange(items[index].value);
    }
  };

  const getItemOpacity = (index: number) => {
    const distance = Math.abs(index - centerIndex);
    if (distance === 0) return 1;
    if (distance === 1) return 0.7;
    if (distance === 2) return 0.4;
    return 0.2;
  };

  const getItemScale = (index: number) => {
    const distance = Math.abs(index - centerIndex);
    if (distance === 0) return 1;
    if (distance === 1) return 0.9;
    return 0.8;
  };

  return (
    <div className={cn("relative bg-white dark:bg-gray-900 rounded-lg overflow-hidden", className)}>
      {/* Selection bar overlay */}
      <div 
        className="absolute left-0 right-0 z-10 pointer-events-none border-t-2 border-b-2 border-blue-500 bg-blue-50/30 dark:bg-blue-500/10"
        style={{
          top: (containerHeight - itemHeight) / 2,
          height: itemHeight,
        }}
      />
      
      {/* Gradient overlays for fade effect */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white via-white/80 to-transparent dark:from-gray-900 dark:via-gray-900/80 dark:to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-gray-900 dark:via-gray-900/80 dark:to-transparent z-10 pointer-events-none" />
      
      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className="overflow-y-scroll scrollbar-none cursor-grab active:cursor-grabbing"
        style={{ height: containerHeight }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onScroll={handleScroll}
      >
        {/* Padding to center first and last items */}
        <div style={{ height: (containerHeight - itemHeight) / 2 }} />
        
        {items.map((item, index) => (
          <div
            key={item.value}
            className={cn(
              "flex items-center justify-center px-4 py-2 text-center transition-all duration-200 cursor-pointer",
              index === centerIndex 
                ? "text-blue-600 dark:text-blue-400 font-semibold" 
                : "text-gray-600 dark:text-gray-400"
            )}
            style={{
              height: itemHeight,
              opacity: getItemOpacity(index),
              transform: `scale(${getItemScale(index)})`,
            }}
            onClick={() => handleItemClick(index)}
          >
            <div className="flex items-center space-x-2 space-x-reverse">
              {item.icon && <span className="text-lg">{item.icon}</span>}
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          </div>
        ))}
        
        {/* Padding to center first and last items */}
        <div style={{ height: (containerHeight - itemHeight) / 2 }} />
      </div>
    </div>
  );
}