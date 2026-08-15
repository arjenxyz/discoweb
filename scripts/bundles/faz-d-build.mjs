/**
 * Build Faz D i18n bundle (docs, privacy, terms, economy, important, chat, cart)
 * for all 11 locales → scripts/bundles/faz-d-all.json
 *
 * Usage: node scripts/bundles/faz-d-build.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LANGS = ['tr', 'en', 'pt', 'id', 'es', 'de', 'fr', 'hu', 'ja', 'ko', 'ru'];

function setPath(obj, dotted, value) {
  const parts = dotted.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!cur[p] || typeof cur[p] !== 'object') cur[p] = {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
}

function fromFlat(flat) {
  const out = {};
  for (const [k, v] of Object.entries(flat)) setPath(out, k, v);
  return out;
}

/** Shared product terms kept across locales */
const PRODUCT = {
  discoweb: 'DiscoWeb',
  papel: 'Papel',
  discord: 'Discord',
  activity: 'Activity',
  supabase: 'Supabase',
  vercel: 'Vercel',
};

// ─────────────────────────────────────────────
// Flat key maps: lang → { 'docs.hub.title': '...', ... }
// ─────────────────────────────────────────────

const maps = Object.fromEntries(LANGS.map((l) => [l, {}]));

function add(key, values) {
  for (const lang of LANGS) {
    if (values[lang] == null) {
      throw new Error(`Missing ${lang} for ${key}`);
    }
    maps[lang][key] = values[lang];
  }
}

function addMany(prefix, rows) {
  for (const [suffix, values] of Object.entries(rows)) {
    add(`${prefix}.${suffix}`, values);
  }
}

// ═══════════════════════════════════════════
// CART
// ═══════════════════════════════════════════
addMany('cart', {
  title: {
    tr: 'Sepetim', en: 'My Cart', pt: 'Meu carrinho', id: 'Keranjang saya',
    es: 'Mi carrito', de: 'Mein Warenkorb', fr: 'Mon panier', hu: 'Kosaram',
    ja: 'カート', ko: '내 장바구니', ru: 'Моя корзина',
  },
  item_count: {
    tr: '{count} Ürün', en: '{count} items', pt: '{count} itens', id: '{count} item',
    es: '{count} artículos', de: '{count} Artikel', fr: '{count} articles', hu: '{count} termék',
    ja: '{count} 点', ko: '{count}개 상품', ru: '{count} товар(ов)',
  },
  empty: {
    tr: 'Sepetin şimdilik boş duruyor.', en: 'Your cart is empty for now.',
    pt: 'Seu carrinho está vazio por enquanto.', id: 'Keranjangmu masih kosong.',
    es: 'Tu carrito está vacío por ahora.', de: 'Dein Warenkorb ist momentan leer.',
    fr: 'Votre panier est vide pour le moment.', hu: 'A kosarad egyelőre üres.',
    ja: 'カートは空です。', ko: '장바구니가 비어 있습니다.', ru: 'Корзина пока пуста.',
  },
  continue_shopping: {
    tr: 'Alışverişe Dön', en: 'Continue shopping', pt: 'Continuar comprando', id: 'Lanjut belanja',
    es: 'Seguir comprando', de: 'Weiter einkaufen', fr: 'Continuer vos achats', hu: 'Vásárlás folytatása',
    ja: '買い物を続ける', ko: '쇼핑 계속하기', ru: 'Продолжить покупки',
  },
  price_papel: {
    tr: '{price} Papel', en: '{price} Papel', pt: '{price} Papel', id: '{price} Papel',
    es: '{price} Papel', de: '{price} Papel', fr: '{price} Papel', hu: '{price} Papel',
    ja: '{price} Papel', ko: '{price} Papel', ru: '{price} Papel',
  },
  use_discount: {
    tr: 'İndirim Kodu Kullan', en: 'Use discount code', pt: 'Usar código de desconto', id: 'Gunakan kode diskon',
    es: 'Usar código de descuento', de: 'Rabattcode verwenden', fr: 'Utiliser un code promo', hu: 'Kedvezménykód használata',
    ja: '割引コードを使う', ko: '할인 코드 사용', ru: 'Использовать промокод',
  },
  code_placeholder: {
    tr: 'Kodu giriniz', en: 'Enter code', pt: 'Digite o código', id: 'Masukkan kode',
    es: 'Introduce el código', de: 'Code eingeben', fr: 'Saisir le code', hu: 'Add meg a kódot',
    ja: 'コードを入力', ko: '코드 입력', ru: 'Введите код',
  },
  add: {
    tr: 'Ekle', en: 'Add', pt: 'Adicionar', id: 'Tambah', es: 'Añadir', de: 'Hinzufügen',
    fr: 'Ajouter', hu: 'Hozzáadás', ja: '追加', ko: '추가', ru: 'Добавить',
  },
  remove: {
    tr: 'Kaldır', en: 'Remove', pt: 'Remover', id: 'Hapus', es: 'Quitar', de: 'Entfernen',
    fr: 'Retirer', hu: 'Eltávolítás', ja: '削除', ko: '제거', ru: 'Убрать',
  },
  hide_coupons: {
    tr: 'Kuponları kapat', en: 'Hide coupons', pt: 'Ocultar cupons', id: 'Sembunyikan kupon',
    es: 'Ocultar cupones', de: 'Gutscheine ausblenden', fr: 'Masquer les coupons', hu: 'Kuponok elrejtése',
    ja: 'クーポンを隠す', ko: '쿠폰 숨기기', ru: 'Скрыть купоны',
  },
  show_coupons: {
    tr: 'Kuponları aç', en: 'Show coupons', pt: 'Mostrar cupons', id: 'Tampilkan kupon',
    es: 'Mostrar cupones', de: 'Gutscheine anzeigen', fr: 'Afficher les coupons', hu: 'Kuponok megjelenítése',
    ja: 'クーポンを表示', ko: '쿠폰 보기', ru: 'Показать купоны',
  },
  min_spend: {
    tr: 'Min. {amount} Papel', en: 'Min. {amount} Papel', pt: 'Mín. {amount} Papel', id: 'Min. {amount} Papel',
    es: 'Mín. {amount} Papel', de: 'Min. {amount} Papel', fr: 'Min. {amount} Papel', hu: 'Min. {amount} Papel',
    ja: '最低 {amount} Papel', ko: '최소 {amount} Papel', ru: 'Мин. {amount} Papel',
  },
  usage: {
    tr: 'Kullanım: {used} / {limit}', en: 'Usage: {used} / {limit}', pt: 'Uso: {used} / {limit}',
    id: 'Pemakaian: {used} / {limit}', es: 'Uso: {used} / {limit}', de: 'Nutzung: {used} / {limit}',
    fr: 'Utilisation : {used} / {limit}', hu: 'Használat: {used} / {limit}',
    ja: '利用: {used} / {limit}', ko: '사용: {used} / {limit}', ru: 'Использование: {used} / {limit}',
  },
  welcome_discount: {
    tr: 'Hoşgeldin İndirimi', en: 'Welcome discount', pt: 'Desconto de boas-vindas', id: 'Diskon selamat datang',
    es: 'Descuento de bienvenida', de: 'Willkommensrabatt', fr: 'Remise de bienvenue', hu: 'Üdvözlő kedvezmény',
    ja: 'ウェルカム割引', ko: '웰컴 할인', ru: 'Приветственная скидка',
  },
  percent_off: {
    tr: '{percent}% indirim', en: '{percent}% off', pt: '{percent}% de desconto', id: 'Diskon {percent}%',
    es: '{percent}% de descuento', de: '{percent} % Rabatt', fr: '{percent} % de réduction', hu: '{percent}% kedvezmény',
    ja: '{percent}% オフ', ko: '{percent}% 할인', ru: 'Скидка {percent}%',
  },
  used_count: {
    tr: '{used}/{limit} kullanıldı', en: '{used}/{limit} used', pt: '{used}/{limit} usados', id: '{used}/{limit} dipakai',
    es: '{used}/{limit} usados', de: '{used}/{limit} genutzt', fr: '{used}/{limit} utilisés', hu: '{used}/{limit} felhasználva',
    ja: '{used}/{limit} 使用済み', ko: '{used}/{limit} 사용', ru: '{used}/{limit} использовано',
  },
  use: {
    tr: 'Kullan', en: 'Use', pt: 'Usar', id: 'Pakai', es: 'Usar', de: 'Einlösen',
    fr: 'Utiliser', hu: 'Beváltás', ja: '使う', ko: '사용', ru: 'Применить',
  },
  total_label: {
    tr: 'Toplam Tutar', en: 'Total', pt: 'Total', id: 'Total', es: 'Total', de: 'Gesamtsumme',
    fr: 'Total', hu: 'Összesen', ja: '合計', ko: '합계', ru: 'Итого',
  },
  papel: {
    tr: 'Papel', en: 'Papel', pt: 'Papel', id: 'Papel', es: 'Papel', de: 'Papel',
    fr: 'Papel', hu: 'Papel', ja: 'Papel', ko: 'Papel', ru: 'Papel',
  },
  discount_amount: {
    tr: '-{amount} Papel İndirim', en: '-{amount} Papel discount', pt: '-{amount} Papel de desconto',
    id: '-{amount} Papel diskon', es: '-{amount} Papel de descuento', de: '-{amount} Papel Rabatt',
    fr: '-{amount} Papel de réduction', hu: '-{amount} Papel kedvezmény',
    ja: '-{amount} Papel 割引', ko: '-{amount} Papel 할인', ru: '-{amount} Papel скидка',
  },
  need_more_for_coupon: {
    tr: 'Kupon için {amount} Papel daha gerekli', en: '{amount} more Papel needed for coupon',
    pt: 'Faltam {amount} Papel para o cupom', id: 'Perlu {amount} Papel lagi untuk kupon',
    es: 'Faltan {amount} Papel para el cupón', de: 'Noch {amount} Papel für den Gutschein nötig',
    fr: 'Il manque {amount} Papel pour le coupon', hu: 'Még {amount} Papel kell a kuponhoz',
    ja: 'クーポンにはあと {amount} Papel 必要です', ko: '쿠폰에 {amount} Papel 더 필요', ru: 'Для купона нужно ещё {amount} Papel',
  },
  processing: {
    tr: 'İşleniyor...', en: 'Processing...', pt: 'Processando...', id: 'Memproses...',
    es: 'Procesando...', de: 'Wird verarbeitet...', fr: 'Traitement...', hu: 'Feldolgozás...',
    ja: '処理中...', ko: '처리 중...', ru: 'Обработка...',
  },
  success: {
    tr: 'Başarılı', en: 'Success', pt: 'Sucesso', id: 'Berhasil', es: 'Listo', de: 'Erfolgreich',
    fr: 'Réussi', hu: 'Sikeres', ja: '完了', ko: '성공', ru: 'Успешно',
  },
  insufficient_balance: {
    tr: 'Yetersiz Bakiye', en: 'Insufficient balance', pt: 'Saldo insuficiente', id: 'Saldo tidak cukup',
    es: 'Saldo insuficiente', de: 'Unzureichendes Guthaben', fr: 'Solde insuffisant', hu: 'Nincs elég egyenleg',
    ja: '残高不足', ko: '잔액 부족', ru: 'Недостаточно средств',
  },
  checkout_failed: {
    tr: 'İşlem Tamamlanamadı', en: 'Checkout failed', pt: 'Pagamento falhou', id: 'Checkout gagal',
    es: 'Pago fallido', de: 'Zahlung fehlgeschlagen', fr: 'Paiement échoué', hu: 'Fizetés sikertelen',
    ja: '決済に失敗', ko: '결제 실패', ru: 'Оплата не удалась',
  },
  limit_short: {
    tr: 'Limit Yetersiz', en: 'Below minimum', pt: 'Abaixo do mínimo', id: 'Di bawah minimum',
    es: 'Por debajo del mínimo', de: 'Unter dem Minimum', fr: 'Sous le minimum', hu: 'Minimum alatt',
    ja: '最低額未満', ko: '최소 금액 미달', ru: 'Ниже минимума',
  },
  checkout: {
    tr: 'Ödemeyi Tamamla', en: 'Complete payment', pt: 'Concluir pagamento', id: 'Selesaikan pembayaran',
    es: 'Completar pago', de: 'Zahlung abschließen', fr: 'Payer', hu: 'Fizetés befejezése',
    ja: '支払いを完了', ko: '결제 완료', ru: 'Оплатить',
  },
  err_empty_cart: {
    tr: 'Sepette ürün yok', en: 'Cart is empty', pt: 'Carrinho vazio', id: 'Keranjang kosong',
    es: 'El carrito está vacío', de: 'Warenkorb ist leer', fr: 'Le panier est vide', hu: 'A kosár üres',
    ja: 'カートが空です', ko: '장바구니가 비어 있습니다', ru: 'Корзина пуста',
  },
  err_add_more: {
    tr: '{amount} Papel daha ekle', en: 'Add {amount} more Papel', pt: 'Adicione mais {amount} Papel',
    id: 'Tambah {amount} Papel lagi', es: 'Añade {amount} Papel más', de: 'Noch {amount} Papel hinzufügen',
    fr: 'Ajoutez encore {amount} Papel', hu: 'Adj hozzá még {amount} Papelt',
    ja: 'あと {amount} Papel 追加', ko: '{amount} Papel 더 추가', ru: 'Добавьте ещё {amount} Papel',
  },
  err_already_used: {
    tr: 'Bu kodu zaten kullandınız', en: 'You already used this code', pt: 'Você já usou este código',
    id: 'Kamu sudah memakai kode ini', es: 'Ya usaste este código', de: 'Du hast diesen Code bereits genutzt',
    fr: 'Vous avez déjà utilisé ce code', hu: 'Ezt a kódot már felhasználtad',
    ja: 'このコードは既に使用済みです', ko: '이미 사용한 코드입니다', ru: 'Вы уже использовали этот код',
  },
  err_invalid_code: {
    tr: 'Kod geçersiz', en: 'Invalid code', pt: 'Código inválido', id: 'Kode tidak valid',
    es: 'Código no válido', de: 'Ungültiger Code', fr: 'Code invalide', hu: 'Érvénytelen kód',
    ja: '無効なコード', ko: '유효하지 않은 코드', ru: 'Неверный код',
  },
  err_coupon_active: {
    tr: 'Kupon aktif!', en: 'Coupon applied!', pt: 'Cupom ativado!', id: 'Kupon aktif!',
    es: '¡Cupón aplicado!', de: 'Gutschein aktiv!', fr: 'Coupon activé !', hu: 'Kupon aktív!',
    ja: 'クーポン適用！', ko: '쿠폰 적용됨!', ru: 'Купон применён!',
  },
  err_generic: {
    tr: 'Hata', en: 'Error', pt: 'Erro', id: 'Kesalahan', es: 'Error', de: 'Fehler',
    fr: 'Erreur', hu: 'Hiba', ja: 'エラー', ko: '오류', ru: 'Ошибка',
  },
  err_connection: {
    tr: 'Bağlantı hatası', en: 'Connection error', pt: 'Erro de conexão', id: 'Kesalahan koneksi',
    es: 'Error de conexión', de: 'Verbindungsfehler', fr: 'Erreur de connexion', hu: 'Kapcsolati hiba',
    ja: '接続エラー', ko: '연결 오류', ru: 'Ошибка соединения',
  },
  err_cart_limit: {
    tr: 'Sepet limiti için {amount} Papel daha gerekli', en: '{amount} more Papel needed for cart minimum',
    pt: 'Faltam {amount} Papel para o mínimo do carrinho', id: 'Perlu {amount} Papel lagi untuk minimum keranjang',
    es: 'Faltan {amount} Papel para el mínimo del carrito', de: 'Noch {amount} Papel für das Warenkorb-Minimum nötig',
    fr: 'Il manque {amount} Papel pour le minimum du panier', hu: 'Még {amount} Papel kell a kosár minimumához',
    ja: 'カート最低額にあと {amount} Papel 必要', ko: '장바구니 최소에 {amount} Papel 더 필요', ru: 'Для минимума корзины нужно ещё {amount} Papel',
  },
  err_balance_short: {
    tr: 'Yetersiz bakiye! (Eksik: {amount})', en: 'Insufficient balance! (Short: {amount})',
    pt: 'Saldo insuficiente! (Faltam: {amount})', id: 'Saldo tidak cukup! (Kurang: {amount})',
    es: '¡Saldo insuficiente! (Faltan: {amount})', de: 'Unzureichendes Guthaben! (Fehlen: {amount})',
    fr: 'Solde insuffisant ! (Manque : {amount})', hu: 'Nincs elég egyenleg! (Hiány: {amount})',
    ja: '残高不足！（不足: {amount}）', ko: '잔액 부족! (부족: {amount})', ru: 'Недостаточно средств! (Не хватает: {amount})',
  },
  err_payment_failed: {
    tr: 'Ödeme başarısız', en: 'Payment failed', pt: 'Pagamento falhou', id: 'Pembayaran gagal',
    es: 'Pago fallido', de: 'Zahlung fehlgeschlagen', fr: 'Paiement échoué', hu: 'Fizetés sikertelen',
    ja: '支払いに失敗', ko: '결제 실패', ru: 'Оплата не удалась',
  },
  err_occurred: {
    tr: 'Hata oluştu', en: 'An error occurred', pt: 'Ocorreu um erro', id: 'Terjadi kesalahan',
    es: 'Ocurrió un error', de: 'Ein Fehler ist aufgetreten', fr: 'Une erreur est survenue', hu: 'Hiba történt',
    ja: 'エラーが発生しました', ko: '오류가 발생했습니다', ru: 'Произошла ошибка',
  },
});

// ═══════════════════════════════════════════
// IMPORTANT
// ═══════════════════════════════════════════
addMany('important', {
  title: {
    tr: 'Önemli Bilgilendirme', en: 'Important notice', pt: 'Aviso importante', id: 'Pemberitahuan penting',
    es: 'Aviso importante', de: 'Wichtiger Hinweis', fr: 'Avis important', hu: 'Fontos tájékoztatás',
    ja: '重要なお知らせ', ko: '중요 안내', ru: 'Важное уведомление',
  },
  last_updated: {
    tr: 'Son güncelleme: {date}', en: 'Last updated: {date}', pt: 'Última atualização: {date}',
    id: 'Terakhir diperbarui: {date}', es: 'Última actualización: {date}', de: 'Zuletzt aktualisiert: {date}',
    fr: 'Dernière mise à jour : {date}', hu: 'Utolsó frissítés: {date}',
    ja: '最終更新: {date}', ko: '최종 업데이트: {date}', ru: 'Последнее обновление: {date}',
  },
  date: {
    tr: '04 Şubat 2026', en: 'February 4, 2026', pt: '4 de fevereiro de 2026', id: '4 Februari 2026',
    es: '4 de febrero de 2026', de: '4. Februar 2026', fr: '4 février 2026', hu: '2026. február 4.',
    ja: '2026年2月4日', ko: '2026년 2월 4일', ru: '4 февраля 2026 г.',
  },
  p1_before: {
    tr: 'Bu internet sitesi,', en: 'This website is not affiliated with, endorsed by, or sponsored by',
    pt: 'Este site não tem afiliação, endosso ou patrocínio de', id: 'Situs ini tidak berafiliasi, didukung, atau disponsori oleh',
    es: 'Este sitio web no está afiliado, respaldado ni patrocinado por', de: 'Diese Website ist nicht verbunden mit, genehmigt oder gesponsert von',
    fr: 'Ce site n’est pas affilié, approuvé ni sponsorisé par', hu: 'Ez a weboldal nincs kapcsolatban, nincs jóváhagyva és nincs szponzorálva a következő által:',
    ja: '本サイトは、', ko: '이 웹사이트는', ru: 'Этот сайт не связан, не одобрен и не спонсирован',
  },
  p1_mid: {
    tr: 'veya ona bağlı tüzel kişiler ile herhangi bir bağlılık, onay veya sponsorluk ilişkisi içerisinde değildir.',
    en: 'or any of its affiliates.',
    pt: 'ou quaisquer afiliadas.',
    id: 'atau afiliasinya.',
    es: 'ni de ninguna de sus afiliadas.',
    de: 'oder verbundenen Unternehmen.',
    fr: 'ni de ses sociétés affiliées.',
    hu: 'vagy bármely kapcsolt vállalkozása.',
    ja: 'またはその関連会社との提携・承認・スポンサー関係はありません。',
    ko: '또는 그 계열사와 제휴·승인·후원 관계가 없습니다.',
    ru: 'или её аффилированными лицами.',
  },
  p1_marks_before: {
    tr: '"', en: '"', pt: '"', id: '"', es: '"', de: '„', fr: '«\u00a0', hu: '„', ja: '「', ko: '「', ru: '«',
  },
  p1_marks_after: {
    tr: '" ve ilişkili ticari markalar',
    en: '" and related trademarks belong to',
    pt: '" e marcas relacionadas pertencem a',
    id: '" dan merek terkait dimiliki oleh',
    es: '" y las marcas relacionadas pertenecen a',
    de: '" und verwandte Marken gehören',
    fr: '\u00a0» et les marques associées appartiennent à',
    hu: '" és a kapcsolódó védjegyek a következő tulajdonai:',
    ja: '」および関連商標は',
    ko: '」및 관련 상표는',
    ru: '» и связанные товарные знаки принадлежат',
  },
  p1_end: {
    tr: "'e aittir.",
    en: '.',
    pt: '.',
    id: '.',
    es: '.',
    de: '.',
    fr: '.',
    hu: '.',
    ja: 'に帰属します。',
    ko: '의 소유입니다.',
    ru: '.',
  },
  p2: {
    tr: 'Sitede sunulan araçlar, içerikler ve yönlendirmeler bağımsız olarak sağlanmakta olup, bu hizmetlerin kullanımı sonucu ortaya çıkabilecek her türlü sorumluluk ilgili kullanıcıya aittir. Hizmetlerin kullanımı öncesinde gerekli özenin gösterilmesi ve güvenlik önlemlerinin alınması kullanıcı sorumluluğundadır.',
    en: 'Tools, content, and links on this site are provided independently. Any liability arising from use of these services rests with the user. Users must exercise due care and take security precautions before using the services.',
    pt: 'As ferramentas, conteúdos e links deste site são fornecidos de forma independente. Qualquer responsabilidade pelo uso desses serviços é do usuário. Cabe ao usuário agir com cuidado e tomar medidas de segurança antes de usar os serviços.',
    id: 'Alat, konten, dan tautan di situs ini disediakan secara independen. Segala tanggung jawab atas penggunaan layanan ini berada pada pengguna. Pengguna wajib berhati-hati dan mengambil langkah keamanan sebelum memakai layanan.',
    es: 'Las herramientas, contenidos y enlaces de este sitio se ofrecen de forma independiente. Toda responsabilidad por el uso de estos servicios recae en el usuario. El usuario debe actuar con diligencia y tomar medidas de seguridad antes de usar los servicios.',
    de: 'Tools, Inhalte und Links auf dieser Website werden unabhängig bereitgestellt. Jede Haftung aus der Nutzung dieser Dienste liegt beim Nutzer. Nutzer müssen vor der Nutzung Sorgfalt walten lassen und Sicherheitsmaßnahmen ergreifen.',
    fr: 'Les outils, contenus et liens de ce site sont fournis de manière indépendante. Toute responsabilité liée à l’usage de ces services incombe à l’utilisateur. L’utilisateur doit faire preuve de prudence et prendre des mesures de sécurité avant d’utiliser les services.',
    hu: 'Az oldalon elérhető eszközök, tartalmak és hivatkozások függetlenül kerülnek biztosításra. A szolgáltatások használatából eredő felelősség a felhasználót terheli. A felhasználónak kellő gondossággal kell eljárnia, és biztonsági intézkedéseket kell tennie a használat előtt.',
    ja: '本サイトのツール・コンテンツ・リンクは独立して提供されます。これらのサービス利用から生じる責任はすべて利用者にあります。利用前に十分な注意を払い、セキュリティ対策を講じてください。',
    ko: '이 사이트의 도구, 콘텐츠, 링크는 독립적으로 제공됩니다. 서비스 사용으로 인한 모든 책임은 사용자에게 있습니다. 사용 전 주의를 기울이고 보안 조치를 취해야 합니다.',
    ru: 'Инструменты, материалы и ссылки на этом сайте предоставляются независимо. Любая ответственность за использование этих сервисов лежит на пользователе. Перед использованием необходимо соблюдать осторожность и меры безопасности.',
  },
  p3: {
    tr: 'Kişisel veya hassas bilgilerin paylaşımında dikkatli olunuz. Hesap bilgileri, parolalar, güvenlik anahtarları veya benzeri erişim verileri üçüncü taraflarla paylaşılmamalıdır.',
    en: 'Be careful when sharing personal or sensitive information. Account details, passwords, security keys, or similar access data must not be shared with third parties.',
    pt: 'Tenha cuidado ao compartilhar informações pessoais ou sensíveis. Dados de conta, senhas, chaves de segurança ou dados de acesso semelhantes não devem ser compartilhados com terceiros.',
    id: 'Hati-hati saat membagikan informasi pribadi atau sensitif. Detail akun, kata sandi, kunci keamanan, atau data akses serupa tidak boleh dibagikan kepada pihak ketiga.',
    es: 'Ten cuidado al compartir información personal o sensible. No compartas con terceros datos de cuenta, contraseñas, claves de seguridad u otros datos de acceso.',
    de: 'Sei vorsichtig beim Teilen persönlicher oder sensibler Informationen. Kontodaten, Passwörter, Sicherheitsschlüssel oder ähnliche Zugangsdaten dürfen nicht an Dritte weitergegeben werden.',
    fr: 'Soyez prudent lorsque vous partagez des informations personnelles ou sensibles. Les identifiants, mots de passe, clés de sécurité ou données d’accès similaires ne doivent pas être partagés avec des tiers.',
    hu: 'Légy óvatos személyes vagy érzékeny adatok megosztásakor. Fiókadatokat, jelszavakat, biztonsági kulcsokat vagy hasonló hozzáférési adatokat nem szabad harmadik féllel megosztani.',
    ja: '個人情報や機微な情報の共有には注意してください。アカウント情報、パスワード、セキュリティキーなどのアクセス情報を第三者に共有しないでください。',
    ko: '개인정보나 민감한 정보를 공유할 때 주의하세요. 계정 정보, 비밀번호, 보안 키 등 접근 데이터를 제3자와 공유해서는 안 됩니다.',
    ru: 'Будьте осторожны при передаче личных или конфиденциальных данных. Данные аккаунта, пароли, ключи безопасности и подобную информацию нельзя передавать третьим лицам.',
  },
  p4_before: {
    tr: "Resmi destek, doğrulama veya güvenlik bilgisi gerektiğinde lütfen ",
    en: 'When you need official support, verification, or security information, please use ',
    pt: 'Quando precisar de suporte oficial, verificação ou informações de segurança, use ',
    id: 'Jika memerlukan dukungan resmi, verifikasi, atau informasi keamanan, gunakan ',
    es: 'Si necesitas soporte oficial, verificación o información de seguridad, usa ',
    de: 'Wenn du offiziellen Support, Verifizierung oder Sicherheitsinformationen brauchst, nutze bitte ',
    fr: 'Pour un support officiel, une vérification ou des informations de sécurité, utilisez ',
    hu: 'Hivatalos támogatáshoz, ellenőrzéshez vagy biztonsági információhoz használd a ',
    ja: '公式サポート、確認、セキュリティ情報が必要な場合は、',
    ko: '공식 지원, 인증 또는 보안 정보가 필요하면 ',
    ru: 'Если нужна официальная поддержка, проверка или сведения о безопасности, используйте ',
  },
  p4_link: {
    tr: "Discord'un resmi destek",
    en: "Discord's official support",
    pt: 'o suporte oficial do Discord',
    id: 'dukungan resmi Discord',
    es: 'el soporte oficial de Discord',
    de: 'Discords offiziellen Support',
    fr: 'le support officiel de Discord',
    hu: 'Discord hivatalos támogatását',
    ja: 'Discordの公式サポート',
    ko: 'Discord 공식 지원',
    ru: 'официальную поддержку Discord',
  },
  p4_after: {
    tr: ' kanallarını ve belgelerini kullanınız. Bu sayfada yer alan bilgiler bilgilendirme amaçlıdır ve bağlayıcı hukuki tavsiye yerine geçmez; hukuki konular için yetkili bir hukuk müşavirine başvurunuz.',
    en: ' channels and documentation. Information on this page is for informational purposes only and is not binding legal advice; consult a qualified attorney for legal matters.',
    pt: ' e a documentação. As informações nesta página são apenas informativas e não constituem aconselhamento jurídico vinculativo; consulte um advogado qualificado para questões jurídicas.',
    id: ' dan dokumentasinya. Informasi di halaman ini hanya bersifat informatif dan bukan nasihat hukum yang mengikat; konsultasikan dengan pengacara yang berwenang untuk masalah hukum.',
    es: ' y su documentación. La información de esta página es solo informativa y no constituye asesoramiento jurídico vinculante; consulta a un abogado cualificado para asuntos legales.',
    de: '-Kanäle und Dokumentation. Die Angaben auf dieser Seite dienen nur der Information und sind keine verbindliche Rechtsberatung; wende dich bei Rechtsfragen an einen qualifizierten Anwalt.',
    fr: ' et sa documentation. Les informations de cette page sont fournies à titre informatif et ne constituent pas un conseil juridique engageant ; consultez un avocat qualifié pour toute question juridique.',
    hu: ' csatornáit és dokumentációját. Az oldalon található információk tájékoztató jellegűek, nem minősülnek kötelező érvényű jogi tanácsadásnak; jogi kérdésekben fordulj képesített ügyvédhez.',
    ja: 'のチャネルとドキュメントをご利用ください。本ページの情報は参考情報であり、拘束力のある法的助言ではありません。法的事項については資格のある弁護士にご相談ください。',
    ko: ' 채널과 문서를 이용하세요. 이 페이지의 정보는 안내용이며 구속력 있는 법률 자문이 아닙니다. 법률 문제는 자격을 갖춘 변호사에게 문의하세요.',
    ru: ' и документацию. Сведения на этой странице носят информационный характер и не являются обязательной юридической консультацией; по правовым вопросам обратитесь к квалифицированному юристу.',
  },
  contact: {
    tr: 'İletişim:', en: 'Contact:', pt: 'Contato:', id: 'Kontak:', es: 'Contacto:', de: 'Kontakt:',
    fr: 'Contact :', hu: 'Kapcsolat:', ja: '連絡先:', ko: '연락처:', ru: 'Контакт:',
  },
  back_label: {
    tr: 'Geri dön:', en: 'Go back:', pt: 'Voltar:', id: 'Kembali:', es: 'Volver:', de: 'Zurück:',
    fr: 'Retour :', hu: 'Vissza:', ja: '戻る:', ko: '돌아가기:', ru: 'Назад:',
  },
  home: {
    tr: 'Anasayfaya dön', en: 'Back to home', pt: 'Voltar ao início', id: 'Kembali ke beranda',
    es: 'Volver al inicio', de: 'Zur Startseite', fr: 'Retour à l’accueil', hu: 'Vissza a főoldalra',
    ja: 'ホームに戻る', ko: '홈으로 돌아가기', ru: 'На главную',
  },
});

console.log('cart+important keys loaded…');

// Continue in next chunk via import of remaining modules
const { loadRest } = await import('./faz-d-content.mjs');
loadRest(add, addMany, PRODUCT);

const bundle = {};
for (const lang of LANGS) {
  bundle[lang] = fromFlat(maps[lang]);
}

const outPath = path.join(__dirname, 'faz-d-all.json');
fs.writeFileSync(outPath, JSON.stringify(bundle, null, 2) + '\n');

let leafCount = 0;
function countLeaves(o) {
  for (const v of Object.values(o)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) countLeaves(v);
    else leafCount++;
  }
}
countLeaves(bundle.tr);
console.log(`Wrote ${outPath} — ~${leafCount} keys per locale × ${LANGS.length} langs`);

const apply = spawnSync(process.execPath, [path.join(__dirname, '../i18n-apply.mjs'), outPath], {
  stdio: 'inherit',
});
process.exit(apply.status ?? 1);
