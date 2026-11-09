-- FleetPulse TMS PostgreSQL Production Database Schema
-- Corresponds to FleetPulse Enterprise Freight & Multi-Drop Architecture

CREATE TABLE IF NOT EXISTS companies (
    id VARCHAR(50) PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    mobile VARCHAR(30) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    gstin VARCHAR(50),
    pan_number VARCHAR(50),
    logo_url TEXT,
    established_year VARCHAR(10),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_accounts (
    id VARCHAR(50) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    mobile VARCHAR(30) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('admin', 'operator', 'driver')),
    address TEXT,
    verification_status VARCHAR(50) DEFAULT 'verified',
    permissions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS vehicles (
    id VARCHAR(50) PRIMARY KEY,
    number VARCHAR(50) UNIQUE NOT NULL,
    state_code VARCHAR(10) NOT NULL,
    type VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    capacity_kg NUMERIC NOT NULL,
    capacity_mt NUMERIC NOT NULL,
    current_odometer NUMERIC NOT NULL DEFAULT 0,
    fuel_type VARCHAR(20) DEFAULT 'diesel',
    assigned_driver_id VARCHAR(50),
    assigned_driver_name VARCHAR(255),
    assigned_driver_ids JSONB DEFAULT '[]'::jsonb,
    diesel_average NUMERIC DEFAULT 0,
    cng_average NUMERIC DEFAULT 0,
    last_service_odo NUMERIC DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    current_location VARCHAR(255) NOT NULL,
    maintenance_reminders JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicle_documents (
    id VARCHAR(50) PRIMARY KEY,
    vehicle_id VARCHAR(50) REFERENCES vehicles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    number VARCHAR(100) NOT NULL,
    expiry_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL,
    soft_copy_name VARCHAR(255),
    soft_copy_url TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drivers (
    id VARCHAR(50) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    mobile VARCHAR(30) NOT NULL,
    address TEXT NOT NULL,
    license_number VARCHAR(100) NOT NULL,
    license_expiry DATE NOT NULL,
    license_soft_copy_url TEXT,
    aadhaar_number VARCHAR(50),
    aadhaar_soft_copy_url TEXT,
    pan_number VARCHAR(50),
    pan_soft_copy_url TEXT,
    profile_photo_url TEXT,
    status VARCHAR(50) DEFAULT 'active',
    assigned_vehicle_id VARCHAR(50),
    assigned_vehicle_number VARCHAR(50),
    assigned_vehicle_ids JSONB DEFAULT '[]'::jsonb,
    trips_completed INT DEFAULT 0,
    joined_date DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS trips (
    id VARCHAR(50) PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    out_date DATE NOT NULL,
    vehicle_id VARCHAR(50) REFERENCES vehicles(id),
    vehicle_number VARCHAR(50) NOT NULL,
    vehicle_state_code VARCHAR(10) NOT NULL,
    driver_id VARCHAR(50) REFERENCES drivers(id),
    driver_name VARCHAR(255) NOT NULL,
    starting_location VARCHAR(255) NOT NULL,
    total_fruit_value NUMERIC NOT NULL DEFAULT 0,
    total_weight_kg NUMERIC DEFAULT 0,
    is_overloaded BOOLEAN DEFAULT FALSE,
    admin_override BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'approved',
    start_odometer NUMERIC NOT NULL DEFAULT 0,
    end_odometer NUMERIC
);

CREATE TABLE IF NOT EXISTS trip_destinations (
    id VARCHAR(50) PRIMARY KEY,
    trip_id VARCHAR(50) REFERENCES trips(id) ON DELETE CASCADE,
    stop_sequence INT NOT NULL,
    place_name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    mobile VARCHAR(30) NOT NULL,
    destination_total_amount NUMERIC NOT NULL DEFAULT 0,
    payment_term VARCHAR(50) NOT NULL DEFAULT 'immediate',
    quick_reminder_date DATE,
    delivery_status VARCHAR(50) DEFAULT 'delivered'
);

CREATE TABLE IF NOT EXISTS delivery_items (
    id VARCHAR(50) PRIMARY KEY,
    destination_id VARCHAR(50) REFERENCES trip_destinations(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    quantity NUMERIC NOT NULL,
    cost_per_item NUMERIC NOT NULL,
    total_amount NUMERIC NOT NULL
);

CREATE TABLE IF NOT EXISTS return_loads (
    id VARCHAR(50) PRIMARY KEY,
    trip_id VARCHAR(50) REFERENCES trips(id),
    loading_party_name VARCHAR(255) NOT NULL,
    loading_city VARCHAR(100) NOT NULL,
    delivery_city VARCHAR(100) NOT NULL,
    goods_description TEXT NOT NULL,
    quantity NUMERIC NOT NULL,
    weight_kg NUMERIC NOT NULL,
    load_rent_charge NUMERIC NOT NULL,
    settled_amount NUMERIC,
    is_settled BOOLEAN DEFAULT FALSE,
    settled_date DATE,
    lr_number VARCHAR(100) NOT NULL,
    has_stamped_lr BOOLEAN DEFAULT FALSE,
    stamped_lr_photo_url TEXT,
    lr_submitted_to_party BOOLEAN DEFAULT FALSE,
    payment_status VARCHAR(50) DEFAULT 'pending',
    due_date DATE NOT NULL,
    vehicle_number VARCHAR(50) NOT NULL,
    driver_name VARCHAR(255) NOT NULL,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS parties (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    business_name VARCHAR(255),
    contact_person VARCHAR(255) NOT NULL,
    mobile VARCHAR(30) NOT NULL,
    email VARCHAR(255),
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    party_type VARCHAR(50) NOT NULL,
    gstin VARCHAR(50),
    pan_number VARCHAR(50),
    total_trips_count INT DEFAULT 0,
    total_business_amount NUMERIC DEFAULT 0,
    outstanding_balance NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS party_payments (
    id VARCHAR(50) PRIMARY KEY,
    party_id VARCHAR(50) REFERENCES parties(id),
    party_name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    route VARCHAR(255) NOT NULL,
    trip_reference_id VARCHAR(50),
    vehicle_number VARCHAR(50) NOT NULL,
    driver_name VARCHAR(255),
    lr_number VARCHAR(100) NOT NULL,
    charge_amount NUMERIC NOT NULL,
    settled_amount NUMERIC,
    is_settled BOOLEAN DEFAULT FALSE,
    amount_paid NUMERIC DEFAULT 0,
    amount_due NUMERIC NOT NULL,
    lr_submitted_to_party BOOLEAN DEFAULT FALSE,
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS fuel_records (
    id VARCHAR(50) PRIMARY KEY,
    vehicle_id VARCHAR(50) REFERENCES vehicles(id),
    vehicle_number VARCHAR(50) NOT NULL,
    driver_id VARCHAR(50) REFERENCES drivers(id),
    driver_name VARCHAR(255) NOT NULL,
    fuel_type VARCHAR(20) NOT NULL,
    odometer_reading NUMERIC NOT NULL,
    fuel_quantity NUMERIC NOT NULL,
    unit VARCHAR(20) NOT NULL,
    price_per_unit NUMERIC NOT NULL,
    total_amount NUMERIC NOT NULL,
    fill_type VARCHAR(50) NOT NULL,
    fuel_station VARCHAR(255) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    receipt_photo_url TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sync_status VARCHAR(50) DEFAULT 'synced'
);

CREATE TABLE IF NOT EXISTS service_repair_records (
    id VARCHAR(50) PRIMARY KEY,
    vehicle_id VARCHAR(50) REFERENCES vehicles(id),
    vehicle_number VARCHAR(50) NOT NULL,
    driver_id VARCHAR(50) REFERENCES drivers(id),
    driver_name VARCHAR(255) NOT NULL,
    current_odometer NUMERIC NOT NULL,
    activity_type VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    workshop_name VARCHAR(255) NOT NULL,
    work_description TEXT NOT NULL,
    expense_amount NUMERIC NOT NULL,
    paid_by VARCHAR(50) NOT NULL,
    invoice_number VARCHAR(100),
    receipt_photo_url TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sync_status VARCHAR(50) DEFAULT 'synced'
);

CREATE TABLE IF NOT EXISTS odometer_events (
    id VARCHAR(50) PRIMARY KEY,
    vehicle_id VARCHAR(50) REFERENCES vehicles(id),
    vehicle_number VARCHAR(50) NOT NULL,
    driver_id VARCHAR(50) REFERENCES drivers(id),
    driver_name VARCHAR(255) NOT NULL,
    odometer_reading NUMERIC NOT NULL,
    activity_type VARCHAR(100) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verification_status VARCHAR(50) DEFAULT 'verified'
);

CREATE TABLE IF NOT EXISTS offline_sync_log (
    id VARCHAR(100) PRIMARY KEY,
    idempotency_key VARCHAR(100) UNIQUE NOT NULL,
    activity_type VARCHAR(100) NOT NULL,
    device_id VARCHAR(100) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_role VARCHAR(30) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT NOT NULL
);

-- Indexes for lightning-fast queries
CREATE INDEX IF NOT EXISTS idx_trips_vehicle ON trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_date ON trips(out_date);
CREATE INDEX IF NOT EXISTS idx_fuel_vehicle ON fuel_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_service_vehicle ON service_repair_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_odo_vehicle ON odometer_events(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_payments_party ON party_payments(party_id);
CREATE INDEX IF NOT EXISTS idx_offline_sync_key ON offline_sync_log(idempotency_key);

