// hooks/useChat.ts
import { useEffect, useState, useRef, useCallback } from 'react';
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

export interface UseChatOptions {
  roomId: string | null;
  currentUserId: string | null;
  supabaseClient: SupabaseClient | null;
  onNewMessage?: (message: unknown) => void;
  onTyping?: (userId: string, isTyping: boolean) => void;
}

// generic chat message type used in hooks
export type ChatMessage = { id: string; [key: string]: unknown };


export function useChat({
  roomId,
  currentUserId,
  supabaseClient,
  onNewMessage,
  onTyping
}: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Mesajları yükle
  const loadMessages = useCallback(async () => {
    if (!roomId || !supabaseClient) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabaseClient
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(500);

      if (fetchError) throw fetchError;
      const arr = data || [];
      console.debug('[useChat] loaded', arr.length, 'messages for room', roomId);
      setMessages(arr);

      // Room'u okundu olarak işaretle
      if (currentUserId) {
        await supabaseClient
          .from('room_members')
          .update({ unread_count: 0, last_read_at: new Date().toISOString() })
          .eq('room_id', roomId)
          .eq('user_id', currentUserId);
      }
    } catch (err) {
      setError(err as Error);
      console.error('Error loading messages:', err);
    } finally {
      setIsLoading(false);
    }
  }, [roomId, currentUserId, supabaseClient]);

  // Realtime subscription
  useEffect(() => {
    if (!roomId || !supabaseClient) return;

    loadMessages();

    // Mevcut channel'ı temizle
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }

    // Yeni channel oluştur
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channel = (supabaseClient as any)
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload: { new: ChatMessage | null }) => {
          const newMessage = payload.new;
          if (newMessage) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
            onNewMessage?.(newMessage);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload: { new: ChatMessage | null }) => {
          const updatedMessage = payload.new;
          if (updatedMessage) {
            setMessages((prev) =>
              prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg))
            );
          }
        }
      )
      .on('broadcast', { event: 'typing' }, (payload: { payload?: { user_id?: string; room_id?: string; typing?: boolean } }) => {
        const p = payload.payload ?? {};
        const user_id = p.user_id;
        const isTyping = !!p.typing;
        if (user_id && user_id !== currentUserId) {
          onTyping?.(user_id, isTyping);
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [roomId, currentUserId, supabaseClient, loadMessages, onNewMessage, onTyping]);

  // Mesaj gönder
  const sendMessage = useCallback(
    async (content: string) => {
      if (!roomId || !currentUserId || !supabaseClient || !content.trim()) {
        return;
      }

      const trimmed = content.trim();

      try {
        const { data: inserted, error: insertError } = await supabaseClient
          .from('messages')
          .insert({
            room_id: roomId,
            sender_id: currentUserId,
            content: trimmed,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        if (inserted) {
          // optimistic/guaranteed local update
          setMessages((prev) => {
            if (prev.some((m) => m.id === inserted.id)) return prev;
            return [...prev, inserted];
          });
        }

        // Room'un last_message_at'ini güncelle (trigger otomatik yapıyor ama garantiye almak için)
        await supabaseClient
          .from('rooms')
          .update({
            last_message_at: new Date().toISOString(),
            last_message_preview: trimmed.substring(0, 100),
          })
          .eq('id', roomId);
      } catch (err) {
        console.error('Error sending message:', err);
        throw err;
      }
    },
    [roomId, currentUserId, supabaseClient]
  );

  // Typing broadcast
  const broadcastTyping = useCallback(
    async (isTyping: boolean) => {
      if (!roomId || !currentUserId || !channelRef.current) return;

      try {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            room_id: roomId,
            user_id: currentUserId,
            typing: isTyping,
          },
        });
      } catch (err) {
        console.error('Error broadcasting typing:', err);
      }
    },
    [roomId, currentUserId]
  );

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    broadcastTyping,
    reloadMessages: loadMessages,
  };
}

// Typing indicator hook
export function useTypingIndicator(timeoutMs = 3000) {
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const timeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  const setUserTyping = useCallback(
    (userId: string, isTyping: boolean) => {
      setTypingUsers((prev) => ({ ...prev, [userId]: isTyping }));

      // Mevcut timeout'u temizle
      if (timeoutsRef.current[userId]) {
        clearTimeout(timeoutsRef.current[userId]);
      }

      // Yeni timeout kur
      if (isTyping) {
        timeoutsRef.current[userId] = setTimeout(() => {
          setTypingUsers((prev) => ({ ...prev, [userId]: false }));
        }, timeoutMs);
      }
    },
    [timeoutMs]
  );

  const clearTyping = useCallback((userId: string) => {
    if (timeoutsRef.current[userId]) {
      clearTimeout(timeoutsRef.current[userId]);
    }
    setTypingUsers((prev) => ({ ...prev, [userId]: false }));
  }, []);

  const clearAllTyping = useCallback(() => {
    Object.keys(timeoutsRef.current).forEach((userId) => {
      clearTimeout(timeoutsRef.current[userId]);
    });
    setTypingUsers({});
  }, []);

  return {
    typingUsers,
    setUserTyping,
    clearTyping,
    clearAllTyping,
  };
}

// Online status heartbeat hook
export function useOnlineStatus(
  supabaseClient: SupabaseClient | null,
  userId: string | null,
  intervalMs = 30000
) {
  useEffect(() => {
    if (!supabaseClient || !userId) return;

    // İlk heartbeat
    const sendHeartbeat = async () => {
      try {
        await supabaseClient.rpc('heartbeat_user_status', {
          p_user_id: userId,
        });
      } catch (err) {
        console.error('Heartbeat error:', err);
      }
    };

    sendHeartbeat();

    // Interval ile heartbeat gönder
    const interval = setInterval(sendHeartbeat, intervalMs);

    // Sayfa kapanırken offline yap
    const handleBeforeUnload = async () => {
      try {
        await supabaseClient.rpc('update_user_status', {
          p_user_id: userId,
          p_status: 'offline',
        });
      } catch (err) {
        console.error('Offline status error:', err);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload(); // Son kez offline yap
    };
  }, [supabaseClient, userId, intervalMs]);
}


// Debounced search hook
export function useDebouncedSearch(initialValue = '', delay = 300) {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return [debouncedValue, value, setValue] as const;
}

// Unread count hook
export function useUnreadCount(
  supabaseClient: SupabaseClient | null,
  userId: string | null
) {
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    if (!supabaseClient || !userId) return;

    const fetchUnreadCount = async () => {
      try {
        const { data, error } = await supabaseClient
          .from('room_members')
          .select('unread_count')
          .eq('user_id', userId);

        if (error) throw error;

        const total = data?.reduce((sum: number, item: { unread_count?: number }) => sum + (item.unread_count || 0), 0) || 0;
        setTotalUnread(total);
      } catch (err) {
        console.error('Error fetching unread count:', err);
      }
    };

    fetchUnreadCount();

    // Realtime subscription for unread changes
    const channel = supabaseClient
      .channel('unread-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_members',
          filter: `user_id=eq.${userId}`,
        },
        fetchUnreadCount
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [supabaseClient, userId]);

  return totalUnread;
}

// Notification permission hook
export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  // effect not needed; permission initialised above

  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }
    return 'denied';
  }, []);

  const showNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (permission === 'granted') {
        new Notification(title, options);
      }
    },
    [permission]
  );

  return {
    permission,
    requestPermission,
    showNotification,
    isSupported: 'Notification' in window,
  };
}

// Local storage hook
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error('Error writing to localStorage:', error);
      }
    },
    [key, storedValue]
  );

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue] as const;
}