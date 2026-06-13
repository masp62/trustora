"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";

type MobileNavProps = {
  links: Array<{ href: string; label: string }>;
};

export function MobileNav({ links }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="text-gray-700 hover:bg-gray-100"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
      >
        <Menu className="size-5" />
      </Button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />

          {/* Drawer */}
          <nav
            className="fixed inset-y-0 right-0 z-50 flex w-64 flex-col bg-white/95 shadow-xl backdrop-blur"
            aria-label="Mobile navigation"
          >
            <div className="flex h-14 items-center justify-between border-b border-gray-200 px-5">
              <span className="font-heading text-lg font-bold text-[#E0565B]">Menu</span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setOpen(false)}
                aria-label="Close navigation menu"
              >
                <X className="size-4" />
              </Button>
            </div>

            <ul className="flex-1 space-y-1 p-4">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-gray-900"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </>
      )}
    </div>
  );
}
