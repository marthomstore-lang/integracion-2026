import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    const user = db.prepare('SELECT id, username, full_name, role FROM users WHERE username = ? AND password = ?')
      .get(username, password) as any;

    if (!user) {
      return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 });
    }

    const response = NextResponse.json({ 
      success: true, 
      user 
    });

    // In a real app, use a proper session/JWT
    // For this local prototype, we'll set a simple cookie
    response.cookies.set('user_role', user.role, { path: '/' });
    response.cookies.set('user_name', user.full_name, { path: '/' });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
