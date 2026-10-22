"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import {
  BarChart3,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Database,
  FileText,
  GraduationCap,
  Home,
  LayoutDashboard,
  LayoutTemplate,
  Layers,
  LogOut,
  Settings,
  Users,
  UsersRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Avatar } from "@/components/social/Avatar";
import { BrandMark } from "@/components/BrandMark";
import type { PublicUser } from "@/lib/types";

type NavItem = { href: string; label: string; icon: LucideIcon };

const STORAGE_KEY = "demolay-sidebar-collapsed";

const collapsedListeners = new Set<() => void>();

function readCollapsed() {
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

function getServerCollapsed() {
  return false;
}

function subscribeCollapsed(listener: () => void) {
  collapsedListeners.add(listener);
  return () => collapsedListeners.delete(listener);
}

function writeCollapsed(value: boolean) {
  window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  collapsedListeners.forEach((listener) => listener());
}

const PAUSED_NAV = new Set(["/dashboard/payment", "/dashboard/profile"]);

export function AppShell({
  user,
  nav,
  title,
  children,
}: {
  user: PublicUser;
  nav: NavItem[];
  title: string;
  children: React.ReactNode;
}) {
  const isAdmin = user.role === "admin";
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(
    subscribeCollapsed,
    readCollapsed,
    getServerCollapsed,
  );

  function toggle() {
    writeCollapsed(!collapsed);
  }

  const isPaused = user.role !== "admin" && user.accountStatus === "suspended";
  const items = isPaused ? nav.filter((item) => PAUSED_NAV.has(item.href)) : nav;

  const activeHref = [...items]
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  function isActive(href: string) {
    return href === activeHref;
  }

  const quickNav = items.slice(0, 6);

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#1B365F]">
      <div className={`grid min-h-screen transition-[grid-template-columns] duration-200 ${collapsed ? "lg:grid-cols-[92px_1fr]" : "lg:grid-cols-[276px_1fr]"}`}>
        <aside className="hidden bg-white lg:block">
          <div className="sticky top-0 flex h-screen flex-col border-r border-black/5 px-4 py-6">
            <div className={`flex px-1 ${collapsed ? "flex-col items-center gap-3" : "items-center justify-between"}`}>
              <Link href={isAdmin ? "/admin" : "/dashboard"} className={collapsed ? "hidden" : "block"}>
                <BrandMark />
              </Link>
              <Link href={isAdmin ? "/admin" : "/dashboard"} className={collapsed ? "mx-auto block" : "hidden"}>
                <img src="/api/branding/logo" alt="DeMolay Pathway" className="h-10 w-10 rounded-xl bg-white object-contain" />
              </Link>
              <button
                type="button"
                onClick={toggle}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-black/10 text-[#1E4488] transition hover:bg-[#EAF1F9]"
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
            </div>

            <nav className="mt-8 flex flex-1 flex-col gap-1 overflow-y-auto">
              {items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={`relative flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold transition ${
                      active
                        ? "bg-[#1E4488] text-white shadow-[0_8px_18px_rgba(30,68,136,0.3)] before:absolute before:-left-1 before:top-1/2 before:h-6 before:w-1.5 before:-translate-y-1/2 before:rounded-r-full before:bg-[#FFCF00]"
                        : "text-[#4C5E73] hover:bg-[#EAF1F9] hover:text-[#1B365F]"
                    } ${collapsed ? "justify-center" : ""}`}
                  >
                    <Icon size={19} strokeWidth={2.2} className={active ? "text-white" : "text-[#1E4488]"} />
                    {!collapsed ? <span className={`truncate ${active ? "text-white" : "text-inherit"}`}>{item.label}</span> : null}
                  </Link>
                );
              })}
            </nav>

            <div className={`rounded-2xl bg-[#F4F7FB] p-3 ${collapsed ? "flex justify-center" : ""}`}>
              {collapsed ? (
                <Avatar id={user.id} name={user.fullName} size="sm" src={user.profilePhoto} />
              ) : (
                <div className="flex items-center gap-3">
                  <Avatar id={user.id} name={user.fullName} size="sm" src={user.profilePhoto} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{user.fullName}</p>
                    <p className="truncate text-xs text-[#8a93a6]">{isAdmin ? "Leadership council" : "Member"}</p>
                  </div>
                  <form action="/api/auth/logout" method="post">
                    <button className="grid h-8 w-8 place-items-center rounded-full text-[#8a93a6] transition hover:bg-white hover:text-[#AC242A]" title="Sign out" type="submit">
                      <LogOut size={16} />
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-black/5 bg-white/90 px-5 py-4 backdrop-blur lg:px-8">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a93a6]">
                {isAdmin ? "Leadership council" : "Member workspace"}
              </p>
              <h1 className="truncate font-serif text-2xl leading-tight lg:text-3xl">{title}</h1>
            </div>

            <nav className="hidden items-center gap-1 rounded-full bg-[#F4F7FB] p-1.5 xl:flex">
              {quickNav.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    aria-label={item.label}
                    aria-current={active ? "page" : undefined}
                    className={`grid h-10 w-10 place-items-center rounded-full border transition ${
                      active
                        ? "border-[#1E4488] bg-[#FFCF00] text-[#1B365F] shadow-[0_6px_16px_rgba(255,207,0,0.45)]"
                        : "border-transparent bg-white text-[#1E4488] hover:border-[#C9D7EC] hover:bg-[#EAF1F9]"
                    }`}
                  >
                    <Icon size={18} strokeWidth={2.2} className={active ? "text-[#1B365F]" : "text-[#1E4488]"} />
                  </Link>
                );
              })}
            </nav>

            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-black/5 bg-white py-1.5 pl-1.5 pr-3 shadow-sm [&::-webkit-details-marker]:hidden">
                <Avatar id={user.id} name={user.fullName} size="sm" src={user.profilePhoto} />
                <span className="hidden text-sm font-semibold sm:block">{user.fullName.split(" ")[0]}</span>
                <ChevronDown size={14} className="text-[#8a93a6] transition group-open:rotate-180" />
              </summary>
              <div className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-2xl border border-black/5 bg-white p-1.5 shadow-[0_18px_40px_rgba(17,44,70,0.16)]">
                <div className="px-3 py-2">
                  <p className="truncate text-sm font-semibold">{user.fullName}</p>
                  <p className="truncate text-xs text-[#8a93a6]">{user.email}</p>
                </div>
                <div className="my-1 h-px bg-black/5" />
                <Link href={isAdmin ? "/admin/settings" : "/dashboard/profile"} className="block rounded-xl px-3 py-2 text-sm font-medium text-[#1B365F] hover:bg-[#F4F7FB]">
                  {isAdmin ? "Council settings" : "My profile"}
                </Link>
                <Link href="/" className="block rounded-xl px-3 py-2 text-sm font-medium text-[#1B365F] hover:bg-[#F4F7FB]">
                  View public site
                </Link>
                <form action="/api/auth/logout" method="post">
                  <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-[#AC242A] hover:bg-[#FFF1F0]" type="submit">
                    <LogOut size={14} /> Sign out
                  </button>
                </form>
              </div>
            </details>
          </header>

          <nav className="flex gap-2 overflow-x-auto border-b border-black/5 bg-white px-5 py-3 lg:hidden">
            {items.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                    active ? "border border-[#FFCF00] bg-[#1E4488] text-white" : "border border-transparent bg-white text-[#1E4488]"
                  }`}
                >
                  <Icon size={14} className={active ? "text-[#FFCF00]" : "text-[#1E4488]"} /> {item.label}
                </Link>
              );
            })}
          </nav>

          <main className="px-5 py-7 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

export const studentNav: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/dashboard/levels", label: "Levels & lessons", icon: GraduationCap },
  { href: "/dashboard/payment", label: "Payments", icon: Wallet },
  { href: "/dashboard/profile", label: "My profile", icon: Settings },
];

export const adminNav: NavItem[] = [
  { href: "/admin", label: "Monitoring", icon: LayoutDashboard },
  { href: "/admin/members", label: "Members", icon: UsersRound },
  { href: "/admin/applicants", label: "Applicants", icon: Users },
  { href: "/admin/payments", label: "Payments", icon: Wallet },
  { href: "/admin/general-reports", label: "General reports", icon: BarChart3 },
  { href: "/admin/levels", label: "Levels", icon: Layers },
  { href: "/admin/lessons", label: "Lessons", icon: BookOpen },
  { href: "/admin/banks", label: "Question banks", icon: Database },
  { href: "/admin/exams", label: "Exams", icon: ClipboardList },
  { href: "/admin/landing", label: "Landing page", icon: LayoutTemplate },
  { href: "/admin/registration-form", label: "Registration form", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];
