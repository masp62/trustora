import type { ReportStatus, ReportTargetType, TripType, UserRole } from "@prisma/client";

export const USER_ROLE = {
  user: "user",
  admin: "admin",
} as const satisfies Record<string, UserRole>;

export const REPORT_TARGET_TYPE = {
  post: "post",
  comment: "comment",
} as const satisfies Record<string, ReportTargetType>;

export const REPORT_STATUS = {
  pending: "pending",
  resolved: "resolved",
  dismissed: "dismissed",
} as const satisfies Record<string, ReportStatus>;

export const TRIP_TYPE = {
  solo: "solo",
  couple: "couple",
  family: "family",
  friends: "friends",
  business: "business",
} as const satisfies Record<string, TripType>;