"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { LuLoader } from 'react-icons/lu';

     interface Guild {
       id: string;
       name: string;
       isAdmin: boolean;
       isSetup: boolean;
       verifyRoleId: string | null;
       isOwner: boolean;
       iconUrl?: string | null;
     }

     interface UserInfo {
       id: string;
       username: string;
       avatar: string | null;
     }

     export default function SelectServerPage() {
       const router = useRouter();
       const [guilds, setGuilds] = useState<Guild[]>([]);
       const [user, setUser] = useState<UserInfo | null>(null);
       const [loading, setLoading] = useState(true);
       const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

       // Agreement modal state
       const [showAgreementModal, setShowAgreementModal] = useState(false);
       const [agreementTargetHref, setAgreementTargetHref] = useState<string | null>(null);
       const [isProcessingAgreement, setIsProcessingAgreement] = useState(false);

       const ensureAgreementAndRedirect = (href: string) => {
         if (typeof window !== 'undefined' && localStorage.getItem('discord_agreement_accepted') === 'true') {
           router.replace(href);
           return;
         }
         setAgreementTargetHref(href);
         setShowAgreementModal(true);
       };

       const loginUrl = useMemo(() => {
         const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID ?? '';
         const redirectUri =
           process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI ?? process.env.NEXT_PUBLIC_REDIRECT_URI ?? '';
         return `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
           redirectUri,
         )}&response_type=code&scope=identify%20guilds`;
       }, []);

       useEffect(() => {
         const fetchUserInfo = async (): Promise<UserInfo | null> => {
           try {
             const response = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
             console.log('SelectServer: /api/auth/me status:', response.status);

             if (response.ok) {
               const userData = await response.json();
               console.log('SelectServer: User data received:', userData);
               setUser(userData);
               return userData as UserInfo;
             } else {
               console.error('SelectServer: Failed to fetch user data:', response.status);
               // Session cookie expired or missing — clear stale localStorage and re-login
               localStorage.removeItem('discordUser');
               localStorage.removeItem('adminGuilds');
               localStorage.removeItem('adminGuildsUpdatedAt');
               router.replace(loginUrl);
             }
           } catch (error) {
             console.error('SelectServer: Failed to fetch user info:', error);
             localStorage.removeItem('discordUser');
             localStorage.removeItem('adminGuilds');
             localStorage.removeItem('adminGuildsUpdatedAt');
             router.replace(loginUrl);
           }
           return null;
         };

         const loadGuilds = async (currentUserId?: string | null) => {
           // localStorage'dan admin sunucuları al
           const adminGuilds = localStorage.getItem('adminGuilds');
           const updatedAt = localStorage.getItem('adminGuildsUpdatedAt');
           setLastUpdatedAt(updatedAt);
           if (!adminGuilds) {
             console.log('No adminGuilds found in localStorage');
             ensureAgreementAndRedirect(loginUrl);
             return;
           }

           try {
             const parsedGuilds = JSON.parse(adminGuilds);
             console.log('Loaded adminGuilds from localStorage:', parsedGuilds);

             // Kullanıcının hala üye olduğu sunucuları filtrele ve owner kontrolü yap
             const filteredGuilds: any[] = [];
             for (const guild of parsedGuilds) {
               try {
                 // Discord API'den kullanıcının bu sunucuda üye olup olmadığını kontrol et
                 const response = await fetch(`/api/discord/guild/${guild.id}/member-check`, {
                   method: 'GET',
                   credentials: 'include',
                   cache: 'no-store',
                 });

                 if (response.ok) {
                   const data = await response.json();
                   if (data.isMember) {
                     let isOwner = Boolean(guild.isOwner);
                     let iconUrl = guild.iconUrl ?? null;
                     // Sunucu sahibi olup olmadığını kontrol et (stale cache'i düzeltmek için her seferinde hesapla)
                     const guildResponse = await fetch(`/api/discord/guild/${guild.id}`, {
                       method: 'GET',
                       credentials: 'include',
                       cache: 'no-store',
                     });

                     if (guildResponse.ok) {
                       const guildData = await guildResponse.json();
                       isOwner = Boolean(currentUserId) && guildData.owner_id === currentUserId;
                       iconUrl = guildData.icon ?? null;
                     }

                     filteredGuilds.push({ ...guild, isOwner, iconUrl });
                   } else {
                     console.log(`User is no longer a member of guild ${guild.name} (${guild.id})`);
                   }
                 } else {
                   // If membership check fails (401/500/etc) we exclude the guild to avoid showing stale results
                   console.warn(`Membership check failed for guild ${guild.id}, status=${response.status}`);
                 }
               } catch (error) {
                 console.error(`Error checking membership for guild ${guild.id}:`, error);
                 // On error, exclude guild to avoid showing stale/non-functional entries
               }
             }

             const withSetupStatus = await Promise.all(
               filteredGuilds.map(async (guild) => {
                 try {
                   const resp = await fetch(`/api/setup/status?guildId=${guild.id}`);
                   if (resp.ok) {
                     const status = (await resp.json()) as { is_setup?: boolean };
                     return { ...guild, isSetup: !!status.is_setup };
                   }
                 } catch {
                   // ignore status fetch errors
                 }
                 return guild;
               }),
             );

             console.log('Filtered guilds (user is still member):', withSetupStatus);
             setGuilds(withSetupStatus);

             // Developer rolü kontrolü yap
             try {
               console.log('Checking developer access for auto-redirect...');
               const developerResponse = await fetch('/api/developer/check-access', { credentials: 'include', cache: 'no-store' });
               if (developerResponse.ok) {
                 const data = await developerResponse.json() as { hasAccess: boolean };
                 if (data.hasAccess) {
                   console.log('User has developer access, redirecting to developer panel');
                   // İlk sunucuyu seç veya hiç sunucu olmasa bile developer paneline git
                   if (withSetupStatus.length > 0) {
                     const firstGuild = withSetupStatus[0];
                     document.cookie = `selected_guild_id=${firstGuild.id}; path=/`;
                     localStorage.setItem('selectedGuildId', firstGuild.id);
                   }
                   router.replace('/developer');
                   return;
                 }
               }
             } catch (error) {
               console.error('Developer access check failed:', error);
             }

             // Eğer hiç üye olunan sunucu kalmadıysa, bot invite sayfasına yönlendir
             if (filteredGuilds.length === 0) {
               console.log('User is not a member of any guilds, redirecting to bot invite');
               router.replace('/auth/bot-invite');
               return;
             }

           } catch (error) {
             console.error('Sunucu bilgileri parse edilemedi:', error);
             router.replace('/auth/error');
             return;
           }

           setLoading(false);
         };

         const initPage = async () => {
           const userData = await fetchUserInfo();
           await loadGuilds(userData?.id ?? null);
         };

         initPage();
       }, [loginUrl, router]);

       const handleSetupGuild = async (guildId: string) => {
         console.log('Setting up guild:', guildId);

         // Seçilen sunucu ID'sini session cookie'ye kaydet

         document.cookie = `selected_guild_id=${guildId}; path=/`;
         localStorage.setItem('selectedGuildId', guildId);

         // Setup sayfasına yönlendir
         router.replace('/auth/setup');
       };

       const handleGuildSelect = async (guildId: string) => {
         console.log('Selecting guild:', guildId);
         console.log('Available guilds:', guilds);

         // Seçilen sunucu ID'sini session cookie'ye kaydet

         document.cookie = `selected_guild_id=${guildId}; path=/`;
         localStorage.setItem('selectedGuildId', guildId);

         // Seçilen sunucunun bilgilerini al
         const selectedGuild = guilds.find(g => g.id === guildId);
         console.log('Selected guild:', selectedGuild);

         const isAdmin = selectedGuild?.isAdmin || false;
         const verifyRoleId = selectedGuild?.verifyRoleId;

         console.log('isAdmin:', isAdmin, 'verifyRoleId:', verifyRoleId);

         // Önce developer rolü kontrolü yap
         try {
           console.log('Checking developer access...');
             const developerResponse = await fetch('/api/developer/check-access', { credentials: 'include', cache: 'no-store' });
           if (developerResponse.ok) {
             console.log('User has developer access, redirecting to developer panel');
             // Developer yönlendirmesi yapılırken selected_guild_id cookie'sini de set et
             document.cookie = `selected_guild_id=${guildId}; path=/`;
             localStorage.setItem('selectedGuildId', guildId);
             router.replace('/developer');
             return;
           }
         } catch (error) {
           console.error('Developer access check failed:', error);
         }

         // Admin ise doğrudan admin paneline yönlendir
         if (isAdmin) {
           console.log('Redirecting to admin panel');
           // Admin yönlendirmesi yapılırken selected_guild_id cookie'sini de set et
        
           document.cookie = `selected_guild_id=${guildId}; path=/`;
           localStorage.setItem('selectedGuildId', guildId);
           router.replace('/admin');
           return;
         }

         // Eğer verify rolü varsa, kullanıcının rolü var mı kontrol et
         if (verifyRoleId) {
           try {
             const response = await fetch('/api/member/check-role', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ guildId }),
             });

             if (response.ok) {
               const data = (await response.json()) as { hasRole: boolean };
               if (data.hasRole) {
                 // Rol var, dashboard'a yönlendir
                 router.replace('/dashboard');
                 return;
               }
             }
           } catch (error) {
             console.error('Rol kontrolü hatası:', error);
           }

           // Rol yok, kurallar sayfasına yönlendir
           router.replace(`/auth/rules?pendingGuildId=${guildId}`);
           return;
         }

         // Verify rolü yoksa, doğrudan dashboard'a yönlendir
         router.replace('/dashboard');
       };

       if (loading) {
         return (
           <div className="flex min-h-screen items-center justify-center bg-[#0b0d12] text-white">
             <div className="text-center">
               <LuLoader className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-500" />
               <p className="text-sm text-white/70">Sunucular yükleniyor...</p>
             </div>
           </div>
         );
       }

       return (
         <div className="min-h-screen bg-[#0b0d12] text-white">
           <nav className="border-b border-white/10 bg-[#0b0d12]">
             <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
               <div className="flex items-center gap-3">
                 {user?.avatar ? (
                   <Image
                     src={user.avatar}
                     alt={user.username}
                     width={44}
                     height={44}
                     className="h-11 w-11 rounded-full border-2 border-white/20"
                   />
                 ) : (
                   <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white/20 bg-slate-600">
                     <span className="text-base font-bold text-white">
                       {user?.username?.charAt(0).toUpperCase() ?? 'U'}
                     </span>
                   </div>
                 )}
                 <div>
                   <p className="text-sm font-semibold text-white">{user?.username ?? 'Discord Kullanıcısı'}</p>
                   <p className="text-xs text-white/50">Discord hesabınızla giriş yaptınız</p>
                 </div>
               </div>
               <button
                 onClick={() => router.replace('/dashboard')}
                 className="text-xs text-white/50 hover:text-white/70 transition-colors"
               >
                 Ana sayfaya dön
               </button>
             </div>
           </nav>

           <main className="mx-auto w-full max-w-5xl px-4 py-8">
             <div className="mb-6">
               <h1 className="text-2xl font-bold text-white mb-2">Sunucu Seçin</h1>
               <p className="text-sm text-white/70">İşlem yapmak istediğiniz sunucuyu seçin</p>
               <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/50">
                 {lastUpdatedAt && (
                   <span>Son güncelleme: {new Date(lastUpdatedAt).toLocaleString('tr-TR')}</span>
                 )}
                 <button
                   onClick={() => ensureAgreementAndRedirect(loginUrl)}
                   className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                 >
                   Sunucuları yenile
                 </button>
               </div>
             </div>

             <div className="space-y-3">
               {guilds.length === 0 ? (
                 <div className="text-center p-8 bg-[#1a1d23] rounded-lg border border-white/10">
                   <p className="text-white/70 mb-4">
                     Erişilebilir hiç sunucu bulunamadı.
                   </p>
                   <p className="text-sm text-white/50">
                     Bot&apos;un bulunduğu sunucularda üye olduğunuzdan emin olun.
                   </p>
                 </div>
               ) : (
                 guilds.map((guild) => {
                   const canSetup = !guild.isSetup && guild.isOwner;
                   const canEnter = guild.isSetup || canSetup;
                   return (
                   <button
                     key={guild.id}
                     onClick={() => {
                       if (guild.isSetup) {
                         handleGuildSelect(guild.id);
                         return;
                       }
                       if (canSetup) {
                         handleSetupGuild(guild.id);
                       }
                     }}
                     disabled={!canEnter}
                     className={`w-full p-4 bg-[#1a1d23] rounded-lg border transition-colors text-left ${
                       guild.isSetup
                         ? 'border-white/10 hover:bg-[#2a2d33] cursor-pointer'
                         : canSetup
                           ? 'border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 cursor-pointer'
                           : 'border-white/5 bg-[#14171d] opacity-70 cursor-not-allowed'
                     }`}
                   >
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-4">
                         {guild.iconUrl ? (
                           <Image
                             src={guild.iconUrl}
                             alt={guild.name}
                             width={56}
                             height={56}
                             className="h-14 w-14 rounded-2xl border border-white/10 object-cover"
                           />
                         ) : (
                           <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-lg font-semibold text-white/80">
                             {guild.name.charAt(0).toUpperCase()}
                           </div>
                         )}
                         <div>
                           <h3 className="font-medium text-white">{guild.name}</h3>
                           <p className="text-xs text-white/50">ID: {guild.id}</p>
                           {!guild.isSetup && canSetup && (
                             <p className="text-xs text-orange-400 mt-1">🔧 Bu sunucu kurulmamış - Tıklayarak kurulum yapın</p>
                           )}
                           {!guild.isSetup && !canSetup && (
                             <p className="text-xs text-white/50 mt-1">Kurulum sadece sunucu sahibi tarafından yapılabilir.</p>
                           )}
                         </div>
                       </div>
                       {guild.isOwner ? (
                         <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
                           Sahip
                         </span>
                       ) : guild.isAdmin ? (
                         <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                           Yönetici
                         </span>
                       ) : (
                         <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                           Üye
                         </span>
                       )}
                     </div>
                   </button>
                 );
                 })
               )}
             </div>
           </main>

           {showAgreementModal && (
             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
               <div className="w-full max-w-2xl mx-4 bg-white/5 border border-white/10 rounded-lg p-6 sm:p-8 shadow-2xl">
                 <div className="flex items-start justify-between gap-4">
                   <div>
                     <h3 className="text-lg font-semibold text-white">Kullanıcı Sözleşmesi ve Veri Kullanımı</h3>
                     <p className="text-sm text-white/70 mt-2">Discord ile giriş yapmadan önce lütfen aşağıdaki veri kullanımını onaylayın.</p>
                   </div>
                 </div>

                 <div className="mt-4 space-y-3 text-sm text-white/70">
                   <p>Bu hizmet, Discord hesabınız ve sunucu verilerinizle entegre çalışmak için aşağıdaki bilgileri kullanacaktır:</p>
                   <ul className="list-disc ml-5 mt-2">
                     <li>Discord kullanıcı kimliğiniz, takma adınız ve avatar bilgileri.</li>
                     <li>Sunucu üyelik durumunuz ve rolleriniz (kurulum, yetki kontrolü için).</li>
                     <li>Panel içi işlemleriniz; ör. cüzdan bakiyesi, işlemler ve satın alma geçmişi.</li>
                     <li>Botun düzgün çalışabilmesi için gerektiğinde teknik log bilgileri.</li>
                   </ul>

                   <p className="mt-2">Bu veriler yalnızca hizmet sağlamak, hesap doğrulaması ve talep ettiğiniz özellikleri çalıştırmak için kullanılacaktır. Ayrıntılı gizlilik politikamız için lütfen <a href="/privacy" className="text-blue-400 underline">Gizlilik</a> sayfasını ziyaret edin.</p>

                   <p className="mt-2 text-sm text-white/60">Kabul etmezseniz, giriş işlemi gerçekleşmeyecek ve ana sayfaya yönlendirileceksiniz.</p>
                 </div>

                 <div className="mt-6 flex items-center justify-end gap-3">
                   <button
                     onClick={() => { setShowAgreementModal(false); router.replace('/'); }}
                     className="rounded-md px-4 py-2 bg-white/5 border border-white/10 text-sm text-white/80 hover:bg-white/10"
                   >
                     Kabul Etmiyorum — Ana Sayfaya Dön
                   </button>
                   <button
                     onClick={() => {
                       setIsProcessingAgreement(true);
                       try {
                         if (typeof window !== 'undefined') {
                           localStorage.setItem('discord_agreement_accepted', 'true');
                         }
                         if (agreementTargetHref) {
                           router.replace(agreementTargetHref);
                         }
                       } finally {
                         setIsProcessingAgreement(false);
                         setShowAgreementModal(false);
                         setAgreementTargetHref(null);
                       }
                     }}
                     disabled={isProcessingAgreement}
                     className="rounded-md px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-medium hover:from-blue-700 hover:to-blue-600 disabled:opacity-50"
                   >
                     {isProcessingAgreement ? 'İşleniyor...' : 'Kabul Ediyorum ve Devam Et'}
                   </button>
                 </div>
               </div>
             </div>
           )}

         </div>
       );
     }
