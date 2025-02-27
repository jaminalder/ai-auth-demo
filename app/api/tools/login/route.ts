import { NextRequest, NextResponse } from "next/server";
import { getAllTools, getToolByName } from "@/app/lib/tools/registry";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  try {
    // Get current session
    await auth();

    // Get login tool
    const loginTool = getToolByName("login");
    if (!loginTool) {
      return NextResponse.json({ error: "Login tool not found" }, { status: 404 });
    }

    // Parse credentials
    const { email, password } = await req.json();

    // Execute tool
    console.log("Executing login tool directly with:", { email, password: "[REDACTED]" });
    const result = await loginTool.handler({ email, password });
    console.log("Login result:", result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Login tool error:", error);
    return NextResponse.json(
      { error: "Failed to process login", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
