export type Role = "user" | "assistant";

export interface VisualizationSpec {
  type: "bar" | "pie" | "line" | "table";
  title: string;
  data: Record<string, string | number>[];
  xKey?: string;
  yKey?: string;
  yKeys?: string[];
  nameKey?: string;
  valueKey?: string;
  columns?: string[];
}

export interface Message {
  role: Role;
  content: string;
  visualization?: VisualizationSpec;
  sql?: string;
  timestamp: number;
}

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
}

export interface QueryError {
  error: string;
}

export interface ChatRequest {
  message: string;
  history: Message[];
}

export interface ChatResponse {
  answer: string;
  visualization?: VisualizationSpec;
  sql?: string;
}
