import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import FlashcardsClient from "./FlashcardsClient";

export const metadata = { title: "Flashcards – TubeCourse" };

export default async function FlashcardsPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  return (
    <div className="bg-[#f8f7f6] min-h-screen">
      <header className="flex items-center justify-between border-b border-orange-100 bg-[#f8f7f6]/80 backdrop-blur-md px-6 md:px-10 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="size-8 bg-orange-100 rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-[#e77e23]">school</span>
          </div>
          <h2 className="text-slate-900 text-lg font-bold tracking-tight">TubeCourse</h2>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-[#e77e23] bg-white border border-slate-200 rounded-xl transition-colors"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Dashboard
        </Link>
      </header>

      <main className="px-6 md:px-10 py-8 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="size-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-purple-600 text-xl">style</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Flashcards</h1>
            <p className="text-sm text-slate-500">Spaced repetition for all your courses</p>
          </div>
        </div>

        <FlashcardsClient />
      </main>
    </div>
  );
}
