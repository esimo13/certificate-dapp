// Test script to add missing columns to Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addColumns() {
  try {
    // Test if new columns exist by trying to insert with them
    console.log('Testing database schema...');
    
    // This will fail if columns don't exist, which is what we want to check
    const testData = {
      certificate_hash: 'test_hash_' + Date.now(),
      student_name: 'Test Student',
      student_email: 'test@example.com',
      course_name: 'Test Course',
      course_code: 'TEST101',
      completion_date: '2025-01-01',
      grade: 'A',
      degree_type: 'Certificate',
      university: 'Test University',
      ipfs_url: 'https://test.com',
      ipfs_hash: 'testhash',
      digital_signature: 'testsig',
      public_key: 'testkey',
      issuer_address: '0x1234567890123456789012345678901234567890'
    };

    const { data, error } = await supabase
      .from('certificates')
      .insert([testData])
      .select();

    if (error) {
      console.error('Error inserting test data:', error);
      console.log('This likely means we need to add the new columns manually in Supabase SQL Editor');
    } else {
      console.log('Success! Database schema is compatible');
      // Clean up test data
      await supabase
        .from('certificates')
        .delete()
        .eq('certificate_hash', testData.certificate_hash);
    }
  } catch (err) {
    console.error('Test failed:', err);
  }
}

addColumns();
