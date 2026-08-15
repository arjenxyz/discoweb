/** docs.errors.* — UI chrome + all DW error entries (11 langs) */
import { ERRORS, put } from './faz-d-error-codes.mjs';
import { registerRest } from './faz-d-error-codes-rest.mjs';

registerRest(put);

export function loadErrors(add, addMany) {
  const L = (tr, en, pt, id, es, de, fr, hu, ja, ko, ru) => ({ tr, en, pt, id, es, de, fr, hu, ja, ko, ru });

  addMany('docs.errors', {
    page_title: L('Hata Kodları — DiscoWeb', 'Error Codes — DiscoWeb', 'Códigos de Erro — DiscoWeb', 'Kode Error — DiscoWeb', 'Códigos de Error — DiscoWeb', 'Fehlercodes — DiscoWeb', 'Codes d’erreur — DiscoWeb', 'Hibakódok — DiscoWeb', 'エラーコード — DiscoWeb', '오류 코드 — DiscoWeb', 'Коды ошибок — DiscoWeb'),
    badge: L('HATA KODLARI', 'ERROR CODES', 'CÓDIGOS DE ERRO', 'KODE ERROR', 'CÓDIGOS DE ERROR', 'FEHLERCODES', 'CODES D’ERREUR', 'HIBAKÓDOK', 'エラーコード', '오류 코드', 'КОДЫ ОШИБОК'),
    back_docs: L('Dokümantasyon', 'Documentation', 'Documentação', 'Dokumentasi', 'Documentación', 'Dokumentation', 'Documentation', 'Dokumentáció', 'ドキュメント', '문서', 'Документация'),
    categories: L('Kategoriler', 'Categories', 'Categorias', 'Kategori', 'Categorías', 'Kategorien', 'Catégories', 'Kategóriák', 'カテゴリ', '카테고리', 'Категории'),
    title: L('Hata Kodları', 'Error codes', 'Códigos de erro', 'Kode error', 'Códigos de error', 'Fehlercodes', 'Codes d’erreur', 'Hibakódok', 'エラーコード', '오류 코드', 'Коды ошибок'),
    intro: L(
      'DiscoWeb Activity’de karşılaştığın hata kodunu aşağıdan aratabilirsin. Her kod için olası nedenler ve çözüm adımları listelenmiştir.',
      'Search for an error code you saw in DiscoWeb Activity. Each code lists likely causes and fixes.',
      'Pesquise o código de erro visto no DiscoWeb Activity. Cada código lista causas e soluções.',
      'Cari kode error yang muncul di DiscoWeb Activity. Setiap kode memuat penyebab dan solusi.',
      'Busca el código de error visto en DiscoWeb Activity. Cada código lista causas y soluciones.',
      'Suche einen Fehlercode aus DiscoWeb Activity. Jeder Code listet Ursachen und Lösungen.',
      'Recherchez un code d’erreur vu dans DiscoWeb Activity. Chaque code liste causes et solutions.',
      'Keresd meg az Activityben látott hibakódot. Minden kódhoz okok és megoldások tartoznak.',
      'DiscoWeb Activity で見たエラーコードを検索できます。各コードに原因と対処を記載しています。',
      'DiscoWeb Activity에서 본 오류 코드를 검색하세요. 각 코드에 원인과 해결이 있습니다.',
      'Найдите код ошибки из DiscoWeb Activity. У каждого кода — причины и решения.',
    ),
    search_ph: L(
      'Kod veya anahtar kelime ara… (örn. DW-1001, frame_id, token)',
      'Search by code or keyword… (e.g. DW-1001, frame_id, token)',
      'Buscar por código ou palavra-chave… (ex. DW-1001, frame_id, token)',
      'Cari kode atau kata kunci… (mis. DW-1001, frame_id, token)',
      'Buscar por código o palabra clave… (ej. DW-1001, frame_id, token)',
      'Nach Code oder Stichwort suchen… (z. B. DW-1001, frame_id, token)',
      'Rechercher un code ou un mot-clé… (ex. DW-1001, frame_id, token)',
      'Keresés kód vagy kulcsszó alapján… (pl. DW-1001, frame_id, token)',
      'コードまたはキーワードで検索…（例: DW-1001, frame_id, token）',
      '코드 또는 키워드 검색… (예: DW-1001, frame_id, token)',
      'Поиск по коду или слову… (напр. DW-1001, frame_id, token)',
    ),
    quick_ref: L('Hızlı Başvuru Tablosu', 'Quick reference table', 'Tabela de referência rápida', 'Tabel referensi cepat', 'Tabla de referencia rápida', 'Schnellreferenztabelle', 'Tableau de référence rapide', 'Gyorsreferenciás táblázat', 'クイック参照表', '빠른 참조 표', 'Таблица быстрой справки'),
    col_code: L('Kod', 'Code', 'Código', 'Kode', 'Código', 'Code', 'Code', 'Kód', 'コード', '코드', 'Код'),
    col_title: L('Başlık', 'Title', 'Título', 'Judul', 'Título', 'Titel', 'Titre', 'Cím', 'タイトル', '제목', 'Заголовок'),
    col_category: L('Kategori', 'Category', 'Categoria', 'Kategori', 'Categoría', 'Kategorie', 'Catégorie', 'Kategória', 'カテゴリ', '카테고리', 'Категория'),
    causes: L('Olası Nedenler', 'Likely causes', 'Possíveis causas', 'Kemungkinan penyebab', 'Posibles causas', 'Mögliche Ursachen', 'Causes probables', 'Lehetséges okok', '考えられる原因', '가능한 원인', 'Возможные причины'),
    solutions: L('Çözüm', 'Solutions', 'Soluções', 'Solusi', 'Soluciones', 'Lösungen', 'Solutions', 'Megoldás', '解決策', '해결', 'Решение'),
    report_title: L('Hata mı yaşıyorsun?', 'Seeing an error?', 'Está vendo um erro?', 'Sedang mengalami error?', '¿Ves un error?', 'Siehst du einen Fehler?', 'Vous voyez une erreur ?', 'Hibát tapasztalsz?', 'エラーが出ていますか？', '오류가 발생하나요?', 'Видите ошибку?'),
    report_body_before: L('Activity ekranındaki ', 'Press ', 'Pressione ', 'Tekan ', 'Pulsa ', 'Drücke ', 'Appuyez sur ', 'Nyomd meg a ', 'Activity 画面の「', 'Activity 화면의 ', 'Нажмите «'),
    report_strong: L('Bildir', 'Report', 'Reportar', 'Laporkan', 'Informar', 'Melden', 'Signaler', 'Jelentés', '報告', '신고', 'Сообщить'),
    report_body_after: L(
      ' butonuna basarak hata detaylarını otomatik olarak bize iletebilirsin. Eğer butona erişemiyorsan, hata kodunu (örn. DW-1004) Discord sunucusundaki destek kanalına yazabilirsin.',
      ' on the Activity screen to send error details automatically. If you cannot reach the button, send the code (e.g. DW-1004) to the support channel on the Discord server.',
      ' na tela do Activity para enviar os detalhes. Se não conseguir, envie o código (ex. DW-1004) ao canal de suporte no Discord.',
      ' di layar Activity untuk mengirim detail. Jika tidak bisa, kirim kode (mis. DW-1004) ke saluran dukungan di Discord.',
      ' en la pantalla de Activity para enviar los detalles. Si no puedes, envía el código (ej. DW-1004) al canal de soporte en Discord.',
      ' im Activity-Fenster, um Details zu senden. Sonst schicke den Code (z. B. DW-1004) an den Support-Kanal auf Discord.',
      ' dans Activity pour envoyer les détails. Sinon, envoyez le code (ex. DW-1004) au canal d’assistance Discord.',
      ' gombot az Activity képernyőn. Ha nem éred el, írd a kódot (pl. DW-1004) a Discord támogatási csatornájába.',
      '」で詳細を自動送信できます。届かない場合はコード（例: DW-1004）を Discord サポートチャンネルへ。',
      ' 버튼으로 세부 정보를 보낼 수 있습니다. 안 되면 코드(예: DW-1004)를 Discord 지원 채널에 보내세요.',
      '» в Activity, чтобы отправить детали. Если нельзя — напишите код (напр. DW-1004) в канал поддержки Discord.',
    ),
    footer: L('DiscoWeb Hata Kodları — Son güncelleme: {date}', 'DiscoWeb Error Codes — Last updated: {date}', 'Códigos de Erro DiscoWeb — Última atualização: {date}', 'Kode Error DiscoWeb — Terakhir diperbarui: {date}', 'Códigos de Error DiscoWeb — Última actualización: {date}', 'DiscoWeb-Fehlercodes — Zuletzt aktualisiert: {date}', 'Codes d’erreur DiscoWeb — Dernière mise à jour : {date}', 'DiscoWeb hibakódok — Utolsó frissítés: {date}', 'DiscoWeb エラーコード — 最終更新: {date}', 'DiscoWeb 오류 코드 — 최종 업데이트: {date}', 'Коды ошибок DiscoWeb — обновлено: {date}'),
    rights: L('Tüm hakları saklıdır.', 'All rights reserved.', 'Todos os direitos reservados.', 'Hak cipta dilindungi.', 'Todos los derechos reservados.', 'Alle Rechte vorbehalten.', 'Tous droits réservés.', 'Minden jog fenntartva.', '全著作権所有。', '모든 권리 보유.', 'Все права защищены.'),
  });

  const cat = (id, label, desc) => {
    add(`docs.errors.cat.${id}.label`, label);
    add(`docs.errors.cat.${id}.description`, desc);
  };
  cat('auth', L('Kimlik Doğrulama', 'Authentication', 'Autenticação', 'Autentikasi', 'Autenticación', 'Authentifizierung', 'Authentification', 'Hitelesítés', '認証', '인증', 'Аутентификация'),
    L('Discord Activity başlatılırken yaşanan oturum ve yetkilendirme sorunları.', 'Session and authorization issues when starting Discord Activity.', 'Problemas de sessão e autorização ao iniciar o Discord Activity.', 'Masalah sesi dan otorisasi saat memulai Discord Activity.', 'Problemas de sesión y autorización al iniciar Discord Activity.', 'Sitzungs- und Autorisierungsprobleme beim Starten von Discord Activity.', 'Problèmes de session et d’autorisation au démarrage de Discord Activity.', 'Munkamenet- és jogosultsági problémák a Discord Activity indításakor.', 'Discord Activity 起動時のセッション・認可の問題。', 'Discord Activity 시작 시 세션·인증 문제.', 'Проблемы сессии и авторизации при запуске Discord Activity.'));
  cat('server', L('Sunucu Yapılandırması', 'Server configuration', 'Configuração do servidor', 'Konfigurasi server', 'Configuración del servidor', 'Serverkonfiguration', 'Configuration du serveur', 'Szerverkonfiguráció', 'サーバー設定', '서버 구성', 'Конфигурация сервера'),
    L('Discord sunucusunun DiscoWeb sistemine kayıt ve kurulum sorunları. Genellikle yönetici müdahalesi gerekir.', 'Registration and setup issues for the Discord server in DiscoWeb. Usually needs an admin.', 'Problemas de registro e configuração do servidor Discord no DiscoWeb. Geralmente exige um admin.', 'Masalah pendaftaran dan setup server Discord di DiscoWeb. Biasanya butuh admin.', 'Problemas de registro y configuración del servidor Discord en DiscoWeb. Suele requerir un admin.', 'Registrierungs- und Setup-Probleme des Discord-Servers in DiscoWeb. Meist Admin nötig.', 'Problèmes d’enregistrement et de configuration du serveur Discord dans DiscoWeb. Souvent un admin est requis.', 'A Discord szerver DiscoWeb regisztrációs és telepítési problémái. Általában admin kell.', 'Discord サーバーの DiscoWeb 登録・セットアップ問題。多くの場合管理者対応が必要。', 'Discord 서버의 DiscoWeb 등록·설정 문제. 보통 관리자 개입 필요.', 'Проблемы регистрации и настройки сервера Discord в DiscoWeb. Обычно нужен админ.'));
  cat('user', L('Kullanıcı / Yetki', 'User / Permission', 'Usuário / Permissão', 'Pengguna / Izin', 'Usuario / Permiso', 'Nutzer / Berechtigung', 'Utilisateur / Permission', 'Felhasználó / Jogosultság', 'ユーザー / 権限', '사용자 / 권한', 'Пользователь / права'),
    L('Kullanıcı hesabı, oturum ve izin sorunları.', 'User account, session, and permission issues.', 'Problemas de conta, sessão e permissão.', 'Masalah akun, sesi, dan izin.', 'Problemas de cuenta, sesión y permisos.', 'Konto-, Sitzungs- und Berechtigungsprobleme.', 'Problèmes de compte, session et permissions.', 'Fiók-, munkamenet- és jogosultságproblémák.', 'ユーザーアカウント・セッション・権限の問題。', '사용자 계정, 세션, 권한 문제.', 'Проблемы аккаунта, сессии и прав.'));
  cat('economy', L('Ekonomi', 'Economy', 'Economia', 'Ekonomi', 'Economía', 'Wirtschaft', 'Économie', 'Gazdaság', '経済', '경제', 'Экономика'),
    L('Ekonomi sistemi ile ilgili işlem ve bakiye hataları.', 'Transaction and balance errors related to the economy system.', 'Erros de transação e saldo ligados ao sistema econômico.', 'Kesalahan transaksi dan saldo terkait sistem ekonomi.', 'Errores de transacción y saldo del sistema económico.', 'Transaktions- und Saldenfehler im Wirtschaftssystem.', 'Erreurs de transaction et de solde liées à l’économie.', 'Gazdasági rendszerhez kapcsolódó tranzakciós és egyenleghibák.', '経済システムの取引・残高エラー。', '경제 시스템의 거래·잔액 오류.', 'Ошибки транзакций и баланса экономики.'));
  cat('network', L('Ağ / API', 'Network / API', 'Rede / API', 'Jaringan / API', 'Red / API', 'Netzwerk / API', 'Réseau / API', 'Hálózat / API', 'ネットワーク / API', '네트워크 / API', 'Сеть / API'),
    L('İnternet bağlantısı ve API iletişim hataları.', 'Internet connection and API communication errors.', 'Erros de conexão e comunicação com a API.', 'Kesalahan koneksi internet dan komunikasi API.', 'Errores de conexión e API.', 'Internetverbindungs- und API-Kommunikationsfehler.', 'Erreurs de connexion Internet et de communication API.', 'Internetkapcsolat- és API-kommunikációs hibák.', 'インターネット接続と API 通信のエラー。', '인터넷 연결 및 API 통신 오류.', 'Ошибки соединения и API.'));
  cat('unknown', L('Bilinmeyen', 'Unknown', 'Desconhecido', 'Tidak diketahui', 'Desconocido', 'Unbekannt', 'Inconnu', 'Ismeretlen', '不明', '알 수 없음', 'Неизвестно'),
    L("Sistemin otomatik olarak yakaladığı beklenmedik hatalar. Ekranda 'Arka planda bir hata oluştu' bildirimi gösterir.", "Unexpected errors caught automatically. Shows an 'A background error occurred' notice.", 'Erros inesperados capturados automaticamente. Mostra um aviso de erro em segundo plano.', 'Error tak terduga yang ditangkap otomatis. Menampilkan pemberitahuan error latar.', 'Errores inesperados capturados automáticamente. Muestra un aviso de error en segundo plano.', 'Automatisch erfasste unerwartete Fehler. Zeigt einen Hintergrundfehler-Hinweis.', 'Erreurs inattendues capturées automatiquement. Affiche une notification d’erreur en arrière-plan.', 'Automatikusan elkapott váratlan hibák. Háttérhiba-értesítést jelenít meg.', '自動捕捉された予期しないエラー。「バックグラウンドでエラーが発生しました」通知を表示。', '자동으로 감지된 예기치 않은 오류. 백그라운드 오류 알림을 표시합니다.', 'Неожиданные ошибки, пойманные автоматически. Показывает уведомление о фоновой ошибке.'));

  for (const [code, pack] of Object.entries(ERRORS)) {
    add(`docs.errors.code.${code}.title`, pack.title);
    add(`docs.errors.code.${code}.message`, pack.message);
    pack.causes.forEach((c, i) => add(`docs.errors.code.${code}.cause${i + 1}`, c));
    pack.solutions.forEach((s, i) => add(`docs.errors.code.${code}.solution${i + 1}`, s));
  }
  console.log('docs.errors keys loaded…');
}
