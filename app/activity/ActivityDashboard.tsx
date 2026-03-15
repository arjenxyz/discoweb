'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DashboardHeader from '../dashboard/components/DashboardHeader';
import OverviewSection from '../dashboard/components/OverviewSection';
import StoreSection from '../dashboard/components/StoreSection';
import MailSection from '../dashboard/components/MailSection';
import { sanitizeHtml } from '@/lib/sanitizeHtml';
import { useActivity } from '../../lib/activityContext';
import { useCart } from '../../lib/cart';
import type {
  MemberProfile,
  OverviewStats,
  OverviewStatsExpanded,
  StoreItem,
  MailItem,
  Notification,
  Section,
  PurchaseFeedback,
} from '../dashboard/types';

export default function ActivityDashboard() {
  const { activityFetch, username, avatar } = useActivity();
  const cart = useCart();

  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [walletBalance, setWalletBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(true);

  const [overviewStats, setOverviewStats] = useState<OverviewStats | OverviewStatsExpanded | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);

  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [storeItemsLoading, setStoreItemsLoading] = useState(true);

  const [mailItems, setMailItems] = useState<MailItem[]>([]);
  const [mailLoading, setMailLoading] = useState(true);
  const [mailError, setMailError] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsMenuRef = useRef<HTMLDivElement | null>(null);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsMenuRef = useRef<HTMLDivElement | null>(null);

  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferRecipientId, setTransferRecipientId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);

  const [purchaseFeedback, setPurchaseFeedback] = useState<PurchaseFeedback>({});
  const [purchaseLoadingId, setPurchaseLoadingId] = useState<string | null>(null);

  const [maintenanceFlags, setMaintenanceFlags] = useState<Record<string, { is_active: boolean; reason: string | null; updated_by?: string | null }> | null>(null);
  const [maintenanceLoading, setMaintenanceLoading] = useState(true);
  const [maintenanceUpdaters, setMaintenanceUpdaters] = useState<Record<string, { id: string; name: string; avatarUrl: string }>>({});

  const refreshMailRef = useRef<() => Promise<void>>();
  const refreshWalletRef = useRef<() => Promise<void>>();
  const refreshStoreRef = useRef<() => Promise<void>>();

  const moneyFormatter = useMemo(() => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }), []);

  const renderNotificationBody = useCallback((body: string) => {
    return <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(body) }} />;
  }, []);

  const fetchProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const res = await activityFetch('/api/member/profile');
      if (res.ok) {
        const data = (await res.json()) as MemberProfile;
        setProfile(data);
        setProfileError(null);
      } else {
        setProfileError('Profil bilgileri alınamadı.');
      }
    } catch {
      setProfileError('Profil bilgileri alınamadı.');
    } finally {
      setProfileLoading(false);
    }
  }, [activityFetch]);

  const refreshWalletBalance = useCallback(async () => {
    setWalletLoading(true);
    try {
      const response = await activityFetch('/api/member/wallet');
      if (response.ok) {
        const data = (await response.json()) as { balance: number };
        setWalletBalance(Number(data.balance ?? 0));
      }
    } catch {
      // ignore
    } finally {
      setWalletLoading(false);
    }
  }, [activityFetch]);

  const fetchOverview = useCallback(async () => {
    setOverviewLoading(true);
    try {
      const response = await activityFetch('/api/member/overview');
      if (response.ok) {
        const data = (await response.json()) as OverviewStats | OverviewStatsExpanded;
        setOverviewStats(data);
      }
    } catch {
      // ignore
    } finally {
      setOverviewLoading(false);
    }
  }, [activityFetch]);

  const fetchStoreItems = useCallback(async () => {
    setStoreItemsLoading(true);
    try {
      const response = await activityFetch('/api/member/store');
      if (response.ok) {
        const data = (await response.json()) as { items: StoreItem[] };
        setStoreItems(data.items ?? []);
      }
    } catch {
      // ignore
    } finally {
      setStoreItemsLoading(false);
    }
  }, [activityFetch]);

  const refreshMail = useCallback(async () => {
    setMailLoading(true);
    try {
      const response = await activityFetch('/api/mail');
      if (response.ok) {
        const data = (await response.json()) as MailItem[];
        setMailItems(data);
        setMailError(null);
      } else {
        setMailError('Mail verisi alınamadı');
      }
    } catch {
      setMailError('Mail verisi alınamadı');
    } finally {
      setMailLoading(false);
    }
  }, [activityFetch]);

  useEffect(() => {
    void fetchProfile();
    void refreshWalletBalance();
    void fetchOverview();
    void fetchStoreItems();
    void refreshMail();

    const interval = setInterval(() => {
      void refreshMailRef.current?.();
      void refreshWalletRef.current?.();
      void refreshStoreRef.current?.();
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchProfile, refreshWalletBalance, fetchOverview, fetchStoreItems, refreshMail]);

  useEffect(() => {
    refreshMailRef.current = refreshMail;
    refreshWalletRef.current = refreshWalletBalance;
    refreshStoreRef.current = fetchStoreItems;
  }, [refreshMail, refreshWalletBalance, fetchStoreItems]);

  useEffect(() => {
    if (!settingsOpen) return undefined;
    const handleClick = (event: MouseEvent) => {
      if (!settingsMenuRef.current) return;
      if (!settingsMenuRef.current.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [settingsOpen]);

  useEffect(() => {
    if (!notificationsOpen) return undefined;
    const handleClick = (event: MouseEvent) => {
      if (!notificationsMenuRef.current) return;
      if (!notificationsMenuRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [notificationsOpen]);

  const handlePurchase = useCallback(
    async (itemId: string) => {
      setPurchaseLoadingId(itemId);
      try {
        const res = await activityFetch('/api/member/purchase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId }),
        });
        const data = await res.json();
        if (res.ok) {
          setPurchaseFeedback((prev) => ({
            ...prev,
            [itemId]: { status: 'success', message: data.message ?? 'Satın alma başarılı!' },
          }));
        } else {
          setPurchaseFeedback((prev) => ({
            ...prev,
            [itemId]: { status: 'error', message: data.error ?? 'Satın alma başarısız' },
          }));
        }
      } catch {
        setPurchaseFeedback((prev) => ({
          ...prev,
          [itemId]: { status: 'error', message: 'Bağlantı hatası' },
        }));
      } finally {
        setPurchaseLoadingId(null);
      }
    },
    [activityFetch],
  );

  const handleAddToCart = useCallback(
    (item: StoreItem) => {
      cart.addToCart(item);
    },
    [cart],
  );

  const mailUnreadCount = useMemo(() => mailItems.filter((m) => !m.is_read).length, [mailItems]);

  const navigation = useMemo(
    () => ({
      activeSection,
      onNavigate: (section: Section) => setActiveSection(section),
    }),
    [activeSection],
  );

  return (
    <div className="min-h-screen min-w-0 bg-[#0b0d12] text-[#dbdee1] flex flex-col">
      <DashboardHeader
        unauthorized={false}
        walletLoading={walletLoading}
        walletBalance={walletBalance}
        loginUrl=""
        isDeveloper={false}
        isAdmin={false}
        navigation={navigation}
        profile={
          profile
            ? { name: profile.displayName || profile.username, username: profile.username, avatarUrl: profile.avatarUrl }
            : null
        }
        profileLoading={profileLoading}
        notifications={{
          open: notificationsOpen,
          unreadCount: mailUnreadCount,
          loading: notificationsLoading,
          items: notifications,
          onToggle: () => setNotificationsOpen((o) => !o),
          onOpenNotification: (item) => {
            // nothing for now
            console.log('open notification', item);
          },
          onOpenModal: undefined,
          menuRef: notificationsMenuRef,
        }}
        renderNotificationBody={renderNotificationBody}
        settings={{
          open: settingsOpen,
          onToggle: () => setSettingsOpen((o) => !o),
          onOpenSettings: () => setSettingsOpen(true),
          onOpenTransfer: () => setTransferModalOpen(true),
          onOpenPromotions: () => {},
          onOpenDiscounts: () => {},
          logoutHref: '/',
          menuRef: settingsMenuRef,
        }}
        server={{
          data: null,
          loading: false,
          guilds: [],
          onSelectServer: () => {},
        }}
        mailUnreadCount={mailUnreadCount}
      />

      <main className="flex-1 mx-auto flex max-w-6xl flex-col gap-6 px-6 pb-10 pt-8">
        {activeSection === 'overview' && (
          <OverviewSection
            overviewLoading={overviewLoading}
            overviewStats={overviewStats}
            profileLoading={profileLoading}
            profileError={profileError}
            unauthorized={false}
            profile={profile}
            renderPapelAmount={(value) => (
              <span className="inline-flex items-center gap-1.5">
                <img src="/papel.gif" alt="papel" width={16} height={16} className="h-3.5 w-3.5" />
                <span className="text-[#dbdee1]">{moneyFormatter.format(value)}</span>
                <span className="text-[10px] text-[#949ba4]">papel</span>
              </span>
            )}
            formatRoleColor={(color) => (color ? `#${color.toString(16).padStart(6, '0')}` : '#949ba4')}
          />
        )}

        {activeSection === 'store' && (
          <StoreSection
            storeLoading={storeItemsLoading}
            items={storeItems}
            purchaseLoadingId={purchaseLoadingId}
            purchaseFeedback={purchaseFeedback}
            onPurchase={handlePurchase}
            onAddToCart={handleAddToCart}
            renderPapelAmount={(value) => (
              <span className="inline-flex items-center gap-1.5">
                <img src="/papel.gif" alt="papel" width={16} height={16} className="h-3.5 w-3.5" />
                <span className="text-[#dbdee1]">{moneyFormatter.format(value)}</span>
                <span className="text-[10px] text-[#949ba4]">papel</span>
              </span>
            )}
          />
        )}

        {activeSection === 'mail' && (
          <div className="h-full">
            <MailSection
              loading={mailLoading}
              error={mailError}
              items={mailItems}
              disableRouting
              onBack={() => setActiveSection('overview')}
            />
          </div>
        )}

        {activeSection === 'leaderboard' && (
          <div className="rounded-xl bg-white/5 border border-white/10 p-6 text-white/70">
            <h2 className="text-lg font-semibold text-white">Sıralama</h2>
            <p className="mt-2">Sıralama bölümü Activity içinde hazır değil, yakında gelecek.</p>
          </div>
        )}
      </main>
    </div>
  );
}
