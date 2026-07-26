const xlsx = require('xlsx');
const fs = require('fs');

try {
    const workbook = xlsx.readFile('C:\\tugas\\New folder\\LAPBUL POLDA POLRES  DAN POLSEK JAJARAN POLDA SULUT.xlsx');
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    fs.writeFileSync('out2.json', JSON.stringify(data.slice(0, 100), null, 2), 'utf-8');
} catch (e) {
    console.error(e);
}
