INSERT INTO "Customer" ("companyName", "address", "industry", "timezone", "serviceZoneId", "createdById", "updatedById", "createdAt", "updatedAt")
VALUES ('Tata Motors', 'Pune Plant, Bhosari', 'Automotive', 'Asia/Kolkata', 3, 1, 1, NOW(), NOW())
RETURNING id \gset cust_

INSERT INTO "Asset" ("machineId", "model", "serialNo", "location", "customerId", "createdAt", "updatedAt")
VALUES ('LR35-001', 'Megamat RS 350', 'SN-98124', 'Bay 4', :cust_id, NOW(), NOW())
RETURNING id \gset asset_

INSERT INTO "Contact" ("name", "phone", "customerId", "createdAt", "updatedAt")
VALUES ('Rajesh Patil', '9876543210', :cust_id, NOW(), NOW())
RETURNING id \gset contact_

INSERT INTO "Ticket" ("ticketNumber", "title", "description", "customerId", "assetId", "contactId", "createdById", "ownerId", "zoneId", "assignedToId", "createdAt", "updatedAt")
VALUES ('TK-2026-101', 'Vertical Lift Jamming', 'Tray 12 sensor fault', :cust_id, :asset_id, :contact_id, 1, 1, 3, 3, NOW(), NOW())
RETURNING id \gset ticket_

INSERT INTO expense_claims ("claim_number", "submitted_by", "claim_date", "total_amount", "status", "ticket_id", "customer_id", "asset_id", "ticket_no", "customer", "machine_no", "location", "purpose", "po_so_no", "zone", "created_at", "updated_at")
VALUES ('RDO-2026-0001', 3, NOW(), 1250.00, 'APPROVED', :ticket_id, :cust_id, :asset_id, 'TK-2026-101', 'Tata Motors', 'SN-98124', 'Pune Plant', 'Breakdown Maintenance', 'PO-44021', 'West', NOW(), NOW())
RETURNING id \gset claim_

INSERT INTO expense_items ("claim_id", "category", "amount", "expense_date", "description", "created_at")
VALUES 
  (:claim_id, 'TRAVELLING', 1000.00, NOW(), 'Bike mileage 200km', NOW()),
  (:claim_id, 'DA', 250.00, NOW(), 'Lunch Daily Allowance', NOW());
