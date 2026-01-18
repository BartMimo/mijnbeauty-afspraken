import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSalonPaymentMethods() {
  try {
    const { data, error } = await supabase
      .from('salons')
      .select('id, name, payment_methods')
      .limit(1);

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('Salon data:', data);
  } catch (err) {
    console.error('Failed to check salons:', err);
  }
}

checkSalonPaymentMethods();