'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import AdminSidebar, { type AdminProfile } from './components/AdminSidebar';
import AdminTopBar from './components/AdminTopBar';
import AdminMobileDrawer from './components/AdminMobileDrawer';
import { ADMIN_MENU, isExpandableActive } from './components/adminMenuConfig';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    setMobileMenuOpen(false);
    setAccountMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const next: Record<string, boolean> = {};
    for (const group of ADMIN_MENU) {
      for (const item of group.items) {
        if (item.kind === 'expandable' && isExpandableActive(pathname, item)) {
          next[item.id] = true;
        }
      }
    }
    setOpenSections((prev) => ({ ...prev, ...next }));
  }, [pathname]);

  useEffect(() => {
    const loadProfile = async () => {
      const response = await fetch('/api/admin/profile', { credentials: 'include', cache: 'no-store' });
      if (response.ok) {
        setProfile((await response.json()) as AdminProfile);
      }
    };
    loadProfile();
  }, []);

  useEffect(() => {
    const safeJson = async (res: Response) => {
      try {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) return await res.json();
      } catch {
        /* ignore */
      }
      return { status: res.status, statusText: res.statusText };
    };

    const checkAccess = async () => {
      try {
        let adminOk = false;
        for (let attempt = 1; attempt <= 2; attempt += 1) {
          const adminResponse = await fetch('/api/admin/profile', { credentials: 'include', cache: 'no-store' });
          if (adminResponse.ok) {
            adminOk = true;
            break;
          }
          if (adminResponse.status === 403 && attempt < 2) {
            // eslint-disable-next-line no-await-in-loop
            await new Promise((r) => setTimeout(r, 300));
            continue;
          }
          break;
        }
        if (adminOk) return;
        const devResponse = await fetch('/api/developer/check-access', { credentials: 'include', cache: 'no-store' });
        if (devResponse.ok) return;
        window.location.href = '/';
      } catch {
        window.location.href = '/';
      }
    };
    checkAccess();
  }, []);

  useEffect(() => {
    if (!accountMenuOpen) return undefined;
    const handleClick = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [accountMenuOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    try {
      localStorage.clear();
      if (typeof document !== 'undefined') {
        document.cookie.split(';').forEach((c) => {
          const name = c.split('=')[0].trim();
          try {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
          } catch {
            /* ignore */
          }
        });
      }
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      window.location.href = '/';
    } catch {
      localStorage.clear();
      window.location.href = '/';
    }
  };

  const toggleSection = useCallback((id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const sidebarProps = useMemo(
    () => ({
      profile,
      openSections,
      onToggleSection: toggleSection,
    }),
    [profile, openSections, toggleSection],
  );

  return (
    <div className="h-screen overflow-hidden bg-[#090b10] text-white">
      <style>{`
        @keyframes adminTitleShine{0%,60%{background-position:100% 0}100%{background-position:-100% 0}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .animate-fadeIn{animation:fadeIn .25s ease-out}
      `}</style>

      <div className="flex h-full">
        {/* Desktop sidebar */}
        <aside
          className={`sticky top-0 hidden h-screen flex-col border-r border-white/10 bg-[#090b10]/95 backdrop-blur-xl transition-[width] duration-300 ease-out lg:flex ${
            collapsed ? 'w-[76px]' : 'w-[268px]'
          }`}
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-10 top-20 h-40 w-40 rounded-full bg-[#5865F2]/10 blur-3xl" />
            <div className="absolute bottom-24 -right-12 h-36 w-36 rounded-full bg-[#7289DA]/10 blur-3xl" />
          </div>
          <div className="relative flex h-full flex-col">
            <AdminSidebar
              {...sidebarProps}
              collapsed={collapsed}
              onToggleCollapse={() => setCollapsed((p) => !p)}
              variant="desktop"
            />
          </div>
        </aside>

        {/* Main column */}
        <div className="relative z-0 flex min-w-0 flex-1 flex-col">
          <AdminTopBar
            profile={profile}
            accountMenuOpen={accountMenuOpen}
            onAccountMenuToggle={() => setAccountMenuOpen((p) => !p)}
            onAccountMenuClose={() => setAccountMenuOpen(false)}
            onMobileMenuOpen={() => setMobileMenuOpen(true)}
            onLogout={handleLogout}
            accountMenuRef={accountMenuRef}
          />

          <main className="custom-scrollbar flex-1 overflow-y-auto px-4 py-6 md:pt-24 lg:h-[calc(100vh-64px)] lg:px-8 lg:py-8 lg:pt-8 2xl:px-12">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile drawer */}
      <AdminMobileDrawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      >
        <AdminSidebar
          {...sidebarProps}
          collapsed={false}
          onToggleCollapse={() => {}}
          variant="mobile"
        />
      </AdminMobileDrawer>
    </div>
  );
}
