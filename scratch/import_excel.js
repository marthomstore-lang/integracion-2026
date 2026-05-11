const XLSX = require('xlsx');
const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const filePath = 'C:\\Users\\david\\Downloads\\nomina_excel (9).xls.xlsx';
const DB_PATH = path.join(process.cwd(), 'students.db');
const NEE_DB_PATH = path.join(process.cwd(), 'nee_data.db');

const db = new Database(DB_PATH);
const neeDb = new Database(NEE_DB_PATH);

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`Processing ${data.length} rows...`);

    const insertStudent = db.prepare(`
      INSERT OR REPLACE INTO students (id, run, full_name, curso, status_informe)
      VALUES (?, ?, ?, ?, ?)
    `);

    let importedCount = 0;

    const studentTx = db.transaction((rows) => {
      for (const row of rows) {
        let studentRun = row['RUT Estudiante'] || row['RUN'] || row['Run'];
        if (studentRun && row['Dígito Ver.'] !== undefined) {
          studentRun = `${studentRun}-${row['Dígito Ver.']}`;
        }
        
        let fullName = row['Nombre Completo'] || row['Nombre'];
        if (!fullName && row['Nombres']) {
          fullName = `${row['Apellido Paterno'] || ''} ${row['Apellido Materno'] || ''}, ${row['Nombres']}`.trim();
        }

        const studentId = row['ID'] || uuidv4();
        
        let curso = row['Curso'];
        if (!curso && row['Desc Grado']) {
          curso = `${row['Desc Grado']} ${row['Letra Curso'] || ''}`.trim();
        }

        const statusInforme = row['Estado Informe'] || 'PENDIENTE';

        if (!studentRun || !fullName) continue;

        insertStudent.run(studentId, studentRun, fullName, curso, statusInforme);
        importedCount++;
      }
    });

    studentTx(data);

    console.log(`Successfully imported ${importedCount} students.`);

} catch (error) {
    console.error('Error:', error);
}
