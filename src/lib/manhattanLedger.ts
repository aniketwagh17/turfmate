import * as XLSX from "xlsx-js-style";

type LedgerExpense = { id: string; name: string; amount: number };
type LedgerSession = {
  id: string; date: string; venue: string; participants: string[];
  attendance: Record<string, number>; total: number; mode: "equal" | "fund";
  contribution: number; ledgerTurfCharge?: number;
  ledgerOtherExpenses?: LedgerExpense[]; ledgerCompleted?: boolean;
};
type LedgerPlayer = { id: string; name: string };
type LedgerPayment = { sessionId: string; playerId: string; amount: number };
type ExportArgs = {
  templateBase64: string; sessions: LedgerSession[]; players: LedgerPlayer[];
  payments: LedgerPayment[]; openingBalance: number;
};

const START_DATE = "2026-11-01";
const SUMMARY_NAME = "Turf summary";
const moneyNumber = (value: number) => Math.round((Number(value) || 0) * 100) / 100;

function readTemplate(base64: string) {
  const workbook = XLSX.read(base64, { type: "base64", cellStyles: true, cellDates: true });
  const sheetName = workbook.SheetNames.find((name: string) => name.trim().toLowerCase() === SUMMARY_NAME);
  if (!sheetName) throw new Error('The selected workbook does not contain a "Turf summary" sheet.');
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: null }) as unknown[][];
  const headerIndex = rows.findIndex(row =>
    String(row[1] ?? "").trim().toLowerCase() === "date" &&
    String(row[2] ?? "").trim().toLowerCase() === "opening balance"
  );
  if (headerIndex < 0) throw new Error('Could not find the expected Date / Opening balance headings in "Turf summary".');
  return { workbook, sheetName, sheet, rows, headerIndex };
}

export function validateManhattanLedgerTemplate(base64: string) {
  if (!base64) throw new Error("Please select the original Excel workbook.");
  readTemplate(base64);
}

const thinBorder = {
  top: { style: "thin", color: { rgb: "DCE7E1" } },
  bottom: { style: "thin", color: { rgb: "DCE7E1" } },
  left: { style: "thin", color: { rgb: "DCE7E1" } },
  right: { style: "thin", color: { rgb: "DCE7E1" } },
};
const bodyStyle = (alternate: boolean) => ({
  font: { name: "Aptos", sz: 10, color: { rgb: "263B32" } },
  fill: { patternType: "solid", fgColor: { rgb: alternate ? "F3F8F5" : "FFFFFF" } },
  alignment: { vertical: "center", horizontal: "center" },
  border: thinBorder,
});
const balanceStyle = {
  font: { name: "Aptos", sz: 10, bold: true, color: { rgb: "176B49" } },
  fill: { patternType: "solid", fgColor: { rgb: "E6F4EA" } },
  alignment: { vertical: "center", horizontal: "center" },
  border: thinBorder,
};
const sectionStyle = {
  font: { name: "Aptos Display", sz: 11, bold: true, color: { rgb: "FFFFFF" } },
  fill: { patternType: "solid", fgColor: { rgb: "173D32" } },
  alignment: { vertical: "center", horizontal: "center" },
  border: thinBorder,
};

function styleCell(sheet: any, address: string, style: any) {
  if (sheet[address]) sheet[address].s = style;
}

function makeSessionSheet(
  session: LedgerSession, players: LedgerPlayer[], payments: LedgerPayment[],
  turf: number, otherTotal: number, totalExpense: number, opening: number,
  collections: number, closing: number
) {
  const headCount = session.participants.reduce((sum, id) => sum + (session.attendance?.[id] || 1), 0);
  const aoa: unknown[][] = [
    [`TurfMate Session · ${session.venue}`, null, null, null, null],
    [`Date: ${session.date}`, null, null, null, null],
    ["Players", "Contribution", "Received", "Balance", "Attendance"],
  ];
  for (const playerId of session.participants) {
    const attendance = session.attendance?.[playerId] || 1;
    const due = session.mode === "fund"
      ? attendance * session.contribution
      : headCount ? (totalExpense / headCount) * attendance : 0;
    const received = moneyNumber(payments.filter(payment => payment.sessionId === session.id && payment.playerId === playerId)
      .reduce((sum, payment) => sum + moneyNumber(payment.amount), 0));
    aoa.push([players.find(player => player.id === playerId)?.name || "Player", moneyNumber(due), received, moneyNumber(due - received), attendance]);
  }
  aoa.push([]);
  aoa.push(["Expense details", null, null, null, null]);
  aoa.push(["Expense", "Amount (₹)", null, null, null]);
  aoa.push(["Turf", turf, null, null, null]);
  for (const expense of (session.ledgerOtherExpenses || []).filter(item => item.name.trim() || item.amount > 0)) {
    aoa.push([expense.name.trim() || "Other expense", moneyNumber(expense.amount), null, null, null]);
  }
  aoa.push(["Total expense", totalExpense, null, null, null]);
  aoa.push(["Collections", collections, null, null, null]);
  aoa.push(["Opening balance", opening, null, null, null]);
  aoa.push(["Closing balance", closing, null, null, null]);

  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  sheet["!cols"] = [{ wch: 25 }, { wch: 18 }, { wch: 17 }, { wch: 17 }, { wch: 13 }];
  sheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }];
  sheet["!rows"] = [{ hpt: 27 }, { hpt: 21 }, { hpt: 24 }];
  for (let c = 0; c < 5; c++) {
    styleCell(sheet, XLSX.utils.encode_cell({ r: 0, c }), sectionStyle);
    styleCell(sheet, XLSX.utils.encode_cell({ r: 2, c }), sectionStyle);
  }
  for (let r = 3; r < 3 + session.participants.length; r++) {
    for (let c = 0; c < 5; c++) styleCell(sheet, XLSX.utils.encode_cell({ r, c }), bodyStyle((r - 3) % 2 === 1));
  }
  const expenseTitleRow = 4 + session.participants.length;
  for (let c = 0; c < 5; c++) {
    styleCell(sheet, XLSX.utils.encode_cell({ r: expenseTitleRow, c }), sectionStyle);
    styleCell(sheet, XLSX.utils.encode_cell({ r: expenseTitleRow + 1, c }), {
      ...bodyStyle(false), font: { name: "Aptos", sz: 10, bold: true, color: { rgb: "29473A" } },
      fill: { patternType: "solid", fgColor: { rgb: "E8F2EC" } },
    });
  }
  for (let r = expenseTitleRow + 2; r <= aoa.length - 1; r++) {
    for (let c = 0; c < 5; c++) styleCell(sheet, XLSX.utils.encode_cell({ r, c }), bodyStyle(r % 2 === 0));
  }
  for (const address of Object.keys(sheet)) {
    if (address.startsWith("!")) continue;
    const cell = sheet[address];
    if (typeof cell.v === "number") cell.z = '"₹"#,##0.00;[Red]-"₹"#,##0.00';
  }
  return sheet;
}

export function downloadManhattanLedger({ templateBase64, sessions, players, payments, openingBalance }: ExportArgs) {
  const { workbook, sheet, rows, headerIndex } = readTemplate(templateBase64);
  const included = sessions.filter(session => session.ledgerCompleted && session.date >= START_DATE)
    .slice().sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  if (!included.length) {
    throw new Error("Complete at least one session dated 1 November 2026 or later before exporting the ledger.");
  }

  // Retain the uploaded historical workbook and every historical sheet. The summary
  // continues in the same B:I columns; column J (Balance with Aniket) is excluded.
  const range = XLSX.utils.decode_range(sheet["!ref"] || "B1:J1");
  for (let r = 0; r <= range.e.r; r++) delete sheet[XLSX.utils.encode_cell({ r, c: 9 })];
  if (Array.isArray(sheet["!cols"])) sheet["!cols"] = sheet["!cols"].slice(0, 9);
  sheet["!ref"] = XLSX.utils.encode_range({ s: { r: range.s.r, c: 1 }, e: { r: range.e.r, c: 8 } });

  let lastHistoricalRow = headerIndex + 1;
  for (let r = headerIndex + 1; r < rows.length; r++) {
    const value = rows[r]?.[1];
    if (value instanceof Date || typeof value === "number" || (typeof value === "string" && value.trim())) lastHistoricalRow = r;
  }
  const dividerRow = lastHistoricalRow + 1;
  const firstNewRow = dividerRow + 1;
  const mergeList = (sheet["!merges"] || []).filter((merge: any) => !(merge.s.r === dividerRow && merge.s.c === 1));
  mergeList.push({ s: { r: dividerRow, c: 1 }, e: { r: dividerRow, c: 8 } });
  sheet["!merges"] = mergeList;
  XLSX.utils.sheet_add_aoa(sheet, [["TurfMate records start here · From 1 November 2026"]], { origin: { r: dividerRow, c: 1 } });
  const dividerAddress = XLSX.utils.encode_cell({ r: dividerRow, c: 1 });
  sheet[dividerAddress].s = sectionStyle;
  for (let c = 2; c <= 8; c++) {
    const address = XLSX.utils.encode_cell({ r: dividerRow, c });
    sheet[address] = { t: "s", v: "", s: sectionStyle };
  }
  sheet["!rows"] = sheet["!rows"] || [];
  sheet["!rows"][dividerRow] = { hpt: 25 };

  let runningBalance = moneyNumber(openingBalance);
  included.forEach((session, index) => {
    const rowIndex = firstNewRow + index;
    const excelRow = rowIndex + 1;
    const turf = moneyNumber(session.ledgerTurfCharge ?? session.total);
    const otherExpenses = (session.ledgerOtherExpenses || []).filter(item => item.name.trim() || item.amount > 0);
    const otherTotal = moneyNumber(otherExpenses.reduce((sum, item) => sum + moneyNumber(item.amount), 0));
    const totalExpense = moneyNumber(turf + otherTotal);
    const collections = moneyNumber(payments.filter(payment => payment.sessionId === session.id)
      .reduce((sum, payment) => sum + moneyNumber(payment.amount), 0));
    const closing = moneyNumber(runningBalance + collections - totalExpense);
    const values = [new Date(session.date + "T00:00:00"), runningBalance, session.participants.length, turf, otherTotal, totalExpense, collections, closing];
    XLSX.utils.sheet_add_aoa(sheet, [values], { origin: { r: rowIndex, c: 1 } });
    const totalCell = sheet[XLSX.utils.encode_cell({ r: rowIndex, c: 6 })];
    totalCell.f = `SUM(E${excelRow}:F${excelRow})`;
    totalCell.v = totalExpense;
    const closingCell = sheet[XLSX.utils.encode_cell({ r: rowIndex, c: 8 })];
    closingCell.f = `C${excelRow}+H${excelRow}-G${excelRow}`;
    closingCell.v = closing;
    for (let c = 1; c <= 8; c++) {
      const address = XLSX.utils.encode_cell({ r: rowIndex, c });
      const isClosing = c === 8;
      styleCell(sheet, address, isClosing ? balanceStyle : bodyStyle(index % 2 === 1));
      if (sheet[address] && c === 1) sheet[address].z = "dd-mmm-yyyy";
      if (sheet[address] && c >= 2) sheet[address].z = c === 3 ? "0" : '"₹"#,##0.00;[Red]-"₹"#,##0.00';
    }
    sheet["!rows"][rowIndex] = { hpt: 22 };

    const detailSheet = makeSessionSheet(session, players, payments, turf, otherTotal, totalExpense, runningBalance, collections, closing);
    let detailName = (session.date.replace(/-/g, "") + " " + session.venue).replace(/[:\\/?*\[\]]/g, " ").slice(0, 31);
    if (workbook.SheetNames.includes(detailName)) detailName = (detailName.slice(0, 25) + "-" + String(index + 1)).slice(0, 31);
    workbook.SheetNames.push(detailName);
    workbook.Sheets[detailName] = detailSheet;
    runningBalance = closing;
  });

  const lastRow = firstNewRow + included.length - 1;
  sheet["!ref"] = XLSX.utils.encode_range({ s: { r: range.s.r, c: 1 }, e: { r: lastRow, c: 8 } });
  sheet["!cols"] = [
    { wch: 3 }, { wch: 14 }, { wch: 18 }, { wch: 10 }, { wch: 15 },
    { wch: 15 }, { wch: 17 }, { wch: 15 }, { wch: 17 },
  ];
  const workbookProperties: any = workbook.Workbook || {};
  workbookProperties.CalcPr = { calcMode: "auto", fullCalcOnLoad: true, forceFullCalc: true };
  workbook.Workbook = workbookProperties;
  XLSX.writeFile(workbook, "Manhattan-Building-Turf-Ledger.xlsx", { bookType: "xlsx", cellStyles: true });
}
