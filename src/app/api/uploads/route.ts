import { NextRequest, NextResponse } from 'next/server';
import { neeDb } from '@/lib/db';
import { writeFile } from 'fs/promises';
import path from 'path';
import fs from 'fs';


export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const run = formData.get('run') as string;
    const description = formData.get('description') as string;
    const createdBy = formData.get('createdBy') as string;

    if (!file || !run) {
      return NextResponse.json({ error: 'Missing file or student RUN' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
    
    await writeFile(filePath, buffer);

    // Drive Sync Attempt
    try {
      const { uploadFileToDrive } = await import('@/lib/googleDrive');
      await uploadFileToDrive(file.name, file.type, fs.createReadStream(filePath));
    } catch (e) {
      console.log('Sync to Drive skipped or failed. Continuing locally.');
    }

    const result = neeDb.prepare(`
      INSERT INTO student_documents (student_run, name, description, created_by, file_path)
      VALUES (?, ?, ?, ?, ?)
    `).run(run, file.name, description || '', createdBy || 'Docente', `/uploads/${filename}`);

    return NextResponse.json({ success: true, id: result.lastInsertRowid });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const run = searchParams.get('run');

  if (!run) return NextResponse.json({ error: 'Missing RUN' }, { status: 400 });

  const docs = neeDb.prepare('SELECT * FROM student_documents WHERE student_run = ? ORDER BY created_at DESC').all(run);
  return NextResponse.json({ success: true, data: docs });
}
