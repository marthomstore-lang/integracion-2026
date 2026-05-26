import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mnsgztcxlixwkeavzxwt.supabase.co';

// En el servidor (Next.js API routes), preferimos usar la clave service_role (SUPABASE_SERVICE_ROLE_KEY)
// para evadir RLS y tener acceso total de lectura/escritura. En el cliente, usamos la clave anon pública.
const isServer = typeof window === 'undefined';
const supabaseKey = (isServer ? (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) : null)
  || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
  || 'sb_publishable_oOYGIGjoeMG63m8itf6g3w_SdLgZEVS';

export const supabase = createClient(supabaseUrl, supabaseKey);
