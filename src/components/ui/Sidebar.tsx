"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV = [
  { href: "/dashboard", icon: "home", label: "Home", exact: true },
  { href: "/dashboard/stats", icon: "bar_chart", label: "Statistics", exact: false },
];

export default function Sidebar({
  userName,
  userImage,
}: {
  userName?: string | null;
  userImage?: string | null;
}) {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-orange-100 bg-white flex flex-col hidden md:flex shrink-0">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="bg-[#e77e23] p-2 rounded-lg text-white">
          <span className="material-symbols-outlined">school</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight">TubeCourse</h1>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 space-y-1 mt-4">
        {NAV.map(({ href, icon, label, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                active
                  ? "bg-orange-50 text-[#e77e23]"
                  : "hover:bg-orange-50/50 text-slate-700"
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {icon}
              </span>
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User + sign out */}
      <div className="p-4 mt-auto border-t border-orange-50">
        <div className="flex items-center gap-3 mb-4">
          {userImage ? (
            <img src={userImage} className="w-9 h-9 rounded-full" alt="" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-[#e77e23] font-bold">
              {userName?.[0] ?? "U"}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{userName ?? "User"}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-base">logout</span>
          Sign out
        </button>
      </div>
    </aside>
  );
}
