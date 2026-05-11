
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mnsgztcxlixwkeavzxwt.supabase.co';
const supabaseKey = 'sb_publishable_oOYGIGjoeMG63m8itf6g3w_SdLgZEVS';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  const { data, error } = await supabase.from('users').select('*');
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Users found:', JSON.stringify(data, null, 2));
  }
}

checkUsers();
