const XLSX = require('xlsx');

/**
 * Parse an Excel answer key file.
 * Expected columns: "Question Number" (or "Số câu") and "Correct Answer" (or "Đáp án")
 * Returns: { answers: Map<number, string>, errors: string[] }
 */
function parseAnswerKey(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (rows.length === 0) {
    return { answers: new Map(), errors: ['File Excel không có dữ liệu.'] };
  }

  const errors = [];
  const answers = new Map();

  // Detect column names (flexible matching)
  const firstRow = rows[0];
  const keys = Object.keys(firstRow);

  const qNumCol = keys.find((k) =>
    /question.?number|số.?câu|câu.?số|câu/i.test(k)
  );
  const ansCol = keys.find((k) =>
    /correct.?answer|đáp.?án|answer/i.test(k)
  );

  if (!qNumCol) {
    return { answers, errors: ['Không tìm thấy cột "Question Number" hoặc "Số câu" trong file Excel.'] };
  }
  if (!ansCol) {
    return { answers, errors: ['Không tìm thấy cột "Correct Answer" hoặc "Đáp án" trong file Excel.'] };
  }

  rows.forEach((row, index) => {
    const rowNum = index + 2; // Excel row number (1-indexed + header)
    const qNum = parseInt(row[qNumCol], 10);
    const ans = String(row[ansCol] || '').trim().toUpperCase();

    if (isNaN(qNum) || qNum <= 0) {
      errors.push(`Hàng ${rowNum}: Số câu "${row[qNumCol]}" không hợp lệ.`);
      return;
    }

    if (!['A', 'B', 'C', 'D'].includes(ans)) {
      errors.push(`Hàng ${rowNum}: Đáp án "${row[ansCol]}" không hợp lệ (phải là A, B, C, hoặc D).`);
      return;
    }

    if (answers.has(qNum)) {
      errors.push(`Hàng ${rowNum}: Câu ${qNum} bị trùng lặp.`);
      return;
    }

    answers.set(qNum, ans);
  });

  return { answers, errors };
}

module.exports = { parseAnswerKey };
