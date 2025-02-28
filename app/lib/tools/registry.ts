import { auth, signIn } from "@/auth";

// Tool schemas
const AUTH_STATUS_SCHEMA = {
  type: "object",
  properties: {},
  required: [],
};

const INITIATE_LOGIN_SCHEMA = {
  type: "object",
  properties: {},
  required: [],
};

const SUBMIT_CREDENTIALS_SCHEMA = {
  type: "object",
  properties: {
    email: {
      type: "string",
      description: "The user's email address",
    },
    password: {
      type: "string",
      description: "The user's password",
    },
  },
  required: ["email", "password"],
};

const GET_USER_INFO_SCHEMA = {
  type: "object",
  properties: {},
  required: [],
};

const LOGOUT_SCHEMA = {
  type: "object",
  properties: {},
  required: [],
};

// Tool definitions with handlers
export const tools = [
  {
    name: "check_auth_status",
    description: "Check if the user is currently authenticated",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
    handler: async () => {
      const session = await auth();

      if (session) {
        return {
          authenticated: true,
          user: {
            name: session.user?.name,
            email: session.user?.email,
          },
        };
      } else {
        return {
          authenticated: false,
          message: "User is not authenticated. To login, ask for their email and password, then use the login tool.",
        };
      }
    },
  },
  // Update this in app/lib/tools/registry.ts
  {
    name: "login",
    description: "Submit user credentials for authentication. Use this after getting email and password from the user.",
    parameters: {
      type: "object",
      properties: {
        email: {
          type: "string",
          description: "The user's email address",
        },
        password: {
          type: "string",
          description: "The user's password",
        },
      },
      required: ["email", "password"],
    },
    handler: async ({ email, password }: { email: string; password: string }) => {
      console.log("============ LOGIN TOOL CALLED ============");
      console.log("Login attempt with email:", email);
      console.log("Password provided:", password ? "[REDACTED]" : "No password");

      // Check if already authenticated
      const session = await auth();
      console.log("Current session:", session ? "Authenticated" : "Not authenticated");

      if (session) {
        console.log("User already authenticated, returning session info");
        return {
          status: "already_authenticated",
          message: "User is already logged in.",
          user: {
            name: session.user?.name,
            email: session.user?.email,
          },
        };
      }

      // For demo, check against mock user credentials
      const isValid = email === "user@example.com" && password === "password123";
      console.log("Credentials valid:", isValid);

      if (isValid) {
        try {
          // Actually create the session using NextAuth signIn
          // This is the key part that was missing - we need to call the actual signIn function
          const result = await signIn("credentials", {
            redirect: false,
            email,
            password,
          });

          if (result?.error) {
            console.log("NextAuth signIn failed:", result.error);
            return {
              success: false,
              message: "Authentication system error",
              error: result.error
            };
          }

          console.log("Login successful for demo user, session created");
          return {
            success: true,
            message: "Login successful! The user is now authenticated.",
            user: {
              name: "Demo User",
              email: "user@example.com",
            },
          };
        } catch (error) {
          console.error("Error during NextAuth signIn:", error);
          return {
            success: false,
            message: "Error during authentication process",
            error: error instanceof Error ? error.message : "Unknown error"
          };
        }
      } else {
        console.log("Login failed: invalid credentials");
        return {
          success: false,
          message: "Invalid credentials. Please try again.",
          hint: "For this demo, use: user@example.com / password123"
        };
      }
    },
  },
  {
    name: "get_user_info",
    description: "Get the authenticated user's personal information. Only use if the user is authenticated.",
    parameters: GET_USER_INFO_SCHEMA,
    handler: async () => {
      const session = await auth();

      if (!session) {
        return {
          error: "not_authenticated",
          message: "The user must be logged in to access personal information.",
          suggestion: "Please use the initiate_login tool to start the authentication process."
        };
      }

      // For a demo, we'll return some mock personal info
      return {
        profile: {
          name: session.user?.name || "Demo User",
          email: session.user?.email || "user@example.com",
          id: (session.user as any)?.id || "1",
        },
        account: {
          type: "Premium",
          status: "Active",
          member_since: "January 15, 2023",
          subscription: {
            plan: "Premium Annual",
            price: "$99/year",
            next_billing_date: "January 15, 2025",
            features: ["Unlimited access", "Priority support", "Advanced analytics"]
          }
        },
        preferences: {
          theme: "Dark",
          notifications: true,
          language: "English",
          timezone: "UTC-8 (Pacific Time)"
        },
        activity: {
          last_login: new Date().toISOString(),
          login_count: 42,
          last_actions: [
            "Updated profile picture",
            "Changed notification settings",
            "Viewed account summary"
          ]
        }
      };
    },
  },
  {
    name: "logout",
    description: "Log the user out of their account",
    parameters: LOGOUT_SCHEMA,
    handler: async () => {
      const session = await auth();

      if (!session) {
        return {
          status: "not_authenticated",
          message: "User is not currently logged in."
        };
      }

      // In a real implementation, this would trigger a real logout
      // We'll just return instructions
      return {
        status: "success",
        message: "To log out, please use the sign out button on the dashboard or visit the sign out URL.",
        redirect_url: "/api/auth/signout"
      };
    },
  }
];

// Helper to get a tool by name
export function getToolByName(name: string) {
  return tools.find((tool) => tool.name === name);
}

// Helper to get all tools
export function getAllTools() {
  return tools;
}

// Helper to get tools for a specific context
export function getToolsForContext(isAuthenticated: boolean) {
  if (isAuthenticated) {
    // All tools are available when authenticated
    return tools;
  } else {
    // Only auth-related tools when not authenticated
    return tools.filter(tool =>
      ['check_auth_status', 'initiate_login', 'submit_credentials'].includes(tool.name)
    );
  }
}
