import { Message, ToolCall, ToolResult } from "@/app/lib/types";
import { getAllTools, getToolByName } from "@/app/lib/tools/registry";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

// Initialize clients
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

interface RouterRequest {
  messages: Message[];
  provider: string;
  model: string;
}

// Helper to convert our app message format to provider-specific format

function formatMessagesForAnthropic(messages: Message[]) {
  // Extract system message for Anthropic's top-level system parameter
  const systemMessage = messages.find(msg => msg.role === 'system');
  const systemContent = systemMessage?.content || '';

  // Filter out system messages as they need special handling
  const filteredMessages = messages.filter(msg => msg.role !== 'system');

  const formattedMessages = filteredMessages.map((message) => {
    if (message.role === "tool") {
      return {
        role: "assistant" as const,
        content: [
          {
            type: "tool_result" as const,
            tool_call_id: message.id,
            content: message.content,
          },
        ],
      };
    }

    if (message.toolCalls) {
      return {
        role: message.role as "user" | "assistant",
        content: message.content,
        tool_calls: message.toolCalls.map((call) => ({
          id: call.id,
          type: call.type,
          name: call.function.name,
          input: JSON.parse(call.function.arguments),
        })),
      };
    }

    return {
      role: message.role as "user" | "assistant",
      content: message.content,
    };
  });

  return { messages: formattedMessages, system: systemContent };
}

function formatMessagesForOpenAI(messages: Message[]) {
  return messages.map((message) => {
    if (message.role === "tool") {
      return {
        role: "tool" as const,
        tool_call_id: message.id,
        content: message.content,
      };
    }

    if (message.toolCalls) {
      return {
        role: message.role as "user" | "assistant" | "system",
        content: message.content,
        tool_calls: message.toolCalls.map((call) => ({
          id: call.id,
          type: call.type,
          function: {
            name: call.function.name,
            arguments: call.function.arguments,
          },
        })),
      };
    }

    return {
      role: message.role as "user" | "assistant" | "system",
      content: message.content,
    };
  });
}

function formatToolsForAnthropic(tools: any[]) {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: {
      type: "object",
      properties: tool.parameters.properties || {},
      required: tool.parameters.required || [],
    },
  }));
}

function formatToolsForOpenAI(tools: any[]) {
  return tools.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}

export async function processLLMRequest(request: RouterRequest): Promise<Response> {
  const { messages, provider, model } = request;
  const tools = getAllTools();

  try {
    // Route to the appropriate provider
    switch (provider) {
      case "anthropic": {
        const { messages: formattedMessages, system } = formatMessagesForAnthropic(messages);
        const formattedTools = formatToolsForAnthropic(tools);

        console.log("Sending to Claude API:", {
          system,
          messageCount: formattedMessages.length,
          tools: formattedTools.map(t => t.name),
        });

        try {
          const response = await anthropic.messages.create({
            model,
            max_tokens: 1024,
            system,
            messages: formattedMessages,
            tools: formattedTools,
          });

          console.log("Claude API response:", {
            contentType: response.content[0]?.type,
            hasToolCalls: !!response.tool_calls?.length,
          });

          // Process the response
          const content = response.content[0]?.type === 'text' ? response.content[0]?.text || "" : "";
          const toolCalls = response.tool_calls?.map(call => ({
            id: call.id,
            type: "function",
            function: {
              name: call.name,
              arguments: JSON.stringify(call.input),
            }
          })) || [];

          return new Response(
            JSON.stringify({
              content,
              role: "assistant",
              tool_calls: toolCalls
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        } catch (error) {
          console.error("Error calling Claude API:", error);
          return new Response(
            JSON.stringify({
              error: "Failed to process request with Claude API",
              details: error instanceof Error ? error.message : "Unknown error"
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
      }

      case "openai": {
        const formattedMessages = formatMessagesForOpenAI(messages);
        const formattedTools = formatToolsForOpenAI(tools);

        const response = await openai.chat.completions.create({
          model,
          messages: formattedMessages,
          tools: formattedTools,
          tool_choice: "auto",
        });

        // Process the response
        const message = response.choices[0]?.message;
        return new Response(
          JSON.stringify({
            content: message?.content || "",
            role: "assistant",
            tool_calls: message?.tool_calls?.map(call => ({
              id: call.id,
              type: call.type,
              function: {
                name: call.function.name,
                arguments: call.function.arguments,
              }
            })) || []
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // For Ollama - this would require a custom implementation
      case "ollama": {
        return new Response(
          JSON.stringify({
            content: "Ollama integration is not implemented in this demo. Please select Claude or GPT to use the authentication tools.",
            role: "assistant"
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      default:
        return new Response(
          JSON.stringify({
            error: "Unsupported LLM provider",
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
    }
  } catch (error) {
    console.error("Error processing LLM request:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process LLM request",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export async function executeToolCall(toolCall: ToolCall): Promise<ToolResult> {
  const tool = getToolByName(toolCall.function.name);

  if (!tool) {
    return {
      toolCallId: toolCall.id,
      result: JSON.stringify({
        error: `Tool '${toolCall.function.name}' not found`,
        available_tools: getAllTools().map(t => t.name)
      }),
    };
  }

  try {
    const args = JSON.parse(toolCall.function.arguments);
    const result = await tool.handler(args);

    return {
      toolCallId: toolCall.id,
      result: JSON.stringify(result),
    };
  } catch (error) {
    console.error(`Error executing tool ${toolCall.function.name}:`, error);
    return {
      toolCallId: toolCall.id,
      result: JSON.stringify({
        error: "Tool execution failed",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
    };
  }
}
