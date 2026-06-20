-- Certificate Verification DApp Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Create certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  certificate_hash TEXT UNIQUE NOT NULL,
  student_name TEXT NOT NULL,
  student_id TEXT NOT NULL,
  degree TEXT NOT NULL,
  university TEXT NOT NULL,
  issue_date TIMESTAMP WITH TIME ZONE NOT NULL,
  ipfs_url TEXT NOT NULL,
  ipfs_hash TEXT NOT NULL,
  digital_signature TEXT NOT NULL,
  public_key TEXT NOT NULL,
  issuer_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create authorized issuers table
CREATE TABLE IF NOT EXISTS authorized_issuers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  issuer_address TEXT UNIQUE NOT NULL,
  university TEXT NOT NULL,
  public_key TEXT,
  authorized_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin users table (for university admins)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  university TEXT NOT NULL,
  wallet_address TEXT,
  role TEXT DEFAULT 'admin',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create certificate verification logs table
CREATE TABLE IF NOT EXISTS verification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  certificate_hash TEXT NOT NULL,
  verifier_ip TEXT,
  verification_result BOOLEAN NOT NULL,
  verification_method TEXT, -- 'database', 'blockchain', 'signature'
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  additional_info JSONB
);

-- Create universities table (credit transfer module)
CREATE TABLE IF NOT EXISTS universities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    country TEXT NOT NULL,
    annual_load_units NUMERIC(10,2) NOT NULL CHECK (annual_load_units > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create courses table (credit transfer module)
CREATE TABLE IF NOT EXISTS courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    uni_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    course_code TEXT NOT NULL,
    title TEXT NOT NULL,
    credits NUMERIC(10,2) NOT NULL CHECK (credits > 0),
    syllabus_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (uni_id, course_code)
);

-- Create equivalencies table (credit transfer module)
CREATE TABLE IF NOT EXISTS equivalencies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    target_course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    match_confidence_score NUMERIC(5,2) NOT NULL CHECK (match_confidence_score >= 0 AND match_confidence_score <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (source_course_id, target_course_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_certificates_hash ON certificates(certificate_hash);
CREATE INDEX IF NOT EXISTS idx_certificates_student_id ON certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_university ON certificates(university);
CREATE INDEX IF NOT EXISTS idx_certificates_created_at ON certificates(created_at);
CREATE INDEX IF NOT EXISTS idx_authorized_issuers_address ON authorized_issuers(issuer_address);
CREATE INDEX IF NOT EXISTS idx_verification_logs_hash ON verification_logs(certificate_hash);
CREATE INDEX IF NOT EXISTS idx_verification_logs_verified_at ON verification_logs(verified_at);
CREATE INDEX IF NOT EXISTS idx_universities_name ON universities(name);
CREATE INDEX IF NOT EXISTS idx_courses_uni_id ON courses(uni_id);
CREATE INDEX IF NOT EXISTS idx_courses_course_code ON courses(course_code);
CREATE INDEX IF NOT EXISTS idx_equivalencies_source ON equivalencies(source_course_id);
CREATE INDEX IF NOT EXISTS idx_equivalencies_target ON equivalencies(target_course_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for certificates table
CREATE TRIGGER update_certificates_updated_at 
    BEFORE UPDATE ON certificates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies

-- Enable RLS on all tables
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE authorized_issuers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE equivalencies ENABLE ROW LEVEL SECURITY;

-- Certificates policies
CREATE POLICY "Certificates are viewable by everyone" ON certificates
    FOR SELECT USING (TRUE);

CREATE POLICY "Certificates can be inserted by authenticated users" ON certificates
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Certificates can be updated by issuer" ON certificates
    FOR UPDATE USING (auth.uid()::text = issuer_address);

-- Authorized issuers policies
CREATE POLICY "Authorized issuers are viewable by everyone" ON authorized_issuers
    FOR SELECT USING (TRUE);

CREATE POLICY "Authorized issuers can be managed by authenticated users" ON authorized_issuers
    FOR ALL USING (auth.role() = 'authenticated');

-- Admin users policies
CREATE POLICY "Admin users can view their own data" ON admin_users
    FOR SELECT USING (auth.email() = email);

CREATE POLICY "Admin users can be created by service role" ON admin_users
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Verification logs policies
CREATE POLICY "Verification logs are insertable by everyone" ON verification_logs
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Verification logs are viewable by authenticated users" ON verification_logs
    FOR SELECT USING (auth.role() = 'authenticated');

-- Credit transfer table policies
CREATE POLICY "Universities are viewable by everyone" ON universities
    FOR SELECT USING (TRUE);

CREATE POLICY "Courses are viewable by everyone" ON courses
    FOR SELECT USING (TRUE);

CREATE POLICY "Equivalencies are viewable by everyone" ON equivalencies
    FOR SELECT USING (TRUE);

CREATE POLICY "Universities can be managed by authenticated users" ON universities
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Courses can be managed by authenticated users" ON courses
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Equivalencies can be managed by authenticated users" ON equivalencies
    FOR ALL USING (auth.role() = 'authenticated');

-- Insert sample data for testing
INSERT INTO authorized_issuers (issuer_address, university) VALUES 
('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 'Harvard University'),
('0x70997970C51812dc3A010C7d01b50e0d17dc79C8', 'MIT'),
('0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', 'Stanford University')
ON CONFLICT (issuer_address) DO NOTHING;

-- Create a view for easy certificate verification
CREATE OR REPLACE VIEW certificate_verification_view AS
SELECT 
    c.certificate_hash,
    c.student_name,
    c.student_id,
    c.degree,
    c.university,
    c.issue_date,
    c.ipfs_url,
    c.issuer_address,
    ai.university as issuer_university,
    ai.is_active as issuer_active,
    c.created_at
FROM certificates c
LEFT JOIN authorized_issuers ai ON c.issuer_address = ai.issuer_address;

-- Grant necessary permissions
GRANT SELECT ON certificate_verification_view TO anon, authenticated;
GRANT ALL ON certificates TO authenticated;
GRANT ALL ON authorized_issuers TO authenticated;
GRANT ALL ON verification_logs TO anon, authenticated;
GRANT ALL ON universities TO anon, authenticated;
GRANT ALL ON courses TO anon, authenticated;
GRANT ALL ON equivalencies TO anon, authenticated;
