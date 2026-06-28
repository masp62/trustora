"use client";

import { useState } from "react";
import Link from "next/link";
import { CircleHelp, Compass, LogIn, LogOut, Menu, PenLine, Shield, User } from "lucide-react";

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

type NavLink = { href: string; label: string };

type UserMenuProps = {
  isAuthenticated: boolean;
  googleAuthConfigured: boolean;
  displayName: string | null;
  navLinks?: NavLink[];
};

const navIcons: Record<string, React.ReactNode> = {
  "/explore": <Compass className="mr-2 size-4" />,
  "/create": <PenLine className="mr-2 size-4" />,
  "/admin": <Shield className="mr-2 size-4" />,
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function UserMenu({ isAuthenticated, googleAuthConfigured, displayName, navLinks = [] }: UserMenuProps) {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {isAuthenticated && (
        <Link
          href="/profile/setup"
          className="touch-target flex items-center gap-2 rounded-full px-1 transition hover:opacity-80"
          title="Edit profile"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-700 sm:size-8">
            {displayName ? getInitials(displayName) : <User className="size-4" />}
          </span>
          {displayName && (
            <span className="hidden text-sm font-medium text-gray-700 sm:inline">
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
            className="touch-target text-gray-700 hover:bg-gray-100"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {/* Mobile-only nav links */}
          {navLinks.length > 0 && (
            <>
              {navLinks.map((link) => (
                <DropdownMenuItem key={link.href} asChild className="sm:hidden">
                  <Link href={link.href} className="cursor-pointer">
                    {navIcons[link.href] ?? null}
                    {link.label}
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="sm:hidden" />
            </>
          )}
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
