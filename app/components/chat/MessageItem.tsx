"use client";

import { Message } from "@/app/lib/types";
import { useState } from "react";

interface MessageItemProps {
  message: Message;
}

export default function MessageItem({ message }: MessageItemProps) {
  const [expanded, setExpanded] = useState(false);

  // Determine appropriate styling based on message role
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";
  const isTool = message.role === "tool";

  // Format tool result for better display
  const formattedToolContent = () => {
    try {
      const parsed = JSON.parse(message.content);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return message.content;
    }
  };

  return (
    <div className={`w-full mb-4 ${isUser ? '' : 'pl-8'}`}>
      <div className="flex items-start">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${isUser ? 'bg-blue-500 text-white' :
              isAssistant ? 'bg-green-500 text-white' :
                'bg-gray-300 text-gray-700'
            }`}
        >
          {isUser ? 'U' : isAssistant ? 'A' : 'T'}
        </div>

        <div className="flex-1">
          <div className="text-sm text-gray-500 mb-1">
            {isUser ? 'You' : isAssistant ? 'Assistant' : 'Tool Result'}
          </div>

          <div className={`p-3 rounded-lg ${isUser ? 'bg-blue-100 text-gray-800' :
              isAssistant ? 'bg-white border border-gray-200 text-gray-800' :
                'bg-gray-100 text-gray-800 text-sm font-mono'
            }`}>
            {isTool ? (
              <>
                <div className="flex justify-between items-center">
                  <div className="font-medium text-xs text-gray-500">
                    Tool: {message.id.split('-')[0]}
                  </div>
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="text-xs text-blue-500 hover:text-blue-700"
                  >
                    {expanded ? 'Collapse' : 'Expand'}
                  </button>
                </div>
                {expanded ? (
                  <pre className="mt-2 whitespace-pre-wrap text-xs overflow-x-auto max-h-40 overflow-y-auto">
                    {formattedToolContent()}
                  </pre>
                ) : (
                  <div className="mt-1 text-xs italic text-gray-500">
                    {isTool && "Tool execution completed"}
                  </div>
                )}
              </>
            ) : (
              <div className="whitespace-pre-wrap">{message.content}</div>
            )}

            {/* Display tool calls if present */}
            {message.toolCalls && message.toolCalls.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="text-sm text-gray-500 mb-1">Tool Calls:</div>
                {message.toolCalls.map((toolCall) => (
                  <div key={toolCall.id} className="p-2 bg-gray-100 rounded text-sm font-mono mt-1">
                    <div className="font-medium">{toolCall.function.name}</div>
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(JSON.parse(toolCall.function.arguments), null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
