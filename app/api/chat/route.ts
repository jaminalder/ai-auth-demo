import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { processLLMRequest, executeToolCall } from "@/app/lib/llm/router";
import { Message, ToolCall } from "@/app/lib/types";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  console.log("============ CHAT API REQUEST STARTED ============");
  try {
    // Get session to pass to tools
    const session = await auth();
    console.log("Session state:", session ? "Authenticated" : "Not authenticated");

    // Parse request
    const body = await req.json();
    const { messages, provider, model } = body;
    console.log("Request payload:", { provider, model, messageCount: messages.length });
    console.log("Last user message:", messages.filter(m => m.role === "user").pop()?.content);

    // Call LLM
    console.log("Calling LLM provider:", provider);
    const llmResponse = await processLLMRequest({
      messages,
      provider,
      model,
    });

    // Process response
    console.log("LLM responded with status:", llmResponse.status);
    const responseText = await llmResponse.text();
    console.log("Raw LLM response:", responseText);
    let responseMessages: Message[] = [];

    try {
      const parsedResponse = JSON.parse(responseText);
      console.log("Parsed response:", JSON.stringify(parsedResponse, null, 2));

      // Create assistant message
      const assistantMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: parsedResponse.content || "",
        createdAt: new Date(),
      };

      // Add tool calls if present
      if (parsedResponse.tool_calls && parsedResponse.tool_calls.length > 0) {
        console.log("Tool calls found:", parsedResponse.tool_calls.length);
        console.log("Tool calls details:", JSON.stringify(parsedResponse.tool_calls, null, 2));

        assistantMessage.toolCalls = parsedResponse.tool_calls.map((call: any) => {
          console.log(`Processing tool call: ${call.id}, function: ${call.function?.name}`);
          return {
            id: call.id,
            type: "function",
            function: {
              name: call.function.name,
              arguments: call.function.arguments,
            },
          };
        });

        // Execute tool calls
        console.log("Executing tool calls...");
        const toolResults = await Promise.all(
          parsedResponse.tool_calls.map(async (call: any) => {
            console.log(`Executing tool: ${call.function.name} with args: ${call.function.arguments}`);
            const result = await executeToolCall({
              id: call.id,
              type: "function",
              function: {
                name: call.function.name,
                arguments: call.function.arguments,
              },
            });
            console.log(`Tool ${call.function.name} result:`, result.result);
            return result;
          })
        );

        const toolMessages = toolResults.map((result) => ({
          id: result.toolCallId,
          role: "tool" as const,
          content: result.result,
          createdAt: new Date(),
        }));

        console.log("Adding tool messages to response:", toolMessages.length);
        responseMessages = [assistantMessage, ...toolMessages];
      } else {
        console.log("No tool calls found in response");
        responseMessages = [assistantMessage];
      }
    } catch (error) {
      console.error("Error parsing LLM response:", error);
      console.error("Problematic response text:", responseText);

      // Fallback if JSON parsing fails
      responseMessages = [
        {
          id: uuidv4(),
          role: "assistant",
          content: responseText || "Sorry, I encountered an error processing your request.",
          createdAt: new Date(),
        },
      ];
    }

    console.log("Final response message count:", responseMessages.length);
    console.log("============ CHAT API REQUEST COMPLETED ============");
    return NextResponse.json({ messages: responseMessages });
  } catch (error) {
    console.error("============ CHAT API ERROR ============");
    console.error("Error details:", error);
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    console.error("============ END OF ERROR DETAILS ============");
    return NextResponse.json(
      { error: "Failed to process request", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
