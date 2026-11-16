type LedgerExpense = { id: string; name: string; amount: number };
type LedgerSession = {
  id: string;
  date: string;
  venue: string;
  participants: string[];
  attendance: Record<string, number>;
  total: number;
  mode: "equal" | "fund";
  contribution: number;
  ledgerTurfCharge?: number;
  ledgerOtherExpenses?: LedgerExpense[];
  ledgerCompleted?: boolean;
};
type LedgerPlayer = { id: string; name: string };
type LedgerPayment = { sessionId: string; playerId: string; amount: number };

type ExportArgs = {
  sessions: LedgerSession[];
  players: LedgerPlayer[];
  payments: LedgerPayment[];
  openingBalance: number;
};

const START_DATE = "2026-11-01";
const moneyNumber = (value: number) => Math.round((Number(value) || 0) * 100) / 100;
const xmlEscape = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

function cell(value: unknown, type: "String" | "Number" = "String") {
  return `<Cell><Data ss:Type="${type}">${xmlEscape(value)}</Data></Cell>`;
}

function row(values: Array<{ value: unknown; type?: "String" | "Number" }>) {
  return `<Row>${values.map(item => cell(item.value, item.type || "String")).join("")}</Row>`;
}

function worksheet(name: string, rows: string[]) {
  const safeName = name.replace(/[\\/?*\[\]:]/g, " ").slice(0, 31) || "Session";
  return `<Worksheet ss:Name="${xmlEscape(safeName)}"><Table>${rows.join("")}</Table></Worksheet>`;
}

export function downloadManhattanLedger({ sessions, players, payments, openingBalance }: ExportArgs) {
  const included = sessions
    .filter(session => session.ledgerCompleted && session.date >= START_DATE)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));

  const summaryRows = [
    row(["Date", "Opening balance", "Players", "Turf expense", "Other expenses", "Total Expense", "Collections", "Total balance"].map(value => ({ value }))),
  ];
  const sheets: string[] = [];
  let runningBalance = moneyNumber(openingBalance);

  for (const session of included) {
    const turf = moneyNumber(session.ledgerTurfCharge ?? session.total);
    const otherExpenses = (session.ledgerOtherExpenses || []).filter(item => item.name.trim() || item.amount > 0);
    const otherTotal = moneyNumber(otherExpenses.reduce((sum, item) => sum + moneyNumber(item.amount), 0));
    const totalExpense = moneyNumber(turf + otherTotal);
    const collections = moneyNumber(
      payments.filter(payment => payment.sessionId === session.id).reduce((sum, payment) => sum + moneyNumber(payment.amount), 0)
    );
    const closingBalance = moneyNumber(runningBalance + collections - totalExpense);
    summaryRows.push(row([
      { value: session.date },
      { value: runningBalance, type: "Number" },
      { value: session.participants.length, type: "Number" },
      { value: turf, type: "Number" },
      { value: otherTotal, type: "Number" },
      { value: totalExpense, type: "Number" },
      { value: collections, type: "Number" },
      { value: closingBalance, type: "Number" },
    ]));

    const detailRows = [
      row([{ value: session.venue }, { value: session.date }]),
      row([{ value: "Player" }, { value: "Attendance" }, { value: "Contribution due (₹)" }, { value: "Amount received (₹)" }, { value: "Balance (₹)" }]),
    ];
    const headCount = session.participants.reduce((sum, id) => sum + (session.attendance?.[id] || 1), 0);
    for (const playerId of session.participants) {
      const player = players.find(item => item.id === playerId);
      const attendance = session.attendance?.[playerId] || 1;
      const due = session.mode === "fund"
        ? attendance * session.contribution
        : headCount > 0 ? (totalExpense / headCount) * attendance : 0;
      const received = moneyNumber(
        payments.filter(payment => payment.sessionId === session.id && payment.playerId === playerId)
          .reduce((sum, payment) => sum + moneyNumber(payment.amount), 0)
      );
      detailRows.push(row([
        { value: player?.name || "Player" },
        { value: attendance, type: "Number" },
        { value: moneyNumber(due), type: "Number" },
        { value: received, type: "Number" },
        { value: moneyNumber(due - received), type: "Number" },
      ]));
    }
    detailRows.push(row([{ value: "Expense breakdown" }]));
    detailRows.push(row([{ value: "Expense" }, { value: "Amount (₹)" }]));
    detailRows.push(row([{ value: "Turf charges" }, { value: turf, type: "Number" }]));
    for (const expense of otherExpenses) {
      detailRows.push(row([{ value: expense.name || "Other expense" }, { value: moneyNumber(expense.amount), type: "Number" }]));
    }
    detailRows.push(row([{ value: "Total expense" }, { value: totalExpense, type: "Number" }]));
    detailRows.push(row([{ value: "Total collections" }, { value: collections, type: "Number" }]));
    detailRows.push(row([{ value: "Opening balance" }, { value: runningBalance, type: "Number" }]));
    detailRows.push(row([{ value: "Closing balance" }, { value: closingBalance, type: "Number" }]));
    const sheetName = `${session.date} ${session.venue}`.replace(/[:\\/?*\[\]]/g, " ").slice(0, 31);
    sheets.push(worksheet(sheetName, detailRows));
    runningBalance = closingBalance;
  }

  const workbook = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:html="http://www.w3.org/TR/REC-html40">
${worksheet("Turf Summary", summaryRows)}
${sheets.join("\n")}
</Workbook>`;
  const blob = new Blob([workbook], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "Manhattan-Building-Turf-Ledger.xls";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
