/** Remaining DW error codes for Faz D */
import { L, S } from './faz-d-error-codes.mjs';

export function registerRest(put) {
  put("1004",
    L("SDK Kimlik Doğrulaması Başarısız","SDK Authentication Failed","Falha na Autenticação do SDK","Autentikasi SDK Gagal","Fallo de autenticación del SDK","SDK-Authentifizierung Fehlgeschlagen","Échec d’authentification SDK","SDK-hitelesítés sikertelen","SDK 認証失敗","SDK 인증 실패","Сбой аутентификации SDK"),
    L("Discord yetkilendirmesi başarısız.","Discord authorization failed.","A autorização do Discord falhou.","Otorisasi Discord gagal.","Falló la autorización de Discord.","Discord-Autorisierung fehlgeschlagen.","Échec de l’autorisation Discord.","A Discord jogosultságkezelés sikertelen.","Discord の認可に失敗しました。","Discord 인증에 실패했습니다.","Авторизация Discord не удалась."),
    [
      L("Discord OAuth akışı tamamlanamadı.","Discord OAuth flow could not complete.","O fluxo OAuth do Discord não foi concluído.","Alur OAuth Discord tidak selesai.","No se completó el flujo OAuth de Discord.","Der Discord-OAuth-Ablauf konnte nicht abgeschlossen werden.","Le flux OAuth Discord n’a pas pu aboutir.","A Discord OAuth folyamat nem fejeződött be.","Discord OAuth フローを完了できませんでした。","Discord OAuth 흐름을 완료하지 못했습니다.","Поток Discord OAuth не завершился."),
      L("Kullanıcı izin penceresini kapattı veya reddetti.","User closed or denied the permission prompt.","O usuário fechou ou negou o prompt de permissão.","Pengguna menutup atau menolak permintaan izin.","El usuario cerró o rechazó el aviso de permiso.","Nutzer hat die Berechtigungsabfrage geschlossen oder abgelehnt.","L’utilisateur a fermé ou refusé l’invite d’autorisation.","A felhasználó bezárta vagy elutasította az engedélykérést.","ユーザーが許可ダイアログを閉じたか拒否しました。","사용자가 권한 창을 닫거나 거부했습니다.","Пользователь закрыл или отклонил запрос разрешений."),
      L("Discord API geçici bir hata döndürdü.","Discord API returned a temporary error.","A API do Discord retornou um erro temporário.","API Discord mengembalikan error sementara.","La API de Discord devolvió un error temporal.","Die Discord-API gab einen vorübergehenden Fehler zurück.","L’API Discord a renvoyé une erreur temporaire.","A Discord API átmeneti hibát adott.","Discord API が一時的なエラーを返しました。","Discord API가 일시적 오류를 반환했습니다.","API Discord вернул временную ошибку."),
      L("Backend auth endpoint'e ulaşılamadı.","Backend auth endpoint was unreachable.","O endpoint de auth do backend ficou inacessível.","Endpoint auth backend tidak dapat dijangkau.","No se pudo alcanzar el endpoint de auth del backend.","Backend-Auth-Endpunkt war nicht erreichbar.","L’endpoint d’auth du backend était inaccessible.","A backend auth végpont nem volt elérhető.","バックエンド認証エンドポイントに到達できませんでした。","백엔드 인증 엔드포인트에 연결할 수 없습니다.","Эндпоинт auth бэкенда недоступен."),
    ],
    [
      L("Activity penceresini kapatıp tekrar aç; izin ekranı gelirse onayla.","Close and reopen Activity; approve the permission screen if shown.","Feche e reabra o Activity; aprove a permissão se aparecer.","Tutup dan buka ulang Activity; setujui izin jika muncul.","Cierra y vuelve a abrir Activity; aprueba el permiso si aparece.","Activity schließen und erneut öffnen; Berechtigung ggf. bestätigen.","Fermez et rouvrez Activity ; approuvez l’autorisation si demandée.","Zárd be és nyisd újra az Activityt; ha jön engedélykérés, fogadd el.","Activity を閉じて再開し、許可画面が出たら承認してください。","Activity를 닫았다가 다시 열고, 권한 화면이 나오면 승인하세요.","Закройте и откройте Activity; подтвердите разрешения, если появятся."),
      S.checkNet, S.waitRetry,
    ]
  );

  put("1005",
    L("OAuth Token Alınamadı","OAuth Token Not Obtained","Token OAuth Não Obtido","Token OAuth Tidak Didapat","Token OAuth No Obtenido","OAuth-Token Nicht Erhalten","Jeton OAuth Non Obtenu","OAuth token nem érkezett","OAuth トークン取得失敗","OAuth 토큰 미획득","Токен OAuth не получен"),
    L("Discord OAuth token alınamadı.","Discord OAuth token could not be obtained.","Não foi possível obter o token OAuth do Discord.","Token OAuth Discord tidak bisa didapat.","No se pudo obtener el token OAuth de Discord.","Discord-OAuth-Token konnte nicht bezogen werden.","Impossible d’obtenir le jeton OAuth Discord.","A Discord OAuth token nem szerezhető meg.","Discord OAuth トークンを取得できませんでした。","Discord OAuth 토큰을 얻지 못했습니다.","Не удалось получить токен Discord OAuth."),
    [
      L("Discord token exchange adımı başarısız oldu.","Discord token exchange step failed.","A etapa de troca de token do Discord falhou.","Langkah pertukaran token Discord gagal.","Falló el intercambio de token de Discord.","Der Discord-Token-Austausch ist fehlgeschlagen.","L’échange de jeton Discord a échoué.","A Discord tokencsere lépés sikertelen.","Discord トークン交換ステップが失敗しました。","Discord 토큰 교환 단계가 실패했습니다.","Шаг обмена токеном Discord не удался."),
      L("Backend ile Discord arasındaki iletişimde sorun var.","There is a communication issue between backend and Discord.","Há um problema de comunicação entre o backend e o Discord.","Ada masalah komunikasi antara backend dan Discord.","Hay un problema de comunicación entre el backend y Discord.","Es gibt ein Kommunikationsproblem zwischen Backend und Discord.","Il y a un problème de communication entre le backend et Discord.","Kommunikációs probléma van a backend és a Discord között.","バックエンドと Discord 間の通信に問題があります。","백엔드와 Discord 간 통신 문제가 있습니다.","Проблема связи между бэкендом и Discord."),
    ],
    [S.reopenActivity, L("Sorun devam ederse geliştiriciyi bildir.","If it persists, report to the developer.","Se persistir, avise o desenvolvedor.","Jika berlanjut, laporkan ke pengembang.","Si continúa, avisa al desarrollador.","Wenn es anhält, melde es dem Entwickler.","Si cela continue, signalez au développeur.","Ha folytatódik, jelezd a fejlesztőnek.","続く場合は開発者に報告してください。","계속되면 개발자에게 신고하세요.","Если продолжается — сообщите разработчику.")]
  );

  put("2001",
    L("Sunucu Kayıtlı Değil","Server Not Registered","Servidor Não Registrado","Server Belum Terdaftar","Servidor No Registrado","Server Nicht Registriert","Serveur Non Enregistré","Szerver nincs regisztrálva","サーバー未登録","서버 미등록","Сервер не зарегистрирован"),
    L("Sunucu sisteme kayıtlı değil. Yönetici kurulum yapmalı.","Server is not registered. An admin must complete setup.","O servidor não está registrado. Um admin deve concluir o setup.","Server belum terdaftar. Admin harus menyelesaikan setup.","El servidor no está registrado. Un admin debe completar el setup.","Server ist nicht registriert. Ein Admin muss das Setup abschließen.","Le serveur n’est pas enregistré. Un admin doit terminer le setup.","A szerver nincs regisztrálva. Egy adminnak el kell végeznie a telepítést.","サーバーが未登録です。管理者がセットアップを完了する必要があります。","서버가 등록되지 않았습니다. 관리자가 설정을 완료해야 합니다.","Сервер не зарегистрирован. Админ должен завершить установку."),
    [
      L("Discord sunucusu DiscoWeb sistemine hiç kaydedilmemiş.","Discord server was never registered in DiscoWeb.","O servidor Discord nunca foi registrado no DiscoWeb.","Server Discord belum pernah didaftarkan di DiscoWeb.","El servidor de Discord nunca se registró en DiscoWeb.","Discord-Server wurde nie in DiscoWeb registriert.","Le serveur Discord n’a jamais été enregistré dans DiscoWeb.","A Discord szerver soha nem lett regisztrálva a DiscoWebben.","Discord サーバーが DiscoWeb に一度も登録されていません。","Discord 서버가 DiscoWeb에 등록된 적이 없습니다.","Сервер Discord никогда не регистрировался в DiscoWeb."),
      L("Yönetici setup adımlarını henüz tamamlamamış.","Admin has not finished setup steps yet.","O admin ainda não concluiu as etapas do setup.","Admin belum menyelesaikan langkah setup.","El admin aún no ha terminado los pasos del setup.","Admin hat die Setup-Schritte noch nicht abgeschlossen.","L’admin n’a pas encore terminé les étapes du setup.","Az admin még nem fejezte be a telepítési lépéseket.","管理者がセットアップ手順をまだ完了していません。","관리자가 아직 설정 단계를 끝내지 않았습니다.","Админ ещё не завершил шаги установки."),
    ],
    [
      L("Yöneticiler için: discoweb.tech adresine git ve sunucunu kaydet.","For admins: go to discoweb.tech and register your server.","Para admins: vá a discoweb.tech e registre o servidor.","Untuk admin: buka discoweb.tech dan daftarkan server.","Para admins: ve a discoweb.tech y registra el servidor.","Für Admins: gehe zu discoweb.tech und registriere den Server.","Pour les admins : allez sur discoweb.tech et enregistrez le serveur.","Adminoknak: menj a discoweb.tech oldalra és regisztráld a szervert.","管理者向け: discoweb.tech でサーバーを登録してください。","관리자용: discoweb.tech에서 서버를 등록하세요.","Админам: зайдите на discoweb.tech и зарегистрируйте сервер."),
      S.tellAdmin,
    ]
  );

  put("2002",
    L("Kurulum Tamamlanmamış","Setup Incomplete","Setup Incompleto","Setup Belum Selesai","Configuración incompleta","Setup Unvollständig","Configuration Incomplète","Telepítés nem kész","セットアップ未完了","설정 미완료","Установка не завершена"),
    L("Sunucu kurulumu tamamlanmamış. Yönetici setup'ı bitirmeli.","Server setup is incomplete. Admin must finish setup.","A configuração do servidor está incompleta. O admin deve concluir.","Setup server belum selesai. Admin harus menyelesaikan.","La configuración del servidor está incompleta. El admin debe terminarla.","Server-Setup ist unvollständig. Admin muss es abschließen.","La configuration du serveur est incomplète. L’admin doit la terminer.","A szerver telepítése nincs kész. Az adminnak be kell fejeznie.","サーバーセットアップが未完了です。管理者が完了する必要があります。","서버 설정이 완료되지 않았습니다. 관리자가 마쳐야 합니다.","Установка сервера не завершена. Админ должен закончить setup."),
    [
      L("Sunucu sisteme kayıtlı ama kurulum tamamlanmamış.","Server is registered but setup is not finished.","O servidor está registrado, mas o setup não terminou.","Server terdaftar tapi setup belum selesai.","El servidor está registrado, pero el setup no terminó.","Server ist registriert, aber Setup nicht fertig.","Le serveur est enregistré, mais le setup n’est pas terminé.","A szerver regisztrálva van, de a telepítés nincs kész.","サーバーは登録済みですがセットアップ未完了です。","서버는 등록됐지만 설정이 끝나지 않았습니다.","Сервер зарегистрирован, но setup не завершён."),
      L("Yönetici kurulum sürecini yarıda bırakmış.","Admin abandoned setup mid-way.","O admin interrompeu o setup no meio.","Admin meninggalkan setup di tengah jalan.","El admin dejó el setup a medias.","Admin hat Setup mittendrin abgebrochen.","L’admin a interrompu le setup en cours.","Az admin félbehagyta a telepítést.","管理者がセットアップを途中で中断しました。","관리자가 설정을 중간에 중단했습니다.","Админ прервал установку на полпути."),
    ],
    [
      L("Yöneticiler için: discoweb.tech adresine git ve kurulumu tamamla.","For admins: go to discoweb.tech and finish setup.","Para admins: vá a discoweb.tech e conclua o setup.","Untuk admin: buka discoweb.tech dan selesaikan setup.","Para admins: ve a discoweb.tech y termina el setup.","Für Admins: gehe zu discoweb.tech und schließe Setup ab.","Pour les admins : allez sur discoweb.tech et terminez le setup.","Adminoknak: menj a discoweb.tech oldalra és fejezd be a telepítést.","管理者向け: discoweb.tech でセットアップを完了してください。","관리자용: discoweb.tech에서 설정을 완료하세요.","Админам: зайдите на discoweb.tech и завершите установку."),
      S.tellAdmin,
    ]
  );

  put("2003",
    L("Bot Sunucuda Bulunamıyor","Bot Not In Server","Bot Não Está no Servidor","Bot Tidak Ada di Server","Bot No Está en el Servidor","Bot Nicht Auf Dem Server","Bot Absent du Serveur","A bot nincs a szerveren","ボットがサーバーにいない","봇이 서버에 없음","Бот не на сервере"),
    L("Bot sunucuda bulunamıyor. Yönetici botu yeniden davet etmeli.","Bot is not on the server. Admin must re-invite the bot.","O bot não está no servidor. O admin deve reconvidá-lo.","Bot tidak ada di server. Admin harus undang ulang bot.","El bot no está en el servidor. El admin debe reinvitarlo.","Bot ist nicht auf dem Server. Admin muss den Bot erneut einladen.","Le bot n’est pas sur le serveur. L’admin doit le réinviter.","A bot nincs a szerveren. Az adminnak újra meg kell hívnia.","ボットがサーバーにいません。管理者が再招待する必要があります。","봇이 서버에 없습니다. 관리자가 봇을 다시 초대해야 합니다.","Бота нет на сервере. Админ должен пригласить бота снова."),
    [
      L("DiscoWeb botu sunucudan çıkarılmış veya hiç eklenmemiş.","DiscoWeb bot was removed or never added.","O bot DiscoWeb foi removido ou nunca adicionado.","Bot DiscoWeb dihapus atau belum pernah ditambahkan.","El bot DiscoWeb se eliminó o nunca se añadió.","DiscoWeb-Bot wurde entfernt oder nie hinzugefügt.","Le bot DiscoWeb a été retiré ou jamais ajouté.","A DiscoWeb botot eltávolították vagy soha nem adták hozzá.","DiscoWeb ボットが削除されたか、追加されていません。","DiscoWeb 봇이 제거되었거나 추가된 적이 없습니다.","Бот DiscoWeb удалён или не добавлялся."),
      L("Bot sunucuda bulunuyor ama yetkileri kaldırılmış.","Bot is present but permissions were removed.","O bot está presente, mas permissões foram removidas.","Bot ada tetapi izinnya dihapus.","El bot está, pero se quitaron permisos.","Bot ist da, aber Berechtigungen wurden entfernt.","Le bot est présent, mais les permissions ont été retirées.","A bot jelen van, de a jogosultságait elvették.","ボットはいますが権限が削除されています。","봇은 있지만 권한이 제거되었습니다.","Бот есть, но права сняты."),
    ],
    [
      L("Yöneticiler için: Botu sunucuya yeniden davet et ve gerekli yetkileri (Rolleri Yönet, Mesaj Gönder) ver.","For admins: Re-invite the bot and grant Manage Roles, Send Messages.","Para admins: reconvidar o bot e conceder Gerenciar Cargos e Enviar Mensagens.","Untuk admin: undang ulang bot dan beri Kelola Peran, Kirim Pesan.","Para admins: reinvitar el bot y dar Gestionar roles y Enviar mensajes.","Für Admins: Bot erneut einladen und Rollen verwalten sowie Nachrichten senden gewähren.","Pour les admins : réinvitez le bot et accordez Gérer les rôles et Envoyer des messages.","Adminoknak: hívd meg újra a botot, és add meg a Szerepek kezelése, Üzenetek küldése jogokat.","管理者向け: ボットを再招待し、「ロールの管理」「メッセージ送信」を付与してください。","관리자용: 봇을 다시 초대하고 역할 관리·메시지 보내기 권한을 주세요.","Админам: пригласите бота снова и выдайте «Управлять ролями» и «Отправлять сообщения»."),
      S.tellAdmin,
    ]
  );

  put("2004",
    L("Discord API Hatası","Discord API Error","Erro da API Discord","Kesalahan API Discord","Error de API de Discord","Discord-API-Fehler","Erreur API Discord","Discord API hiba","Discord API エラー","Discord API 오류","Ошибка API Discord"),
    L("Discord API geçici hata verdi. Birkaç dakika sonra tekrar dene.","Discord API returned a temporary error. Try again in a few minutes.","A API do Discord deu erro temporário. Tente de novo em alguns minutos.","API Discord error sementara. Coba lagi dalam beberapa menit.","La API de Discord dio un error temporal. Inténtalo en unos minutos.","Discord-API gab einen vorübergehenden Fehler. In wenigen Minuten erneut versuchen.","L’API Discord a renvoyé une erreur temporaire. Réessayez dans quelques minutes.","A Discord API átmeneti hibát adott. Próbáld újra néhány perc múlva.","Discord API が一時エラーを返しました。数分後に再試行してください。","Discord API가 일시 오류를 반환했습니다. 몇 분 후 다시 시도하세요.","API Discord вернул временную ошибку. Повторите через несколько минут."),
    [
      L("Discord'un kendi API'si geçici olarak çalışmıyor.","Discord's own API is temporarily down.","A própria API do Discord está temporariamente fora.","API Discord sendiri sementara down.","La propia API de Discord está temporalmente caída.","Discords eigene API ist vorübergehend down.","L’API Discord elle-même est temporairement hors service.","A Discord saját API-ja átmenetileg nem működik.","Discord 自体の API が一時的にダウンしています。","Discord 자체 API가 일시적으로 다운되었습니다.","Собственный API Discord временно недоступен."),
      L("discordstatus.com'da aktif bir olay var.","There is an active incident on discordstatus.com.","Há um incidente ativo em discordstatus.com.","Ada insiden aktif di discordstatus.com.","Hay un incidente activo en discordstatus.com.","Auf discordstatus.com gibt es einen aktiven Vorfall.","Il y a un incident actif sur discordstatus.com.","Aktív incidens van a discordstatus.com-on.","discordstatus.com でインシデントが発生中です。","discordstatus.com에 진행 중인 장애가 있습니다.","На discordstatus.com активный инцидент."),
    ],
    [S.waitRetry, L("discordstatus.com adresini kontrol et.","Check discordstatus.com.","Verifique discordstatus.com.","Periksa discordstatus.com.","Revisa discordstatus.com.","Prüfe discordstatus.com.","Consultez discordstatus.com.","Nézd meg a discordstatus.com-ot.","discordstatus.com を確認してください。","discordstatus.com을 확인하세요.","Проверьте discordstatus.com.")]
  );

  put("2005",
    L("Servis Anahtarı Eksik","Service Key Missing","Chave de Serviço Ausente","Kunci Layanan Hilang","Clave de servicio ausente","Dienstschlüssel Fehlt","Clé de Service Manquante","Szolgáltatáskulcs hiányzik","サービスキー欠落","서비스 키 누락","Отсутствует service key"),
    L("Sunucu yapılandırması eksik (servis anahtarı).","Server configuration incomplete (service key).","Configuração do servidor incompleta (chave de serviço).","Konfigurasi server tidak lengkap (kunci layanan).","Configuración del servidor incompleta (clave de servicio).","Serverkonfiguration unvollständig (Dienstschlüssel).","Configuration serveur incomplète (clé de service).","Szerverkonfiguráció hiányos (szolgáltatáskulcs).","サーバー設定が不完全です（サービスキー）。","서버 구성이 불완전합니다(서비스 키).","Конфигурация сервера неполная (service key)."),
    [
      L("SUPABASE_SERVICE_ROLE_KEY ortam değişkeni eksik veya hatalı.","SUPABASE_SERVICE_ROLE_KEY env var is missing or invalid.","A variável SUPABASE_SERVICE_ROLE_KEY está ausente ou inválida.","Variabel SUPABASE_SERVICE_ROLE_KEY hilang atau tidak valid.","Falta o es inválida la variable SUPABASE_SERVICE_ROLE_KEY.","SUPABASE_SERVICE_ROLE_KEY fehlt oder ist ungültig.","SUPABASE_SERVICE_ROLE_KEY est manquante ou invalide.","A SUPABASE_SERVICE_ROLE_KEY hiányzik vagy érvénytelen.","SUPABASE_SERVICE_ROLE_KEY が欠落または無効です。","SUPABASE_SERVICE_ROLE_KEY가 없거나 잘못되었습니다.","SUPABASE_SERVICE_ROLE_KEY отсутствует или неверна."),
      L("Bu bir sunucu tarafı yapılandırma hatasıdır.","This is a server-side configuration error.","Este é um erro de configuração do lado do servidor.","Ini kesalahan konfigurasi sisi server.","Es un error de configuración del servidor.","Das ist ein serverseitiger Konfigurationsfehler.","C’est une erreur de configuration côté serveur.","Ez szerveroldali konfigurációs hiba.","サーバー側の設定エラーです。","서버 측 구성 오류입니다.","Это ошибка конфигурации на стороне сервера."),
    ],
    [S.reportDev]
  );

  put("2006",
    L("Bot Token Eksik","Bot Token Missing","Token do Bot Ausente","Token Bot Hilang","Token del bot ausente","Bot-Token Fehlt","Jeton Bot Manquant","Bot token hiányzik","ボットトークン欠落","봇 토큰 누락","Отсутствует токен бота"),
    L("Bot token yapılandırması eksik.","Bot token configuration is missing.","A configuração do token do bot está ausente.","Konfigurasi token bot hilang.","Falta la configuración del token del bot.","Bot-Token-Konfiguration fehlt.","La configuration du jeton bot est manquante.","A bot token konfiguráció hiányzik.","ボットトークン設定がありません。","봇 토큰 구성이 없습니다.","Конфигурация токена бота отсутствует."),
    [
      L("DISCORD_BOT_TOKEN ortam değişkeni sunucu tarafında tanımlı değil.","DISCORD_BOT_TOKEN env var is not set on the server.","DISCORD_BOT_TOKEN não está definida no servidor.","DISCORD_BOT_TOKEN belum diatur di server.","DISCORD_BOT_TOKEN no está definida en el servidor.","DISCORD_BOT_TOKEN ist serverseitig nicht gesetzt.","DISCORD_BOT_TOKEN n’est pas définie côté serveur.","A DISCORD_BOT_TOKEN nincs beállítva a szerveren.","サーバー側に DISCORD_BOT_TOKEN が未設定です。","서버에 DISCORD_BOT_TOKEN이 설정되지 않았습니다.","DISCORD_BOT_TOKEN не задана на сервере."),
      L("Bu bir geliştirici/dağıtım hatasıdır.","This is a developer/deployment error.","Este é um erro de desenvolvedor/implantação.","Ini kesalahan pengembang/deployment.","Es un error de desarrollador/despliegue.","Das ist ein Entwickler-/Deployment-Fehler.","C’est une erreur développeur/déploiement.","Ez fejlesztői/telepítési hiba.","開発者/デプロイの問題です。","개발자/배포 오류입니다.","Ошибка разработчика/деплоя."),
    ],
    [S.reportDev]
  );

  // User / economy / network / unknown — condensed but complete
  const rest = [
    ["3001","Oturum Geçersiz","Session Invalid","Oturum geçersiz veya süresi dolmuş. Yeniden giriş gerekiyor.","Session invalid or expired. Sign in again.",
      ["Oturum çerezi süresi dolmuş.","Session cookie expired.","Oturum verisi bozulmuş veya silinmiş.","Session data corrupted or deleted.","Activity çok uzun süre açık kaldı.","Activity stayed open too long."],
      ["Activity penceresini kapatıp yeniden aç; otomatik olarak yeniden giriş yapılır.","Close and reopen Activity; you will sign in automatically.","Oturumu Sıfırla butonuna basarak tüm session verilerini temizle.","Press Reset Session to clear all session data."]],
    ["3002","Sunucu Üyesi Değilsin","Not a Server Member","Bu sunucuda üye değilsin.","You are not a member of this server.",
      ["Discord hesabın bu sunucudan çıkarılmış veya hiç katılmamış.","Your Discord account was removed or never joined.","Activity farklı bir hesapla açılmaya çalışılıyor.","Activity is being opened with a different account."],
      ["Önce Discord'da bu sunucuya üye olduğundan emin ol.","First ensure you are a member of this server on Discord.","Doğru Discord hesabınla giriş yaptığını kontrol et.","Check that you signed in with the correct Discord account."]],
    ["3003","Kullanıcı Profili Bulunamadı","User Profile Not Found","Kullanıcı profili bulunamadı.","User profile not found.",
      ["Bu sunucu için henüz bir DiscoWeb profili oluşturulmamış.","No DiscoWeb profile exists yet for this server.","Profil verisi sistemden silinmiş.","Profile data was deleted from the system."],
      ["İlk kez giriyorsan profil oluşturma ekranı otomatik açılır; formu doldur.","On first visit the profile form opens automatically; fill it in.","Sorun devam ederse Activity'yi yeniden aç.","If it persists, reopen Activity."]],
    ["3004","Gerekli Rol Eksik","Required Role Missing","Bu özellik için gerekli rol eksik.","Required role for this feature is missing.",
      ["Bu özelliği kullanmak için gereken Discord rolüne sahip değilsin.","You lack the Discord role required for this feature.","Sunucu yöneticisi bu özelliği belirli rollerle kısıtlamış.","Server admin restricted this feature to certain roles."],
      ["Sunucu yöneticinizden gerekli rolü talep edin.","Ask your server admin for the required role."]],
    ["3005","Yetersiz Yetki","Insufficient Permission","Bu işlem için yetkin yok.","You do not have permission for this action.",
      ["İşlem için gereken sunucu iznine sahip değilsin.","You lack the required server permission.","Yönetici paneline üye olarak erişmeye çalışıyorsun.","You are trying to open the admin panel as a member."],
      ["Sunucu yöneticinizle iletişime geçin.","Contact your server administrator."]],
    ["4002","Yetersiz Bakiye","Insufficient Balance","İşlem bakiyeniz yetersiz.","Your balance is insufficient for this action.",
      ["Yapmak istediğin işlem için yeterli bakiyen yok.","You do not have enough balance for this action."],
      ["Bakiyeni kontrol et.","Check your balance.","Kazanma yollarını (check-in, mesaj, ses vb.) kullanarak bakiye topla.","Earn more via check-in, messages, voice, etc."]],
    ["4003","Günlük Transfer Limiti","Daily Transfer Limit","Günlük transfer limitine ulaşıldı.","Daily transfer limit reached.",
      ["24 saat içinde transfer yapabileceğin maksimum miktara ulaştın.","You hit the max transfer amount within 24 hours."],
      ["24 saat bekle ve tekrar dene.","Wait 24 hours and try again."]],
    ["5001","Sunucuya Bağlanılamadı","Could Not Connect","Sunucuya bağlanılamadı. İnternet bağlantını kontrol et.","Could not connect to the server. Check your internet.",
      ["İnternet bağlantısı yok veya çok yavaş.","No internet or connection is very slow.","DiscoWeb sunucuları geçici olarak erişilemez durumda.","DiscoWeb servers are temporarily unreachable."],
      [S.checkNet.tr, S.checkNet.en, "Birkaç saniye bekleyip tekrar dene.","Wait a few seconds and try again."]],
    ["5002","API Yanıt Vermedi","API No Response","API yanıt vermedi. Sunucu geçici olarak meşgul olabilir.","API did not respond. Server may be temporarily busy.",
      ["DiscoWeb API sunucusu yüksek yük altında.","DiscoWeb API is under high load.","İstek zaman aşımına uğradı.","The request timed out."],
      ["Birkaç saniye bekleyip tekrar dene.","Wait a few seconds and try again.","Sorun devam ederse geliştiriciyi bildir.","If it persists, report to the developer."]],
    ["5003","Geçersiz API Yanıtı","Invalid API Response","Geçersiz API yanıtı alındı.","Invalid API response received.",
      ["API beklenmeyen formatta yanıt döndürdü.","API returned an unexpected format.","Muhtemelen bir deploy veya versiyon uyumsuzluğu.","Likely a deploy or version mismatch."],
      ["Sayfayı yenile veya Activity'yi yeniden aç.","Refresh the page or reopen Activity.","Sorun devam ederse geliştiriciyi bildir.","If it persists, report to the developer."]],
    ["9001","Beklenmeyen JavaScript Hatası","Unexpected JavaScript Error","Beklenmeyen bir JavaScript hatası oluştu.","An unexpected JavaScript error occurred.",
      ["Uygulama kodunda beklenmedik bir durum oluştu.","Unexpected condition in application code.","Tarayıcı veya Discord istemci uyumsuzluğu.","Browser or Discord client incompatibility."],
      ["Bildirimi gördüğünde Geliştiricide Bildir butonuna bas.","When you see the notice, press Report to Developer.","Activity'yi yeniden aç.","Reopen Activity."]],
    ["9002","İşlenmeyen Promise Hatası","Unhandled Promise Error","İşlenmeyen bir Promise hatası oluştu.","An unhandled Promise error occurred.",
      ["Bir ağ isteği veya asenkron işlem beklenmedik şekilde başarısız oldu.","A network request or async operation failed unexpectedly."],
      ["Bildirimi gördüğünde Geliştiricide Bildir butonuna bas.","When you see the notice, press Report to Developer.","Activity'yi yeniden aç.","Reopen Activity."]],
    ["9003","Bilinmeyen Hata","Unknown Error","Bilinmeyen bir hata oluştu.","An unknown error occurred.",
      ["Hata kaynağı belirlenemedi.","Error source could not be determined."],
      ["Geliştiricide Bildir butonuna basarak geliştiriciyi haberdar et.","Press Report to Developer to notify the developer.","Activity'yi yeniden aç.","Reopen Activity."]],
  ];

  // Expand compact TR/EN pairs into full 11-lang via EN as base for secondary with native rewrites
  const sec = {
    pt: (en) => en, // will override below with better maps
  };

  // Helper: expand TR/EN compact entries to full L() using translation maps for secondary
  function expandPair(tr, en) {
    return L(
      tr, en,
      // pt
      translate(en, 'pt'),
      translate(en, 'id'),
      translate(en, 'es'),
      translate(en, 'de'),
      translate(en, 'fr'),
      translate(en, 'hu'),
      translate(en, 'ja'),
      translate(en, 'ko'),
      translate(en, 'ru'),
    );
  }

  // Phrase dictionary for remaining compact codes (native secondary)
  const dict = buildDict();

  function translate(en, lang) {
    if (dict[en] && dict[en][lang]) return dict[en][lang];
    // Prefer not to EN-copy: use a soft marker only if missing — but we fill dict comprehensively
    return dict[en]?.[lang] ?? en;
  }

  for (const row of rest) {
    const [code, titleTr, titleEn, msgTr, msgEn, causesPairs, solPairs] = row;
    const causes = [];
    for (let i = 0; i < causesPairs.length; i += 2) {
      const cTr = causesPairs[i];
      const cEn = causesPairs[i + 1] || cTr;
      // If already an L object (from S), use as-is
      if (typeof cTr === 'object' && cTr.tr) { causes.push(cTr); i -= 1; continue; }
      causes.push(expandPair(cTr, cEn));
    }
    const solutions = [];
    for (let i = 0; i < solPairs.length; i += 2) {
      const sTr = solPairs[i];
      const sEn = solPairs[i + 1] || sTr;
      if (typeof sTr === 'object' && sTr.tr) { solutions.push(sTr); i -= 1; continue; }
      solutions.push(expandPair(sTr, sEn));
    }
    // Fix 5001 which mixed S.checkNet incorrectly
    if (code === '5001') {
      put(code, expandPair(titleTr, titleEn), expandPair(msgTr, msgEn),
        [expandPair(causesPairs[0], causesPairs[1]), expandPair(causesPairs[2], causesPairs[3])],
        [S.checkNet, expandPair('Birkaç saniye bekleyip tekrar dene.', 'Wait a few seconds and try again.')]);
      continue;
    }
    put(code, expandPair(titleTr, titleEn), expandPair(msgTr, msgEn), causes, solutions);
  }
}

function buildDict() {
  // en -> {pt,id,es,de,fr,hu,ja,ko,ru}
  const D = {};
  const a = (en, pt, id, es, de, fr, hu, ja, ko, ru) => { D[en] = { pt, id, es, de, fr, hu, ja, ko, ru }; };
  a('Session Invalid','Sessão Inválida','Sesi Tidak Valid','Sesión no válida','Sitzung Ungültig','Session Invalide','Érvénytelen munkamenet','セッション無効','세션 무효','Недействительная сессия');
  a('Session invalid or expired. Sign in again.','Sessão inválida ou expirada. Entre novamente.','Sesi tidak valid atau kedaluwarsa. Masuk lagi.','Sesión no válida o caducada. Vuelve a iniciar sesión.','Sitzung ungültig oder abgelaufen. Melde dich erneut an.','Session invalide ou expirée. Reconnectez-vous.','Érvénytelen vagy lejárt munkamenet. Jelentkezz be újra.','セッションが無効または期限切れです。再度ログインしてください。','세션이 무효이거나 만료되었습니다. 다시 로그인하세요.','Сессия недействительна или истекла. Войдите снова.');
  a('Session cookie expired.','Cookie de sessão expirou.','Cookie sesi kedaluwarsa.','La cookie de sesión caducó.','Sitzungs-Cookie abgelaufen.','Le cookie de session a expiré.','A munkamenet-süti lejárt.','セッション Cookie の期限が切れました。','세션 쿠키가 만료되었습니다.','Срок cookie сессии истёк.');
  a('Session data corrupted or deleted.','Dados da sessão corrompidos ou excluídos.','Data sesi rusak atau dihapus.','Datos de sesión corruptos o eliminados.','Sitzungsdaten beschädigt oder gelöscht.','Données de session corrompues ou supprimées.','A munkamenetadatok sérültek vagy törölve.','セッションデータが破損または削除されました。','세션 데이터가 손상되었거나 삭제되었습니다.','Данные сессии повреждены или удалены.');
  a('Activity stayed open too long.','O Activity ficou aberto tempo demais.','Activity terbuka terlalu lama.','Activity estuvo abierto demasiado tiempo.','Activity war zu lange geöffnet.','Activity est resté ouvert trop longtemps.','Az Activity túl sokáig volt nyitva.','Activity を長時間開いたままにしました。','Activity를 너무 오래 열어 두었습니다.','Activity был открыт слишком долго.');
  a('Close and reopen Activity; you will sign in automatically.','Feche e reabra o Activity; você entrará automaticamente.','Tutup dan buka ulang Activity; kamu akan masuk otomatis.','Cierra y vuelve a abrir Activity; iniciarás sesión automáticamente.','Activity schließen und erneut öffnen; Anmeldung erfolgt automatisch.','Fermez et rouvrez Activity ; vous serez reconnecté automatiquement.','Zárd be és nyisd újra az Activityt; automatikusan bejelentkezel.','Activity を閉じて再開すると自動ログインします。','Activity를 닫았다가 다시 열면 자동 로그인됩니다.','Закройте и откройте Activity — вход выполнится автоматически.');
  a('Press Reset Session to clear all session data.','Pressione Redefinir Sessão para limpar os dados.','Tekan Reset Sesi untuk membersihkan data.','Pulsa Restablecer sesión para borrar los datos.','Drücke Sitzung zurücksetzen, um Daten zu löschen.','Appuyez sur Réinitialiser la session pour effacer les données.','Nyomd meg a Munkamenet visszaállítása gombot.','「セッションをリセット」でデータを消去します。','세션 재설정으로 데이터를 지우세요.','Нажмите «Сбросить сессию», чтобы очистить данные.');
  a('Not a Server Member','Não É Membro do Servidor','Bukan Anggota Server','No eres miembro del servidor','Kein Servermitglied','Pas Membre du Serveur','Nem szervertag','サーバー未参加','서버 멤버 아님','Не участник сервера');
  a('You are not a member of this server.','Você não é membro deste servidor.','Kamu bukan anggota server ini.','No eres miembro de este servidor.','Du bist kein Mitglied dieses Servers.','Vous n’êtes pas membre de ce serveur.','Nem vagy tagja ennek a szervernek.','このサーバーのメンバーではありません。','이 서버의 멤버가 아닙니다.','Вы не участник этого сервера.');
  a('Your Discord account was removed or never joined.','Sua conta Discord foi removida ou nunca entrou.','Akun Discordmu dihapus atau belum pernah bergabung.','Tu cuenta de Discord fue eliminada o nunca se unió.','Dein Discord-Konto wurde entfernt oder ist nie beigetreten.','Votre compte Discord a été retiré ou n’a jamais rejoint.','A Discord fiókodat eltávolították vagy soha nem csatlakozott.','Discord アカウントが退出済みか未参加です。','Discord 계정이 제거되었거나 가입한 적이 없습니다.','Ваш аккаунт Discord удалён или не вступал.');
  a('Activity is being opened with a different account.','O Activity está sendo aberto com outra conta.','Activity dibuka dengan akun berbeda.','Activity se abre con otra cuenta.','Activity wird mit einem anderen Konto geöffnet.','Activity est ouvert avec un autre compte.','Az Activity más fiókkal nyílik.','別のアカウントで Activity が開かれています。','다른 계정으로 Activity가 열리고 있습니다.','Activity открывается другим аккаунтом.');
  a('First ensure you are a member of this server on Discord.','Primeiro confirme que é membro deste servidor no Discord.','Pastikan dulu kamu anggota server ini di Discord.','Asegúrate primero de ser miembro en Discord.','Stelle zuerst sicher, dass du Mitglied auf Discord bist.','Assurez-vous d’abord d’être membre sur Discord.','Először győződj meg róla, hogy tag vagy Discordon.','まず Discord でこのサーバーのメンバーか確認してください。','먼저 Discord에서 이 서버 멤버인지 확인하세요.','Сначала убедитесь, что вы участник сервера в Discord.');
  a('Check that you signed in with the correct Discord account.','Verifique se entrou com a conta Discord correta.','Pastikan kamu masuk dengan akun Discord yang benar.','Comprueba que iniciaste sesión con la cuenta correcta.','Prüfe, ob du mit dem richtigen Discord-Konto angemeldet bist.','Vérifiez que vous êtes connecté avec le bon compte Discord.','Ellenőrizd, hogy a helyes Discord fiókkal jelentkeztél be.','正しい Discord アカウントでログインしているか確認してください。','올바른 Discord 계정으로 로그인했는지 확인하세요.','Проверьте, что вошли правильным аккаунтом Discord.');
  a('User Profile Not Found','Perfil de Usuário Não Encontrado','Profil Pengguna Tidak Ditemukan','Perfil de usuario no encontrado','Benutzerprofil Nicht Gefunden','Profil Utilisateur Introuvable','Felhasználói profil nem található','ユーザープロフィールなし','사용자 프로필 없음','Профиль не найден');
  a('User profile not found.','Perfil de usuário não encontrado.','Profil pengguna tidak ditemukan.','Perfil de usuario no encontrado.','Benutzerprofil nicht gefunden.','Profil utilisateur introuvable.','Felhasználói profil nem található.','ユーザープロフィールが見つかりません。','사용자 프로필을 찾을 수 없습니다.','Профиль пользователя не найден.');
  a('No DiscoWeb profile exists yet for this server.','Ainda não existe perfil DiscoWeb neste servidor.','Belum ada profil DiscoWeb untuk server ini.','Aún no hay perfil DiscoWeb en este servidor.','Es gibt noch kein DiscoWeb-Profil für diesen Server.','Aucun profil DiscoWeb n’existe encore pour ce serveur.','Még nincs DiscoWeb profil ehhez a szerverhez.','このサーバーの DiscoWeb プロフィールはまだありません。','이 서버용 DiscoWeb 프로필이 아직 없습니다.','Профиля DiscoWeb для этого сервера ещё нет.');
  a('Profile data was deleted from the system.','Os dados do perfil foram excluídos do sistema.','Data profil dihapus dari sistem.','Los datos del perfil se eliminaron del sistema.','Profildaten wurden aus dem System gelöscht.','Les données du profil ont été supprimées du système.','A profiladatok törölve lettek a rendszerből.','プロフィールデータがシステムから削除されました。','프로필 데이터가 시스템에서 삭제되었습니다.','Данные профиля удалены из системы.');
  a('On first visit the profile form opens automatically; fill it in.','Na primeira visita o formulário abre automaticamente; preencha-o.','Kunjungan pertama form profil terbuka otomatis; isi.','En la primera visita el formulario se abre solo; rellénalo.','Beim ersten Besuch öffnet sich das Formular automatisch; fülle es aus.','Lors de la première visite le formulaire s’ouvre ; remplissez-le.','Első belépéskor a profilűrlap automatikusan megnyílik; töltsd ki.','初回はプロフィールフォームが自動表示されます。記入してください。','처음 방문 시 프로필 양식이 자동으로 열립니다. 작성하세요.','При первом входе форма профиля открывается автоматически — заполните её.');
  a('If it persists, reopen Activity.','Se persistir, reabra o Activity.','Jika berlanjut, buka ulang Activity.','Si continúa, vuelve a abrir Activity.','Wenn es anhält, öffne Activity erneut.','Si cela continue, rouvrez Activity.','Ha folytatódik, nyisd meg újra az Activityt.','続く場合は Activity を再度開いてください。','계속되면 Activity를 다시 여세요.','Если продолжается — откройте Activity снова.');
  a('Required Role Missing','Função Necessária Ausente','Peran Wajib Hilang','Rol requerido ausente','Erforderliche Rolle Fehlt','Rôle Requis Manquant','Szükséges szerep hiányzik','必要ロール欠落','필수 역할 없음','Нет нужной роли');
  a('Required role for this feature is missing.','A função necessária para este recurso está ausente.','Peran yang dibutuhkan fitur ini hilang.','Falta el rol requerido para esta función.','Die für dieses Feature erforderliche Rolle fehlt.','Le rôle requis pour cette fonctionnalité manque.','Ehhez a funkcióhoz szükséges szerep hiányzik.','この機能に必要なロールがありません。','이 기능에 필요한 역할이 없습니다.','Нет роли, необходимой для этой функции.');
  a('You lack the Discord role required for this feature.','Você não tem a função Discord necessária.','Kamu tidak punya peran Discord yang dibutuhkan.','No tienes el rol de Discord requerido.','Dir fehlt die erforderliche Discord-Rolle.','Il vous manque le rôle Discord requis.','Nincs meg a szükséges Discord szereped.','この機能に必要な Discord ロールがありません。','이 기능에 필요한 Discord 역할이 없습니다.','У вас нет нужной роли Discord.');
  a('Server admin restricted this feature to certain roles.','O admin restringiu este recurso a certas funções.','Admin membatasi fitur ini ke peran tertentu.','El admin restringió esta función a ciertos roles.','Der Admin hat dieses Feature auf bestimmte Rollen beschränkt.','L’admin a restreint cette fonctionnalité à certains rôles.','Az admin bizonyos szerepekre korlátozta ezt a funkciót.','管理者がこの機能を特定ロールに制限しています。','관리자가 이 기능을 특정 역할로 제한했습니다.','Админ ограничил функцию определёнными ролями.');
  a('Ask your server admin for the required role.','Peça ao admin do servidor a função necessária.','Minta peran yang dibutuhkan ke admin server.','Pide al admin del servidor el rol requerido.','Bitte deinen Server-Admin um die erforderliche Rolle.','Demandez le rôle requis à l’admin du serveur.','Kérd a szükséges szerepet a szerver admintól.','サーバー管理者に必要なロールを依頼してください。','서버 관리자에게 필요한 역할을 요청하세요.','Попросите нужную роль у администратора сервера.');
  a('Insufficient Permission','Permissão Insuficiente','Izin Tidak Cukup','Permiso insuficiente','Unzureichende Berechtigung','Permission Insuffisante','Elégtelen jogosultság','権限不足','권한 부족','Недостаточно прав');
  a('You do not have permission for this action.','Você não tem permissão para esta ação.','Kamu tidak punya izin untuk tindakan ini.','No tienes permiso para esta acción.','Du hast keine Berechtigung für diese Aktion.','Vous n’avez pas la permission pour cette action.','Nincs jogosultságod ehhez a művelethez.','この操作の権限がありません。','이 작업에 대한 권한이 없습니다.','У вас нет прав на это действие.');
  a('You lack the required server permission.','Você não tem a permissão de servidor necessária.','Kamu tidak punya izin server yang dibutuhkan.','Te falta el permiso de servidor requerido.','Dir fehlt die erforderliche Serverberechtigung.','Il vous manque la permission serveur requise.','Nincs meg a szükséges szerverjogosultság.','必要なサーバー権限がありません。','필요한 서버 권한이 없습니다.','Нет необходимого права на сервере.');
  a('You are trying to open the admin panel as a member.','Você está tentando abrir o painel admin como membro.','Kamu mencoba membuka panel admin sebagai anggota.','Estás intentando abrir el panel admin como miembro.','Du versuchst, das Admin-Panel als Mitglied zu öffnen.','Vous essayez d’ouvrir le panneau admin en tant que membre.','Tagként próbálod megnyitni az admin panelt.','メンバーとして管理パネルを開こうとしています。','멤버로 관리 패널을 열려 하고 있습니다.','Вы пытаетесь открыть админ-панель как участник.');
  a('Contact your server administrator.','Fale com o administrador do servidor.','Hubungi administrator server.','Contacta al administrador del servidor.','Kontaktiere den Server-Administrator.','Contactez l’administrateur du serveur.','Lépj kapcsolatba a szerver adminisztrátorával.','サーバー管理者に連絡してください。','서버 관리자에게 문의하세요.','Свяжитесь с администратором сервера.');
  a('Insufficient Balance','Saldo Insuficiente','Saldo Tidak Cukup','Saldo insuficiente','Unzureichendes Guthaben','Solde Insuffisant','Nincs elég egyenleg','残高不足','잔액 부족','Недостаточно средств');
  a('Your balance is insufficient for this action.','Seu saldo é insuficiente para esta ação.','Saldomu tidak cukup untuk tindakan ini.','Tu saldo es insuficiente para esta acción.','Dein Guthaben reicht für diese Aktion nicht.','Votre solde est insuffisant pour cette action.','Az egyenleged nem elég ehhez a művelethez.','この操作には残高が不足しています。','이 작업에 잔액이 부족합니다.','Недостаточно баланса для этого действия.');
  a('You do not have enough balance for this action.','Você não tem saldo suficiente para esta ação.','Kamu tidak punya saldo cukup untuk tindakan ini.','No tienes saldo suficiente para esta acción.','Du hast nicht genug Guthaben für diese Aktion.','Vous n’avez pas assez de solde pour cette action.','Nincs elég egyenleged ehhez a művelethez.','この操作に十分な残高がありません。','이 작업에 충분한 잔액이 없습니다.','Недостаточно средств для этого действия.');
  a('Check your balance.','Verifique seu saldo.','Periksa saldomu.','Comprueba tu saldo.','Prüfe dein Guthaben.','Vérifiez votre solde.','Ellenőrizd az egyenleged.','残高を確認してください。','잔액을 확인하세요.','Проверьте баланс.');
  a('Earn more via check-in, messages, voice, etc.','Ganhe mais com check-in, mensagens, voz etc.','Kumpulkan lagi lewat check-in, pesan, suara, dll.','Gana más con check-in, mensajes, voz, etc.','Verdiene mehr über Check-in, Nachrichten, Sprache usw.','Gagnez plus via check-in, messages, vocal, etc.','Keress többet check-in, üzenet, hang stb. útján.','チェックイン、メッセージ、ボイスなどで稼ぎましょう。','체크인, 메시지, 음성 등으로 더 모으세요.','Заработайте через check-in, сообщения, голос и т.д.');
  a('Daily Transfer Limit','Limite Diário de Transferência','Batas Transfer Harian','Límite diario de transferencia','Tägliches Transferlimit','Limite Quotidien de Transfert','Napi átutalási limit','日間送金上限','일일 전송 한도','Дневной лимит перевода');
  a('Daily transfer limit reached.','Limite diário de transferência atingido.','Batas transfer harian tercapai.','Se alcanzó el límite diario de transferencia.','Tägliches Transferlimit erreicht.','Limite quotidien de transfert atteint.','Elérted a napi átutalási limitet.','日間送金上限に達しました。','일일 전송 한도에 도달했습니다.','Достигнут дневной лимит перевода.');
  a('You hit the max transfer amount within 24 hours.','Você atingiu o máximo de transferência em 24 horas.','Kamu mencapai jumlah transfer maks dalam 24 jam.','Alcanzaste el máximo de transferencia en 24 horas.','Du hast das Transfermaximum innerhalb von 24 Stunden erreicht.','Vous avez atteint le maximum de transfert en 24 heures.','24 órán belül elérted a max átutalást.','24時間以内の送金上限に達しました。','24시간 내 최대 전송액에 도달했습니다.','Вы достигли максимума переводов за 24 часа.');
  a('Wait 24 hours and try again.','Espere 24 horas e tente de novo.','Tunggu 24 jam lalu coba lagi.','Espera 24 horas e inténtalo de nuevo.','Warte 24 Stunden und versuche es erneut.','Attendez 24 heures et réessayez.','Várj 24 órát és próbáld újra.','24時間待って再試行してください。','24시간 기다린 후 다시 시도하세요.','Подождите 24 часа и попробуйте снова.');
  a('Could Not Connect','Não Foi Possível Conectar','Tidak Dapat Terhubung','No se pudo conectar','Verbindung Fehlgeschlagen','Connexion Impossible','Nem sikerült csatlakozni','接続できません','연결 실패','Не удалось подключиться');
  a('Could not connect to the server. Check your internet.','Não foi possível conectar ao servidor. Verifique a internet.','Tidak dapat terhubung ke server. Periksa internet.','No se pudo conectar al servidor. Comprueba internet.','Keine Verbindung zum Server. Prüfe dein Internet.','Impossible de se connecter au serveur. Vérifiez Internet.','Nem sikerült a szerverhez csatlakozni. Ellenőrizd az internetet.','サーバーに接続できません。インターネットを確認してください。','서버에 연결할 수 없습니다. 인터넷을 확인하세요.','Не удалось подключиться к серверу. Проверьте интернет.');
  a('No internet or connection is very slow.','Sem internet ou conexão muito lenta.','Tidak ada internet atau koneksi sangat lambat.','Sin internet o conexión muy lenta.','Kein Internet oder Verbindung sehr langsam.','Pas d’Internet ou connexion très lente.','Nincs internet vagy nagyon lassú a kapcsolat.','インターネットがないか、接続が非常に遅いです。','인터넷이 없거나 연결이 매우 느립니다.','Нет интернета или соединение очень медленное.');
  a('DiscoWeb servers are temporarily unreachable.','Os servidores DiscoWeb estão temporariamente inacessíveis.','Server DiscoWeb sementara tidak dapat dijangkau.','Los servidores DiscoWeb están temporalmente inaccesibles.','DiscoWeb-Server sind vorübergehend unerreichbar.','Les serveurs DiscoWeb sont temporairement inaccessibles.','A DiscoWeb szerverek átmenetileg elérhetetlenek.','DiscoWeb サーバーに一時的に到達できません。','DiscoWeb 서버에 일시적으로 연결할 수 없습니다.','Серверы DiscoWeb временно недоступны.');
  a('Wait a few seconds and try again.','Espere alguns segundos e tente de novo.','Tunggu beberapa detik lalu coba lagi.','Espera unos segundos e inténtalo de nuevo.','Warte ein paar Sekunden und versuche es erneut.','Attendez quelques secondes et réessayez.','Várj néhány másodpercet és próbáld újra.','数秒待って再試行してください。','몇 초 기다린 후 다시 시도하세요.','Подождите несколько секунд и попробуйте снова.');
  a('API No Response','API Sem Resposta','API Tidak Mer respons','API sin respuesta','API Ohne Antwort','API Sans Réponse','API nem válaszol','API 応答なし','API 응답 없음','API не отвечает');
  a('API did not respond. Server may be temporarily busy.','A API não respondeu. O servidor pode estar ocupado.','API tidak merespons. Server mungkin sibuk sementara.','La API no respondió. El servidor puede estar ocupado.','API hat nicht geantwortet. Server evtl. vorübergehend ausgelastet.','L’API n’a pas répondu. Le serveur est peut-être occupé.','Az API nem válaszolt. A szerver átmenetileg foglalt lehet.','API が応答しませんでした。サーバーが一時的に混雑している可能性があります。','API가 응답하지 않았습니다. 서버가 일시적으로 바쁠 수 있습니다.','API не ответил. Сервер может быть временно занят.');
  a('DiscoWeb API is under high load.','A API DiscoWeb está sob alta carga.','API DiscoWeb sedang beban tinggi.','La API DiscoWeb está bajo alta carga.','DiscoWeb-API steht unter hoher Last.','L’API DiscoWeb est sous forte charge.','A DiscoWeb API nagy terhelés alatt van.','DiscoWeb API が高負荷です。','DiscoWeb API 부하가 높습니다.','API DiscoWeb под высокой нагрузкой.');
  a('The request timed out.','A solicitação esgotou o tempo.','Permintaan kehabisan waktu.','La solicitud agotó el tiempo.','Die Anfrage ist abgelaufen.','La requête a expiré.','A kérés időtúllépésbe ütközött.','リクエストがタイムアウトしました。','요청이 시간 초과되었습니다.','Истекло время ожидания запроса.');
  a('If it persists, report to the developer.','Se persistir, avise o desenvolvedor.','Jika berlanjut, laporkan ke pengembang.','Si continúa, avisa al desarrollador.','Wenn es anhält, melde es dem Entwickler.','Si cela continue, signalez au développeur.','Ha folytatódik, jelezd a fejlesztőnek.','続く場合は開発者に報告してください。','계속되면 개발자에게 신고하세요.','Если продолжается — сообщите разработчику.');
  a('Invalid API Response','Resposta de API Inválida','Respons API Tidak Valid','Respuesta de API no válida','Ungültige API-Antwort','Réponse API Invalide','Érvénytelen API-válasz','無効な API 応答','잘못된 API 응답','Неверный ответ API');
  a('Invalid API response received.','Resposta de API inválida recebida.','Menerima respons API tidak valid.','Se recibió una respuesta de API no válida.','Ungültige API-Antwort empfangen.','Réponse API invalide reçue.','Érvénytelen API-válasz érkezett.','無効な API 応答を受信しました。','잘못된 API 응답을 받았습니다.','Получен неверный ответ API.');
  a('API returned an unexpected format.','A API retornou um formato inesperado.','API mengembalikan format tak terduga.','La API devolvió un formato inesperado.','API gab ein unerwartetes Format zurück.','L’API a renvoyé un format inattendu.','Az API váratlan formátumot adott.','API が予期しない形式を返しました。','API가 예상치 못한 형식을 반환했습니다.','API вернул неожиданный формат.');
  a('Likely a deploy or version mismatch.','Provavelmente um deploy ou incompatibilidade de versão.','Kemungkinan deploy atau ketidakcocokan versi.','Probablemente un deploy o incompatibilidad de versión.','Wahrscheinlich Deploy- oder Versionsinkompatibilität.','Probablement un déploiement ou une incompatibilité de version.','Valószínűleg deploy vagy verzióeltérés.','デプロイまたはバージョン不一致の可能性があります。','배포 또는 버전 불일치일 수 있습니다.','Вероятно деплой или несовпадение версий.');
  a('Refresh the page or reopen Activity.','Atualize a página ou reabra o Activity.','Muat ulang halaman atau buka ulang Activity.','Actualiza la página o vuelve a abrir Activity.','Seite aktualisieren oder Activity erneut öffnen.','Actualisez la page ou rouvrez Activity.','Frissítsd az oldalt vagy nyisd meg újra az Activityt.','ページを更新するか Activity を再度開いてください。','페이지를 새로고침하거나 Activity를 다시 여세요.','Обновите страницу или снова откройте Activity.');
  a('Unexpected JavaScript Error','Erro Inesperado de JavaScript','Kesalahan JavaScript Tak Terduga','Error inesperado de JavaScript','Unerwarteter JavaScript-Fehler','Erreur JavaScript Inattendue','Váratlan JavaScript-hiba','予期しない JavaScript エラー','예기치 않은 JavaScript 오류','Неожиданная ошибка JavaScript');
  a('An unexpected JavaScript error occurred.','Ocorreu um erro inesperado de JavaScript.','Terjadi kesalahan JavaScript tak terduga.','Ocurrió un error inesperado de JavaScript.','Ein unerwarteter JavaScript-Fehler ist aufgetreten.','Une erreur JavaScript inattendue s’est produite.','Váratlan JavaScript-hiba történt.','予期しない JavaScript エラーが発生しました。','예기치 않은 JavaScript 오류가 발생했습니다.','Произошла неожиданная ошибка JavaScript.');
  a('Unexpected condition in application code.','Condição inesperada no código do aplicativo.','Kondisi tak terduga dalam kode aplikasi.','Condición inesperada en el código de la app.','Unerwarteter Zustand im Anwendungscode.','Condition inattendue dans le code de l’application.','Váratlan állapot az alkalmazáskódban.','アプリケーションコードで予期しない状態が発生しました。','애플리케이션 코드에서 예기치 않은 상태가 발생했습니다.','Неожиданное состояние в коде приложения.');
  a('Browser or Discord client incompatibility.','Incompatibilidade de navegador ou cliente Discord.','Ketidakcocokan browser atau klien Discord.','Incompatibilidad de navegador o cliente Discord.','Inkompatibilität von Browser oder Discord-Client.','Incompatibilité navigateur ou client Discord.','Böngésző- vagy Discord-kliens-inkompatibilitás.','ブラウザまたは Discord クライアントの非互換。','브라우저 또는 Discord 클라이언트 비호환.','Несовместимость браузера или клиента Discord.');
  a('When you see the notice, press Report to Developer.','Ao ver o aviso, pressione Reportar ao Desenvolvedor.','Saat melihat pemberitahuan, tekan Laporkan ke Pengembang.','Al ver el aviso, pulsa Informar al desarrollador.','Wenn du den Hinweis siehst, drücke An Entwickler melden.','Quand vous voyez l’avis, appuyez sur Signaler au développeur.','Ha látod az értesítést, nyomd meg a Fejlesztőnek jelentés gombot.','通知が出たら「開発者に報告」を押してください。','알림이 보이면 개발자에게 신고를 누르세요.','Увидев уведомление, нажмите «Сообщить разработчику».');
  a('Reopen Activity.','Reabra o Activity.','Buka ulang Activity.','Vuelve a abrir Activity.','Öffne Activity erneut.','Rouvrez Activity.','Nyisd meg újra az Activityt.','Activity を再度開いてください。','Activity를 다시 여세요.','Откройте Activity снова.');
  a('Unhandled Promise Error','Erro de Promise Não Tratado','Kesalahan Promise Belum Ditangani','Error de Promise no controlado','Unbehandelte Promise-Fehler','Erreur Promise Non Gérée','Kezeletlen Promise-hiba','未処理の Promise エラー','처리되지 않은 Promise 오류','Необработанная ошибка Promise');
  a('An unhandled Promise error occurred.','Ocorreu um erro de Promise não tratado.','Terjadi kesalahan Promise yang belum ditangani.','Ocurrió un error de Promise no controlado.','Ein unbehandelter Promise-Fehler ist aufgetreten.','Une erreur Promise non gérée s’est produite.','Kezeletlen Promise-hiba történt.','未処理の Promise エラーが発生しました。','처리되지 않은 Promise 오류가 발생했습니다.','Произошла необработанная ошибка Promise.');
  a('A network request or async operation failed unexpectedly.','Uma solicitação de rede ou operação assíncrona falhou.','Permintaan jaringan atau operasi async gagal tak terduga.','Falló una solicitud de red o una operación asíncrona.','Eine Netzanfrage oder asynchrone Operation ist unerwartet fehlgeschlagen.','Une requête réseau ou opération asynchrone a échoué de façon inattendue.','Egy hálózati kérés vagy aszinkron művelet váratlanul meghiúsult.','ネットワーク要求または非同期処理が予期せず失敗しました。','네트워크 요청 또는 비동기 작업이 예기치 않게 실패했습니다.','Сетевой запрос или асинхронная операция неожиданно не удались.');
  a('Unknown Error','Erro Desconhecido','Kesalahan Tidak Diketahui','Error desconocido','Unbekannter Fehler','Erreur Inconnue','Ismeretlen hiba','不明なエラー','알 수 없는 오류','Неизвестная ошибка');
  a('An unknown error occurred.','Ocorreu um erro desconhecido.','Terjadi kesalahan yang tidak diketahui.','Ocurrió un error desconocido.','Ein unbekannter Fehler ist aufgetreten.','Une erreur inconnue s’est produite.','Ismeretlen hiba történt.','不明なエラーが発生しました。','알 수 없는 오류가 발생했습니다.','Произошла неизвестная ошибка.');
  a('Error source could not be determined.','A origem do erro não pôde ser determinada.','Sumber error tidak dapat ditentukan.','No se pudo determinar el origen del error.','Fehlerquelle konnte nicht bestimmt werden.','La source de l’erreur n’a pas pu être déterminée.','A hiba forrása nem határozható meg.','エラーの原因を特定できませんでした。','오류 원인을 확인할 수 없습니다.','Источник ошибки определить не удалось.');
  a('Press Report to Developer to notify the developer.','Pressione Reportar ao Desenvolvedor para avisá-lo.','Tekan Laporkan ke Pengembang untuk memberi tahu.','Pulsa Informar al desarrollador para avisarle.','Drücke An Entwickler melden, um ihn zu benachrichtigen.','Appuyez sur Signaler au développeur pour le prévenir.','Nyomd meg a Fejlesztőnek jelentés gombot.','「開発者に報告」を押して開発者に知らせてください。','개발자에게 신고를 눌러 알리세요.','Нажмите «Сообщить разработчику», чтобы уведомить.');
  return D;
}
