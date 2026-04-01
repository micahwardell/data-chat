import Database from "better-sqlite3";
import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";
import { COLUMN_MAP, SCHEMA_DDL } from "./schema";
import type { QueryResult, QueryError } from "./types";

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  const db = new Database(":memory:");
  db.pragma("journal_mode = WAL");

  // Create table
  db.exec(SCHEMA_DDL);

  // Load data from xlsx
  const filePath = path.join(process.cwd(), "data-set.xlsx");
  const buf = fs.readFileSync(filePath);
  const workbook = XLSX.read(buf);
  const sheet = workbook.Sheets["Data"];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  const rawHeaders = Object.keys(COLUMN_MAP);
  const sanitizedHeaders = Object.values(COLUMN_MAP);

  const placeholders = sanitizedHeaders.map(() => "?").join(", ");
  const insertSQL = `INSERT INTO survey_responses (${sanitizedHeaders.join(", ")}) VALUES (${placeholders})`;
  const insert = db.prepare(insertSQL);

  const insertMany = db.transaction((data: Record<string, unknown>[]) => {
    for (const row of data) {
      const values = rawHeaders.map((h) => {
        const val = row[h];
        if (val === undefined || val === null) return null;
        return val;
      });
      insert.run(...values);
    }
  });

  insertMany(rows);

  // Make read-only
  db.pragma("query_only = ON");

  _db = db;
  return db;
}

const FORBIDDEN_KEYWORDS = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|ATTACH|DETACH)\b/i;

export function executeQuery(sql: string): QueryResult | QueryError {
  if (FORBIDDEN_KEYWORDS.test(sql)) {
    return { error: "Query contains forbidden keywords. Only SELECT queries are allowed." };
  }

  try {
    const db = getDb();
    const stmt = db.prepare(sql);
    const rows = stmt.all() as Record<string, unknown>[];
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    return {
      columns,
      rows,
      rowCount: rows.length,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: message };
  }
}
