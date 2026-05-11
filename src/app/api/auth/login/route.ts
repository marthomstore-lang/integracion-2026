import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, full_name, role')
      .eq('username', username)
      .eq('password', password)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 });
    }

    const response = NextResponse.json({ 
      success: true, 
      user 
    });

    // Set cookies for the session
    response.cookies.set('user_role', user.role, { path: '/' });
    response.cookies.set('user_name', user.full_name, { path: '/' });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

