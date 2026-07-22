import {
  BookMarked,
  Compass,
  History,
  Home,
  Star,
  type LucideIcon,
} from "lucide-react";

export type SiteNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const siteNavItems: SiteNavItem[] = [
  { href: "/", label: "ホーム", icon: Home },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/favorites", label: "お気に入り", icon: Star },
  { href: "/history", label: "履歴", icon: History },
  { href: "/vocabulary", label: "単語帳", icon: BookMarked },
];
