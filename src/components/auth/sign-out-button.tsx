import { signOutFromApp } from "@/lib/auth-actions";

type SignOutButtonProps = {
  className?: string;
};

export function SignOutButton({ className }: SignOutButtonProps) {
  return (
    <form action={signOutFromApp}>
      <button
        type="submit"
        className={
          className ??
          "inline-flex items-center justify-center rounded-full border border-amber-700/30 px-5 py-2 font-semibold text-amber-800 transition hover:bg-amber-100/60"
        }
      >
        Sign out
      </button>
    </form>
  );
}
