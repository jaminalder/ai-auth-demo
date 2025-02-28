"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export default function SessionProvider({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <NextAuthSessionProvider
      // Reduce refetch interval to minimize polling
      refetchInterval={10 * 60} // 10 minutes in seconds
      refetchOnWindowFocus={false} // Don't refetch when window regains focus
    >
      {children}
    </NextAuthSessionProvider>
  );
}
