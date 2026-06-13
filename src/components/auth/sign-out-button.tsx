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
          "inline-flex items-center justify-center rounded-full border border-gray-300 px-5 py-2 font-semibold text-gray-700 transition hover:bg-gray-50"
        }
      >
        Sign out
      </button>
    </form>
  );
}
