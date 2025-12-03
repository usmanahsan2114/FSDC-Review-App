const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../docs/Cards Contact DAS 25.xlsx');
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Array of arrays

console.log('Headers:', data[0]);
console.log('First Row:', data[1]);

fs.writeFileSync(path.join(__dirname, '../temp_excel_dump.json'), JSON.stringify(data.slice(0, 2), null, 2));
