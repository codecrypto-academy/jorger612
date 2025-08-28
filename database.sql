-- Create the company table
CREATE TABLE IF NOT EXISTS company (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    founded_year INTEGER,
    industry VARCHAR(100),
    website VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on name for better search performance
CREATE INDEX IF NOT EXISTS idx_company_name ON company(name);
CREATE INDEX IF NOT EXISTS idx_company_industry ON company(industry);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_company_updated_at 
    BEFORE UPDATE ON company 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data
INSERT INTO company (name, description, founded_year, industry, website) VALUES
('Apple Inc.', 'Technology company that designs, manufactures, and markets smartphones, personal computers, tablets, wearables and accessories', 1976, 'Technology', 'https://www.apple.com'),
('Microsoft Corporation', 'Multinational technology company that develops, manufactures, licenses, supports, and sells computer software, consumer electronics, personal computers, and related services', 1975, 'Technology', 'https://www.microsoft.com'),
('Google LLC', 'Multinational technology company that specializes in Internet-related services and products', 1998, 'Technology', 'https://www.google.com'),
('Amazon.com Inc.', 'Multinational technology company focusing on e-commerce, cloud computing, digital streaming, and artificial intelligence', 1994, 'E-commerce', 'https://www.amazon.com'),
('Tesla Inc.', 'Electric vehicle and clean energy company', 2003, 'Automotive', 'https://www.tesla.com');

-- Grant permissions (if needed)
-- GRANT ALL PRIVILEGES ON TABLE company TO debuggeandoideas;
-- GRANT USAGE, SELECT ON SEQUENCE company_id_seq TO debuggeandoideas; 