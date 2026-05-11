const XLSX = require('xlsx');
const path = require('path');

const filePath = 'C:\\Users\\david\\Downloads\\nomina_excel (9).xls.xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // Read as array of arrays
    
    console.log('--- HEADERS (ROW 0) ---');
    console.log(JSON.stringify(data[0], null, 2));
    console.log('--- FIRST DATA ROW (ROW 1) ---');
    console.log(JSON.stringify(data[1], null, 2));

} catch (error) {
    console.error('Error reading file:', error.message);
}
