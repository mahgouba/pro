import { getManufacturerLogo } from "@shared/manufacturer-logos";
import { Building2 } from "lucide-react";

interface ManufacturerLogoProps {
  manufacturerName: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  showFallback?: boolean;
  customLogo?: string; // Base64 or URL for uploaded logo
}

const sizeClasses = {
  sm: "w-6 h-6",
  md: "w-8 h-8", 
  lg: "w-12 h-12"
};

export function ManufacturerLogo({ 
  manufacturerName, 
  className = "", 
  size = "md", 
  showFallback = true,
  customLogo
}: ManufacturerLogoProps) {
  // Check if manufacturerName is valid
  if (!manufacturerName || typeof manufacturerName !== 'string') {
    if (showFallback) {
      return (
        <div className={`${sizeClasses[size]} ${className} flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-md`}>
          <Building2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        </div>
      );
    }
    return null;
  }

  // Prioritize custom uploaded logo over static logo
  const logoPath = customLogo || getManufacturerLogo(manufacturerName);
  
  if (logoPath) {
    return (
      <div className={`${sizeClasses[size]} ${className} flex items-center justify-center relative`}>
        <img
          src={logoPath}
          alt={`شعار ${manufacturerName}`}
          className="object-contain w-full h-full"
          style={{
            filter: manufacturerName.includes('جي إم سي') || manufacturerName.includes('GMC') 
              ? 'brightness(0) saturate(100%) invert(59%) sepia(11%) saturate(200%) hue-rotate(356deg) brightness(99%) contrast(83%)'
              : 'none'
          }}
          onError={(e) => {
            console.log(`Failed to load logo for: ${manufacturerName} at path: ${logoPath}`);
            // Fallback to icon if image fails to load
            if (showFallback) {
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
              if (fallback) {
                fallback.style.display = 'flex';
              }
            }
          }}
        />
        {showFallback && (
          <div className="hidden absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-md">
            <Building2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </div>
        )}
      </div>
    );
  }

  // Fallback icon when no logo is available
  if (showFallback) {
    return (
      <div className={`${sizeClasses[size]} ${className} flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-md`}>
        <Building2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
      </div>
    );
  }

  return null;
}