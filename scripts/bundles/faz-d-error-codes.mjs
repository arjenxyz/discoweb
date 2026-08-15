/** Auto-style error code packs for Faz D. Keys: title, message, causes[], solutions[] as L() objects */
export function L(tr, en, pt, id, es, de, fr, hu, ja, ko, ru) {
  return { tr, en, pt, id, es, de, fr, hu, ja, ko, ru };
}

/** Shared solutions reused */
export const S = {
  reopen: L(
    "Activity penceresini kapatıp tekrar aç.",
    "Close the Activity window and open it again.",
    "Feche a janela do Activity e abra de novo.",
    "Tutup jendela Activity lalu buka lagi.",
    "Cierra la ventana de Activity y ábrela de nuevo.",
    "Schließe das Activity-Fenster und öffne es erneut.",
    "Fermez la fenêtre Activity et rouvrez-la.",
    "Zárd be az Activity ablakot és nyisd meg újra.",
    "Activity ウィンドウを閉じて再度開いてください。",
    "Activity 창을 닫았다가 다시 여세요.",
    "Закройте окно Activity и откройте снова."
  ),
  checkNet: L(
    "İnternet bağlantını kontrol et.",
    "Check your internet connection.",
    "Verifique sua conexão com a internet.",
    "Periksa koneksi internetmu.",
    "Comprueba tu conexión a internet.",
    "Prüfe deine Internetverbindung.",
    "Vérifiez votre connexion Internet.",
    "Ellenőrizd az internetkapcsolatodat.",
    "インターネット接続を確認してください。",
    "인터넷 연결을 확인하세요.",
    "Проверьте подключение к интернету."
  ),
  waitRetry: L(
    "Birkaç dakika bekleyip tekrar dene.",
    "Wait a few minutes and try again.",
    "Espere alguns minutos e tente de novo.",
    "Tunggu beberapa menit lalu coba lagi.",
    "Espera unos minutos e inténtalo de nuevo.",
    "Warte ein paar Minuten und versuche es erneut.",
    "Attendez quelques minutes et réessayez.",
    "Várj néhány percet és próbáld újra.",
    "数分待ってから再試行してください。",
    "몇 분 기다린 후 다시 시도하세요.",
    "Подождите несколько минут и попробуйте снова."
  ),
  reportDev: L(
    "Ekrandaki Bildir butonuna basarak geliştiriciyi haberdar et.",
    "Press Report on screen to notify the developer.",
    "Pressione Reportar na tela para avisar o desenvolvedor.",
    "Tekan Laporkan di layar untuk memberi tahu pengembang.",
    "Pulsa Informar en pantalla para avisar al desarrollador.",
    "Drücke Melden auf dem Bildschirm, um den Entwickler zu benachrichtigen.",
    "Appuyez sur Signaler à l’écran pour prévenir le développeur.",
    "Nyomd meg a Jelentés gombot a képernyőn a fejlesztő értesítéséhez.",
    "画面の「報告」を押して開発者に知らせてください。",
    "화면의 신고를 눌러 개발자에게 알리세요.",
    "Нажмите «Сообщить» на экране, чтобы уведомить разработчика."
  ),
  tellAdmin: L(
    "Üyeler için: Sunucu yöneticinize bu hatayı bildirin.",
    "For members: Tell your server admin about this error.",
    "Para membros: Informe o admin do servidor sobre este erro.",
    "Untuk anggota: Beritahu admin server tentang error ini.",
    "Para miembros: Informa al admin del servidor de este error.",
    "Für Mitglieder: Melde diesem Fehler deinem Server-Admin.",
    "Pour les membres : Informez l’admin du serveur de cette erreur.",
    "Tagoknak: Értesítsd a szerver admint erről a hibáról.",
    "メンバー向け: サーバー管理者にこのエラーを伝えてください。",
    "멤버용: 서버 관리자에게 이 오류를 알리세요.",
    "Участникам: сообщите об этой ошибке администратору сервера."
  ),
  reopenActivity: L(
    "Activity'yi yeniden aç.",
    "Reopen Activity.",
    "Reabra o Activity.",
    "Buka ulang Activity.",
    "Vuelve a abrir Activity.",
    "Öffne Activity erneut.",
    "Rouvrez Activity.",
    "Nyisd meg újra az Activityt.",
    "Activity を再度開いてください。",
    "Activity를 다시 여세요.",
    "Откройте Activity снова."
  ),
};

export const ERRORS = {};

export function put(code, title, message, causes, solutions) {
  ERRORS[code] = { title, message, causes, solutions };
}

put("1001",
  L("frame_id Bulunamadı","frame_id Not Found","frame_id Não Encontrado","frame_id Tidak Ditemukan","frame_id No Encontrado","frame_id Nicht Gefunden","frame_id Introuvable","frame_id Nem Található","frame_id が見つかりません","frame_id 없음","frame_id не найден"),
  L("Discord frame_id parametresi bulunamadı.","Discord frame_id parameter not found.","Parâmetro frame_id do Discord não encontrado.","Parameter frame_id Discord tidak ditemukan.","No se encontró el parámetro frame_id de Discord.","Discord-frame_id-Parameter nicht gefunden.","Paramètre frame_id Discord introuvable.","A Discord frame_id paraméter nem található.","Discord の frame_id パラメータが見つかりません。","Discord frame_id 매개변수를 찾을 수 없습니다.","Параметр Discord frame_id не найден."),
  [
    L("Activity normal bir tarayıcıdan açılmaya çalışıldı (Discord dışı).","Activity was opened in a normal browser (outside Discord).","O Activity foi aberto em um navegador normal (fora do Discord).","Activity dibuka di browser biasa (di luar Discord).","Activity se abrió en un navegador normal (fuera de Discord).","Activity wurde in einem normalen Browser geöffnet (außerhalb von Discord).","Activity a été ouvert dans un navigateur normal (hors Discord).","Az Activityt normál böngészőben nyitották meg (Discordon kívül).","Activity が通常のブラウザで開かれました（Discord 外）。","Activity가 일반 브라우저에서 열렸습니다(Discord 외부).","Activity открыт в обычном браузере (вне Discord)."),
    L("URL'de frame_id parametresi eksik; Discord bunu Activity başlarken otomatik ekler.","The frame_id query param is missing; Discord adds it when Activity starts.","O parâmetro frame_id está ausente na URL; o Discord o adiciona ao iniciar o Activity.","Parameter frame_id hilang di URL; Discord menambahkannya saat Activity mulai.","Falta el parámetro frame_id en la URL; Discord lo añade al iniciar Activity.","Der frame_id-Parameter fehlt in der URL; Discord fügt ihn beim Activity-Start hinzu.","Le paramètre frame_id manque dans l’URL ; Discord l’ajoute au démarrage d’Activity.","Hiányzik a frame_id paraméter az URL-ből; a Discord az Activity indításakor adja hozzá.","URL に frame_id がありません。Discord が Activity 開始時に自動付与します。","URL에 frame_id가 없습니다. Discord가 Activity 시작 시 자동 추가합니다.","В URL нет frame_id; Discord добавляет его при запуске Activity."),
    L("Çok eski veya desteklenmeyen bir Discord istemcisi kullanılıyor.","An outdated or unsupported Discord client is in use.","Um cliente Discord antigo ou sem suporte está em uso.","Klien Discord terlalu lama atau tidak didukung.","Se usa un cliente de Discord antiguo o no compatible.","Ein veralteter oder nicht unterstützter Discord-Client wird verwendet.","Un client Discord obsolète ou non pris en charge est utilisé.","Elavult vagy nem támogatott Discord kliens van használatban.","古すぎる、または非対応の Discord クライアントです。","너무 오래되었거나 지원되지 않는 Discord 클라이언트입니다.","Используется устаревший или неподдерживаемый клиент Discord."),
  ],
  [
    L("Activity'yi Discord masaüstü veya mobil uygulaması üzerinden aç.","Open Activity from the Discord desktop or mobile app.","Abra o Activity pelo app Discord desktop ou mobile.","Buka Activity lewat aplikasi Discord desktop atau seluler.","Abre Activity desde la app de Discord de escritorio o móvil.","Öffne Activity über die Discord-Desktop- oder Mobile-App.","Ouvrez Activity depuis l’app Discord bureau ou mobile.","Nyisd meg az Activityt a Discord asztali vagy mobil alkalmazásából.","Discord デスクトップまたはモバイルアプリから Activity を開いてください。","Discord 데스크톱 또는 모바일 앱에서 Activity를 여세요.","Откройте Activity из приложения Discord (ПК или мобильное)."),
    L("Discord uygulamasını güncelleyerek tekrar dene.","Update the Discord app and try again.","Atualize o app Discord e tente de novo.","Perbarui aplikasi Discord lalu coba lagi.","Actualiza la app de Discord e inténtalo de nuevo.","Aktualisiere die Discord-App und versuche es erneut.","Mettez à jour l’app Discord et réessayez.","Frissítsd a Discord alkalmazást és próbáld újra.","Discord アプリを更新して再試行してください。","Discord 앱을 업데이트한 뒤 다시 시도하세요.","Обновите приложение Discord и попробуйте снова."),
    L("Pencereyi kapatıp yeniden aç.","Close the window and reopen it.","Feche a janela e abra de novo.","Tutup jendela lalu buka lagi.","Cierra la ventana y ábrela de nuevo.","Schließe das Fenster und öffne es erneut.","Fermez la fenêtre et rouvrez-la.","Zárd be az ablakot és nyisd meg újra.","ウィンドウを閉じて再度開いてください。","창을 닫았다가 다시 여세요.","Закройте окно и откройте снова."),
  ]
);

put("1002",
  L("SDK Zaman Aşımı","SDK Timeout","Tempo Limite do SDK","Timeout SDK","Tiempo de espera del SDK","SDK-Zeitüberschreitung","Délai d’attente du SDK","SDK időtúllépés","SDK タイムアウト","SDK 시간 초과","Тайм-аут SDK"),
  L("Authentication timeout.","Authentication timeout.","Tempo limite de autenticação.","Batas waktu autentikasi.","Tiempo de espera de autenticación.","Authentifizierungs-Timeout.","Délai d’authentification dépassé.","Hitelesítési időtúllépés.","認証タイムアウト。","인증 시간 초과.","Тайм-аут аутентификации."),
  [
    L("Discord SDK 90 saniye içinde hazır hale gelemedi.","Discord SDK did not become ready within 90 seconds.","O SDK do Discord não ficou pronto em 90 segundos.","SDK Discord tidak siap dalam 90 detik.","El SDK de Discord no estuvo listo en 90 segundos.","Das Discord-SDK war innerhalb von 90 Sekunden nicht bereit.","Le SDK Discord n’a pas été prêt en 90 secondes.","A Discord SDK 90 másodpercen belül nem készült el.","Discord SDK が 90 秒以内に準備完了しませんでした。","Discord SDK가 90초 안에 준비되지 않았습니다.","Discord SDK не был готов за 90 секунд."),
    L("İnternet bağlantısı yavaş veya kesintili.","Internet connection is slow or unstable.","A conexão com a internet está lenta ou instável.","Koneksi internet lambat atau tidak stabil.","La conexión a internet es lenta o inestable.","Die Internetverbindung ist langsam oder instabil.","La connexion Internet est lente ou instable.","Az internetkapcsolat lassú vagy instabil.","インターネット接続が遅い、または不安定です。","인터넷 연결이 느리거나 불안정합니다.","Интернет медленный или нестабильный."),
    L("Discord sunucuları geçici olarak yüksek yük altında.","Discord servers are temporarily under high load.","Os servidores do Discord estão temporariamente sob alta carga.","Server Discord sementara beban tinggi.","Los servidores de Discord están temporalmente con alta carga.","Discord-Server stehen vorübergehend unter hoher Last.","Les serveurs Discord sont temporairement sous forte charge.","A Discord szerverek átmenetileg nagy terhelés alatt vannak.","Discord サーバーが一時的に高負荷です。","Discord 서버가 일시적으로 부하가 높습니다.","Серверы Discord временно под высокой нагрузкой."),
  ],
  [S.reopen, S.checkNet, S.waitRetry]
);

put("1003",
  L("Client ID Tanımlı Değil","Client ID Not Set","Client ID Não Definido","Client ID Belum Diatur","Client ID No Definido","Client-ID Nicht Gesetzt","Client ID Non Défini","Client ID Nincs Beállítva","Client ID 未設定","Client ID 미설정","Client ID не задан"),
  L("Discord Client ID tanımlı değil (NEXT_PUBLIC_DISCORD_CLIENT_ID).","Discord Client ID is not set (NEXT_PUBLIC_DISCORD_CLIENT_ID).","Discord Client ID não está definido (NEXT_PUBLIC_DISCORD_CLIENT_ID).","Discord Client ID belum diatur (NEXT_PUBLIC_DISCORD_CLIENT_ID).","Discord Client ID no está definido (NEXT_PUBLIC_DISCORD_CLIENT_ID).","Discord-Client-ID ist nicht gesetzt (NEXT_PUBLIC_DISCORD_CLIENT_ID).","Discord Client ID n’est pas défini (NEXT_PUBLIC_DISCORD_CLIENT_ID).","A Discord Client ID nincs beállítva (NEXT_PUBLIC_DISCORD_CLIENT_ID).","Discord Client ID が未設定です (NEXT_PUBLIC_DISCORD_CLIENT_ID)。","Discord Client ID가 설정되지 않았습니다(NEXT_PUBLIC_DISCORD_CLIENT_ID).","Discord Client ID не задан (NEXT_PUBLIC_DISCORD_CLIENT_ID)."),
  [
    L("Sunucu yapılandırmasında NEXT_PUBLIC_DISCORD_CLIENT_ID ortam değişkeni eksik.","NEXT_PUBLIC_DISCORD_CLIENT_ID env var is missing in server config.","A variável NEXT_PUBLIC_DISCORD_CLIENT_ID está ausente na configuração.","Variabel lingkungan NEXT_PUBLIC_DISCORD_CLIENT_ID hilang di konfigurasi.","Falta la variable NEXT_PUBLIC_DISCORD_CLIENT_ID en la configuración.","NEXT_PUBLIC_DISCORD_CLIENT_ID fehlt in der Serverkonfiguration.","La variable NEXT_PUBLIC_DISCORD_CLIENT_ID manque dans la configuration.","Hiányzik a NEXT_PUBLIC_DISCORD_CLIENT_ID környezeti változó.","サーバー設定に NEXT_PUBLIC_DISCORD_CLIENT_ID がありません。","서버 설정에 NEXT_PUBLIC_DISCORD_CLIENT_ID가 없습니다.","В конфигурации сервера нет NEXT_PUBLIC_DISCORD_CLIENT_ID."),
    L("Bu bir geliştirici/dağıtım hatasıdır, kullanıcı kaynaklı değildir.","This is a developer/deployment error, not caused by the user.","Este é um erro de desenvolvedor/implantação, não do usuário.","Ini kesalahan pengembang/deployment, bukan dari pengguna.","Es un error de desarrollador/despliegue, no del usuario.","Das ist ein Entwickler-/Deployment-Fehler, nicht nutzerbedingt.","C’est une erreur développeur/déploiement, pas due à l’utilisateur.","Ez fejlesztői/telepítési hiba, nem felhasználói.","開発者/デプロイの問題であり、ユーザー起因ではありません。","개발자/배포 오류이며 사용자 원인이 아닙니다.","Ошибка разработчика/деплоя, не вызванная пользователем."),
  ],
  [S.reportDev]
);

// Rest codes registered from faz-d-errors.mjs via registerRest(put)
console.log('base error codes:', Object.keys(ERRORS).length);
