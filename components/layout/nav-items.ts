import { BookMarked, History, Home, Star, type LucideIcon } from "lucide-react";

export type SiteNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const siteNavItems: SiteNavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/favorites", label: "Favorites", icon: Star },
  { href: "/history", label: "History", icon: History },
  { href: "/vocabulary", label: "Vocabulary", icon: BookMarked },
];
