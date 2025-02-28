"use client";

import { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { useSession } from "next-auth/react";
import MessageItem from "./MessageItem";
import ChatInput from "./ChatInput";
import ProviderSelector from "./ProviderSelector";
import { Message, LLMProvider } from "@/app/lib/types";
import AuthStatus from "../auth/AuthStatus";
import { signIn } from "next-auth/react";

export default function ChatInterface() {
  const { data: session, status, update: updateSession } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // LLM provider options
  const providers: LLMProvider[] = [
    {
      id: "anthropic",
      name: "Claude (Anthropic)",
      models: ["claude-3-haiku-20240307", "claude-3-5-sonnet-latest", "claude-3-opus-20240229"],
    },
    {
      id: "openai",
      name: "GPT (OpenAI)",
      models: ["gpt-3.5-turbo", "gpt-4o"],
    },
    {
      id: "ollama",
      name: "Ollama (Local)",
      models: ["llama3", "mistral"],
    },
  ];

  const [selectedProvider, setSelectedProvider] = useState(providers[0].id);
  const [selectedModel, setSelectedModel] = useState(providers[0].models[0]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initial system message
  useEffect(() => {
    setMessages([
      {
        id: uuidv4(),
        role: "system",
        content: `You are a helpful AI assistant in a demo application that shows AI-guided authentication.

CRITICAL INSTRUCTIONS FOR CLAUDE:
- When a user indicates they want to log in or provides credentials, you MUST call the login tool with those credentials.
- When you detect an email address and password, call the login tool immediately.
- If a user says "log me in" or "I want to sign in", ask them for their email and password.
- After receiving credentials, ALWAYS use the login tool to authenticate them, not just respond in text.
- Do not proceed with conversations about personal information without successful authentication.
- Recognize user@example.com as the email and password123 as the password for this demo.

AVAILABLE TOOLS:
- login: Submit user credentials for authentication. Call this tool with email and password when provided.
- check_auth_status: Check if a user is authenticated.
- get_user_info: Get user personal information (only if authenticated).

USER EXPERIENCE NOTES:
- Be conversational and helpful in guiding users through the authentication process.
- If credentials are provided in an unusual format, still attempt to extract and use them.
- For this demo, the credentials user@example.com / password123 will always work.`,
        createdAt: new Date(),
      }
    ]);
  }, [session]);

  // Add welcome message after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      if (messages.length === 1) { // Only add if we just have the system message
        setMessages(prev => [
          ...prev,
          {
            id: uuidv4(),
            role: "assistant",
            content: `Hello! I'm your AI assistant for this authentication demo. ${session
              ? `I see you're already signed in as ${session.user?.name}. Feel free to ask about your account information or any other questions.`
              : "I can help you sign in to access your personal information. Just let me know if you'd like to log in."
              }`,
            createdAt: new Date(),
          }
        ]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [messages, session]);

  const handleSendMessage = async (content: string) => {
    if (isLoading) return;

    // Create new user message
    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content,
      createdAt: new Date(),
    };

    // Update messages
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {

      const emailMatch = content.match(/\b([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/i);
      const passwordMatch = content.match(/\bpassword\s*:?\s*([^\s,;]+)|([^\s@]+)(?=\s*$)/i);

      // If both credentials found, use direct login
      if (emailMatch && passwordMatch) {
        const email = emailMatch[1];
        const password = passwordMatch[1] || passwordMatch[2];

        console.log("Detected credentials:", { email, password: '[REDACTED]' });

        // Use our direct login function - no need for API call
        await manualLoginWithCredentials(email, password);
        return; // Early return to avoid the regular flow
      }

      // Regular flow for non-credential messages
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          provider: selectedProvider,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      // Parse and handle the response
      const responseData = await response.json();

      if (responseData.messages && responseData.messages.length > 0) {
        // Add all returned messages to the chat
        setMessages((prev) => [...prev, ...responseData.messages]);
      } else {
        // Fallback in case of unexpected response format
        console.error("Unexpected response format:", responseData);
        throw new Error("Received an invalid response format from the API");
      }

    } catch (err) {
      console.error("Error in chat:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProviderChange = (providerId: string, modelId: string) => {
    setSelectedProvider(providerId);
    setSelectedModel(modelId);
  };

  const handleClearChat = () => {
    // Keep only the system message
    const systemMessage = messages.find(m => m.role === "system");
    setMessages(systemMessage ? [systemMessage] : []);
  };

  const manualLoginWithCredentials = async (email: string, password: string) => {
    setIsLoading(true);

    try {
      // Generate messages for UI feedback first
      const assistantMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: "I'll process your login credentials using the authentication tool.",
        toolCalls: [
          {
            id: uuidv4(),
            type: "function",
            function: {
              name: "login",
              arguments: JSON.stringify({ email, password }),
            },
          },
        ],
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Directly call NextAuth signIn (more reliable than going through the API)
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      // Create tool result message
      const toolMessage: Message = {
        id: assistantMessage.toolCalls![0].id,
        role: "tool",
        content: JSON.stringify({
          success: !result?.error,
          message: result?.error ? result.error : "Login successful"
        }),
        createdAt: new Date(),
      };

      // Create feedback message
      const feedbackMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: result?.error
          ? `Login failed: ${result.error}. Please try again with user@example.com / password123.`
          : `Login successful! You're now authenticated as Demo User. You can now access your personal information.`,
        createdAt: new Date(),
      };

      // Add messages to the chat
      setMessages((prev) => [...prev, toolMessage, feedbackMessage]);

      return !result?.error;
    } catch (error) {
      console.error("Error in manual login:", error);

      // Add error message
      const errorMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: "Sorry, I encountered an error processing your login. Please try again.",
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">AI Chat Interface</h2>
        <button
          onClick={handleClearChat}
          className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded-md hover:bg-gray-100"
        >
          Clear Chat
        </button>
      </div>

      <ProviderSelector
        providers={providers}
        selectedProvider={selectedProvider}
        selectedModel={selectedModel}
        onProviderChange={handleProviderChange}
      />

      <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
        <AuthStatus />
        <p className="text-sm text-gray-600">
          {session
            ? "The assistant can access your personal information. Try asking about your account details."
            : "The assistant can help you sign in to access personal information. Ask it to help you log in."}
        </p>
      </div>

      <div className="border border-gray-200 rounded-lg p-4 mb-4 max-h-[500px] overflow-y-auto">
        <div className="space-y-4">
          {messages
            .filter(m => m.role !== "system") // Hide system messages
            .map((message) => (
              <MessageItem key={message.id} message={message} />
            ))}

          {isLoading && (
            <div className="w-full pl-8 mb-4">
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center mr-2">
                  A
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-500 mb-1">Assistant</div>
                  <div className="p-3 rounded-lg bg-white border border-gray-200">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <div className="flex">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-bold">Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />

      <div className="mt-4 text-xs text-gray-500">
        <p>This is a demo of AI-guided authentication. The assistant can use tools to help with authentication tasks.</p>
        <p className="mt-1">Demo credentials: <span className="font-mono">user@example.com</span> / <span className="font-mono">password123</span></p>
      </div>
    </div>
  );
}
