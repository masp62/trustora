"use client";

import { useState } from "react";
import Link from "next/link";
import { CircleHelp, LogIn, LogOut, Menu, User } from "lucide-react";

import { signOutFromApp } from "@/lib/auth-actions";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserMenuProps = {
  isAuthenticated: boolean;
  googleAuthConfigured: boolean;
  displayName: string | null;
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function UserMenu({ isAuthenticated, googleAuthConfigured, displayName }: UserMenuProps) {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {isAuthenticated && (
        <Link
          href="/profile/setup"
          className="flex items-center gap-2 rounded-full transition hover:opacity-80"
          title="Edit profile"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">
            {displayName ? getInitials(displayName) : <User className="size-4" />}
          </span>
          {displayName && (
            <span className="hidden text-sm font-medium text-stone-700 sm:inline">
              {displayName}
            </span>
          )}
        </Link>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-amber-800 hover:bg-amber-100/60"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {isAuthenticated ? (
            <>
              <DropdownMenuItem asChild>
                <Link href="/help" className="cursor-pointer">
                  <CircleHelp className="mr-2 size-4" />
                  Help
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => void signOutFromApp()}
                className="cursor-pointer"
              >
                <LogOut className="mr-2 size-4" />
                Sign out
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem
                onSelect={() => setAuthDialogOpen(true)}
                className="cursor-pointer"
              >
                <LogIn className="mr-2 size-4" />
                Sign in
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/help" className="cursor-pointer">
                  <CircleHelp className="mr-2 size-4" />
                  Help
                </Link>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {!isAuthenticated && (
        <AuthDialog
          open={authDialogOpen}
          onOpenChange={setAuthDialogOpen}
          googleAuthConfigured={googleAuthConfigured}
        />
      )}
    </div>
  );
}
