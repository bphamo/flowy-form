DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='form_versions' AND column_name='metadata') THEN
        ALTER TABLE "form_versions" ADD COLUMN "metadata" jsonb;
    END IF;
END $$;