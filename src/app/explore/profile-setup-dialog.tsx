"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { ProfileSetupForm } from "@/app/profile/setup/profile-setup-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ProfileSetupDialogProps = {
  initialDisplayName: string;
  initialBio: string;
  initialLocation: string;
};

export function ProfileSetupDialog({
  initialDisplayName,
  initialBio,
  initialLocation,
}: ProfileSetupDialogProps) {
  const searchParams = useSearchParams();
  const showSetup = searchParams.get("setup") === "1";
  const [open, setOpen] = useState(showSetup);

  if (!showSetup) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-stone-900">
            Complete your public profile
          </DialogTitle>
          <DialogDescription className="text-stone-600">
            We&apos;ll generate your unique username from your display name.
          </DialogDescription>
        </DialogHeader>

        <ProfileSetupForm
          initialDisplayName={initialDisplayName}
          initialBio={initialBio}
          initialLocation={initialLocation}
          onSkip={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
