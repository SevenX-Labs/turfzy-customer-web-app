"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { authService, profileService, notificationService } from "@/services";
import { clearToken, getToken } from "@/lib/api";
import type { UserProfile } from "@/types/domain";
import { Brand } from "@/components/ui";
import { ToastProvider, useToast } from "@/components/toast";

type IconName = "home" | "explore" | "bookings" | "notifications" | "profile" | "settings" | "logout" | "leaderboard";

const links: { label: string; href: string; icon: IconName }[] = [
  { label: "Home", href: "/home", icon: "home" },
  { label: "Explore", href: "/turfs", icon: "explore" },
  { label: "My bookings", href: "/bookings", icon: "bookings" },
  { label: "Leaderboard", href: "/leaderboard", icon: "leaderboard" },
  { label: "Notifications", href: "/notifications", icon: "notifications" },
  { label: "Profile", href: "/profile", icon: "profile" },
  { label: "Settings", href: "/settings", icon: "settings" },
];

function NavIcon({ name }: { name: IconName }) {
  const common = { width: 17, height: 17, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (name === "home") return <svg {...common}><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" /><path d="M9 21v-6h6v6" /></svg>;
  if (name === "explore") return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="m15.5 8.5-2.1 4.8-4.8 2.2 2.1-4.8Z" /></svg>;
  if (name === "bookings") return <svg {...common}><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16M8 14h3" /></svg>;
  if (name === "leaderboard") return <svg {...common}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" /><path d="M12 2a4 4 0 0 1 4 4v7a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4Z" /></svg>;
  if (name === "notifications") return <svg {...common}><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /><circle cx="19" cy="5" r="2" fill="currentColor" stroke="none" /></svg>;
  if (name === "profile") return <svg {...common}><circle cx="12" cy="8" r="3.5" /><path d="M5 21c.7-4 3-6 7-6s6.3 2 7 6" /></svg>;
  if (name === "settings") return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.1 2.1-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-3v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-2.1-2.1.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H5.3v-3h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 2.1-2.1.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5v-.2h3v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 2.1 2.1-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2v3h-.2a1.7 1.7 0 0 0-1.5 1Z" /></svg>;
  return <svg {...common}><path d="M10 17l5-5-5-5M15 12H3" /><path d="M21 3v18" /></svg>;
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AppShellContent>{children}</AppShellContent>
    </ToastProvider>
  );
}

function AppShellContent({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  useEffect(() => {
    if (!getToken()) router.replace("/login");
    else {
      Promise.resolve().then(() => setReady(true));
      profileService.get().then((response) => setProfile(response.data)).catch(() => setProfile(null));
    }
  }, [router]);

  // Background listener for real-time notifications
  useEffect(() => {
    if (!ready || !profile) return;

    const checkNotifications = async () => {
      try {
        const response = await notificationService.inbox(1, 20);
        const notifications = response.data || [];
        
        // Find unread gamification notifications
        const unreadGamification = notifications.filter(
          (notif) => {
            const hasUnread = !notif.isRead;
            if (!hasUnread) return false;
            
            const type = notif.type || (notif.data as any)?.type;
            return type === "GAMIFICATION_DECAY" || type === "GAMIFICATION_PENALTY" || type === "GAMIFICATION_UPDATE";
          }
        );

        for (const notif of unreadGamification) {
          let toastType: any = "info";
          const type = notif.type || (notif.data as any)?.type;
          
          if (type === "GAMIFICATION_DECAY") {
            toastType = "gamification_decay";
          } else if (type === "GAMIFICATION_PENALTY") {
            toastType = "gamification_penalty";
          } else if (type === "GAMIFICATION_UPDATE") {
            toastType = "gamification_success";
          }

          toast(notif.title, toastType, notif.body);

          // Mark as read immediately on the server so we don't display it again
          await notificationService.read(notif.id).catch(() => {});
          
          // Dispatch a custom event to notify components to reload stats
          window.dispatchEvent(new CustomEvent("gamification-update", { detail: notif }));
        }
      } catch (err) {
        console.error("Error polling notifications:", err);
      }
    };

    // Run immediately
    checkNotifications();

    // Poll every 12 seconds
    const interval = setInterval(checkNotifications, 12000);
    return () => clearInterval(interval);
  }, [ready, profile, toast]);

  const logout = async () => { try { await authService.logout(); } catch {} clearToken(); router.replace("/login"); };
  const confirmLogout = async () => { setLogoutDialogOpen(false); await logout(); };
  const initials = profile?.name?.trim().slice(0, 1).toUpperCase() || "T";

  if (!ready) return <main className="grid min-h-screen place-items-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-lime-500" /></main>;

  return <div className="min-h-screen bg-[#f7f8f5]">
    {mobileMenuOpen && <button aria-label="Close navigation" onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 z-20 bg-black/30 lg:hidden" />}
    <aside className={`fixed inset-y-0 left-0 z-30 flex min-h-screen w-[260px] flex-col overflow-hidden border-r border-zinc-100 bg-white px-4 py-5 shadow-xl transition-transform duration-200 lg:w-[240px] lg:translate-x-0 lg:shadow-none ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="mb-10 flex items-center justify-between px-2">
        <Link href="/home" onClick={() => setMobileMenuOpen(false)}><Brand /></Link>
        <button aria-label="Close navigation" onClick={() => setMobileMenuOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 lg:hidden"><span className="text-xl leading-none">×</span></button>
      </div>
      <nav className="space-y-1" aria-label="Main navigation">
        {links.map(({ label, href, icon }) => {
          const active = path === href || (href !== "/home" && path.startsWith(`${href}/`));
          return <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${active ? "bg-lime-100 text-zinc-950" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"}`}>
            <NavIcon name={icon} /><span>{label}</span>
          </Link>;
        })}
      </nav>
      <div className="mt-auto border-t border-zinc-100 pt-4">
        <Link href="/profile" className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-zinc-50">
          {profile?.avatarUrl ? <img src={profile.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" /> : <div className="grid h-9 w-9 place-items-center rounded-full bg-zinc-200 text-sm font-bold text-zinc-700">{initials}</div>}
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-zinc-800">{profile?.name || "Turfzy Player"}</span><span className="block text-[11px] text-zinc-400">Turfzy Player</span></span>
        </Link>
        <button onClick={() => setLogoutDialogOpen(true)} className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950"><NavIcon name="logout" />Sign out</button>
      </div>
    </aside>
    <main className="min-h-screen pb-8 lg:ml-[240px]"><header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-5 lg:px-9"><button aria-label="Open navigation" onClick={() => setMobileMenuOpen(true)} className="grid h-9 w-9 place-items-center rounded-lg text-zinc-700 hover:bg-zinc-100 lg:hidden"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg></button><p className="ml-auto text-sm text-zinc-500">Play more. Live better.</p></header>{children}</main>
    {logoutDialogOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-5" role="presentation" onMouseDown={() => setLogoutDialogOpen(false)}>
      <section role="dialog" aria-modal="true" aria-labelledby="logout-title" onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <h2 id="logout-title" className="text-lg font-bold text-zinc-950">Sign out?</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-500">Are you sure you want to sign out of your Turfzy account?</p>
        <div className="mt-6 flex justify-end gap-3"><button onClick={() => setLogoutDialogOpen(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-100">Cancel</button><button onClick={confirmLogout} className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800">Sign out</button></div>
      </section>
    </div>}
  </div>;
}
