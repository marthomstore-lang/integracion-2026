import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const users = db.prepare('SELECT id, username, full_name, role FROM users').all();
    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { username, password, full_name, role } = await request.json();

    if (!username || !password || !role) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const id = uuidv4();
    db.prepare('INSERT INTO users (id, username, password, full_name, role) VALUES (?, ?, ?, ?, ?)')
      .run(id, username, password, full_name, role);

    return NextResponse.json({ success: true, message: 'Usuario creado exitosamente' });
  } catch (error: any) {
    if (error.message.includes('UNIQUE')) {
      return NextResponse.json({ error: 'El nombre de usuario ya existe' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (id === '1') {
      return NextResponse.json({ error: 'No se puede eliminar el administrador principal' }, { status: 400 });
    }
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    return NextResponse.json({ success: true, message: 'Usuario eliminado' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
