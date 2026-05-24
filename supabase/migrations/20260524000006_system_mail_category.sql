-- system_mails.category: 'system' kategorisini ekle (quiz ve sistem bildirimleri)
DO $migrate$
DECLARE
  cname text;
BEGIN
  SELECT con.conname INTO cname
  FROM pg_constraint con
  JOIN pg_class cls ON cls.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = cls.relnamespace
  WHERE cls.relname = 'system_mails'
    AND nsp.nspname = 'public'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) ILIKE '%category%'
  LIMIT 1;

  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.system_mails DROP CONSTRAINT %I', cname);
  END IF;

  EXECUTE $sql$
    ALTER TABLE public.system_mails
    ADD CONSTRAINT system_mails_category_check
    CHECK (category IN (
      'announcement','maintenance','sponsor','update','lottery','reward','order','system'
    ))
  $sql$;
END $migrate$;
