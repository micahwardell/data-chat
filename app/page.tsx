import { ChatInterface } from "@/components/chat-interface";

export default function Home() {
  return (
    <main className="h-screen flex flex-col bg-white">
      <header className="border-b border-gray-200 px-6 py-3 flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Data Chat</h1>
          <p className="text-xs text-gray-500">
            Ask questions about the employee engagement survey
          </p>
        </div>
      </header>
      <ChatInterface />
    </main>
  );
}
