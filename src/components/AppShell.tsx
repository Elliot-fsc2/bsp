"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle,
  Compass,
  FileCheck,
  Home,
  LayoutDashboard,
  LogOut,
  Medal,
  Megaphone,
  Menu,
  MessagesSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Shield,
  Sparkles,
  Tag,
  Users,
  X,
} from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { markNotificationsReadAction } from "@/actions/advancement";
import { Avatar, RoleBadge } from "@/components/ui";
import type { AuthUser, SiteSettings } from "@/lib/types";

type Notice = {
  id: number;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
};

type NavItem = { href: string; label: string; icon: typeof Award };

const mainNav: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/advancement", label: "Advancement", icon: Award },
  { href: "/merit-badges", label: "Merit badges", icon: Medal },
  { href: "/my-advancement", label: "My advancement", icon: FileCheck },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/forums", label: "Forums", icon: MessagesSquare },
  { href: "/announcements", label: "News", icon: Megaphone },
  { href: "/people", label: "People", icon: Users },
];

const staffNav: NavItem[] = [{ href: "/approvals", label: "Approvals", icon: CheckCircle }];

const adminNav: NavItem[] = [
  { href: "/admin", label: "Overview", icon: Shield },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/programs", label: "Programs", icon: Compass },
  { href: "/admin/badges", label: "Badges", icon: Award },
  { href: "/admin/categories", label: "Categories", icon: Tag },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AppShell({
  user,
  settings,
  notices,
  defaultCollapsed = false,
  children,
}: {
  user: AuthUser;
  settings: SiteSettings;
  notices: Notice[];
  defaultCollapsed?: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [bell, setBell] = useState(false);
  const [bellPos, setBellPos] = useState<{ top: number; right: number }>({ top: 80, right: 16 });
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const bellRef = useRef<HTMLButtonElement | null>(null);
  const unread = notices.filter((item) => !item.read).length;

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `bsp_nav=${next ? "collapsed" : "expanded"}; path=/; max-age=31536000; samesite=lax`;
  };

  const toggleBell = () => {
    if (bell) {
      setBell(false);
      return;
    }
    const rect = bellRef.current?.getBoundingClientRect();
    setBellPos(
      rect
        ? { top: Math.min(rect.bottom + 8, window.innerHeight - 120), right: Math.max(12, window.innerWidth - rect.right) }
        : { top: 80, right: 16 },
    );
    setBell(true);
  };

  useEffect(() => {
    if (!bell) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setBell(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [bell]);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const renderNav = (items: NavItem[], compact: boolean) =>
    items.map((item) => {
      const Icon = item.icon;
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setOpen(false)}
          title={compact ? item.label : undefined}
          className={`nav-link ${compact ? "justify-center px-0" : ""} ${isActive(item.href) ? "active" : ""}`}
        >
          <Icon size={18} />
          {compact ? null : item.label}
        </Link>
      );
    });

  const sectionTitle = (label: string, compact: boolean) =>
    compact ? (
      <div className="my-3 h-px bg-[var(--line)]" />
    ) : (
      <p className="mt-6 mb-2 px-3 text-[11px] font-extrabold tracking-[0.14em] text-[var(--muted)] uppercase">
        {label}
      </p>
    );

  const sidebar = (compact: boolean, showToggle: boolean) => (
    <>
      <div className={`mb-6 flex items-center ${compact ? "flex-col gap-2" : "gap-3 px-2"}`}>
        <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
          {settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt=""
              className="h-12 w-12 shrink-0 rounded-[18px] bg-white object-contain shadow-[3px_3px_0_rgba(43,27,78,0.12)]"
            />
          ) : (
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[18px] bg-[var(--accent)] text-2xl shadow-[3px_3px_0_rgba(43,27,78,0.12)]">
              ⚜️
            </span>
          )}
          {compact ? null : (
            <span className="min-w-0">
              <span className="font-display block text-lg leading-none">{settings.siteName}</span>
              <span className="text-xs font-bold text-[var(--muted)]">{settings.mascotName} says hi</span>
            </span>
          )}
        </Link>
        {showToggle ? (
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={compact ? "Expand menu" : "Minimize menu"}
            title={compact ? "Expand menu" : "Minimize menu"}
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white shadow-[2px_2px_0_rgba(43,27,78,0.12)] ${
              compact ? "" : "ml-auto"
            }`}
          >
            {compact ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        ) : null}
      </div>

      {sectionTitle("Explore", compact)}
      <nav className="space-y-1">{renderNav(mainNav, compact)}</nav>
      {user.role !== "student" ? (
        <>
          {sectionTitle("Advancement desk", compact)}
          <nav className="space-y-1">{renderNav(staffNav, compact)}</nav>
        </>
      ) : null}
      {user.role === "admin" ? (
        <>
          {sectionTitle("Council office", compact)}
          <nav className="space-y-1">{renderNav(adminNav, compact)}</nav>
        </>
      ) : null}

      <div className="mt-auto pt-6">
        <Link
          href="/profile"
          title={compact ? user.name : undefined}
          className={`bloom-card flex items-center gap-3 ${compact ? "justify-center p-2" : "p-3"}`}
        >
          <Avatar name={user.name} color={user.avatarColor} size={42} />
          {compact ? null : (
            <span className="min-w-0">
              <span className="block truncate text-sm font-extrabold">{user.name}</span>
              <RoleBadge role={user.role} />
            </span>
          )}
        </Link>
        <form action={logoutAction} className="mt-3">
          <button
            className={`nav-link w-full ${compact ? "justify-center px-0" : ""}`}
            type="submit"
            title={compact ? "Log out" : undefined}
          >
            <LogOut size={18} />
            {compact ? null : "Log out"}
          </button>
        </form>
      </div>
    </>
  );

  const bottomNav: NavItem[] = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/advancement", label: "Ranks", icon: Award },
    { href: "/merit-badges", label: "Badges", icon: Medal },
    user.role === "student"
      ? { href: "/my-advancement", label: "Progress", icon: FileCheck }
      : { href: "/approvals", label: "Approvals", icon: CheckCircle },
  ];

  return (
    <div className="mx-auto flex min-h-screen max-w-[1500px] gap-4 p-3 md:p-4">
      <aside
        className={`bloom-card hidden shrink-0 flex-col p-4 transition-[width] duration-200 lg:flex ${
          collapsed ? "w-[92px]" : "w-[280px]"
        }`}
      >
        {sidebar(collapsed, true)}
      </aside>

      {open ? (
        <div className="fixed inset-0 z-[80] bg-[rgba(43,27,78,0.35)] p-3 lg:hidden">
          <aside className="bloom-card flex h-full w-[min(100%,320px)] flex-col overflow-y-auto p-4">
            <button className="mb-3 self-end" onClick={() => setOpen(false)} aria-label="Close menu">
              <X />
            </button>
            {sidebar(false, false)}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col gap-3 md:gap-4">
        <header className="bloom-card flex items-center justify-between gap-2 px-3 py-2.5 md:gap-3 md:px-4 md:py-3">
          <div className="flex min-w-0 items-center gap-2 md:gap-3">
            <button
              className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <div className="hidden items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-bold text-[var(--muted)] lg:flex">
              <Sparkles size={16} />
              <span className="truncate">{settings.tagline}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={user.role === "student" ? "/advancement" : "/approvals"}
              className="bloom-btn hidden px-3 py-2 text-sm sm:inline-flex"
            >
              {user.role === "student" ? "My advancement" : "Approvals"}
            </Link>
            <button
              ref={bellRef}
              className="relative grid h-11 w-11 place-items-center rounded-2xl bg-white"
              onClick={toggleBell}
              aria-label="Notifications"
              aria-expanded={bell}
            >
              <Bell size={18} />
              {unread ? (
                <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--primary)] px-1 text-[10px] font-extrabold text-white">
                  {unread}
                </span>
              ) : null}
            </button>
            <Link href="/profile" className="shrink-0">
              <Avatar name={user.name} color={user.avatarColor} size={42} />
            </Link>
          </div>
        </header>

        <main className="pb-24 lg:pb-8">{children}</main>
      </div>

      {bell
        ? createPortal(
            <div
              className="fixed inset-0 z-[90]"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setBell(false);
              }}
            >
              <div
                className="bloom-card fixed max-h-[70vh] w-[min(92vw,360px)] overflow-y-auto p-3"
                style={{ top: bellPos.top, right: bellPos.right }}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="font-display text-lg">Signals</p>
                  <div className="flex items-center gap-2">
                    <form action={markNotificationsReadAction}>
                      <button className="text-xs font-extrabold text-[var(--muted)]">Mark read</button>
                    </form>
                    <button
                      type="button"
                      onClick={() => setBell(false)}
                      aria-label="Close notifications"
                      className="grid h-7 w-7 place-items-center rounded-full bg-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {notices.length === 0 ? (
                    <p className="p-3 text-sm text-[var(--muted)]">All quiet at camp.</p>
                  ) : (
                    notices.map((notice) => (
                      <Link
                        key={notice.id}
                        href={notice.href || "/dashboard"}
                        className="block rounded-2xl bg-white/80 p-3"
                        onClick={() => setBell(false)}
                      >
                        <p className="text-sm font-extrabold">{notice.title}</p>
                        <p className="text-xs text-[var(--muted)]">{notice.body}</p>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      <nav className="bloom-card fixed bottom-0 left-0 right-0 z-[70] rounded-t-[24px] rounded-b-none border-x-0 border-b-0 px-2 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] lg:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-between">
          {bottomNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center gap-0.5 rounded-2xl px-1 py-2 text-[10px] font-extrabold ${
                  active ? "bg-white text-[var(--ink)]" : "text-[var(--muted)]"
                }`}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex flex-1 flex-col items-center gap-0.5 rounded-2xl px-1 py-2 text-[10px] font-extrabold text-[var(--muted)]"
          >
            <Menu size={20} />
            More
          </button>
        </div>
      </nav>
    </div>
  );
}
