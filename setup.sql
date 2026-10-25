-- ═══════════════════════════════════════════
-- Piwi Kappen — SQL سريع (SQL Editor ← Run)
-- ═══════════════════════════════════════════

-- 1) الجداول
CREATE TABLE IF NOT EXISTS piwi_products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  old_price NUMERIC(10,2),
  badge TEXT,
  image_url TEXT,
  image_url2 TEXT,
  image_url3 TEXT,
  description TEXT DEFAULT '',
  sold_out BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- إن كانت الجداول موجودة مسبقًا (تشغيل آمن):
ALTER TABLE piwi_products ADD COLUMN IF NOT EXISTS image_url2 TEXT;
ALTER TABLE piwi_products ADD COLUMN IF NOT EXISTS image_url3 TEXT;
ALTER TABLE piwi_products ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

CREATE TABLE IF NOT EXISTS piwi_orders (
  id SERIAL PRIMARY KEY,
  order_number TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  shipping_city TEXT,
  shipping_address TEXT NOT NULL,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled')),
  payment_method TEXT DEFAULT 'cod',
  subtotal NUMERIC(10,2) DEFAULT 0,
  shipping_cost NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) DEFAULT 0,
  items_json TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS piwi_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2) فهارس سريعة
CREATE INDEX IF NOT EXISTS idx_pwp_act ON piwi_products(is_active);
CREATE INDEX IF NOT EXISTS idx_pwo_st  ON piwi_orders(status);
CREATE INDEX IF NOT EXISTS idx_pwo_ct  ON piwi_orders(created_at DESC);

-- 3) رقم الطلب تلقائي
CREATE SEQUENCE IF NOT EXISTS piwi_ord_seq;
CREATE OR REPLACE FUNCTION piwi_ordno() RETURNS trigger AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number='' THEN
    NEW.order_number := 'PK-'||to_char(now(),'YYYYMM')||'-'||lpad(nextval('piwi_ord_seq')::text,4,'0');
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_piwi_ordno ON piwi_orders;
CREATE TRIGGER trg_piwi_ordno BEFORE INSERT ON piwi_orders
  FOR EACH ROW EXECUTE FUNCTION piwi_ordno();

-- 4) updated_at
CREATE OR REPLACE FUNCTION piwi_touch() RETURNS trigger AS $$
BEGIN NEW.updated_at=now(); RETURN NEW; END $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_pwp_touch ON piwi_products;
CREATE TRIGGER trg_pwp_touch BEFORE UPDATE ON piwi_products
  FOR EACH ROW EXECUTE FUNCTION piwi_touch();
DROP TRIGGER IF EXISTS trg_pwo_touch ON piwi_orders;
CREATE TRIGGER trg_pwo_touch BEFORE UPDATE ON piwi_orders
  FOR EACH ROW EXECUTE FUNCTION piwi_touch();

-- 5) بيانات أولية
INSERT INTO piwi_products (name,price,old_price,badge,description,sort_order)
SELECT v.name,v.price,v.old_price,v.badge,v.description,v.sort_order
FROM (VALUES
  ('Casquette Classic',1800,2200,'جديد','قبعة كلاسيك أصلية',1),
  ('Casquette Snapback',1900,NULL,NULL,'سناپباك عصرية',2),
  ('Casquette Street',1700,2000,'خصم','ستايل شارع',3),
  ('Casquette Sport',1600,NULL,'الأكثر طلباً','رياضة ويوميات',4),
  ('Casquette Trucker',1500,1800,'خصم','شبكة خلفية',5),
  ('Casquette Baseball',2000,NULL,NULL,'بيسبول كلاسيك',6)
) AS v(name,price,old_price,badge,description,sort_order)
WHERE NOT EXISTS (SELECT 1 FROM piwi_products p WHERE p.name=v.name);

INSERT INTO piwi_settings (key,value) VALUES
('w','213777589554'),
('p','+213 777 58 95 54'),
('a','Aller de Parking Centre commercial Mohamadia'),
('f','5000'),
('b','🚚 توصيل لـ 69 ولاية • الدفع عند الاستلام'),
('admin_pass','admin123')
ON CONFLICT (key) DO NOTHING;

-- ═══════════════════════════════════════════
-- 6) RLS — أمان سريع ومحكم
-- ═══════════════════════════════════════════
ALTER TABLE piwi_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE piwi_orders   ENABLE ROW LEVEL SECURITY;
ALTER TABLE piwi_settings ENABLE ROW LEVEL SECURITY;

-- احذف سياسات قديمة إن وجدت
DROP POLICY IF EXISTS pwp_pub_read  ON piwi_products;
DROP POLICY IF EXISTS pwp_pub_none  ON piwi_products;
DROP POLICY IF EXISTS pwo_pub_ins   ON piwi_orders;
DROP POLICY IF EXISTS pwo_pub_none  ON piwi_orders;
DROP POLICY IF EXISTS pws_pub_read  ON piwi_settings;
DROP POLICY IF EXISTS pws_pub_none  ON piwi_settings;

-- المنتجات: الزوار يقرؤون النشط فقط، لا يكتبون شيئًا
CREATE POLICY pwp_pub_read ON piwi_products
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- الطلبات: الزوار يُرسلون طلب فقط، لا يقرؤون ولا يحذفون
CREATE POLICY pwo_pub_ins ON piwi_orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- الإعدادات: الزوار يقرؤون إلا admin_pass
CREATE POLICY pws_pub_read ON piwi_settings
  FOR SELECT TO anon, authenticated
  USING (key <> 'admin_pass');

-- ملاحظة: RLS مفعّل = أي أمر بلا سياسة يُرفض تلقائيًا
-- الزائر: قراءة منتجات + إدراج طلب فقط
-- اللوحة (service_role): كل الصلاحيات عبر مفتاح الخدمة

-- 7) تأكيد
SELECT 'DONE' AS status,
  (SELECT count(*) FROM piwi_products) AS products,
  (SELECT count(*) FROM piwi_settings) AS settings;
