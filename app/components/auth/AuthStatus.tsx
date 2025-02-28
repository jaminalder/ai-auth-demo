"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function AuthStatus() {
  const { data: session, status } = useSession();
  // We're NOT calling update() on an interval anymore

  return (
    <div className={`flex items-center mb-2`}>
      <div className={`w-2 h-2 rounded-full mr-2 ${status === 'authenticated' ? 'bg-green-500' : 'bg-red-500'}`}></div>
      <div className="text-sm font-medium text-gray-700">
        {status === 'authenticated' ? (
          <span className="text-green-600">Authenticated as {session?.user?.name || 'User'}</span>
        ) : status === 'loading' ? (
          <span className="text-yellow-600">Checking authentication...</span>
        ) : (
          <span className="text-red-600">Not authenticated</span>
        )}
      </div>
    </div>
  );
}
