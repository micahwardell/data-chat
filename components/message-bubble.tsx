"use client";

import ReactMarkdown from "react-markdown";
import dynamic from "next/dynamic";
import { ErrorBoundary } from "./error-boundary";
import type { Message } from "@/lib/types";
import { useState } from "react";

const ChartDisplay = dynamic(
  () => import("./chart-display").then((mod) => mod.ChartDisplay),
  { ssr: false, loading: () => <div className="my-4 p-4 text-sm text-gray-400">Loading chart...</div> }
);

export function MessageBubble({ message }: { message: Message }) {
  const [showSQL, setShowSQL] = useState(false);
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`rounded-2xl px-4 py-3 ${
          isUser
            ? "max-w-[85%] bg-blue-600 text-white"
            : `bg-gray-100 text-gray-900 ${message.visualization ? "max-w-[95%] w-full" : "max-w-[85%]"}`
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <>
            <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-800 prose-strong:text-gray-900 prose-li:text-gray-800">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
            {message.visualization && (
              <ErrorBoundary>
                <ChartDisplay spec={message.visualization} />
              </ErrorBoundary>
            )}
            {message.sql && (
              <div className="mt-2 border-t border-gray-200 pt-2">
                <button
                  onClick={() => setShowSQL(!showSQL)}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  {showSQL ? "Hide" : "Show"} SQL
                  <svg
                    className={`w-3 h-3 transition-transform ${showSQL ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {showSQL && (
                  <pre className="mt-1 text-xs bg-gray-800 text-green-400 rounded-lg p-3 overflow-x-auto">
                    <code>{message.sql}</code>
                  </pre>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
