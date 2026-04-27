import React, { createContext, useContext, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface ThemeSettings {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  themeStyle?: string;
  darkModeEnabled?: boolean;
  companyLogo?: string;
  companyName?: string;
  companyNameEn?: string;
  systemIcon?: string;
  printHeader?: string;
  printFooter?: string;
}

const ThemeContext = createContext<{ settings: ThemeSettings | null }>({ settings: null });

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: settings } = useQuery<ThemeSettings>({
    queryKey: ["/api/appearance"],
  });

  useEffect(() => {
    if (settings) {
      const root = document.documentElement;
      
      // Apply colors if they exist
      if (settings.primaryColor) {
        root.style.setProperty("--theme-primary", settings.primaryColor);
        root.style.setProperty("--dynamic-primary", settings.primaryColor);
      }
      
      if (settings.secondaryColor) {
        root.style.setProperty("--theme-secondary", settings.secondaryColor);
        root.style.setProperty("--dynamic-secondary", settings.secondaryColor);
      }
      
      if (settings.accentColor) {
        root.style.setProperty("--theme-accent", settings.accentColor);
        root.style.setProperty("--dynamic-accent", settings.accentColor);
      }

      // Apply font family
      if (settings.fontFamily) {
        root.style.setProperty("--font-family-arabic", settings.fontFamily);
        document.body.style.fontFamily = `${settings.fontFamily}, sans-serif`;
      }

      // Apply system icon (favicon)
      if (settings.systemIcon) {
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = settings.systemIcon;
      }

      // Set data attribute for theme style
      if (settings.themeStyle) {
        root.setAttribute("data-theme-style", settings.themeStyle);
      }
    }
  }, [settings]);

  return (
    <ThemeContext.Provider value={{ settings: settings || null }}>
      {children}
    </ThemeContext.Provider>
  );
}
