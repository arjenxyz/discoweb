-- AI Günlük Piyasa Planı tablosu
CREATE TABLE IF NOT EXISTS market_daily_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id        TEXT NOT NULL,
  plan_date       DATE NOT NULL,
  hourly_schedule JSONB NOT NULL DEFAULT '[]',
  ai_reasoning    TEXT,
  mood            TEXT, -- 'bullish' | 'bearish' | 'volatile' | 'stable'
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(guild_id, plan_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_plans_guild_date
  ON market_daily_plans (guild_id, plan_date DESC);
