import React, { createContext, useContext, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface ThemeSettings {
  primaryColor?: string;
  primaryHoverColor?: string;
  secondaryColor?: string;
  secondaryHoverColor?: string;
  accentColor?: string;
  accentHoverColor?: string;
  gradientStart?: string;
  gradientEnd?: string;
  cardBackgroundColor?: string;
  cardHoverColor?: string;
  borderColor?: string;
  borderHoverColor?: string;
  backgroundColor?: string;
  darkBackgroundColor?: string;

  darkPrimaryColor?: string;
  darkPrimaryHoverColor?: string;
  darkSecondaryColor?: string;
  darkSecondaryHoverColor?: string;
  darkAccentColor?: string;
  darkAccentHoverColor?: string;
  darkCardBackgroundColor?: string;
  darkCardHoverColor?: string;
  darkBorderColor?: string;
  darkBorderHoverColor?: string;
  darkTextPrimaryColor?: string;
  darkTextSecondaryColor?: string;

  textPrimaryColor?: string;
  textSecondaryColor?: string;
  headerBackgroundColor?: string;
  darkHeaderBackgroundColor?: string;

  fontFamily?: string;
  themeStyle?: string;
  darkModeEnabled?: boolean;
  darkMode?: boolean;
  rtlLayout?: boolean;
  companyLogo?: string;
  companyName?: string;
  companyNameEn?: string;
  systemIcon?: string;
}

const ThemeContext = createContext<{ settings: ThemeSettings | null }>({ settings: null });

export const useTheme = () => useContext(ThemeContext);

function hexToRgb(hex: string): string {
  const cleaned = hex.replace("#", "");
  const full = cleaned.length === 3
    ? cleaned.split("").map((c) => c + c).join("")
    : cleaned;
  const r = parseInt(full.substring(0, 2), 16);
  const g = parseInt(full.substring(2, 4), 16);
  const b = parseInt(full.substring(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return "0, 0, 0";
  return `${r}, ${g}, ${b}`;
}

function hexToHsl(hex: string): string {
  const cleaned = hex.replace("#", "");
  const full = cleaned.length === 3
    ? cleaned.split("").map((c) => c + c).join("")
    : cleaned;
  let r = parseInt(full.substring(0, 2), 16) / 255;
  let g = parseInt(full.substring(2, 4), 16) / 255;
  let b = parseInt(full.substring(4, 6), 16) / 255;
  if ([r, g, b].some((n) => Number.isNaN(n))) return "0, 0%, 0%";
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%`;
}

function setVar(root: HTMLElement, name: string, value: string | undefined) {
  if (!value) return;
  root.style.setProperty(name, value);
  if (value.startsWith("#")) {
    root.style.setProperty(`${name}-rgb`, hexToRgb(value));
    root.style.setProperty(`${name}-hsl`, hexToHsl(value));
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: settings } = useQuery<ThemeSettings>({
    queryKey: ["/api/appearance"],
  });

  useEffect(() => {
    if (!settings) return;
    const root = document.documentElement;
    const isDark = !!settings.darkMode || !!settings.darkModeEnabled;

    // ===== LIGHT-MODE PALETTE =====
    setVar(root, "--app-primary", settings.primaryColor);
    setVar(root, "--app-primary-hover", settings.primaryHoverColor);
    setVar(root, "--app-secondary", settings.secondaryColor);
    setVar(root, "--app-secondary-hover", settings.secondaryHoverColor);
    setVar(root, "--app-accent", settings.accentColor);
    setVar(root, "--app-accent-hover", settings.accentHoverColor);
    setVar(root, "--app-gradient-start", settings.gradientStart);
    setVar(root, "--app-gradient-end", settings.gradientEnd);
    setVar(root, "--app-card-bg", settings.cardBackgroundColor);
    setVar(root, "--app-card-hover", settings.cardHoverColor);
    setVar(root, "--app-border", settings.borderColor);
    setVar(root, "--app-border-hover", settings.borderHoverColor);
    setVar(root, "--app-bg", settings.backgroundColor);
    setVar(root, "--app-text-primary", settings.textPrimaryColor);
    setVar(root, "--app-text-secondary", settings.textSecondaryColor);
    setVar(root, "--app-header-bg", settings.headerBackgroundColor);

    // ===== DARK-MODE PALETTE (always emitted) =====
    setVar(root, "--app-dark-primary", settings.darkPrimaryColor);
    setVar(root, "--app-dark-primary-hover", settings.darkPrimaryHoverColor);
    setVar(root, "--app-dark-secondary", settings.darkSecondaryColor);
    setVar(root, "--app-dark-secondary-hover", settings.darkSecondaryHoverColor);
    setVar(root, "--app-dark-accent", settings.darkAccentColor);
    setVar(root, "--app-dark-accent-hover", settings.darkAccentHoverColor);
    setVar(root, "--app-dark-card-bg", settings.darkCardBackgroundColor);
    setVar(root, "--app-dark-card-hover", settings.darkCardHoverColor);
    setVar(root, "--app-dark-border", settings.darkBorderColor);
    setVar(root, "--app-dark-border-hover", settings.darkBorderHoverColor);
    setVar(root, "--app-dark-bg", settings.darkBackgroundColor);
    setVar(root, "--app-dark-text-primary", settings.darkTextPrimaryColor);
    setVar(root, "--app-dark-text-secondary", settings.darkTextSecondaryColor);
    setVar(root, "--app-dark-header-bg", settings.darkHeaderBackgroundColor);

    // ===== RESOLVED VARS — what the rest of the CSS reads =====
    const active = {
      primary: isDark ? settings.darkPrimaryColor : settings.primaryColor,
      primaryHover: isDark ? settings.darkPrimaryHoverColor : settings.primaryHoverColor,
      secondary: isDark ? settings.darkSecondaryColor : settings.secondaryColor,
      secondaryHover: isDark ? settings.darkSecondaryHoverColor : settings.secondaryHoverColor,
      accent: isDark ? settings.darkAccentColor : settings.accentColor,
      accentHover: isDark ? settings.darkAccentHoverColor : settings.accentHoverColor,
      cardBg: isDark ? settings.darkCardBackgroundColor : settings.cardBackgroundColor,
      cardHover: isDark ? settings.darkCardHoverColor : settings.cardHoverColor,
      border: isDark ? settings.darkBorderColor : settings.borderColor,
      borderHover: isDark ? settings.darkBorderHoverColor : settings.borderHoverColor,
      bg: isDark ? settings.darkBackgroundColor : settings.backgroundColor,
      textPrimary: isDark ? settings.darkTextPrimaryColor : settings.textPrimaryColor,
      textSecondary: isDark ? settings.darkTextSecondaryColor : settings.textSecondaryColor,
      headerBg: isDark ? settings.darkHeaderBackgroundColor : settings.headerBackgroundColor,
    };

    setVar(root, "--theme-primary", active.primary);
    setVar(root, "--theme-secondary", active.secondary);
    setVar(root, "--theme-accent", active.accent);
    setVar(root, "--dynamic-primary", active.primary);
    setVar(root, "--dynamic-primary-hover", active.primaryHover);
    setVar(root, "--dynamic-secondary", active.secondary);
    setVar(root, "--dynamic-secondary-hover", active.secondaryHover);
    setVar(root, "--dynamic-accent", active.accent);
    setVar(root, "--dynamic-accent-hover", active.accentHover);
    setVar(root, "--dynamic-card-bg", active.cardBg);
    setVar(root, "--dynamic-card-hover", active.cardHover);
    setVar(root, "--dynamic-border", active.border);
    setVar(root, "--dynamic-border-hover", active.borderHover);
    setVar(root, "--dynamic-bg", active.bg);
    setVar(root, "--dynamic-text-primary", active.textPrimary);
    setVar(root, "--dynamic-text-secondary", active.textSecondary);
    setVar(root, "--dynamic-header-bg", active.headerBg);

    // shadcn HSL channels (so bg-primary / text-primary etc. follow the picker)
    if (active.primary?.startsWith("#")) {
      root.style.setProperty("--primary", hexToHsl(active.primary));
      root.style.setProperty("--ring", hexToHsl(active.primary));
    }
    if (active.secondary?.startsWith("#")) {
      root.style.setProperty("--secondary", hexToHsl(active.secondary));
    }
    if (active.accent?.startsWith("#")) {
      root.style.setProperty("--accent", hexToHsl(active.accent));
    }
    if (active.border?.startsWith("#")) {
      root.style.setProperty("--border", hexToHsl(active.border));
      root.style.setProperty("--input", hexToHsl(active.border));
    }
    if (active.cardBg?.startsWith("#")) {
      root.style.setProperty("--card", hexToHsl(active.cardBg));
      root.style.setProperty("--popover", hexToHsl(active.cardBg));
    }
    if (active.bg?.startsWith("#")) {
      root.style.setProperty("--background", hexToHsl(active.bg));
    }
    if (active.textPrimary?.startsWith("#")) {
      root.style.setProperty("--foreground", hexToHsl(active.textPrimary));
      root.style.setProperty("--card-foreground", hexToHsl(active.textPrimary));
      root.style.setProperty("--popover-foreground", hexToHsl(active.textPrimary));
    }

    // page-level gradient
    const gStart = settings.gradientStart || active.primary;
    const gEnd = settings.gradientEnd || active.secondary;
    if (gStart && gEnd) {
      root.style.setProperty(
        "--theme-gradient",
        `linear-gradient(135deg, ${gStart} 0%, ${gEnd} 100%)`
      );
      root.style.setProperty(
        "--app-page-bg",
        isDark
          ? (active.bg || "#000000")
          : `linear-gradient(135deg, ${gStart} 0%, ${gEnd} 100%)`
      );
    }

    // font family
    if (settings.fontFamily) {
      root.style.setProperty("--font-family-arabic", settings.fontFamily);
      document.body.style.fontFamily = `${settings.fontFamily}, sans-serif`;
    }

    // theme style + dark/RTL toggles
    if (settings.themeStyle) root.setAttribute("data-theme-style", settings.themeStyle);
    root.classList.toggle("dark", isDark);
    document.documentElement.dir = settings.rtlLayout === false ? "ltr" : "rtl";

    // favicon
    if (settings.systemIcon) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = settings.systemIcon;
    }

    // browser tab title
    if (settings.companyName) {
      document.title = settings.companyName;
    }
  }, [settings]);

  return (
    <ThemeContext.Provider value={{ settings: settings || null }}>
      {children}
    </ThemeContext.Provider>
  );
}
