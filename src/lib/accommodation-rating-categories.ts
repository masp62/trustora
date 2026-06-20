export const ACCOMMODATION_RATING_CATEGORIES = [
  { key: "cleanliness", label: "Cleanliness" },
  { key: "accuracy", label: "Accuracy of listing" },
  { key: "checkIn", label: "Check-in" },
  { key: "communication", label: "Communication" },
  { key: "location", label: "Location" },
  { key: "value", label: "Value for money" },
  { key: "comfort", label: "Comfort" },
  { key: "facilities", label: "Facilities & amenities" },
] as const;

export type AccommodationRatingCategoryKey =
  (typeof ACCOMMODATION_RATING_CATEGORIES)[number]["key"];
