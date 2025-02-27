import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth"

export default async function Home() {

  const session = await auth();

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="max-w-2xl w-full text-center">
          <h1 className="text-4xl font-bold mb-6">AI-Guided Authentication Demo</h1>
          <p className="text-xl mb-8">
            Experiment with LLM-powered authentication flows and chat interfaces.
          </p>

          <div className="flex gap-4 justify-center">
            {session ? (
              <Link
                href="/dashboard"
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-md"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-md"
              >
                Sign In
              </Link>
            )}

            <Link
              href="/chat"
              className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-3 px-6 rounded-md"
            >
              Try AI Chat
            </Link>
          </div>
        </div>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
