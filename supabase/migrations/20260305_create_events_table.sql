-- ============================================================
-- PROJ-2: Event Setup - Datenbank-Migration
-- ============================================================
-- Erstellt die `events`-Tabelle mit RLS, CHECK-Constraints,
-- Indexes und einem updated_at-Trigger.
--
-- Voraussetzung: organizations-Tabelle aus PROJ-1 existiert.
-- ============================================================

-- 1. Tabelle erstellen
CREATE TABLE IF NOT EXISTS events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name          TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  date          DATE NOT NULL,
  location      TEXT DEFAULT '' CHECK (char_length(location) <= 200),
  description   TEXT DEFAULT '' CHECK (char_length(description) <= 1000),
  status        TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'active', 'archived')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Row Level Security aktivieren
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- SELECT: Alle Mitglieder des Vereins koennen Events lesen
CREATE POLICY "events_select_own_org" ON events
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- INSERT: Nur Admins des Vereins koennen Events erstellen
CREATE POLICY "events_insert_admin" ON events
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- UPDATE: Nur Admins des Vereins, und nicht bei archivierten Events
CREATE POLICY "events_update_admin" ON events
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    AND status != 'archived'
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- DELETE: Nur Admins, nur Draft-Events
CREATE POLICY "events_delete_admin_draft" ON events
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    AND status = 'draft'
  );

-- 4. Indexes fuer Performance
CREATE INDEX idx_events_organization_id ON events(organization_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_org_status ON events(organization_id, status);
CREATE INDEX idx_events_org_date ON events(organization_id, date DESC);

-- 5. Unique Partial Index: Nur ein aktives Event pro Organisation
CREATE UNIQUE INDEX idx_events_one_active_per_org
  ON events(organization_id)
  WHERE status = 'active';

-- 6. updated_at Trigger-Funktion (wiederverwendbar)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger an events-Tabelle binden
CREATE TRIGGER trigger_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. RPC-Funktion: Atomare Aktivierung (respektiert Unique Index)
-- Deaktiviert alle aktiven Events der Organisation und aktiviert das gewuenschte
-- in einer einzigen Transaktion.
-- SECURITY INVOKER: Funktion laeuft mit Rechten des Aufrufers → RLS greift normal.
-- Verhindert, dass authentifizierte Benutzer Events anderer Organisationen manipulieren.
CREATE OR REPLACE FUNCTION activate_event(target_event_id UUID)
RETURNS VOID AS $$
DECLARE
  v_org_id UUID;
  v_status TEXT;
BEGIN
  -- Event laden und Status pruefen
  SELECT organization_id, status INTO v_org_id, v_status
  FROM events
  WHERE id = target_event_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event nicht gefunden';
  END IF;

  IF v_status = 'archived' THEN
    RAISE EXCEPTION 'Archivierte Feste koennen nicht aktiviert werden';
  END IF;

  -- Toggle: Wenn bereits aktiv, auf draft setzen
  IF v_status = 'active' THEN
    UPDATE events SET status = 'draft' WHERE id = target_event_id;
    RETURN;
  END IF;

  -- Alle anderen aktiven Events dieser Organisation deaktivieren
  UPDATE events
  SET status = 'draft'
  WHERE organization_id = v_org_id
    AND status = 'active'
    AND id != target_event_id;

  -- Gewuenschtes Event aktivieren
  UPDATE events
  SET status = 'active'
  WHERE id = target_event_id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
