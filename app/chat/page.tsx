import ChatInterface from "@/app/components/chat/ChatInterface";
import { auth } from "@/auth";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Chat Interface | Authentication Demo",
  description: "Experiment with LLM-guided authentication through an AI chat interface",
};

export default async function ChatPage() {
  // Pre-fetch auth state on server
  await auth();

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">AI Authentication Demo</h1>
          <p className="text-gray-600 mt-2">
            Interact with an AI assistant that can guide you through the authentication process
            and provide personalized information once you're signed in.
          </p>
        </header>

        <main>
          <ChatInterface />
        </main>

        <footer className="mt-8 text-center text-sm text-gray-500">
          <p>
            This demo showcases how LLMs can use tools to manage authentication flows.
            The assistant can help you log in and access protected information.
          </p>
          <div className="mt-2 flex justify-center space-x-4">
            <a href="/" className="text-blue-500 hover:text-blue-700">Home</a>
            <a href="/dashboard" className="text-blue-500 hover:text-blue-700">Dashboard</a>
            <a href="/login" className="text-blue-500 hover:text-blue-700">Login Page</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
