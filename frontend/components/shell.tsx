"use client";
import { BrandMark } from "./brand-mark";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BriefcaseBusiness,
  CalendarDays,
  ChartNoAxesCombined,
  Settings,
  Plus,
  LogOut,
  PanelLeftClose,
  Menu,
  X,
  ArrowUpRight,
} from "lucide-react";
import { api } from "@/lib/api";
import type { User } from "@/types";
import { Loading, ErrorMessage } from "./ui";
const UserContext = createContext<{
  user: User | null;
  update: (user: User) => void;
}>({ user: null, update: () => {} });
export const useUser = () => useContext(UserContext).user;
export const useUpdateUser = () => useContext(UserContext).update;
const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/applications", label: "Applications", icon: BriefcaseBusiness },
  { href: "/interviews", label: "Interviews", icon: CalendarDays },
  { href: "/analytics", label: "Analytics", icon: ChartNoAxesCombined },
];
function subscribeMobile(callback: () => void) {
  const query = window.matchMedia("(max-width: 760px)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const readMobile = () => window.matchMedia("(max-width: 760px)").matches;
const serverMobile = () => false;
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname(),
    router = useRouter();
  const [user, setUser] = useState<User | null>(null),
    [error, setError] = useState(""),
    [open, setOpen] = useState(false);
  const mobile = useSyncExternalStore(
    subscribeMobile,
    readMobile,
    serverMobile,
  );
  const sidebarRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open || !mobile) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const sidebar = sidebarRef.current;
    const menuButton = menuRef.current;
    const items = sidebar?.querySelectorAll<HTMLElement>(
      "a[href], button:not([disabled])",
    );
    items?.[0]?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !items?.length) return;
      const first = items[0],
        last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    sidebar?.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = previousOverflow;
      sidebar?.removeEventListener("keydown", keydown);
      menuButton?.focus();
    };
  }, [open, mobile]);
  useEffect(() => {
    api<User>("/auth/me")
      .then(setUser)
      .catch((e) => {
        if (e.status === 401) router.replace("/login");
        else setError(e.message);
      });
  }, [router]);
  async function logout() {
    try {
      await api("/auth/logout", { method: "POST" });
      router.replace("/login");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  if (error)
    return (
      <main className="standalone">
        <ErrorMessage message={error} />
        <button className="button" onClick={() => window.location.reload()}>
          Try again
        </button>
      </main>
    );
  if (!user) return <Loading />;
  return (
    <UserContext.Provider value={{ user, update: setUser }}>
      <div className="workspace">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {open && mobile && (
          <button
            className="nav-overlay"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          />
        )}
        <aside
          id="workspace-navigation"
          inert={mobile && !open}
          ref={sidebarRef}
          role={open && mobile ? "dialog" : undefined}
          aria-modal={(open && mobile) || undefined}
          aria-label={open && mobile ? "Navigation" : undefined}
          className={`sidebar ${open ? "is-open" : ""}`}
        >
          <button
            className="icon-button mobile-close"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          >
            <X size={18} />
          </button>
          <Link className="brand" href="/dashboard">
            <BrandMark />
            CareerCompass
          </Link>
          <div className="workspace-label">PERSONAL WORKSPACE</div>
          <nav aria-label="Main navigation">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={path.startsWith(item.href) ? "page" : undefined}
                className={
                  path.startsWith(item.href) ? "nav-item active" : "nav-item"
                }
              >
                <item.icon size={19} />
                {item.label}
              </Link>
            ))}
          </nav>
          <Link
            className="button primary sidebar-add"
            href="/applications/new"
            onClick={() => setOpen(false)}
          >
            <Plus size={18} />
            Add application
          </Link>
          <div className="sidebar-bottom">
            <div className="sidebar-note">
              <span className="tiny-label">ONE STEP CLOSER</span>
              <p>
                Your next chapter
                <br />
                starts with a little clarity.
              </p>
              <ArrowUpRight size={20} />
            </div>
            <Link
              className={`nav-item ${path === "/settings" ? "active" : ""}`}
              href="/settings"
              onClick={() => setOpen(false)}
            >
              <Settings size={19} />
              Settings
            </Link>
            <button className="nav-item" onClick={logout}>
              <LogOut size={18} />
              Log out
            </button>
            <div className="profile">
              <span className="avatar">{user.first_name[0]}</span>
              <span>
                <strong>{user.first_name}</strong>
                <small>Personal account</small>
              </span>
              <PanelLeftClose size={17} />
            </div>
          </div>
        </aside>
        <div className="main-wrap" inert={open && mobile}>
          <header className="topbar">
            <button
              ref={menuRef}
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              aria-expanded={open}
              aria-controls="workspace-navigation"
              onClick={() => setOpen(true)}
            >
              <Menu />
            </button>
            <span>
              Workspace <span className="crumb">/</span>{" "}
              <strong>
                {path.includes("/applications/")
                  ? "Applications"
                  : nav.find((n) => path.startsWith(n.href))?.label ||
                    "Settings"}
              </strong>
            </span>
            <div className="topbar-right">
              <span className="today">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <Link
                href="/settings"
                aria-label="Account settings"
                className="avatar small"
              >
                {user.first_name[0]}
              </Link>
            </div>
          </header>
          <main id="main" tabIndex={-1}>
            {children}
          </main>
          <footer className="app-footer">
            <span>Your job search, in focus.</span>
            <nav className="legal-links" aria-label="Legal">
              <Link href="/terms">Terms</Link>
              <Link href="/privacy">Privacy</Link>
            </nav>
          </footer>
        </div>
      </div>
    </UserContext.Provider>
  );
}
