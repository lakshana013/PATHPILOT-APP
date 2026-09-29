import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import { ShapeAuthBackground } from "@/components/ui/shape-auth-background";

export default function LoginPage() {
  return (
    <ShapeAuthBackground>
      <Suspense fallback={<div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/95 p-8 shadow-xl backdrop-blur-sm">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </ShapeAuthBackground>
  );
}
