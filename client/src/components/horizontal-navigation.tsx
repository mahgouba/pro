import React, { useRef, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Package, 
  MessageSquare, 
  FileText, 
  Calendar, 
  ShoppingCart, 
  Calculator, 
  UserCheck, 
  MapPin, 
  CreditCard, 
  Building2, 
  Palette, 
  Image, 
  Users, 
  Building,
  Receipt,
  Settings,
  Landmark,
  LogOut,
  Percent,
  Database,
  Upload,

} from "lucide-react";
import { cn } from "@/lib/utils";
import { shouldShowNavItem, UserRole } from "@/utils/permissions";
import { useTheme } from "@/components/theme-provider";

interface HorizontalNavigationProps {
  userRole: string;
  onLogout?: () => void;
}

export default function HorizontalNavigation({ userRole, onLogout }: HorizontalNavigationProps) {
  const [location, setLocation] = useLocation();
  const { settings } = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [dragStartTime, setDragStartTime] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);
  const [centerItem, setCenterItem] = useState<any>(null);

  // Disable mouse drag - only touch drag allowed
  const handleMouseDown = (e: React.MouseEvent) => {
    // Disabled mouse drag functionality
    return;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Disabled mouse drag functionality
    return;
  };

  const handleMouseUp = () => {
    // Disabled mouse drag functionality
    return;
  };

  // Enhanced sound effects for different interactions
  const playSoundEffect = (type: 'drag' | 'snap' | 'select') => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Different sounds for different actions
      switch (type) {
        case 'drag':
          oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.08);
          gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);
          oscillator.stop(audioContext.currentTime + 0.08);
          break;
        case 'snap':
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.05);
          oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.12);
          gainNode.gain.setValueAtTime(0.12, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.12);
          oscillator.stop(audioContext.currentTime + 0.12);
          break;
        case 'select':
          oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(1400, audioContext.currentTime + 0.06);
          oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.15);
          gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
          oscillator.stop(audioContext.currentTime + 0.15);
          break;
      }
      
      oscillator.start(audioContext.currentTime);
    } catch (error) {
      console.log('Audio not supported or blocked');
    }
  };

  // Touch drag handlers with magnetic center stop and sound
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!scrollRef.current) return;
    setDragStartTime(Date.now());
    setHasMoved(false);
    setStartX(e.touches[0].pageY - scrollRef.current.getBoundingClientRect().top); // Using Y coordinate for vertical
    setScrollLeft(scrollRef.current.scrollTop); // Using scrollTop for vertical
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!scrollRef.current) return;
    const y = e.touches[0].pageY - scrollRef.current.getBoundingClientRect().top;
    const distance = Math.abs(y - startX); // Using startX for Y coordinate
    
    // Only start dragging if moved more than 8px for more stable movement
    if (distance > 8) {
      if (!isDragging) {
        setIsDragging(true);
        playSoundEffect('drag'); // Play drag sound when starting
      }
      setHasMoved(true);
      
      // More stable vertical scrolling with damping
      const walk = (y - startX) * 0.8; // Reduced multiplier for stability
      const newScrollTop = scrollLeft - walk; // Using scrollLeft for Y position
      
      // Constrain scrolling within bounds for stability
      const maxScrollTop = scrollRef.current.scrollHeight - scrollRef.current.clientHeight;
      const constrainedScrollTop = Math.max(0, Math.min(newScrollTop, maxScrollTop));
      
      // Apply smooth scrolling without abrupt transitions
      scrollRef.current.style.scrollBehavior = 'auto';
      scrollRef.current.scrollTop = constrainedScrollTop;
      
      // Play periodic drag sounds for feedback
      if (Math.abs(constrainedScrollTop - scrollRef.current.scrollTop) > 20) {
        playSoundEffect('drag');
      }
    }
  };

  const handleTouchEnd = () => {
    // Add stable deceleration with momentum for vertical scrolling
    if (scrollRef.current && hasMoved) {
      scrollRef.current.style.scrollBehavior = 'smooth';
      scrollRef.current.style.transition = 'scroll-top 0.3s cubic-bezier(0.23, 1, 0.32, 1)';
      playSoundEffect('snap'); // Play snap sound when touch ends
    }
    handleDragEnd();
  };

  // Magnetic snap to center function
  const snapToCenter = () => {
    if (!scrollRef.current) return;
    
    const container = scrollRef.current;
    const containerCenter = container.offsetWidth / 2;
    const buttons = container.querySelectorAll('button');
    
    let closestButton = null;
    let closestDistance = Infinity;
    let closestIndex = 0;
    
    buttons.forEach((button, index) => {
      const buttonRect = button.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const buttonCenter = buttonRect.left - containerRect.left + buttonRect.width / 2 - container.scrollLeft;
      const distance = Math.abs(buttonCenter - containerCenter);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestButton = allItems[index];
        closestIndex = index;
      }
    });
    
    // Magnetic snap when close to center (within 50px)
    if (closestDistance < 50 && closestButton) {
      const button = buttons[closestIndex] as HTMLElement;
      const buttonRect = button.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const buttonCenter = buttonRect.left - containerRect.left + buttonRect.width / 2;
      const targetScrollLeft = container.scrollLeft + (buttonCenter - containerCenter);
      
      // Stable smooth scroll to center with enhanced sound
      playSoundEffect('snap');
      container.style.scrollBehavior = 'smooth';
      container.style.transition = 'scroll-left 0.25s cubic-bezier(0.23, 1, 0.32, 1)';
      container.scrollTo({
        left: targetScrollLeft,
        behavior: 'smooth'
      });
      
      setCenterItem(closestButton);
    }
  };

  // Stable drag end with enhanced feedback
  const handleDragEnd = () => {
    // Reset transition for stability
    if (scrollRef.current) {
      scrollRef.current.style.scrollBehavior = 'smooth';
    }
    
    setTimeout(() => {
      setIsDragging(false);
      setHasMoved(false);
      setCenterItem(null);
    }, 50);
  };

  // Cleanup mouse events
  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging || !scrollRef.current) return;
      e.preventDefault();
      const x = e.pageX - scrollRef.current.offsetLeft;
      const walk = (x - startX) * 2;
      scrollRef.current.scrollLeft = scrollLeft - walk;
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, startX, scrollLeft]);

  const menuItems = [
    { 
      title: "الرئيسية", 
      href: "/card-view", 
      icon: LayoutDashboard,
      internal: false,
      permission: "inventory"
    },
    { 
      title: "المخزون", 
      href: "/inventory", 
      icon: Package,
      internal: true,
      permission: "cardView"
    },
    { 
      title: "عرض سعر", 
      href: "/quotation-creation", 
      icon: MessageSquare,
      internal: true,
      permission: "quotationCreation"
    },
    { 
      title: "الحجوزات", 
      href: "/reservations", 
      icon: Calendar,
      internal: true,
      permission: "reservations"
    },
    { 
      title: "المبيعات", 
      href: "/sold-vehicles", 
      icon: ShoppingCart,
      internal: true,
      permission: "soldVehicles"
    },
    { 
      title: "التمويل", 
      href: "/financing-calculator", 
      icon: Calculator,
      internal: true,
      permission: "financingCalculator"
    },

    { 
      title: "إدارة الحضور والإنصراف", 
      href: "/attendance-management", 
      icon: UserCheck,
      internal: true,
      permission: "attendanceManagement"
    },


    
    // External pages (will navigate away)
    { 
      title: "بطاقات الأسعار", 
      href: "/price-cards", 
      icon: Receipt,
      internal: true,
      permission: "priceCards"
    },
    { 
      title: "البنوك الشخصية", 
      href: "/banks-personal", 
      icon: CreditCard,
      internal: false,
      permission: "bankManagement"
    },
    { 
      title: "بنوك الشركة", 
      href: "/banks-company", 
      icon: Building2,
      internal: false,
      permission: "bankManagement"
    }
  ];

  const adminItems = [


    { 
      title: "المستخدمين", 
      href: "/user-management", 
      icon: Users,
      internal: true,
      permission: "userManagement"
    },
    { 
      title: "إدارة النسب", 
      href: "/bank-management", 
      icon: Landmark,
      internal: true,
      permission: "bankManagement"
    },
    { 
      title: "نسب التمويل", 
      href: "/financing-rates", 
      icon: Percent,
      internal: true,
      permission: "admin"
    },
    { 
      title: "قاعدة البيانات", 
      href: "/database-management", 
      icon: Database,
      internal: true,
      permission: "admin"
    },
    { 
      title: "المواصفات والصور", 
      href: "/specifications-management", 
      icon: Settings,
      internal: true,
      permission: "admin"
    },
    { 
      title: "إعدادات المظهر", 
      href: "/appearance-settings", 
      icon: Palette,
      internal: true,
      permission: "admin"
    },
    { 
      title: "إدارة القوائم المنسدلة", 
      href: "/dropdown-options-management", 
      icon: Settings,
      internal: true,
      permission: "admin"
    },




  ];

  // System items (available for all users)
  const systemItems = [
    { 
      title: "تسجيل الخروج", 
      href: "#", 
      icon: LogOut,
      internal: true,
      isLogout: true
    }
  ];

  // Filter items based on user permissions
  const filteredMenuItems = menuItems.filter(item => {
    if (!item.permission) return true; // Show items without permission requirements
    if (item.permission === "admin") return userRole === "admin";
    return shouldShowNavItem(userRole as UserRole, item.permission);
  });

  const filteredAdminItems = adminItems.filter(item => {
    if (!item.permission) return true;
    if (item.permission === "admin") return userRole === "admin";
    return shouldShowNavItem(userRole as UserRole, item.permission);
  });

  const allItems = [...filteredMenuItems, ...filteredAdminItems, ...systemItems];

  const isActive = (href: string) => location === href;

  const handleNavigation = (item: any) => {
    // Prevent navigation if user was dragging
    if (hasMoved || isDragging) {
      return;
    }
    
    // Play selection sound
    playSoundEffect('select');
    
    // Handle logout
    if (item.isLogout && onLogout) {
      onLogout();
      return;
    }
    
    if (item.internal) {
      // For internal pages, just update the URL without navigating away
      setLocation(item.href);
    } else {
      // For external pages (banks, cards), navigate normally
      window.location.href = item.href;
    }
  };

  return (
    <div className="fixed top-0 right-0 z-50 w-16 h-screen bg-gradient-to-b from-white/15 via-white/10 to-white/5 backdrop-blur-2xl border-l border-white/30 shadow-2xl overflow-hidden sidebar-glass-container">
      {/* Header Section */}
      <div className="p-3 border-b border-white/20 flex items-center justify-center">
        <img 
          src={settings?.companyLogo || "/copmany logo.svg"} 
          alt={settings?.companyName || "شعار الشركة"} 
          className="w-10 h-10 object-contain filter brightness-125 hover:brightness-150 transition-all duration-300"
        />
      </div>



      {/* Navigation Items */}
      <div className="flex-1 p-2 h-full">
        <div 
          ref={scrollRef}
          className="flex flex-col items-center space-y-3 h-full overflow-y-auto scrollbar-none"
          style={{ 
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            height: 'calc(100vh - 120px)' // Full height minus header and padding
          }}
        >
          {allItems.map((item, index) => {
            const active = isActive(item.href);
            return (
              <div
                key={index}
                onClick={() => handleNavigation(item)}
                className={cn(
                  "group relative w-12 h-12 cursor-pointer flex-shrink-0",
                  "flex flex-col items-center justify-center",
                  active 
                    ? "text-[#C79C45]" 
                    : "text-white/70 hover:text-[#C79C45]"
                )}
                title={item.title}
              >
                {/* Icon */}
                <item.icon 
                  size={18} 
                  className={cn(
                    "mb-1",
                    active 
                      ? "text-[#C79C45] drop-shadow-lg" 
                      : "text-white/70 hover:text-[#C79C45]"
                  )} 
                />
                
                {/* Label */}
                <span className={cn(
                  "text-[7px] text-center leading-tight font-medium",
                  active 
                    ? "text-[#C79C45] font-bold" 
                    : "text-white/70 hover:text-[#C79C45]"
                )}>
                  {item.title.split(' ')[0]}
                </span>

                {/* Active Indicator */}
                {active && (
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-[#C79C45] to-[#B8862F] rounded-full shadow-lg"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Glow */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-blue-500/10 to-transparent pointer-events-none"></div>
    </div>
  );
}