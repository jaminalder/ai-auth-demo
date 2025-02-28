// Update app/api/tools/login/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getToolByName } from "@/app/lib/tools/registry";
import { auth, signIn } from "@/auth";

export async function POST(req: NextRequest) {
  try {
    // Get current session
    const currentSession = await auth();

    // If already logged in, return success
    if (currentSession) {
      return NextResponse.json({
        success: true,
        status: "already_authenticated",
        message: "User is already logged in.",
        user: {
          name: currentSession.user?.name,
          email: currentSession.user?.email,
        }
      });
    }

    // Parse credentials
    const { email, password } = await req.json();

    // Validate credentials (for demo purposes)
    const isValid = email === "user@example.com" && password === "password123";

    if (isValid) {
      console.log("Valid credentials, creating session...");

      try {
        // Create an actual session with NextAuth
        const result = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });

        if (result?.error) {
          console.error("NextAuth sign-in error:", result.error);
          return NextResponse.json({
            success: false,
            message: "Authentication failed",
            error: result.error
          }, { status: 401 });
        }

        // Check if session was actually created
        const newSession = await auth();
        console.log("New session after login:", newSession ? "Created" : "Failed");

        return NextResponse.json({
          success: true,
          message: "Login successful! The user is now authenticated.",
          user: {
            name: "Demo User",
            email: "user@example.com",
          },
          sessionCreated: !!newSession
        });
      } catch (error) {
        console.error("Error during signIn:", error);
        return NextResponse.json({
          success: false,
          message: "Error during authentication process",
          error: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
      }
    } else {
      return NextResponse.json({
        success: false,
        message: "Invalid credentials. Please try again.",
        hint: "For this demo, use: user@example.com / password123"
      }, { status: 401 });
    }
  } catch (error) {
    console.error("Login route error:", error);
    return NextResponse.json(
      { error: "Failed to process login", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
