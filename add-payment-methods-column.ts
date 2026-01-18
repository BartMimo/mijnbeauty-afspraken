import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addPaymentMethodsColumn() {
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.salons
        ADD COLUMN IF NOT EXISTS payment_methods jsonb DEFAULT '{"cash": true, "online": false}'::jsonb;
      `
    });

    if (error) {
      console.error('Error adding column:', error);
      return;
    }

    console.log('Payment methods column added successfully');
  } catch (err) {
    console.error('Failed to add payment_methods column:', err);
  }
}

addPaymentMethodsColumn();