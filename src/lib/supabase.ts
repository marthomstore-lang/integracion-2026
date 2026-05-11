import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mnsgztcxlixwkeavzxwt.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_oOYGIGjoeMG63m8itf6g3w_SdLgZEVS';

export const supabase = createClient(supabaseUrl, supabaseKey);
