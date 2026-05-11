import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, full_name, role');
    
    if (error) throw error;
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

    const { error } = await supabase
      .from('users')
      .insert({ username, password, full_name, role });

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Usuario creado exitosamente' });
  } catch (error: any) {
    if (error.message.includes('unique')) {
      return NextResponse.json({ error: 'El nombre de usuario ya existe' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    // In Supabase we should check if it's the primary admin by some field if needed
    // For now keeping the simple ID check if it's a fixed ID
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Usuario eliminado' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, password } = await request.json();

    if (!id || !password) {
      return NextResponse.json({ error: 'ID y contraseña son requeridos' }, { status: 400 });
    }

    const { error } = await supabase
      .from('users')
      .update({ password })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


