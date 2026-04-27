import { useRef, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ScrollableFilterProps {
  title: string;
  items: string[];
  selectedItems: string[];
  onItemToggle: (item: string) => void;
  onClearSelection: () => void;
  className?: string;
}

export default function ScrollableFilter({
  title,
  items,
  selectedItems,
  onItemToggle,
  onClearSelection,
  className = ""
}: ScrollableFilterProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Check scroll indicators
  const checkScrollIndicators = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setShowLeftArrow(container.scrollLeft > 10);
    setShowRightArrow(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  };

  // Scroll functions for navigation buttons
  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let isDown = false;
    let startX: number;
    let scrollLeftPos: number;
    let hasMoved = false;

    const handleMouseDown = (e: MouseEvent) => {
      // Prevent dragging on buttons
      if ((e.target as HTMLElement).closest('button')) return;
      
      isDown = true;
      setIsDragging(true);
      container.classList.add('cursor-grabbing');
      container.style.userSelect = 'none';
      startX = e.pageX - container.offsetLeft;
      scrollLeftPos = container.scrollLeft;
      hasMoved = false;
    };

    const handleMouseLeave = () => {
      isDown = false;
      setIsDragging(false);
      container.classList.remove('cursor-grabbing');
      container.style.userSelect = '';
    };

    const handleMouseUp = () => {
      isDown = false;
      setIsDragging(false);
      container.classList.remove('cursor-grabbing');
      container.style.userSelect = '';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      hasMoved = true;
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 1.5; // More responsive scrolling
      container.scrollLeft = scrollLeftPos - walk;
    };

    // Touch events for mobile with improved sensitivity
    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].pageX - container.offsetLeft;
      scrollLeftPos = container.scrollLeft;
      setIsDragging(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const x = e.touches[0].pageX - container.offsetLeft;
      const walk = (x - startX) * 1.2; // Smooth mobile scrolling
      container.scrollLeft = scrollLeftPos - walk;
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    const handleScroll = () => {
      checkScrollIndicators();
    };

    // Click prevention for dragged items
    const handleClick = (e: MouseEvent) => {
      if (hasMoved) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('scroll', handleScroll);
    container.addEventListener('click', handleClick, true);

    // Initial check
    checkScrollIndicators();

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('click', handleClick, true);
    };
  }, []);

  // Resize observer for responsive scroll indicators
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      checkScrollIndicators();
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {title}
          </h3>
          {selectedItems.length > 0 && (
            <Badge variant="secondary" className="text-xs px-2 py-1">
              {selectedItems.length}
            </Badge>
          )}
        </div>
        {selectedItems.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-7 px-2 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            مسح الكل
          </Button>
        )}
      </div>
      
      <div className="relative group">
        {/* Left scroll arrow */}
        {showLeftArrow && (
          <Button
            size="sm"
            variant="outline"
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-white/90 hover:bg-white dark:bg-slate-800/90 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-600 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Right scroll arrow */}
        {showRightArrow && (
          <Button
            size="sm"
            variant="outline"
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-white/90 hover:bg-white dark:bg-slate-800/90 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-600 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        {/* Gradient fade indicators */}
        {showLeftArrow && (
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white via-white/50 to-transparent dark:from-slate-900 dark:via-slate-900/50 dark:to-transparent z-[5] pointer-events-none" />
        )}
        {showRightArrow && (
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white via-white/50 to-transparent dark:from-slate-900 dark:via-slate-900/50 dark:to-transparent z-[5] pointer-events-none" />
        )}

        <div 
          ref={scrollContainerRef}
          className={`flex gap-2 overflow-x-auto cursor-grab select-none scrollbar-hide transition-all duration-200 ${
            isDragging ? 'cursor-grabbing' : ''
          }`}
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            scrollBehavior: isDragging ? 'auto' : 'smooth'
          } as React.CSSProperties}
        >
          {items.map((item, index) => {
            const isSelected = selectedItems.includes(item);
            return (
              <Button
                key={index}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={(e) => {
                  // Prevent click during drag
                  if (isDragging) {
                    e.preventDefault();
                    return;
                  }
                  onItemToggle(item);
                }}
                className={`
                  flex-shrink-0 h-8 px-3 text-xs whitespace-nowrap transition-all duration-200 relative
                  ${isSelected 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-md transform scale-[1.02]' 
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-600'
                  }
                  hover:scale-105 active:scale-95 hover:shadow-md
                  ${isDragging ? 'pointer-events-none' : ''}
                `}
              >
                {item}
                {isSelected && (
                  <div className="absolute -top-1 -right-1 h-2 w-2 bg-blue-400 rounded-full animate-pulse" />
                )}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}