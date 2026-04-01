import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import { SCHEMA_DESCRIPTION } from "./schema";
import { getItemMapText } from "./item-map";
import type { Message, QueryResult, VisualizationSpec } from "./types";

const client = new Anthropic();

let _context: string | null = null;

function getContext(): string {
  try {
    return fs.readFileSync(
      path.join(process.cwd(), "context.md"),
      "utf-8"
    );
  } catch {
    return "";
  }
}

// Reset cached context (call if context.md changes)
export function resetContext() {
  _context = null;
}

function buildSQLSystemPrompt(): string {
  const context = getContext();
  const itemMapText = getItemMapText();

  return `You are a SQL analyst for an employee engagement survey database. Your job is to convert natural language questions into SQLite SELECT queries.

## Database Schema
${SCHEMA_DESCRIPTION}

## Survey Item Mapping
These are the survey questions corresponding to each item column:
${itemMapText}

${context ? `## Additional Context\n${context}\n` : ""}
## Rules
- Generate a single SQLite SELECT query against the \`survey_responses\` table
- Only use columns that exist in the schema above
- ALWAYS filter by \`survey_status = 'complete'\` unless the user explicitly asks about incomplete/all responses
- For averages, use ROUND(..., 2)
- For percentages, calculate as ROUND(COUNT(*) * 100.0 / total, 1)
- When users ask about a survey topic (e.g., "training", "safety"), find the matching item using the survey item mapping above
- For open-ended questions (item_61, item_62), return the text responses — do not try to average them
- Limit results to 100 rows max unless the user asks for more
- Use meaningful column aliases (e.g., AS avg_score, AS department)
- IMPORTANT: Keep queries concise. Each survey item is a separate column (item_1 through item_60). To compare across items, use multiple CASE/WHEN expressions with hardcoded item names rather than massive UNION ALL statements. For example, to get scores for all items, generate one row per item using: SELECT 'Item 1' AS item, ROUND(AVG(item_1), 2) AS score ... UNION ALL SELECT 'Item 2', ROUND(AVG(item_2), 2) ... — but limit to at most 10-15 items. If the user asks about all items, pick the top/bottom ones or ask them to narrow down.
- CRITICAL: The SQL query MUST be under 2000 characters. If a query would be longer, simplify it.

Respond with ONLY a JSON object (no markdown, no code fences):
{"sql": "SELECT ...", "explanation": "brief description"}

If the question cannot be answered with SQL, respond:
{"sql": null, "explanation": "reason why"}`;
}

function buildFormatSystemPrompt(): string {
  const context = getContext();

  return `You are presenting employee survey data analysis results in a chat interface. Provide clear, insightful answers with optional visualizations.

${context ? `## Additional Context\n${context}\n` : ""}
## Rules
- Give a natural-language answer that directly addresses the question
- Reference specific numbers from the data
- Use markdown formatting for readability
- When data has categories (departments, age groups, etc.) with numeric values, suggest a bar chart
- When showing proportions/percentages of a whole, suggest a pie chart
- When showing trends over time, suggest a line chart
- When there are many columns or the data is best viewed as rows, suggest a table
- Not every response needs a visualization — only include one when it adds value
- For open-ended text responses, present them as a formatted list or table

Respond with ONLY a JSON object (no markdown, no code fences):
{
  "answer": "Your markdown-formatted answer here",
  "visualization": {
    "type": "bar" | "pie" | "line" | "table",
    "title": "Chart title",
    "data": [{"label": "...", "value": 123}, ...],
    "xKey": "label",
    "yKey": "value",
    "yKeys": ["value1", "value2"],
    "nameKey": "label",
    "valueKey": "value",
    "columns": ["col1", "col2"]
  }
}

Set "visualization" to null if no chart/table is needed.
For bar/line charts: provide xKey and yKey (or yKeys for multiple series).
For pie charts: provide nameKey and valueKey.
For tables: provide columns array listing which keys to display.`;
}

function extractJSON(text: string): string {
  // Strip markdown code fences if present
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  // Try to find a JSON object in the text
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) return text.slice(start, end + 1);
  return text;
}

function messageToAPI(
  msgs: Message[]
): Array<{ role: "user" | "assistant"; content: string }> {
  return msgs.map((m) => ({
    role: m.role,
    content: m.role === "assistant" ? (m.content || "I analyzed the data.") : m.content,
  }));
}

export async function generateSQL(
  question: string,
  history: Message[]
): Promise<{ sql: string | null; explanation: string }> {
  const messages = [
    ...messageToAPI(history.slice(-6)),
    { role: "user" as const, content: question },
  ];

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: buildSQLSystemPrompt(),
    messages,
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // If response was truncated, the JSON will be malformed
  if (response.stop_reason === "max_tokens") {
    return { sql: null, explanation: "The query was too complex. Try asking about specific items or a smaller subset of the data." };
  }

  try {
    return JSON.parse(extractJSON(text));
  } catch {
    return { sql: null, explanation: text };
  }
}

export async function formatResults(
  question: string,
  sql: string,
  result: QueryResult,
  history: Message[]
): Promise<{ answer: string; visualization: VisualizationSpec | null }> {
  // Truncate large result sets for the prompt
  const truncatedRows =
    result.rows.length > 50 ? result.rows.slice(0, 50) : result.rows;
  const truncationNote =
    result.rows.length > 50
      ? `\n(Showing first 50 of ${result.rows.length} rows)`
      : "";

  const dataDescription = `SQL Query: ${sql}
Results (${result.rowCount} rows, columns: ${result.columns.join(", ")}):
${JSON.stringify(truncatedRows, null, 2)}${truncationNote}`;

  const messages = [
    ...messageToAPI(history.slice(-6)),
    {
      role: "user" as const,
      content: `Question: ${question}\n\n${dataDescription}`,
    },
  ];

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: buildFormatSystemPrompt(),
    messages,
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  try {
    return JSON.parse(extractJSON(text));
  } catch {
    return { answer: text, visualization: null };
  }
}
