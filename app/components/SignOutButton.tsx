"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-sm text-slate-600 dark:text-slate-400 hover:underline"
    >
      Sign out
    </button>
  );
}
