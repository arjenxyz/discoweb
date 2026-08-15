import fs from 'fs';

let s = fs.readFileSync('app/auth/bot-invite/page.tsx', 'utf8');

if (!s.includes('useTranslation')) {
  s = s.replace(
    "import Image from 'next/image';",
    "import Image from 'next/image';\nimport { useTranslation } from '@/lib/i18nContext';",
  );
  s = s.replace(
    'export default function BotInvitePage() {\n  const router = useRouter();',
    "export default function BotInvitePage() {\n  const router = useRouter();\n  const { t } = useTranslation();",
  );
}

const reps = [
  ['Davet bağlantısı açıldı!', "{t('bot_invite.success_toast')}"],
  [
    'Platform verilerine erişim yetkinizin doğrulanabilmesi için botun, üyesi olduğunuz bir sunucuda aktif durumda bulunması şarttır. Mevcut kayıtlarımızda hesabınızla eşleşen bir sunucu konfigürasyonuna rastlanmamıştır.',
    "{t('bot_invite.body')}",
  ],
  ['Nasıl İlerleyebilirsiniz?', "{t('bot_invite.how_title')}"],
  [
    'Hizmetlerimizi kullanmaya başlamak için botu ilgili sunucuya eklemeniz ve kurulumu tamamlamanız gerekmektedir.',
    "{t('bot_invite.how_1')}",
  ],
  [
    'İşlem sonrası tekrar giriş yaparak panelinizi aktifleştirebilirsiniz.',
    "{t('bot_invite.how_3')}",
  ],
  ['Açılıyor...', "{t('bot_invite.opening')}"],
  ['Botu Sunucuya Ekle', "{t('bot_invite.invite')}"],
  ['Dokümantasyon', "{t('bot_invite.docs')}"],
  ['Geri Dön', "{t('bot_invite.back')}"],
  ['Kullanıcı Sözleşmesi ve Veri Kullanımı', "{t('agreement.title')}"],
  [
    'Kısaca: Hesabınız doğrulanacak ve hizmetimize erişim için gerekli temel bilgiler toplanacaktır.',
    "{t('agreement.lead')}",
  ],
  [
    'Bu hizmet, Discord hesabınız ve sunucu verilerinizle entegre çalışmak için aşağıdaki bilgileri kullanacaktır:',
    "{t('agreement.intro')}",
  ],
  [
    'Discord kullanıcı kimliğiniz, takma adınız ve avatar bilgileri (hesap tanımlama için).',
    "{t('agreement.item_identity')}",
  ],
  [
    'Sunucularınızın listesi ve hangi sunucularda yönetici olduğunuz — hangi sunucularda işlem yapabileceğinizi göstermek için.',
    "{t('agreement.item_guilds')}",
  ],
  [
    'Sunucu üyelik durumunuz ve rolleriniz (yetki kontrolleri için).',
    "{t('agreement.item_roles')}",
  ],
  [
    'Sunucuya katılma bilgisi — bazı özellikler için sunucu erişimi gerekebilir.',
    "{t('agreement.item_join')}",
  ],
  [
    'E-posta adresiniz — hesap doğrulama, önemli bildirimler ve destek için kullanılır.',
    "{t('agreement.item_email')}",
  ],
  [
    'Panel içi işlemleriniz; ör. cüzdan bakiyesi, işlemler ve satın alma geçmişi.',
    "{t('agreement.item_activity')}",
  ],
  ['Bir daha gösterme', "{t('agreement.dont_show_again')}"],
  ['Kabul Etmiyorum — Ana Sayfaya Dön', "{t('agreement.decline_home')}"],
  ['aria-label="Kabul etmiyorum"', "aria-label={t('agreement.aria_decline')}"],
  [
    'aria-label="Kabul ediyorum ve devam et"',
    "aria-label={t('agreement.aria_accept')}",
  ],
  [
    "{isProcessingAgreement ? 'İşleniyor...' : 'Kabul Ediyorum'}",
    "{isProcessingAgreement ? t('agreement.processing') : t('agreement.accept')}",
  ],
  [
    'Kabul etmezseniz, giriş işlemi tamamlanmayacak ve ana sayfaya yönlendirileceksiniz.',
    "{t('agreement.decline_note')}",
  ],
];

for (const [a, b] of reps) {
  if (!s.includes(a)) console.warn('MISS', a.slice(0, 80));
  else s = s.split(a).join(b);
}

s = s.replace(
  /Gerekli izinlerin teknik gerekçelerini ve kurulum rehberini incelemek için aşağıdaki <strong className="text-blue-400">\{t\('bot_invite\.docs'\)\}<\/strong> butonunu kullanabilirsiniz\./,
  "{t('bot_invite.how_2_before')} <strong className=\"text-blue-400\">{t('bot_invite.how_2_strong')}</strong> {t('bot_invite.how_2_after')}",
);

s = s.replace(
  /Bu veriler yalnızca hizmet sağlamak[\s\S]*?sayfasını ziyaret edin\.<\/p>/,
  "{t('agreement.privacy_prefix')}{' '}<a href=\"/privacy\" className=\"text-blue-400 underline\">{t('agreement.privacy_link')}</a>{' '}{t('agreement.privacy_suffix')}</p>",
);

fs.writeFileSync('app/auth/bot-invite/page.tsx', s);
console.log('bot-invite patched');
