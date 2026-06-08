"use client";

import { useState } from "react";

import { signInWithGoogle } from "@/lib/auth-actions";
import { LoginForm } from "@/app/login/login-form";
import { SignupForm } from "@/app/signup/signup-form";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type AuthDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  googleAuthConfigured: boolean;
};

export function AuthDialog({ open, onOpenChange, googleAuthConfigured }: AuthDialogProps) {
  const [mode, setMode] = useState<"login" | "signup" | "forgot-password">("login");

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setMode("login");
    }
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        {mode === "login" ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-heading text-2xl text-stone-900">
                Sign in to RealBnB
              </DialogTitle>
              <DialogDescription className="text-stone-600">
                Continue with Google or use your email and password.
              </DialogDescription>
            </DialogHeader>

            {googleAuthConfigured ? (
              <form action={signInWithGoogle}>
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-full border border-amber-300 bg-amber-50 px-6 py-3 font-semibold text-amber-900 transition hover:bg-amber-100"
                >
                  Continue with Google
                </button>
              </form>
            ) : (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Google sign-in is not configured for this environment.
              </p>
            )}

            <div className="flex items-center gap-3 text-xs font-semibold tracking-[0.08em] text-stone-500 uppercase">
              <span className="h-px flex-1 bg-stone-200" />
              <span>or continue with email</span>
              <span className="h-px flex-1 bg-stone-200" />
            </div>

            <LoginForm onForgotPassword={() => setMode("forgot-password")} />

            <p className="text-center text-sm text-stone-600">
              No account yet?{" "}
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="font-semibold text-amber-700 hover:text-amber-600"
              >
                Create one
              </button>
            </p>
          </>
        ) : mode === "signup" ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-heading text-2xl text-stone-900">
                Create your account
              </DialogTitle>
              <DialogDescription className="text-stone-600">
                Continue with Google or sign up with email and password.
              </DialogDescription>
            </DialogHeader>

            {googleAuthConfigured ? (
              <form action={signInWithGoogle}>
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-full border border-amber-300 bg-amber-50 px-6 py-3 font-semibold text-amber-900 transition hover:bg-amber-100"
                >
                  Continue with Google
                </button>
              </form>
            ) : (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Google sign-up is not configured for this environment.
              </p>
            )}

            <div className="flex items-center gap-3 text-xs font-semibold tracking-[0.08em] text-stone-500 uppercase">
              <span className="h-px flex-1 bg-stone-200" />
              <span>or continue with email</span>
              <span className="h-px flex-1 bg-stone-200" />
            </div>

            <SignupForm />

            <p className="text-center text-sm text-stone-600">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                className="font-semibold text-amber-700 hover:text-amber-600"
              >
                Sign in
              </button>
            </p>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-heading text-2xl text-stone-900">
                Forgot your password?
              </DialogTitle>
              <DialogDescription className="text-stone-600">
                Enter your email address and we&apos;ll send you a reset link.
              </DialogDescription>
            </DialogHeader>

            <ForgotPasswordForm />

            <p className="text-center text-sm text-stone-600">
              Remember your password?{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                className="font-semibold text-amber-700 hover:text-amber-600"
              >
                Sign in
              </button>
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
