import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";

let _itemMap: Map<number, string> | null = null;
let _itemMapText: string | null = null;

function loadItemMap() {
  if (_itemMap) return;

  const filePath = path.join(process.cwd(), "data-set.xlsx");
  const buf = fs.readFileSync(filePath);
  const workbook = XLSX.read(buf);
  const sheet = workbook.Sheets["CSG 2025 Employee Survey"];
  const rows = XLSX.utils.sheet_to_json<{
    "Item Number": number;
    "Item ID": number;
    "Item Text": string;
  }>(sheet);

  _itemMap = new Map();
  for (const row of rows) {
    _itemMap.set(row["Item ID"], row["Item Text"]);
  }

  const lines: string[] = [];
  for (const [id, text] of _itemMap.entries()) {
    const colName =
      id === 61
        ? "item_61 (open-ended text)"
        : id === 62
          ? "item_62 (open-ended text)"
          : `item_${id}`;
    lines.push(`- ${colName}: "${text}"`);
  }
  _itemMapText = lines.join("\n");
}

export function getItemMap(): Map<number, string> {
  loadItemMap();
  return _itemMap!;
}

export function getItemMapText(): string {
  loadItemMap();
  return _itemMapText!;
}
