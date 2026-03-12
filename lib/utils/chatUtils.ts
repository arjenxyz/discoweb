// utils/chatUtils.ts

/**
 * Mesaj zamanını formatlar
 * Bugün: 14:30
 * Dün: Dün
 * Bu hafta: Paz, Pzt, etc.
 * Daha eski: 15 Oca
 */
export function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    // Bugün - sadece saat göster
    return date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } else if (diffInDays === 1) {
    // Dün
    return 'Dün';
  } else if (diffInDays < 7) {
    // Bu hafta - gün adı
    return date.toLocaleDateString('tr-TR', { weekday: 'short' });
  } else if (diffInDays < 365) {
    // Bu yıl - gün ve ay
    return date.toLocaleDateString('tr-TR', { 
      day: 'numeric', 
      month: 'short' 
    });
  } else {
    // Daha eski - tam tarih
    return date.toLocaleDateString('tr-TR', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  }
}

/**
 * Mesajın görüntüleneceği zaman bilgisini formatlar
 */
export function formatMessageTimeDetailed(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('tr-TR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

/**
 * Tarih ayırıcısı için formatlar
 */
export function formatDateSeparator(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return 'Bugün';
  } else if (diffInDays === 1) {
    return 'Dün';
  } else {
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}

/**
 * İki mesaj arasında tarih ayırıcısı gerekip gerekmediğini kontrol eder
 */
export function shouldShowDateSeparator(
  currentDate: string,
  previousDate?: string
): boolean {
  if (!previousDate) return true;
  
  const current = new Date(currentDate).toDateString();
  const previous = new Date(previousDate).toDateString();
  
  return current !== previous;
}

/**
 * Mesajın düzenlenip düzenlenmediğini kontrol eder
 */
export function isMessageEdited(message: { edited_at?: string | null }): boolean {
  return !!message.edited_at;
}

/**
 * Kullanıcı adının baş harfini alır
 */
export function getUserInitial(username?: string, fallback = '?'): string {
  if (!username) return fallback;
  return username.charAt(0).toUpperCase();
}

/**
 * Kullanıcı avatar'ını veya initial'ı döner
 */
export function getUserAvatar(profile?: {
  avatar_url?: string;
  username?: string;
}): { type: 'image' | 'initial'; value: string } {
  if (profile?.avatar_url) {
    return { type: 'image', value: profile.avatar_url };
  }
  return { 
    type: 'initial', 
    value: getUserInitial(profile?.username) 
  };
}

/**
 * Online status'a göre renk döner
 */
export function getStatusColor(status?: 'online' | 'offline' | 'away'): string {
  switch (status) {
    case 'online':
      return '#23a55a'; // Yeşil
    case 'away':
      return '#f0b232'; // Sarı
    case 'offline':
    default:
      return '#80848e'; // Gri
  }
}

/**
 * Room tipine göre varsayılan isim döner
 */
export function getRoomDefaultName(roomType: 'dm' | 'group' | 'help'): string {
  switch (roomType) {
    case 'dm':
      return 'Özel Mesaj';
    case 'group':
      return 'Grup Sohbeti';
    case 'help':
      return 'Yardım';
    default:
      return 'Sohbet';
  }
}

/**
 * Mesaj içeriğini preview için kısaltır
 */
export function truncateMessage(content: string, maxLength = 100): string {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + '...';
}

/**
 * Unread count'u formatlar (99+ gibi)
 */
export function formatUnreadCount(count: number): string {
  if (count > 99) return '99+';
  return count.toString();
}

/**
 * Dosya boyutunu formatlar
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Mesaj içinde URL varsa linkleştirir
 */
export function linkifyMessage(content: string): string {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return content.replace(
    urlRegex, 
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-[#00b0f4] hover:underline">$1</a>'
  );
}

/**
 * Mention'ları (@username) highlight eder
 */
export function highlightMentions(content: string): string {
  const mentionRegex = /@(\w+)/g;
  return content.replace(
    mentionRegex,
    '<span class="bg-[#5865f2]/20 text-[#5865f2] px-1 rounded">@$1</span>'
  );
}

/**
 * Mesaj içeriğini güvenli hale getirir (XSS prevention)
 */
export function sanitizeMessage(content: string): string {
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Typing indicator mesajını formatlar
 */
export function formatTypingMessage(
  usernames: string[],
  maxDisplay = 3
): string {
  if (usernames.length === 0) return '';
  
  if (usernames.length === 1) {
    return `${usernames[0]} yazıyor...`;
  } else if (usernames.length === 2) {
    return `${usernames[0]} ve ${usernames[1]} yazıyor...`;
  } else if (usernames.length <= maxDisplay) {
    const lastUser = usernames[usernames.length - 1];
    const otherUsers = usernames.slice(0, -1).join(', ');
    return `${otherUsers} ve ${lastUser} yazıyor...`;
  } else {
    const displayUsers = usernames.slice(0, maxDisplay - 1).join(', ');
    const remainingCount = usernames.length - (maxDisplay - 1);
    return `${displayUsers} ve ${remainingCount} kişi daha yazıyor...`;
  }
}

/**
 * Arama query'sini highlight eder
 */
export function highlightSearchQuery(
  text: string, 
  query: string
): string {
  if (!query) return text;
  
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(
    regex,
    '<mark class="bg-[#f0b232] text-black px-0.5 rounded">$1</mark>'
  );
}

/**
 * Son görülme zamanını formatlar
 */
export function formatLastSeen(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Az önce';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} dakika önce`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} saat önce`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} gün önce`;
  } else {
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
}

/**
 * Emoji regex - emoji içerip içermediğini kontrol eder
 */
export function containsEmoji(text: string): boolean {
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
  return emojiRegex.test(text);
}

/**
 * Mesajın sadece emoji içerip içermediğini kontrol eder
 */
export function isOnlyEmoji(text: string): boolean {
  const emojiOnlyRegex = /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]+$/u;
  return emojiOnlyRegex.test(text);
}

/**
 * Debounce fonksiyonu
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (func as any)(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle fonksiyonu
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (func as any)(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Local storage için güvenli read/write
 */
export const localStorageUtils = {
  set: (key: string, value: unknown): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('LocalStorage set error:', error);
    }
  },
  
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : defaultValue;
    } catch (error) {
      console.error('LocalStorage get error:', error);
      return defaultValue;
    }
  },
  
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('LocalStorage remove error:', error);
    }
  }
};

/**
 * Notification izinleri için helper
 */
export const notificationUtils = {
  isSupported: (): boolean => {
    return 'Notification' in window;
  },
  
  getPermission: (): NotificationPermission => {
    return Notification.permission;
  },
  
  requestPermission: async (): Promise<NotificationPermission> => {
    if (!notificationUtils.isSupported()) {
      return 'denied';
    }
    return await Notification.requestPermission();
  },
  
  showNotification: (title: string, options?: NotificationOptions): void => {
    if (notificationUtils.getPermission() === 'granted') {
      new Notification(title, options);
    }
  }
};

/**
 * Clipboard için helper
 */
export const clipboardUtils = {
  copy: async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Clipboard copy error:', error);
      return false;
    }
  },
  
  paste: async (): Promise<string | null> => {
    try {
      return await navigator.clipboard.readText();
    } catch (error) {
      console.error('Clipboard paste error:', error);
      return null;
    }
  }
};