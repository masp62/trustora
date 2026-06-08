export function isProfileSetupComplete(user: { bio: string | null; location: string | null }) {
  return Boolean(user.bio || user.location);
}
