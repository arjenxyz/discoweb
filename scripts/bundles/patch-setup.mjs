import fs from 'fs';

const path = 'app/auth/setup/page.tsx';
let s = fs.readFileSync(path, 'utf8');

if (!s.includes("from '@/lib/i18nContext'")) {
  s = s.replace(
    "import {\n  LOCAL_DEV_MOCK_GUILD_NAME,",
    "import { useTranslation } from '@/lib/i18nContext';\nimport {\n  LOCAL_DEV_MOCK_GUILD_NAME,",
  );
}

// RoleSelectDropdown: useTranslation for close/no_roles
if (!s.includes("const { t } = useTranslation();\n  const [open, setOpen]")) {
  s = s.replace(
    '}) {\n  const [open, setOpen] = useState(false);',
    "}) {\n  const { t } = useTranslation();\n  const [open, setOpen] = useState(false);",
  );
}
s = s.replace('aria-label="Kapat"', "aria-label={t('setup.close')}");
s = s.replace(
  '<p className="px-3 py-6 text-center text-xs text-white/40">Rol bulunamadı</p>',
  '<p className="px-3 py-6 text-center text-xs text-white/40">{t(\'setup.no_roles\')}</p>',
);

// Replace STEPS constant with function
s = s.replace(
  /const STEPS = \[[\s\S]*?\];/,
  `function buildSteps(t: (key: string) => string) {
  return [
    { id: 'roles', title: t('setup.step.roles.title'), icon: LuShield, description: t('setup.step.roles.desc') },
    { id: 'logs', title: t('setup.step.logs.title'), icon: LuHardDrive, description: t('setup.step.logs.desc') },
    { id: 'economy', title: t('setup.step.economy.title'), icon: LuSettings, description: t('setup.step.economy.desc') },
    { id: 'bonuses', title: t('setup.step.bonuses.title'), icon: LuZap, description: t('setup.step.bonuses.desc') },
    { id: 'confirm', title: t('setup.step.confirm.title'), icon: LuCheck, description: t('setup.step.confirm.desc') },
  ];
}`,
);

// Main component: add useTranslation + STEPS
if (!s.includes('function SetupWizardPage') && s.includes('export default function')) {
  // find default export function name
}

const mainFnMatch = s.match(/export default function (\w+)/);
if (mainFnMatch) {
  const fn = mainFnMatch[1];
  if (!s.includes(`function ${fn}() {\n  const { t } = useTranslation()`)) {
    s = s.replace(
      `export default function ${fn}() {`,
      `export default function ${fn}() {\n  const { t } = useTranslation();\n  const STEPS = buildSteps(t);`,
    );
  }
}

const reps = [
  ['Erişim Reddedildi', "{t('setup.access_denied_title')}"],
  ['Kurulum için sunucu sahibi veya yönetici olmalısınız.', "{t('setup.access_denied_body')}"],
  ['Geri Dön', "{t('setup.back')}"],
  ["alt={guildName || 'Sunucu'}", "alt={guildName || t('setup.guild_alt')}"],
  ["alreadySetup ? 'Güncelleme Aşaması' : 'Kurulum Aşaması'", "alreadySetup ? t('setup.phase_update') : t('setup.phase_setup')"],
  ['İptal', "{t('setup.cancel')}"],
  ['Adımlar', "{t('setup.steps_heading')}"],
  ['Sistem Rolleri', "{t('setup.roles.heading')}"],
  ['Admin paneli ve üye erişimi için Discord rollerini seçin.', "{t('setup.roles.sub')}"],
  ['label="Yönetici Rolü"', "label={t('setup.roles.admin_label')}"],
  ['hint="Bu rolle Admin Paneline girilir."', "hint={t('setup.roles.admin_hint')}"],
  ['placeholder="Admin rolünü seçin..."', "placeholder={t('setup.roles.admin_placeholder')}"],
  ['label="Üye Rolü"', "label={t('setup.roles.member_label')}"],
  ['hint="Kayıtlı üyelerin temel rolü; papel kazanır."', "hint={t('setup.roles.member_hint')}"],
  ['placeholder="Üye rolünü seçin..."', "placeholder={t('setup.roles.member_placeholder')}"],
  ['Log Yönetimi', "{t('setup.logs.heading')}"],
  ['İşlem logları nereye yazılsın?', "{t('setup.logs.sub')}"],
  ['Bu sunucuya kur', "{t('setup.logs.current_title')}"],
  ['Önerilen', "{t('setup.logs.recommended')}"],
  ['DiscoWeb Logs kategorisi burada açılır.', "{t('setup.logs.current_desc')}"],
  ['Ayrı log sunucusu', "{t('setup.logs.dedicated_title')}"],
  ['Loglar başka bir Discord sunucusuna gider.', "{t('setup.logs.dedicated_desc')}"],
  ['Hedef sunucu ID', "{t('setup.logs.target_id')}"],
  ['Kontrol ediliyor…', "{t('setup.logs.checking')}"],
  ['Geçersiz sunucu ID', "{t('setup.logs.invalid_id')}"],
  ['Bu ID ile sunucu bulunamadı veya bot o sunucuda değil', "{t('setup.logs.not_found')}"],
  ['Bot o sunucuda olmalı.', "{t('setup.logs.bot_must_be')}"],
  ['Dikkat', "{t('setup.logs.warning_title')}"],
  ['Kurulumda eski log kanalları silinip yeniden açılabilir.', "{t('setup.logs.warning_body')}"],
  ['Ekonomi', "{t('setup.economy.heading')}"],
  ['Mesaj ve ses için papel oranlarını ayarlayın.', "{t('setup.economy.sub')}"],
  ['Mesaj Kazancı', "{t('setup.economy.message_title')}"],
  ['Her mesaj için', "{t('setup.economy.message_sub')}"],
  ['Papel / mesaj', "{t('setup.economy.message_unit')}"],
  ['Ses Kazancı', "{t('setup.economy.voice_title')}"],
  ['Her ses dakikası için', "{t('setup.economy.voice_sub')}"],
  ['Papel / dk', "{t('setup.economy.voice_unit')}"],
  ['Bonuslar', "{t('setup.bonuses.heading')}"],
  ['Tag ve boost için ekstra papel.', "{t('setup.bonuses.sub')}"],
  ['Tag Bonusu', "{t('setup.bonuses.tag_title')}"],
  ['İsminde sunucu tagı olanlar', "{t('setup.bonuses.tag_sub')}"],
  ['Boost Bonusu', "{t('setup.bonuses.boost_title')}"],
  ['Sunucuyu boostlayanlar', "{t('setup.bonuses.boost_sub')}"],
  ['Ses / dk', "{t('setup.bonuses.voice_min')}"],
  ['Hazır', "{t('setup.confirm.ready_title')}"],
  ['Ayarlar tamam. Başlatınca sunucuya uygulanır.', "{t('setup.confirm.ready_body')}"],
  ['Kurulumu Başlat', "{t('setup.confirm.start')}"],
  ['Kurulum sürüyor', "{t('setup.confirm.running')}"],
  ['> Geri', "> {t('setup.nav.back')}"], // careful
  ['İleri <', "{t('setup.nav.next')} <"],
];

for (const [a, b] of reps) {
  if (!s.includes(a)) console.warn('MISS UI', a.slice(0, 70));
  else s = s.split(a).join(b);
}

// Mesaj label appears twice for bonuses - replace remaining plain Mesaj in bonus labels carefully
s = s.replaceAll(
  '<label className="mb-1 block text-[10px] font-medium text-white/40">Mesaj</label>',
  "<label className=\"mb-1 block text-[10px] font-medium text-white/40\">{t('setup.bonuses.message')}</label>",
);

// found server status
s = s.replace(
  /\{targetGuildStatus === 'ok' && \(\s*<>\s*<LuCheck className="h-3 w-3" \/> Sunucu bulundu\s*\{targetGuildName \? `: \$\{targetGuildName\}` : ''\}\s*<\/>\s*\)\}/,
  `{targetGuildStatus === 'ok' && (
                              <>
                                <LuCheck className="h-3 w-3" /> {targetGuildName ? t('setup.logs.found_named', { name: targetGuildName }) : t('setup.logs.found')}
                              </>
                            )}`,
);

// nav back button text
s = s.replace(
  '<LuChevronLeft className="w-5 h-5" /> Geri',
  "<LuChevronLeft className=\"w-5 h-5\" /> {t('setup.nav.back')}",
);

// error strings in logic
const errReps = [
  ["throw new Error('Sunucu bilgileri alınamadı');", "throw new Error(t('setup.error.guild_info'));"],
  ["throw new Error('Sunucu rolleri alınamadı');", "throw new Error(t('setup.error.guild_roles'));"],
  [
    "setError('Bu sunucuda bot kurulumu aktif değil. Sunucu sahibi veya yönetici ile iletişime geçin.');",
    "setError(t('setup.error.bot_inactive'));",
  ],
  [
    "setError('Sunucu bilgileri yüklenirken hata oluştu.');",
    "setError(t('setup.error.load_failed'));",
  ],
  [
    "setError('Lütfen hem admin hem de verify rolünü seçin.');",
    "setError(t('setup.error.roles_required'));",
  ],
  ["setError('Sunucu bilgisi bulunamadı.');", "setError(t('setup.error.guild_missing'));"],
  ["throw new Error(errorData.error || 'Kurulum başarısız');", "throw new Error(errorData.error || t('setup.error.failed'));"],
  [
    "setError(setupError instanceof Error ? setupError.message : 'Kurulum sırasında hata oluştu.');",
    "setError(setupError instanceof Error ? setupError.message : t('setup.error.generic'));",
  ],
];
for (const [a, b] of errReps) {
  if (!s.includes(a)) console.warn('MISS ERR', a.slice(0, 70));
  else s = s.split(a).join(b);
}

// progress lines
const prog = [
  ["'> İzinler doğrulanıyor...'", "t('setup.progress.permissions')"],
  ["'> Bot API entegrasyonu başlatılıyor...'", "t('setup.progress.api')"],
  ["'> Webhook servisleri hazırlanıyor...'", "t('setup.progress.webhooks')"],
  ["'> Log sunucusu yapılandırılıyor...'", "t('setup.progress.log_server')"],
  ["'> Örnek roller bağlanıyor...'", "t('setup.progress.mock_roles')"],
  ["'> Ekonomi ayarları yazılıyor...'", "t('setup.progress.economy')"],
  ["'> Bonus kuralları uygulanıyor...'", "t('setup.progress.bonuses')"],
  ["'> Localhost mock kurulum tamamlandı.'", "t('setup.progress.mock_done')"],
  ["'> KURULUM BAŞARILI!'", "t('setup.progress.success')"],
  ["'> Veritabanı kayıtları oluşturuldu...'", "t('setup.progress.db')"],
  ["'> Kurulum başarıyla tamamlandı!'", "t('setup.progress.done')"],
  ["'> Admin Paneline yönlendiriliyorsunuz...'", "t('setup.progress.redirect')"],
  ["'> KURULUM BAŞARISIZ!'", "t('setup.progress.fail')"],
];
for (const [a, b] of prog) {
  if (!s.includes(a)) console.warn('MISS PROG', a);
  else s = s.split(a).join(b);
}

// log setup success/fail line
s = s.replace(
  /`> Log Kurulumu: \$\{resData\.logSetupSuccess \? 'BAŞARILI' : 'BAŞARISIZ \(Lütfen botun sunucuda olduğundan emin olun\)'\}`/,
  "resData.logSetupSuccess ? t('setup.progress.log_ok') : t('setup.progress.log_fail')",
);

// terminal mark detection
s = s.replace(
  "const isError = line.includes('BAŞARISIZ');\n                            const isSuccess = line.includes('BAŞARILI') || line.includes('tamamlandı');",
  "const isError = line.includes(t('setup.marks.fail'));\n                            const isSuccess = line.includes(t('setup.marks.ok')) || line.includes(t('setup.marks.done'));",
);

fs.writeFileSync(path, s);
const left = s.split('\n').filter((l) => /[ğüşıöçĞÜŞİÖÇ]/.test(l) && !l.trim().startsWith('//') && !l.includes('import'));
console.log('remaining TR lines', left.length);
left.slice(0, 30).forEach((l) => console.log(l.trim().slice(0, 120)));
