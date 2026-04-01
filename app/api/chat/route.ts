import { NextRequest, NextResponse } from "next/server";
import { generateSQL, formatResults } from "@/lib/claude";
import { executeQuery } from "@/lib/db";
import type { ChatRequest, ChatResponse } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const { message, history } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Step 1: Generate SQL from the question
    const { sql, explanation } = await generateSQL(message, history || []);

    if (!sql) {
      const response: ChatResponse = {
        answer: explanation,
      };
      return NextResponse.json(response);
    }

    // Step 2: Execute the query
    let result = executeQuery(sql);

    // If query failed, try once more with error context
    if ("error" in result) {
      const retry = await generateSQL(
        `${message}\n\n(Previous query failed with error: ${result.error}. Please fix the SQL.)`,
        history || []
      );

      if (!retry.sql) {
        const response: ChatResponse = {
          answer: `I wasn't able to query the data for that question. ${retry.explanation}`,
          sql,
        };
        return NextResponse.json(response);
      }

      result = executeQuery(retry.sql);

      if ("error" in result) {
        const response: ChatResponse = {
          answer: `I encountered an error querying the data: ${result.error}`,
          sql: retry.sql,
        };
        return NextResponse.json(response);
      }

      // Format results with the corrected SQL
      const formatted = await formatResults(
        message,
        retry.sql,
        result,
        history || []
      );
      const response: ChatResponse = {
        answer: formatted.answer,
        visualization: formatted.visualization ?? undefined,
        sql: retry.sql,
      };
      return NextResponse.json(response);
    }

    // Step 3: Format the results
    const formatted = await formatResults(message, sql, result, history || []);
    console.log("formatResults returned:", JSON.stringify(formatted).slice(0, 500));

    const response: ChatResponse = {
      answer: formatted.answer,
      visualization: formatted.visualization ?? undefined,
      sql,
    };
    return NextResponse.json(response);
  } catch (err: unknown) {
    console.error("Chat API error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
