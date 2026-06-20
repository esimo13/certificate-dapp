// Simple script to add missing database columns
import { createClient } from '@supabase/supabase-js';

// Use the same credentials as in your .env.local
const supabaseUrl = 'https://whlcmmyrgiehegvsgnuc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndobeNtbXlyZ2llaGVndnNnbnVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjE3NzI3MSwiZXhwIjoyMDUxNzUzMjcxfQ.pVrUbXM-LMEgZsLpXG0LpJI2-f2Qy4SXgQJZjgCqnTQ';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function addMissingColumns() {
  try {
    console.log('Adding missing columns to certificates table...');
    
    const { error } = await supabase.rpc('exec_sql', {
      query: `
        ALTER TABLE certificates 
        ADD COLUMN IF NOT EXISTS student_email TEXT,
        ADD COLUMN IF NOT EXISTS course_name TEXT,
        ADD COLUMN IF NOT EXISTS course_code TEXT,
        ADD COLUMN IF NOT EXISTS completion_date TEXT,
        ADD COLUMN IF NOT EXISTS grade TEXT,
        ADD COLUMN IF NOT EXISTS degree_type TEXT DEFAULT 'Certificate';
      `
    });

    if (error) {
      console.error('Error adding columns:', error);
      console.log('\nPlease add the columns manually in Supabase SQL Editor:');
      console.log(`
ALTER TABLE certificates 
ADD COLUMN IF NOT EXISTS student_email TEXT,
ADD COLUMN IF NOT EXISTS course_name TEXT,
ADD COLUMN IF NOT EXISTS course_code TEXT,
ADD COLUMN IF NOT EXISTS completion_date TEXT,
ADD COLUMN IF NOT EXISTS grade TEXT,
ADD COLUMN IF NOT EXISTS degree_type TEXT DEFAULT 'Certificate';
      `);
    } else {
      console.log('✅ Columns added successfully!');
    }
  } catch (err) {
    console.error('Script failed:', err);
    console.log('\nPlease add the columns manually in Supabase SQL Editor.');
  }
}

addMissingColumns();
