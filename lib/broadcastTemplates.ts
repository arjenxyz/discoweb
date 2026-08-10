export type BroadcastTemplate = {
  id: string;
  title: string;
  category: 'Bakım' | 'Güncelleme' | 'Kesinti' | 'Duyuru' | 'Uyarı' | 'Özellik';
  content: string;
  color?: string; // Hex color for embed
};

export const BROADCAST_TEMPLATES: BroadcastTemplate[] = [
  // BAKIM (Maintenance)
  {
    id: 'maint_1',
    title: 'Planlı Bakım Çalışması',
    category: 'Bakım',
    color: '#F59E0B',
    content: 'Merhaba değerli yöneticiler,\n\nSistemlerimizde daha iyi hizmet sunabilmek adına planlı bir bakım çalışması gerçekleştirilecektir.\n\n**Bakım Başlangıcı:** {zaman}\n**Tahmini Süre:** {süre}\n\nBu süre zarfında bot geçici olarak yanıt vermeyebilir. Anlayışınız için teşekkür ederiz.',
  },
  {
    id: 'maint_2',
    title: 'Acil Bakım',
    category: 'Bakım',
    color: '#EF4444',
    content: 'Değerli sunucu sahipleri,\n\nSistemde tespit edilen kritik bir altyapı sorunu nedeniyle acil bakıma geçilmiştir. Bot şu anda devre dışıdır.\n\n**Tahmini Çözüm Süresi:** {süre}\n\nGelişmeler hakkında sizi buradan bilgilendirmeye devam edeceğiz.',
  },
  {
    id: 'maint_3',
    title: 'Bakım Tamamlandı',
    category: 'Bakım',
    color: '#10B981',
    content: 'Merhaba,\n\nÖnceden duyurduğumuz bakım çalışması başarıyla tamamlanmıştır. Bot ve web paneli şu an tam kapasite ile aktiftir.\n\nHerhangi bir sorunla karşılaşırsanız lütfen bizimle iletişime geçin.',
  },

  // GÜNCELLEME (Updates)
  {
    id: 'upd_1',
    title: 'Yeni Sürüm Yayında',
    category: 'Güncelleme',
    color: '#3B82F6',
    content: '🎉 DiscoWeb {versiyon} yayında!\n\nSisteme yepyeni özellikler ekledik. Yeni gelen özellikleri incelemek için web panelinize göz atabilirsiniz.\n\n**Gelen Yenilikler:**\n{yenilikler}\n\nKeyifli kullanımlar dileriz.',
  },
  {
    id: 'upd_2',
    title: 'Küçük Yamalar ve Hata Çözümleri',
    category: 'Güncelleme',
    color: '#6366F1',
    content: 'Sistem altyapımızda bazı iyileştirmeler yapıldı ve bilinen {hata_sayısı} adet hata giderildi. Şu andan itibaren tüm işlemleriniz çok daha stabil çalışacaktır.',
  },
  {
    id: 'upd_3',
    title: 'Görsel Arayüz Güncellemesi',
    category: 'Güncelleme',
    color: '#8B5CF6',
    content: 'Web panelimiz yepyeni bir tasarıma kavuştu! Kullanıcı deneyimini artırmak için menüleri ve sayfaları baştan aşağı yeniledik. Lütfen panelinize girip yeni tasarımı deneyimleyin.',
  },

  // KESİNTİ (Downtime/AFK)
  {
    id: 'down_1',
    title: 'Geçici Kesinti Bildirimi',
    category: 'Kesinti',
    color: '#EF4444',
    content: '⚠️ Merhaba,\n\nŞu anda Discord API taraflı bir yoğunluk yaşandığı için botumuz kısmi gecikmelerle çalışmaktadır. Sorun {sebep} kaynaklıdır.\n\nDurum düzeldiğinde tekrar bilgilendirme yapılacaktır.',
  },
  {
    id: 'down_2',
    title: 'Bot Çevrimdışı (AFK) Modu',
    category: 'Kesinti',
    color: '#F97316',
    content: 'Veritabanı taşınma işlemi nedeniyle botumuz şu andan itibaren {süre} boyunca çevrimdışı (AFK) kalacaktır. Verilerinizde hiçbir kayıp yaşanmayacaktır.',
  },
  {
    id: 'down_3',
    title: 'Hizmet Kesintisi Sona Erdi',
    category: 'Kesinti',
    color: '#10B981',
    content: '✅ Yaşanan kesinti tamamen giderildi. Tüm sistemler an itibarıyla %100 online durumdadır. Sabrınız için teşekkür ederiz.',
  },

  // ÖZELLİK (Features)
  {
    id: 'feat_1',
    title: 'Yeni Özellik: {özellik_adı}',
    category: 'Özellik',
    color: '#14B8A6',
    content: 'Uzun zamandır beklenen **{özellik_adı}** özelliği an itibarıyla tüm sunucularda aktif edilmiştir!\n\nBu özelliği kullanmaya başlamak için web paneli üzerinden gerekli ayarları yapabilirsiniz.',
  },
  {
    id: 'feat_2',
    title: 'Mağaza Sistemi Güncellendi',
    category: 'Özellik',
    color: '#F43F5E',
    content: 'Mağaza altyapımız yenilendi! Artık kullanıcılarınız çok daha hızlı satın alım yapabilir. Ürün fiyatlandırma limitleri ve satın alım limitleri hakkında web panelini kontrol ediniz.',
  },

  // UYARI (Warnings & Policy)
  {
    id: 'warn_1',
    title: 'Kullanım Koşulları Güncellemesi',
    category: 'Uyarı',
    color: '#64748B',
    content: 'Değerli kullanıcılarımız,\n\nHizmet kalitemizi korumak adına Kullanım Koşullarımız (ToS) ve Gizlilik Politikamız güncellenmiştir. Yeni kurallar {tarih} tarihinden itibaren geçerli olacaktır.',
  },
  {
    id: 'warn_2',
    title: 'Önemli Güvenlik Uyarısı',
    category: 'Uyarı',
    color: '#DC2626',
    content: 'Lütfen dikkat!\n\nSon zamanlarda sahte bağlantılar içeren hesap çalma girişimleri artmıştır. Botumuz size asla özel mesaj yoluyla bir bağlantı (link) göndermez. Lütfen yetkililerimiz haricinde kimseye itibar etmeyiniz.',
  },
  {
    id: 'warn_3',
    title: 'Veritabanı Limitleri',
    category: 'Uyarı',
    color: '#EAB308',
    content: 'Sistem yükünü dengelemek amacıyla sunucu başına maksimum log kanalı ve özel rol sınırı getirilmiştir. Detayları web panelinden inceleyebilirsiniz.',
  },

  // DUYURU (General Announcements)
  {
    id: 'ann_1',
    title: 'Topluluk Etkinliği Başlıyor!',
    category: 'Duyuru',
    color: '#D946EF',
    content: '🎉 Büyük topluluk etkinliğimiz başlıyor!\n\n**Tarih:** {tarih}\n**Etkinlik:** {etkinlik_adı}\n\nDetaylı bilgi ve katılım koşulları için ana destek sunucumuzu ziyaret edebilirsiniz.',
  },
  {
    id: 'ann_2',
    title: 'Bot İstatistikleri',
    category: 'Duyuru',
    color: '#06B6D4',
    content: 'DiscoWeb olarak {sunucu_sayısı} sunucuya ulaştığımızı gururla duyururuz! Bize inanan ve destek veren tüm yöneticilere teşekkürler.',
  },
  {
    id: 'ann_3',
    title: 'Haftalık Raporunuz Hazır',
    category: 'Duyuru',
    color: '#84CC16',
    content: 'Geçtiğimiz haftaya ait sunucu ekonomi, mesaj ve ses aktiflik raporları başarıyla oluşturulup sisteminize işlendi. Web panelindeki "İstatistikler" bölümünden detaylara ulaşabilirsiniz.',
  },
];
