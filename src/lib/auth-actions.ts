"use server";

import { randomBytes } from "node:crypto";

import { UserRole } from "@prisma/client";
import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";

import { auth, googleAuthConfigured, signIn, signOut } from "@/auth";
import { type AuthActionState } from "@/lib/auth-action-state";
import { db } from "@/lib/db";
import { generateUniqueUsername } from "@/lib/usernames";

function parseField(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function isDatabaseConfigurationError(error: unknown) {
  return (
    error instanceof Error &&
    (error.message.includes("DATABASE_URL") || error.name === "PrismaClientInitializationError")
  );
}

export async function signInWithGoogle() {
  if (!googleAuthConfigured) {
    redirect("/login?error=google_not_configured");
  }

  await signIn("google", { redirectTo: "/explore?setup=1" });
}

export async function signOutFromApp() {
  await signOut({ redirectTo: "/explore" });
}

export async function signInWithCredentials(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = parseField(formData.get("email")).toLowerCase();
  const password = parseField(formData.get("password"));

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/explore",
    });

    return { error: null };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }

    if (isDatabaseConfigurationError(error)) {
      return { error: "Auth is not configured yet. Add DATABASE_URL to your .env file." };
    }

    throw error;
  }
}

export async function signUpWithCredentials(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = parseField(formData.get("email")).toLowerCase();
  const displayName = parseField(formData.get("displayName"));
  const password = parseField(formData.get("password"));
  const confirmPassword = parseField(formData.get("confirmPassword"));

  if (!email || !displayName || !password || !confirmPassword) {
    return { error: "All fields are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  try {
    const existingUser = (await db.user.findUnique({
      where: { email },
      select: { id: true },
    })) as { id: string } | null;

    if (existingUser) {
      return { error: "An account with this email already exists." };
    }

    const passwordHash = await hash(password, 12);
    const username = await generateUniqueUsername(displayName);

    await db.user.create({
      data: {
        email,
        displayName,
        username,
        avatarUrl: null,
        bio: null,
        location: null,
        role: UserRole.user,
        passwordHash,
        isBanned: false,
      },
    });
  } catch (error) {
    if (isDatabaseConfigurationError(error)) {
      return { error: "Auth is not configured yet. Add DATABASE_URL to your .env file." };
    }

    throw error;
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/explore?setup=1",
    });

    return { error: null };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account was created, but sign-in failed. Please log in." };
    }

    throw error;
  }
}

export async function completeProfileSetup(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const displayName = parseField(formData.get("displayName"));
  const bio = parseField(formData.get("bio"));
  const location = parseField(formData.get("location"));

  if (!displayName) {
    return { error: "Display name is required." };
  }

  if (bio.length > 280) {
    return { error: "Bio must be 280 characters or less." };
  }

  const username = await generateUniqueUsername(displayName);

  await db.user.update({
    where: { id: session.user.id },
    data: {
      displayName,
      bio: bio || null,
      location: location || null,
      username,
    },
  });

  redirect("/explore?onboarding=1");
}

const PASSWORD_RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export async function requestPasswordReset(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = parseField(formData.get("email")).toLowerCase();

  if (!email) {
    return { error: "Email is required." };
  }

  const successMessage =
    "If an account with this email exists, a password reset link has been sent.";

  try {
    const user = (await db.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true },
    })) as { id: string; passwordHash: string | null } | null;

    // Don't reveal whether the user exists. Also skip OAuth-only accounts.
    if (!user || !user.passwordHash) {
      return { error: null, success: successMessage };
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRY_MS);

    await (db as any).passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/reset-password?token=${token}`;

    // TODO: send email with resetUrl
    // For now, log in development
    if (process.env.NODE_ENV === "development") {
      console.log(`\n🔑 Password reset link for ${email}:\n${resetUrl}\n`);
    }

    return { error: null, success: successMessage };
  } catch (error) {
    if (isDatabaseConfigurationError(error)) {
      return { error: "Auth is not configured yet. Add DATABASE_URL to your .env file." };
    }

    throw error;
  }
}

export async function resetPassword(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const token = parseField(formData.get("token"));
  const password = parseField(formData.get("password"));
  const confirmPassword = parseField(formData.get("confirmPassword"));

  if (!token) {
    return { error: "Invalid or missing reset token." };
  }

  if (!password || !confirmPassword) {
    return { error: "All fields are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  try {
    const resetToken = (await (db as any).passwordResetToken.findUnique({
      where: { token },
      select: { id: true, userId: true, expiresAt: true, usedAt: true },
    })) as { id: string; userId: string; expiresAt: Date; usedAt: Date | null } | null;

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      return { error: "This reset link is invalid or has expired." };
    }

    const passwordHash = await hash(password, 12);

    await (db as any).$transaction([
      (db as any).user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      (db as any).passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { error: null, success: "Password has been reset. You can now sign in." };
  } catch (error) {
    if (isDatabaseConfigurationError(error)) {
      return { error: "Auth is not configured yet. Add DATABASE_URL to your .env file." };
    }

    throw error;
  }
}
