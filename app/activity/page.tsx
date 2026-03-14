'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { Ubuntu } from 'next/font/google';
import ActivityNav, { type ActivityTab } from './components/ActivityNav';
import { useActivity } from '../../lib/activityContext';
import { useCart } from '../../lib/cart';
import StoreSection from '../dashboard/components/StoreSection';
import OverviewSection from '../dashboard/components/OverviewSection';
import type {
  MemberProfile,
  StoreItem,
  OverviewStats,
  OverviewStatsExpanded,
  PurchaseFeedback,
} from '../dashboard/types';

const ubuntu = Ubuntu({ subsets: ['latin'], weight: ['400', '700'] });

const moneyFormatter = new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export default function ActivityPage() {
  const [activeTab, setActiveTab] = useState<ActivityTab>('home');
  const { activityFetch, userId } = useActivity();

  // Mağaza state
  const cart = useCart();
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [storeLoading, setStoreLoading] = useState(true);
  const [purchaseFeedback, setPurchaseFeedback] = useState<PurchaseFeedback>({});
  const [purchaseLoadingId, setPurchaseLoadingId] = useState<string | null>(null);

  // Dashboard state
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [overviewStats, setOverviewStats] = useState<OverviewStats | OverviewStatsExpanded | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);

  // Helpers
  const renderPapelAmount = useCallback(
    (value: number) => (
      <span className="inline-flex items-center gap-2">
        <Image src="/papel.gif" alt="papel" width={18} height={18} className="h-4 w-4" />
        <span className="text-white">{moneyFormatter.format(value)}</span>
        <span className="text-xs text-white/40">papel</span>
      </span>
    ),
    [],
  );

  const formatRoleColor = useCallback(
    (color: number) => (color ? `#${color.toString(16).padStart(6, '0')}` : '#64748b'),
    [],
  );

  // Mağaza verilerini yükle
  useEffect(() => {
    if (activeTab !== 'store' && storeItems.length > 0) return;
    if (activeTab !== 'store') return;

    let cancelled = false;
    const load = async () => {
      setStoreLoading(true);
      try {
        const res = await activityFetch('/api/store/items');
        if (res.ok && !cancelled) {
          const data = await res.json();
          setStoreItems(Array.isArray(data) ? data : data.items ?? []);
        }
      } catch (err) {
        console.error('Mağaza yükleme hatası:', err);
      } finally {
        if (!cancelled) setStoreLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [activeTab, activityFetch, storeItems.length]);

  // Dashboard verilerini yükle
  useEffect(() => {
    if (activeTab !== 'dashboard') return;

    let cancelled = false;
    const load = async () => {
      setProfileLoading(true);
      setOverviewLoading(true);
      try {
        const [profileRes, overviewRes, walletRes] = await Promise.all([
          activityFetch('/api/admin/profile'),
          activityFetch('/api/overview'),
          activityFetch('/api/wallet'),
        ]);

        if (!cancelled) {
          if (profileRes.ok) {
            const data = await profileRes.json();
            setProfile(data);
          } else {
            setProfileError('Profil yüklenemedi');
          }

          if (overviewRes.ok) {
            const data = await overviewRes.json();
            setOverviewStats(data);
          }

          if (walletRes.ok) {
            const data = await walletRes.json();
            setWalletBalance(data.balance ?? 0);
          }
        }
      } catch (err) {
        console.error('Dashboard yükleme hatası:', err);
        if (!cancelled) setProfileError('Veriler yüklenemedi');
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
          setOverviewLoading(false);
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [activeTab, activityFetch]);

  // Satın alma işlemi
  const handlePurchase = useCallback(
    async (itemId: string) => {
      setPurchaseLoadingId(itemId);
      try {
        const res = await activityFetch('/api/store/purchase', {
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

  // Sepete ekleme
  const handleAddToCart = useCallback(
    (item: StoreItem) => {
      cart.addToCart(item);
    },
    [cart],
  );

  return (
    <>
      <ActivityNav activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 overflow-y-auto">
        {/* Ana Sayfa */}
        {activeTab === 'home' && <HomeTab />}

        {/* Mağaza */}
        {activeTab === 'store' && (
          <div className="p-4">
            <StoreSection
              storeLoading={storeLoading}
              items={storeItems}
              purchaseLoadingId={purchaseLoadingId}
              purchaseFeedback={purchaseFeedback}
              onPurchase={handlePurchase}
              onAddToCart={handleAddToCart}
              renderPapelAmount={renderPapelAmount}
            />
          </div>
        )}

        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="p-4">
            <OverviewSection
              overviewLoading={overviewLoading}
              overviewStats={overviewStats}
              profileLoading={profileLoading}
              profileError={profileError}
              unauthorized={false}
              profile={profile}
              renderPapelAmount={renderPapelAmount}
              formatRoleColor={formatRoleColor}
            />
          </div>
        )}
      </div>
    </>
  );
}

/** Ana Sayfa tab'ı — landing page'in Activity uyarlaması */
function HomeTab() {
  return (
    <div className="flex-1 flex items-center justify-center relative overflow-hidden min-h-[calc(100vh-48px)]">
      {/* Arka plan efektleri */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#5865F2]/10 to-[#7289DA]/10" />
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#5865F2]/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-[#7289DA]/15 rounded-full blur-3xl animate-pulse" />

      <div className="relative z-10 text-center px-6 max-w-lg">
        <div className="relative inline-block leading-none mb-6">
          <img
            src="/gif/BM.gif"
            alt="cat"
            className="absolute left-1/2 transform -translate-x-1/2 translate-y-6 bottom-full block"
            style={{ margin: 0 }}
          />
          <h1 className={`text-3xl md:text-5xl font-extrabold text-white ${ubuntu.className}`}>
            DiscoWeb
          </h1>
        </div>

        <p className="text-[#cbd5db] text-sm md:text-base leading-relaxed mb-6">
          Discord sunucularınızı yönetmek için epik bir yolculuğa çıkın! Mağaza, promosyonlar ve
          daha fazlasıyla topluluğunuzu büyütün.
        </p>

        <div className="relative w-full max-w-xs mx-auto h-48 md:h-64">
          <Image
            src="/gif/indir.gif"
            alt="Discord Banner"
            fill
            className="object-contain"
            unoptimized
            priority
          />
        </div>

        <p className="text-xs text-[#99AAB5] opacity-75 mt-6">
          DiscoWeb | 2026 &copy; Tüm hakları saklıdır
        </p>
      </div>
    </div>
  );
}
