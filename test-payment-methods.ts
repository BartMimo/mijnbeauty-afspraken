import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPaymentMethods() {
  try {
    // Try to update a salon with payment_methods to see if the column exists
    const { data, error } = await supabase
      .from('salons')
      .update({ payment_methods: { cash: true, online: false } })
      .eq('id', '00000000-0000-0000-0000-000000000000') // Non-existent ID to avoid actual update
      .select();

    if (error && error.code === '42703') {
      console.log('Column does not exist, need to add it');
      return false;
    }

    console.log('Column exists or update succeeded');
    return true;
  } catch (err) {
    console.error('Error testing payment_methods:', err);
    return false;
  }
}

testPaymentMethods();