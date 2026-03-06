-- ============================================================
-- PROJ-3: Artikel & Kategorieverwaltung - Datenbank-Migration
-- ============================================================
-- Erstellt:
--   categories        (Vereinsebene)
--   product_templates (Vereinsebene - Vorlagen)
--   products          (Festebene - Kopien)
-- ============================================================

-- 1. categories
CREATE TABLE IF NOT EXISTS categories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 50),
  color           TEXT CHECK (color IS NULL OR color ~ '^#[0-9a-fA-F]{6}$'),
  display_order   INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select_own_org" ON categories
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "categories_insert_admin" ON categories
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "categories_update_admin" ON categories
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "categories_delete_admin" ON categories
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE INDEX idx_categories_organization_id ON categories(organization_id);
CREATE INDEX idx_categories_org_order ON categories(organization_id, display_order);

-- 2. product_templates (Vereinsebene)
CREATE TABLE IF NOT EXISTS product_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
  name            TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 40),
  unit            TEXT NOT NULL DEFAULT 'Stk.' CHECK (unit IN ('Stk.', 'l', 'kg')),
  image_url       TEXT,
  display_order   INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE product_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_templates_select_own_org" ON product_templates
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "product_templates_insert_admin" ON product_templates
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "product_templates_update_admin" ON product_templates
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "product_templates_delete_admin" ON product_templates
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE INDEX idx_product_templates_org ON product_templates(organization_id);
CREATE INDEX idx_product_templates_category ON product_templates(category_id);
CREATE INDEX idx_product_templates_org_order ON product_templates(organization_id, display_order);

-- 3. products (Festebene - Kopien)
CREATE TABLE IF NOT EXISTS products (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id          UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  template_id       UUID REFERENCES product_templates(id) ON DELETE SET NULL,
  category_id       UUID REFERENCES categories(id) ON DELETE SET NULL,
  name              TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 40),
  unit              TEXT NOT NULL DEFAULT 'Stk.' CHECK (unit IN ('Stk.', 'l', 'kg')),
  price_cents       INT NOT NULL CHECK (price_cents >= 0),
  last_price_cents  INT CHECK (last_price_cents IS NULL OR last_price_cents >= 0),
  station_id        UUID, -- FK zu stations (PROJ-4), noch nicht vorhanden
  is_active         BOOLEAN NOT NULL DEFAULT true,
  display_order     INT NOT NULL DEFAULT 0,
  image_url         TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- SELECT: Alle Mitglieder koennen Produkte ihres Vereins lesen
CREATE POLICY "products_select_own_org" ON products
  FOR SELECT
  USING (
    event_id IN (
      SELECT e.id FROM events e
      JOIN profiles p ON p.organization_id = e.organization_id
      WHERE p.id = auth.uid()
    )
  );

-- INSERT: Nur Admins
CREATE POLICY "products_insert_admin" ON products
  FOR INSERT
  WITH CHECK (
    event_id IN (
      SELECT e.id FROM events e
      JOIN profiles p ON p.organization_id = e.organization_id
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- UPDATE: Nur Admins, nicht bei archivierten Festen
CREATE POLICY "products_update_admin" ON products
  FOR UPDATE
  USING (
    event_id IN (
      SELECT e.id FROM events e
      JOIN profiles p ON p.organization_id = e.organization_id
      WHERE p.id = auth.uid() AND p.role = 'admin'
        AND e.status != 'archived'
    )
  )
  WITH CHECK (
    event_id IN (
      SELECT e.id FROM events e
      JOIN profiles p ON p.organization_id = e.organization_id
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- DELETE: Nur Admins, nicht bei archivierten Festen
CREATE POLICY "products_delete_admin" ON products
  FOR DELETE
  USING (
    event_id IN (
      SELECT e.id FROM events e
      JOIN profiles p ON p.organization_id = e.organization_id
      WHERE p.id = auth.uid() AND p.role = 'admin'
        AND e.status != 'archived'
    )
  );

CREATE INDEX idx_products_event_id ON products(event_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_event_order ON products(event_id, display_order);
CREATE INDEX idx_products_event_active ON products(event_id, is_active);

-- updated_at Trigger fuer products
CREATE TRIGGER trigger_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
