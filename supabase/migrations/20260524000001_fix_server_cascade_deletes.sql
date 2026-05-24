-- ============================================================
-- Fix: Server cascade deletes & sync-members data safety
-- ============================================================
-- 1. store_discounts — add ON DELETE CASCADE from servers if FK exists
-- 2. Ensure discount_usages cleans up when a discount is deleted
-- 3. Ensure raffle_entries clean up when raffles are deleted
-- 4. Add server_id FK with cascade on members table if not present
-- ============================================================

-- store_discounts → servers: add cascade if the FK already exists without it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.referential_constraints rc ON rc.constraint_name = tc.constraint_name
    JOIN information_schema.key_column_usage kcu ON kcu.constraint_name = tc.constraint_name
    WHERE tc.table_name = 'store_discounts'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'server_id'
  ) THEN
    -- Drop old FK and re-add with cascade
    ALTER TABLE public.store_discounts
      DROP CONSTRAINT IF EXISTS store_discounts_server_id_fkey;
  END IF;
END;
$$;

ALTER TABLE public.store_discounts
  DROP CONSTRAINT IF EXISTS store_discounts_server_id_fkey;

-- Only add FK if the servers table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'servers' AND table_schema = 'public') THEN
    ALTER TABLE public.store_discounts
      ADD CONSTRAINT store_discounts_server_id_fkey
      FOREIGN KEY (server_id) REFERENCES public.servers(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN others THEN
  -- Column or table may not exist in all environments; skip silently
  NULL;
END;
$$;

-- discount_usages → store_discounts: cascade delete
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'discount_usages' AND table_schema = 'public') THEN
    ALTER TABLE public.discount_usages
      DROP CONSTRAINT IF EXISTS discount_usages_discount_id_fkey;
    ALTER TABLE public.discount_usages
      ADD CONSTRAINT discount_usages_discount_id_fkey
      FOREIGN KEY (discount_id) REFERENCES public.store_discounts(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN others THEN NULL;
END;
$$;

-- raffle_entries → raffles: ensure cascade (already in migration but make idempotent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'raffle_entries' AND table_schema = 'public')
  AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'raffles' AND table_schema = 'public') THEN
    ALTER TABLE public.raffle_entries
      DROP CONSTRAINT IF EXISTS raffle_entries_raffle_id_fkey;
    ALTER TABLE public.raffle_entries
      ADD CONSTRAINT raffle_entries_raffle_id_fkey
      FOREIGN KEY (raffle_id) REFERENCES public.raffles(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN others THEN NULL;
END;
$$;

-- members → servers: add server_id FK with cascade if members table uses UUID server_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'members' AND column_name = 'server_id' AND table_schema = 'public'
  )
  AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'servers' AND table_schema = 'public') THEN
    ALTER TABLE public.members
      DROP CONSTRAINT IF EXISTS members_server_id_fkey;
    ALTER TABLE public.members
      ADD CONSTRAINT members_server_id_fkey
      FOREIGN KEY (server_id) REFERENCES public.servers(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN others THEN NULL;
END;
$$;

-- booster_tiers: no UUID server_id, uses guild_id text → no FK possible, handled in app layer
-- weekly_tasks: same — guild_id text, handled in app layer
