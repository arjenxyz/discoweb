/** Shared localhost design mocks for setup / Discord API / admin panel fallbacks. */

export const LOCAL_DEV_MOCK_GUILD = {
  id: process.env.NEXT_PUBLIC_DISCORD_GUILD_ID ?? '1465698764453838882',
  name: 'Local Development',
  icon: null as string | null,
  owner_id: 'local-dev-bypass',
};

export const LOCAL_DEV_MOCK_LOG_GUILD_ID = '987654321098765432';
export const LOCAL_DEV_MOCK_GUILD_NAME = 'Local Development';

export const LOCAL_DEV_MOCK_ROLES = [
  { id: 'local-role-everyone', name: '@everyone', color: 0, permissions: '0', position: 0 },
  { id: 'local-role-owner', name: 'Owner', color: 0xe74c3c, permissions: '8', position: 100 },
  { id: 'local-role-admin', name: 'Admin', color: 0x5865f2, permissions: '8', position: 90 },
  {
    id: 'local-role-mod',
    name: 'Moderator',
    color: 0x57f287,
    permissions: String(0x20 | 0x10000000),
    position: 80,
  },
  {
    id: 'local-role-staff',
    name: 'Staff',
    color: 0xfee75c,
    permissions: String(0x10000000),
    position: 70,
  },
  { id: 'local-role-member', name: 'Üye', color: 0x3498db, permissions: '0', position: 50 },
  { id: 'local-role-verified', name: 'Doğrulanmış', color: 0x1abc9c, permissions: '0', position: 40 },
  { id: 'local-role-booster', name: 'Booster', color: 0xf47fff, permissions: '0', position: 30 },
  { id: 'local-role-vip', name: 'VIP', color: 0xe67e22, permissions: '0', position: 20 },
  { id: 'local-role-muted', name: 'Muted', color: 0x95a5a6, permissions: '0', position: 10 },
] as const;

export const LOCAL_DEV_MOCK_OVERVIEW_STATS = {
  rangeHours: 24,
  rangeMessages: 1842,
  rangeVoiceMinutes: 960,
  totalMessages: 128_450,
  totalVoiceMinutes: 54_320,
  totalMembers: 1284,
  totalWallets: 892,
  totalCirculation: 2_450_000,
  avgBalance: 2746.64,
  highestBalance: 125_000,
  pendingOrders: 7,
  paidOrders: 143,
  activeStoreItems: 12,
  tagCount: 64,
  boosterCount: 28,
};

export const LOCAL_DEV_MOCK_QUIZ_EVENTS = [
  {
    id: 'local-quiz-live',
    scope: 'guild' as const,
    guild_id: LOCAL_DEV_MOCK_GUILD.id,
    title: 'Haftalık Trivia Canlı',
    description: 'Localhost örnek canlı etkinlik',
    lang: 'tr',
    start_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    end_at: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    total_questions: 25,
    seconds_per_question: 20,
    wrong_allowed: 3,
    prize_pool_papel: 5000,
    status: 'live' as const,
    checkpoints: [
      { position: 8, papel_reward: 25, label: 'Checkpoint 1' },
      { position: 16, papel_reward: 50, label: 'Checkpoint 2' },
      { position: 25, papel_reward: 100, label: 'Final' },
    ],
  },
  {
    id: 'local-quiz-scheduled',
    scope: 'guild' as const,
    guild_id: LOCAL_DEV_MOCK_GUILD.id,
    title: 'Cuma Akşamı Quiz',
    description: 'Localhost örnek planlı etkinlik',
    lang: 'tr',
    start_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    end_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    total_questions: 20,
    seconds_per_question: 18,
    wrong_allowed: 2,
    prize_pool_papel: 3500,
    status: 'scheduled' as const,
    checkpoints: [
      { position: 7, papel_reward: 20, label: 'Checkpoint 1' },
      { position: 14, papel_reward: 40, label: 'Checkpoint 2' },
      { position: 20, papel_reward: 80, label: 'Final' },
    ],
  },
  {
    id: 'local-quiz-finished',
    scope: 'guild' as const,
    guild_id: LOCAL_DEV_MOCK_GUILD.id,
    title: 'Geçen Hafta Finali',
    description: 'Localhost örnek tamamlanmış etkinlik',
    lang: 'en',
    start_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    end_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 50 * 60 * 1000).toISOString(),
    total_questions: 30,
    seconds_per_question: 15,
    wrong_allowed: 3,
    prize_pool_papel: 8000,
    status: 'finished' as const,
    checkpoints: [
      { position: 10, papel_reward: 30, label: 'Checkpoint 1' },
      { position: 20, papel_reward: 60, label: 'Checkpoint 2' },
      { position: 30, papel_reward: 150, label: 'Final' },
    ],
  },
];

export const LOCAL_DEV_MOCK_QUIZ_QUESTIONS = [
  {
    id: 'local-q-1',
    category: 'genel',
    difficulty: 'easy' as const,
    correct_index: 1,
    translations: [
      {
        lang: 'tr',
        question: 'Discord’un resmi rengi hangisidir?',
        options: ['Kırmızı', 'Blurple', 'Yeşil', 'Turuncu'],
        is_ready: true,
      },
      {
        lang: 'en',
        question: 'What is Discord’s official brand color?',
        options: ['Red', 'Blurple', 'Green', 'Orange'],
        is_ready: true,
      },
    ],
  },
  {
    id: 'local-q-2',
    category: 'teknoloji',
    difficulty: 'medium' as const,
    correct_index: 2,
    translations: [
      {
        lang: 'tr',
        question: 'HTTP durum kodu 404 ne anlama gelir?',
        options: ['Sunucu hatası', 'Yetkisiz', 'Bulunamadı', 'Yönlendirme'],
        is_ready: true,
      },
    ],
  },
  {
    id: 'local-q-3',
    category: 'oyun',
    difficulty: 'hard' as const,
    correct_index: 0,
    translations: [
      {
        lang: 'tr',
        question: 'Bir quiz etkinliğinde yanlış hakkı tükenince ne olur?',
        options: ['Elendi', 'Bonus puan', 'Ek süre', 'Otomatik doğru'],
        is_ready: true,
      },
      {
        lang: 'en',
        question: 'What happens when wrong attempts run out in a quiz?',
        options: ['Eliminated', 'Bonus points', 'Extra time', 'Auto-correct'],
        is_ready: false,
      },
    ],
  },
];

export const LOCAL_DEV_MOCK_STORE_ITEMS = [
  {
    id: 'local-store-1',
    title: 'VIP Rol (7 Gün)',
    description: 'Sunucuda VIP rozeti ve özel kanal erişimi',
    price: 2500,
    status: 'active',
    role_id: 'local-role-vip',
    duration_days: 7,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'local-store-2',
    title: 'Özel Renk Rolü',
    description: 'İstediğin renkte özel rol',
    price: 5000,
    status: 'active',
    role_id: null,
    duration_days: 30,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'local-store-3',
    title: 'Booster Rozeti',
    description: 'Örnek pasif ürün',
    price: 1200,
    status: 'draft',
    role_id: 'local-role-booster',
    duration_days: 14,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const LOCAL_DEV_MOCK_WALLETS = {
  wallets: [
    {
      user_id: 'local-member-1',
      balance: 125000,
      updated_at: new Date().toISOString(),
      username: 'Nova',
      avatar: null,
    },
    {
      user_id: 'local-member-2',
      balance: 48200,
      updated_at: new Date().toISOString(),
      username: 'Pixel',
      avatar: null,
    },
    {
      user_id: 'local-member-3',
      balance: 15600,
      updated_at: new Date().toISOString(),
      username: 'Echo',
      avatar: null,
    },
    {
      user_id: 'local-member-4',
      balance: 3200,
      updated_at: new Date().toISOString(),
      username: 'Mira',
      avatar: null,
    },
  ],
  totalCirculation: 192000,
  totalCount: 4,
};
