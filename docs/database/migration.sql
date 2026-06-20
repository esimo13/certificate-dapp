-- Migration to update certificates table structure
-- Run this SQL in your Supabase SQL Editor

-- Add new columns to certificates table
ALTER TABLE certificates 
ADD COLUMN IF NOT EXISTS student_email TEXT,
ADD COLUMN IF NOT EXISTS course_name TEXT,
ADD COLUMN IF NOT EXISTS course_code TEXT,
ADD COLUMN IF NOT EXISTS completion_date TEXT,
ADD COLUMN IF NOT EXISTS grade TEXT,
ADD COLUMN IF NOT EXISTS degree_type TEXT DEFAULT 'Certificate';

-- Update existing columns to be optional for migration
ALTER TABLE certificates 
ALTER COLUMN student_id DROP NOT NULL,
ALTER COLUMN degree DROP NOT NULL,
ALTER COLUMN university DROP NOT NULL,
ALTER COLUMN issue_date DROP NOT NULL;

-- Support per-university admin credentials used by the admin portal.
CREATE TABLE IF NOT EXISTS admin_users (
	id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
	email TEXT UNIQUE NOT NULL,
	university TEXT NOT NULL,
	password TEXT,
	wallet_address TEXT,
	role TEXT DEFAULT 'admin',
	is_active BOOLEAN DEFAULT TRUE,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE admin_users
ADD COLUMN IF NOT EXISTS password TEXT;

-- Create index on certificate_hash for faster lookups
CREATE INDEX IF NOT EXISTS idx_certificates_hash ON certificates(certificate_hash);
CREATE INDEX IF NOT EXISTS idx_certificates_student_email ON certificates(student_email);

-- Credit transfer module tables
CREATE TABLE IF NOT EXISTS universities (
	id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
	name TEXT UNIQUE NOT NULL,
	country TEXT NOT NULL,
	annual_load_units NUMERIC(10,2) NOT NULL CHECK (annual_load_units > 0),
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS equivalencies (
	id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
	source_course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
	target_course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
	match_confidence_score NUMERIC(5,2) NOT NULL CHECK (match_confidence_score >= 0 AND match_confidence_score <= 100),
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
	UNIQUE (source_course_id, target_course_id)
);

CREATE INDEX IF NOT EXISTS idx_universities_name ON universities(name);
CREATE INDEX IF NOT EXISTS idx_courses_uni_id ON courses(uni_id);
CREATE INDEX IF NOT EXISTS idx_courses_course_code ON courses(course_code);
CREATE INDEX IF NOT EXISTS idx_equivalencies_source ON equivalencies(source_course_id);
CREATE INDEX IF NOT EXISTS idx_equivalencies_target ON equivalencies(target_course_id);

ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE equivalencies ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_policies
		WHERE tablename = 'universities' AND policyname = 'Universities are viewable by everyone'
	) THEN
		CREATE POLICY "Universities are viewable by everyone" ON universities
			FOR SELECT USING (TRUE);
	END IF;
END $$;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_policies
		WHERE tablename = 'courses' AND policyname = 'Courses are viewable by everyone'
	) THEN
		CREATE POLICY "Courses are viewable by everyone" ON courses
			FOR SELECT USING (TRUE);
	END IF;
END $$;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_policies
		WHERE tablename = 'equivalencies' AND policyname = 'Equivalencies are viewable by everyone'
	) THEN
		CREATE POLICY "Equivalencies are viewable by everyone" ON equivalencies
			FOR SELECT USING (TRUE);
	END IF;
END $$;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_policies
		WHERE tablename = 'universities' AND policyname = 'Universities can be managed by authenticated users'
	) THEN
		CREATE POLICY "Universities can be managed by authenticated users" ON universities
			FOR ALL USING (auth.role() = 'authenticated');
	END IF;
END $$;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_policies
		WHERE tablename = 'courses' AND policyname = 'Courses can be managed by authenticated users'
	) THEN
		CREATE POLICY "Courses can be managed by authenticated users" ON courses
			FOR ALL USING (auth.role() = 'authenticated');
	END IF;
END $$;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_policies
		WHERE tablename = 'equivalencies' AND policyname = 'Equivalencies can be managed by authenticated users'
	) THEN
		CREATE POLICY "Equivalencies can be managed by authenticated users" ON equivalencies
			FOR ALL USING (auth.role() = 'authenticated');
	END IF;
END $$;

GRANT ALL ON universities TO anon, authenticated;
GRANT ALL ON courses TO anon, authenticated;
GRANT ALL ON equivalencies TO anon, authenticated;

-- Seed data request: BRAC -> Adelaide
INSERT INTO universities (name, country, annual_load_units)
VALUES
	('BRAC University', 'Bangladesh', 36),
	('University of Adelaide', 'Australia', 24)
ON CONFLICT (name) DO UPDATE SET
	country = EXCLUDED.country,
	annual_load_units = EXCLUDED.annual_load_units;

INSERT INTO courses (uni_id, course_code, title, credits, syllabus_text)
SELECT u.id, v.course_code, v.title, v.credits, v.syllabus_text
FROM universities u
JOIN (
	VALUES
		('BRAC University', 'CSE110', 'Programming I', 3, 'Intro to programming, variables, loops, functions, arrays.'),
		('BRAC University', 'CSE220', 'Data Structures', 3, 'Stacks, queues, linked lists, trees, hashing, recursion.'),
		('BRAC University', 'CSE221', 'Algorithms', 3, 'Sorting, searching, graph algorithms, complexity analysis.'),
		('University of Adelaide', 'COMP1002', 'Problem Solving', 3, 'Problem decomposition, programming fundamentals, recursion, data representation.'),
		('University of Adelaide', 'COMP2017', 'Data Structures & Alg', 3, 'Linked lists, trees, hash maps, recursion, algorithms and complexity.')
) AS v(university_name, course_code, title, credits, syllabus_text)
	ON u.name = v.university_name
ON CONFLICT (uni_id, course_code) DO UPDATE SET
	title = EXCLUDED.title,
	credits = EXCLUDED.credits,
	syllabus_text = EXCLUDED.syllabus_text;

INSERT INTO equivalencies (source_course_id, target_course_id, match_confidence_score)
SELECT sc.id, tc.id, v.score
FROM (
	VALUES
		('CSE110', 'COMP1002', 89),
		('CSE220', 'COMP2017', 93),
		('CSE221', 'COMP2017', 86)
) AS v(source_code, target_code, score)
JOIN courses sc ON sc.course_code = v.source_code
JOIN courses tc ON tc.course_code = v.target_code
JOIN universities su ON su.id = sc.uni_id AND su.name = 'BRAC University'
JOIN universities tu ON tu.id = tc.uni_id AND tu.name = 'University of Adelaide'
ON CONFLICT (source_course_id, target_course_id) DO UPDATE SET
	match_confidence_score = EXCLUDED.match_confidence_score;

INSERT INTO admin_users (email, university, password, role, is_active)
VALUES
	('admin@bracu.ac.bd', 'BRAC University', 'brac123', 'admin', TRUE),
	('admin@adelaide.edu.au', 'University of Adelaide', 'adelaide123', 'admin', TRUE)
ON CONFLICT (email) DO UPDATE SET
	university = EXCLUDED.university,
	password = EXCLUDED.password,
	role = EXCLUDED.role,
	is_active = EXCLUDED.is_active;
