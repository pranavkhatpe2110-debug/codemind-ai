import {
  Bug,
  Code,
  FolderKanban,
  Gauge,
  History,
  LayoutDashboard,
  Lightbulb,
  MessageSquare,
  Settings,
  Sparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "AI Assistant", href: "/assistant", icon: MessageSquare },
  { label: "Code Editor", href: "/editor", icon: Code },
  { label: "Code Debugger", href: "/debugger", icon: Bug },
  { label: "Explain Code", href: "/tools/explain", icon: Lightbulb },
  { label: "Fix Code", href: "/tools/fix", icon: Wrench },
  { label: "Generate Code", href: "/tools/generate", icon: Sparkles },
  { label: "Optimize Code", href: "/tools/optimize", icon: Gauge },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "History", href: "/history", icon: History },
  { label: "Settings", href: "/settings", icon: Settings },
];
