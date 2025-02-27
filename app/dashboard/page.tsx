import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();

  // Protect the route
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <Link
            href="/api/auth/signout"
            className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md"
          >
            Sign Out
          </Link>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-900">Welcome, {session.user?.name}!</h2>
          <p className="text-gray-800">This is your protected dashboard. Only authenticated users can see this page.</p>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2 text-gray-900">Your Personal Information</h2>
          <p className="text-gray-800"><strong>Email:</strong> {session.user?.email}</p>
          <p className="text-gray-800"><strong>User ID:</strong> {(session.user as any)?.id}</p>
        </div>
      </div>
    </div>
  );
}
