// Script to delete all certificates from Supabase
import { createClient } from '@supabase/supabase-js';

// Use your Supabase credentials
const supabaseUrl = 'https://whlcmmyrgiehegvsgnuc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndobGNtbXlyZ2llaGVndnNnbnVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjE3NzI3MSwiZXhwIjoyMDUxNzUzMjcxfQ.pVrUbXM-LMEgZsLpXG0LpJI2-f2Qy4SXgQJZjgCqnTQ';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function deleteAllCertificates() {
  try {
    console.log('Fetching all certificates...');
    
    // First, let's see how many certificates exist
    const { data: certificates, error: fetchError } = await supabase
      .from('certificates')
      .select('id, certificate_hash, student_name');

    if (fetchError) {
      console.error('Error fetching certificates:', fetchError);
      return;
    }

    console.log(`Found ${certificates.length} certificates:`);
    certificates.forEach((cert, index) => {
      console.log(`${index + 1}. ${cert.student_name} - Hash: ${cert.certificate_hash.substring(0, 16)}...`);
    });

    if (certificates.length === 0) {
      console.log('No certificates to delete.');
      return;
    }

    console.log('\nDeleting all certificates...');
    
    // Delete all certificates
    const { error: deleteError } = await supabase
      .from('certificates')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // This condition will match all rows

    if (deleteError) {
      console.error('Error deleting certificates:', deleteError);
      return;
    }

    console.log('✅ All certificates deleted successfully!');
    
    // Verify deletion
    const { data: remaining } = await supabase
      .from('certificates')
      .select('id');
    
    console.log(`Remaining certificates: ${remaining.length}`);

  } catch (err) {
    console.error('Script failed:', err);
  }
}

deleteAllCertificates();
