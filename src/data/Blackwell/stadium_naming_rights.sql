-- DW SPORTS MANAGEMENT & ENTERTAINMENT DATABASE
-- Stadium and Venue Naming Rights Contracts
-- Last Updated: 2023-10-18

CREATE TABLE naming_rights_deals (
    deal_id INT PRIMARY KEY,
    client_name VARCHAR(100),
    venue_name VARCHAR(200),
    location VARCHAR(100),
    contract_start DATE,
    contract_end DATE,
    annual_value DECIMAL(12,2),
    total_value DECIMAL(15,2),
    payment_schedule VARCHAR(50),
    signage_rights BOOLEAN,
    suite_included BOOLEAN,
    tickets_per_year INT
);

INSERT INTO naming_rights_deals VALUES
(1001, 'Demarco Washington', 'DW Performance Center', 'Aventura, FL', '2021-01-01', '2031-12-31', 250000, 2500000, 'Annual', TRUE, TRUE, 100),
(1002, 'TechNova Corp', 'TechNova Arena', 'Fort Lauderdale, FL', '2022-07-01', '2032-06-30', 1800000, 18000000, 'Quarterly', TRUE, TRUE, 500),
(1003, 'Caribbean First Bank', 'CFB Stadium', 'Nassau, Bahamas', '2023-01-01', '2043-12-31', 2500000, 50000000, 'Semi-Annual', TRUE, TRUE, 1000),
(1004, 'Miami Health Systems', 'MHS Sports Complex', 'Miami Gardens, FL', '2020-09-01', '2030-08-31', 750000, 7500000, 'Monthly', TRUE, FALSE, 200);

CREATE TABLE endorsement_deals (
    endorsement_id INT PRIMARY KEY,
    athlete_name VARCHAR(100),
    brand VARCHAR(100),
    category VARCHAR(50),
    start_date DATE,
    end_date DATE,
    guaranteed_amount DECIMAL(10,2),
    performance_bonus DECIMAL(10,2),
    social_media_posts INT,
    appearances_required INT
);

INSERT INTO endorsement_deals VALUES
(2001, 'Marcus Johnson', 'PowerAde', 'Beverage', '2023-03-01', '2025-02-28', 500000, 150000, 24, 6),
(2002, 'Jasmine Williams', 'Nike', 'Apparel', '2023-01-15', '2026-01-14', 1200000, 400000, 52, 12),
(2003, 'Carlos Rodriguez', 'Rolex', 'Luxury Watch', '2022-06-01', '2024-05-31', 750000, 0, 12, 4),
(2004, 'Demarco Washington', 'Mercedes-Benz', 'Automotive', '2019-01-01', '2024-12-31', 2000000, 500000, 36, 8);

CREATE TABLE restaurant_franchise_rights (
    franchise_id INT PRIMARY KEY,
    restaurant_name VARCHAR(100),
    franchisee VARCHAR(100),
    territory VARCHAR(200),
    initial_fee DECIMAL(10,2),
    royalty_rate DECIMAL(4,2),
    marketing_fee DECIMAL(4,2),
    term_years INT,
    locations_allowed INT
);

INSERT INTO restaurant_franchise_rights VALUES
(3001, 'DW''s Sports Bar & Grill', 'Miami Hospitality Group', 'Miami-Dade County', 150000, 6.5, 2.0, 10, 5),
(3002, 'DW''s Sports Bar & Grill', 'Caribbean Restaurant Partners', 'Bahamas', 200000, 7.0, 2.5, 15, 3),
(3003, 'DW''s Sports Bar & Grill', 'Palm Beach Dining LLC', 'Palm Beach County', 175000, 6.5, 2.0, 10, 4),
(3004, 'Champions Steakhouse', 'Sterling Restaurant Group', 'Broward County', 250000, 8.0, 3.0, 20, 2);

-- Client Address Reference
-- Demarco T. Washington: 8976 Star Island Drive, Miami Beach, FL 33139
-- Payment Wire: Bank of America, Routing: 026009593, Acct: ****7890