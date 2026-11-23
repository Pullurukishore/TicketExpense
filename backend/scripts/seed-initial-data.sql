-- Seed initial ServiceZones
INSERT INTO "ServiceZone" ("name", "shortForm", "description", "isActive", "createdAt", "updatedAt")
VALUES 
  ('South', 'S', 'South Zone Region', true, NOW(), NOW()),
  ('North', 'N', 'North Zone Region', true, NOW(), NOW()),
  ('West', 'W', 'West Zone Region', true, NOW(), NOW()),
  ('East', 'E', 'East Zone Region', true, NOW(), NOW()),
  ('Central', 'C', 'Central Zone Region', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Seed Admin User
INSERT INTO "User" ("email", "password", "role", "name", "employee_code", "isActive", "tokenVersion", "createdAt", "updatedAt")
VALUES (
  'admin@kardexcare.com',
  '$2b$10$iy28B42fqPPRgOBgdYz3ZeOS5SrvY6IC.CKfrrVMIAaeIO2Qnwczy',
  'ADMIN',
  'System Admin',
  'KDX-ADMIN-001',
  true,
  '1a2b3c4d-0001-0000-0000-000000000001',
  NOW(),
  NOW()
)
ON CONFLICT ("email") DO UPDATE 
SET "employee_code" = EXCLUDED."employee_code", "role" = 'ADMIN';

-- Seed Zone Manager (Lead)
INSERT INTO "User" ("email", "password", "role", "name", "employee_code", "isActive", "tokenVersion", "createdAt", "updatedAt")
VALUES (
  'lead.south@kardexcare.com',
  '$2b$10$iy28B42fqPPRgOBgdYz3ZeOS5SrvY6IC.CKfrrVMIAaeIO2Qnwczy',
  'ZONE_MANAGER',
  'South Zone Lead',
  'KDX-LEAD-001',
  true,
  '1a2b3c4d-0002-0000-0000-000000000002',
  NOW(),
  NOW()
)
ON CONFLICT ("email") DO UPDATE 
SET "employee_code" = EXCLUDED."employee_code", "role" = 'ZONE_MANAGER';

-- Seed Service Person
INSERT INTO "User" ("email", "password", "role", "name", "employee_code", "isActive", "tokenVersion", "createdAt", "updatedAt")
VALUES (
  'service.raman@kardexcare.com',
  '$2b$10$uk.hRvJLyGbADgL8ZkQHgukKfbeH.yz9uHsi/CU9VELc9bbbnfv0C',
  'SERVICE_PERSON',
  'Raman Kumar',
  'KDX-SP-001',
  true,
  '1a2b3c4d-0003-0000-0000-000000000003',
  NOW(),
  NOW()
)
ON CONFLICT ("email") DO UPDATE 
SET "employee_code" = EXCLUDED."employee_code", "role" = 'SERVICE_PERSON';
