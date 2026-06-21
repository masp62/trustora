import { PrismaClient, ReportStatus, ReportTargetType, TripType, UserRole } from "@prisma/client";
import baselineData from "../../prisma/baseline-data.json";

type InMemoryUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  location: string | null;
  role: UserRole;
  passwordHash: string | null;
  isBanned: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type InMemoryExperiencePost = {
  id: string;
  slug: string;
  status: "draft" | "published";
  publishedAt: Date | null;
  title: string;
  body: string;
  locationCity: string;
  locationCountry: string;
  propertyName: string | null;
  tripType: TripType;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
};

type InMemoryPostImage = {
  id: string;
  postId: string;
  cloudinaryUrl: string;
  order: number;
};

type InMemoryTag = {
  id: string;
  name: string;
};

type InMemoryPostTag = {
  postId: string;
  tagId: string;
};

type InMemoryLike = {
  id: string;
  userId: string;
  postId: string;
  createdAt: Date;
};

type InMemoryComment = {
  id: string;
  body: string;
  postId: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
};

type InMemoryFollow = {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
};

type InMemoryReport = {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string | null;
  status: ReportStatus;
  createdAt: Date;
  updatedAt: Date;
};

type InMemoryAccommodationRating = {
  id: string;
  postId: string;
  userId: string;
  overallScore: number;
  cleanliness: number;
  accuracy: number;
  checkIn: number;
  communication: number;
  location: number;
  value: number;
  comfort: number;
  facilities: number;
  wouldStayAgain: boolean;
  reviewText: string | null;
  isVerifiedStay: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type InMemoryPasswordResetToken = {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
};

type InMemoryStore = {
  users: InMemoryUser[];
  experiencePosts: InMemoryExperiencePost[];
  postImages: InMemoryPostImage[];
  tags: InMemoryTag[];
  postTags: InMemoryPostTag[];
  likes: InMemoryLike[];
  comments: InMemoryComment[];
  follows: InMemoryFollow[];
  reports: InMemoryReport[];
  accommodationRatings: InMemoryAccommodationRating[];
  passwordResetTokens: InMemoryPasswordResetToken[];
};

type FindArgs = {
  where?: Record<string, unknown>;
  select?: Record<string, boolean>;
  orderBy?: Record<string, "asc" | "desc">;
  skip?: number;
  take?: number;
};

function nextId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 12)}`;
}

function applySelect<T extends Record<string, unknown>>(entry: T, select?: Record<string, boolean>) {
  if (!select) {
    return entry;
  }

  const selected: Record<string, unknown> = {};

  for (const [key, include] of Object.entries(select)) {
    if (include) {
      selected[key] = entry[key as keyof T];
    }
  }

  return selected;
}

function matchesWhere<T extends Record<string, unknown>>(entry: T, where?: Record<string, unknown>) {
  if (!where) {
    return true;
  }

  return Object.entries(where).every(([key, expected]) => {
    const value = entry[key as keyof T];

    if (expected && typeof expected === "object" && !Array.isArray(expected)) {
      const filters = expected as Record<string, unknown>;

      if (Array.isArray(filters.in)) {
        return (filters.in as unknown[]).includes(value);
      }

      if (typeof filters.contains === "string" && typeof value === "string") {
        const needle = filters.mode === "insensitive" ? filters.contains.toLowerCase() : filters.contains;
        const haystack = filters.mode === "insensitive" ? value.toLowerCase() : value;
        return haystack.includes(needle);
      }

      if (typeof filters.equals !== "undefined") {
        return value === filters.equals;
      }

      return true;
    }

    return value === expected;
  });
}

function sortEntries<T extends Record<string, unknown>>(entries: T[], orderBy?: Record<string, "asc" | "desc">) {
  if (!orderBy) {
    return [...entries];
  }

  const [[key, direction]] = Object.entries(orderBy);

  return [...entries].sort((a, b) => {
    const left = a[key as keyof T];
    const right = b[key as keyof T];

    if (left === right) {
      return 0;
    }

    const comparison = left && right && left > right ? 1 : -1;
    return direction === "desc" ? comparison * -1 : comparison;
  });
}

function paginate<T>(entries: T[], skip?: number, take?: number) {
  const start = skip ?? 0;
  const end = typeof take === "number" ? start + take : undefined;
  return entries.slice(start, end);
}

function createInMemoryDb(store: InMemoryStore) {
  return {
    user: {
      async findUnique(args: FindArgs) {
        const normalizedWhere = { ...args.where };

        if (typeof normalizedWhere.email === "string") {
          normalizedWhere.email = normalizedWhere.email.toLowerCase();
        }

        const entry = store.users.find((user) => matchesWhere(user, normalizedWhere));
        return entry ? applySelect(entry, args.select) : null;
      },
      async findMany(args: FindArgs = {}) {
        const filtered = store.users.filter((entry) => matchesWhere(entry, args.where));
        const ordered = sortEntries(filtered, args.orderBy);
        return paginate(ordered.map((entry) => applySelect(entry, args.select)), args.skip, args.take);
      },
      async create(args: { data: Omit<InMemoryUser, "id" | "createdAt" | "updatedAt"> }) {
        const email = args.data.email.toLowerCase();

        if (store.users.some((entry) => entry.email === email || entry.username === args.data.username)) {
          throw new Error("In-memory user already exists.");
        }

        const now = new Date();
        const created: InMemoryUser = {
          ...args.data,
          email,
          id: nextId("usr"),
          createdAt: now,
          updatedAt: now,
        };

        store.users.push(created);
        return created;
      },
      async update(args: { where: Record<string, unknown>; data: Partial<InMemoryUser> }) {
        const target = store.users.find((entry) => matchesWhere(entry, args.where));

        if (!target) {
          throw new Error("In-memory user not found.");
        }

        Object.assign(target, args.data, { updatedAt: new Date() });
        return target;
      },
      async delete(args: { where: Record<string, unknown> }) {
        const index = store.users.findIndex((entry) => matchesWhere(entry, args.where));

        if (index < 0) {
          throw new Error("In-memory user not found.");
        }

        const [deleted] = store.users.splice(index, 1);
        return deleted;
      },
      async count(args: { where?: Record<string, unknown> } = {}) {
        return store.users.filter((entry) => matchesWhere(entry, args.where)).length;
      },
    },
    experiencePost: {
      async findUnique(args: FindArgs) {
        const entry = store.experiencePosts.find((post) => matchesWhere(post, args.where));
        return entry ? applySelect(entry, args.select) : null;
      },
      async findMany(args: FindArgs = {}) {
        const filtered = store.experiencePosts.filter((entry) => matchesWhere(entry, args.where));
        const ordered = sortEntries(filtered, args.orderBy);
        return paginate(ordered.map((entry) => applySelect(entry, args.select)), args.skip, args.take);
      },
      async create(args: {
        data: Omit<InMemoryExperiencePost, "id" | "createdAt" | "updatedAt">;
        select?: Record<string, boolean>;
      }) {
        const now = new Date();
        const created: InMemoryExperiencePost = {
          ...args.data,
          id: nextId("post"),
          createdAt: now,
          updatedAt: now,
        };
        store.experiencePosts.push(created);
        return applySelect(created, args.select);
      },
      async update(args: {
        where: Record<string, unknown>;
        data: Partial<InMemoryExperiencePost>;
        select?: Record<string, boolean>;
      }) {
        const target = store.experiencePosts.find((entry) => matchesWhere(entry, args.where));

        if (!target) {
          throw new Error("In-memory post not found.");
        }

        Object.assign(target, args.data, { updatedAt: new Date() });
        return applySelect(target, args.select);
      },
      async delete(args: { where: Record<string, unknown> }) {
        const index = store.experiencePosts.findIndex((entry) => matchesWhere(entry, args.where));

        if (index < 0) {
          throw new Error("In-memory post not found.");
        }

        const [deleted] = store.experiencePosts.splice(index, 1);
        return deleted;
      },
      async count(args: { where?: Record<string, unknown> } = {}) {
        return store.experiencePosts.filter((entry) => matchesWhere(entry, args.where)).length;
      },
    },
    postImage: {
      async findMany(args: FindArgs = {}) {
        const filtered = store.postImages.filter((entry) => matchesWhere(entry, args.where));
        const ordered = sortEntries(filtered, args.orderBy);
        return paginate(ordered.map((entry) => applySelect(entry, args.select)), args.skip, args.take);
      },
      async create(args: { data: Omit<InMemoryPostImage, "id"> }) {
        const created: InMemoryPostImage = {
          ...args.data,
          id: nextId("img"),
        };
        store.postImages.push(created);
        return created;
      },
      async deleteMany(args: { where?: Record<string, unknown> } = {}) {
        const before = store.postImages.length;
        const kept = store.postImages.filter((entry) => !matchesWhere(entry, args.where));
        store.postImages.splice(0, store.postImages.length, ...kept);
        return { count: before - kept.length };
      },
    },
    tag: {
      async findUnique(args: FindArgs) {
        const entry = store.tags.find((tag) => matchesWhere(tag, args.where));
        return entry ? applySelect(entry, args.select) : null;
      },
      async findMany(args: FindArgs = {}) {
        const filtered = store.tags.filter((entry) => matchesWhere(entry, args.where));
        const ordered = sortEntries(filtered, args.orderBy);
        return paginate(ordered.map((entry) => applySelect(entry, args.select)), args.skip, args.take);
      },
      async create(args: { data: Omit<InMemoryTag, "id"> }) {
        if (store.tags.some((entry) => entry.name === args.data.name)) {
          throw new Error("In-memory tag already exists.");
        }

        const created: InMemoryTag = {
          ...args.data,
          id: nextId("tag"),
        };

        store.tags.push(created);
        return created;
      },
      async upsert(args: {
        where: Record<string, unknown>;
        create: Omit<InMemoryTag, "id">;
        update: Partial<InMemoryTag>;
      }) {
        const target = store.tags.find((entry) => matchesWhere(entry, args.where));

        if (target) {
          Object.assign(target, args.update);
          return target;
        }

        return this.create({ data: args.create });
      },
    },
    postTag: {
      async findMany(args: FindArgs = {}) {
        return store.postTags.filter((entry) => matchesWhere(entry, args.where));
      },
      async create(args: { data: InMemoryPostTag }) {
        if (
          store.postTags.some(
            (entry) => entry.postId === args.data.postId && entry.tagId === args.data.tagId,
          )
        ) {
          throw new Error("In-memory postTag already exists.");
        }

        store.postTags.push(args.data);
        return args.data;
      },
      async createMany(args: { data: InMemoryPostTag[] }) {
        let inserted = 0;

        for (const entry of args.data) {
          if (
            !store.postTags.some(
              (existing) => existing.postId === entry.postId && existing.tagId === entry.tagId,
            )
          ) {
            store.postTags.push(entry);
            inserted += 1;
          }
        }

        return { count: inserted };
      },
      async deleteMany(args: { where?: Record<string, unknown> } = {}) {
        const before = store.postTags.length;
        const kept = store.postTags.filter((entry) => !matchesWhere(entry, args.where));
        store.postTags.splice(0, store.postTags.length, ...kept);
        return { count: before - kept.length };
      },
    },
    like: {
      async findUnique(args: FindArgs) {
        const entry = store.likes.find((like) => matchesWhere(like, args.where));
        return entry ? applySelect(entry, args.select) : null;
      },
      async findMany(args: FindArgs = {}) {
        const filtered = store.likes.filter((entry) => matchesWhere(entry, args.where));
        const ordered = sortEntries(filtered, args.orderBy);
        return paginate(ordered.map((entry) => applySelect(entry, args.select)), args.skip, args.take);
      },
      async create(args: { data: Omit<InMemoryLike, "id" | "createdAt"> }) {
        if (
          store.likes.some(
            (entry) => entry.userId === args.data.userId && entry.postId === args.data.postId,
          )
        ) {
          throw new Error("In-memory like already exists.");
        }

        const created: InMemoryLike = {
          ...args.data,
          id: nextId("like"),
          createdAt: new Date(),
        };

        store.likes.push(created);
        return created;
      },
      async deleteMany(args: { where?: Record<string, unknown> } = {}) {
        const before = store.likes.length;
        const kept = store.likes.filter((entry) => !matchesWhere(entry, args.where));
        store.likes.splice(0, store.likes.length, ...kept);
        return { count: before - kept.length };
      },
      async count(args: { where?: Record<string, unknown> } = {}) {
        return store.likes.filter((entry) => matchesWhere(entry, args.where)).length;
      },
    },
    comment: {
      async findUnique(args: FindArgs) {
        const entry = store.comments.find((comment) => matchesWhere(comment, args.where));
        return entry ? applySelect(entry, args.select) : null;
      },
      async findMany(args: FindArgs = {}) {
        const filtered = store.comments.filter((entry) => matchesWhere(entry, args.where));
        const ordered = sortEntries(filtered, args.orderBy);
        return paginate(ordered.map((entry) => applySelect(entry, args.select)), args.skip, args.take);
      },
      async create(args: {
        data: Omit<InMemoryComment, "id" | "createdAt" | "updatedAt">;
        select?: Record<string, boolean>;
      }) {
        const now = new Date();
        const created: InMemoryComment = {
          ...args.data,
          id: nextId("cmt"),
          createdAt: now,
          updatedAt: now,
        };

        store.comments.push(created);
        return applySelect(created, args.select);
      },
      async update(args: { where: Record<string, unknown>; data: Partial<InMemoryComment> }) {
        const target = store.comments.find((entry) => matchesWhere(entry, args.where));

        if (!target) {
          throw new Error("In-memory comment not found.");
        }

        Object.assign(target, args.data, { updatedAt: new Date() });
        return target;
      },
      async delete(args: { where: Record<string, unknown> }) {
        const index = store.comments.findIndex((entry) => matchesWhere(entry, args.where));

        if (index < 0) {
          throw new Error("In-memory comment not found.");
        }

        const [deleted] = store.comments.splice(index, 1);
        return deleted;
      },
      async count(args: { where?: Record<string, unknown> } = {}) {
        return store.comments.filter((entry) => matchesWhere(entry, args.where)).length;
      },
    },
    follow: {
      async findUnique(args: FindArgs) {
        const entry = store.follows.find((follow) => matchesWhere(follow, args.where));
        return entry ? applySelect(entry, args.select) : null;
      },
      async findMany(args: FindArgs = {}) {
        const filtered = store.follows.filter((entry) => matchesWhere(entry, args.where));
        const ordered = sortEntries(filtered, args.orderBy);
        return paginate(ordered.map((entry) => applySelect(entry, args.select)), args.skip, args.take);
      },
      async create(args: { data: Omit<InMemoryFollow, "id" | "createdAt"> }) {
        if (
          store.follows.some(
            (entry) =>
              entry.followerId === args.data.followerId && entry.followingId === args.data.followingId,
          )
        ) {
          throw new Error("In-memory follow already exists.");
        }

        const created: InMemoryFollow = {
          ...args.data,
          id: nextId("fol"),
          createdAt: new Date(),
        };

        store.follows.push(created);
        return created;
      },
      async deleteMany(args: { where?: Record<string, unknown> } = {}) {
        const before = store.follows.length;
        const kept = store.follows.filter((entry) => !matchesWhere(entry, args.where));
        store.follows.splice(0, store.follows.length, ...kept);
        return { count: before - kept.length };
      },
      async count(args: { where?: Record<string, unknown> } = {}) {
        return store.follows.filter((entry) => matchesWhere(entry, args.where)).length;
      },
    },
    report: {
      async findUnique(args: FindArgs) {
        const entry = store.reports.find((report) => matchesWhere(report, args.where));
        return entry ? applySelect(entry, args.select) : null;
      },
      async findMany(args: FindArgs = {}) {
        const filtered = store.reports.filter((entry) => matchesWhere(entry, args.where));
        const ordered = sortEntries(filtered, args.orderBy);
        return paginate(ordered.map((entry) => applySelect(entry, args.select)), args.skip, args.take);
      },
      async create(args: {
        data: Omit<InMemoryReport, "id" | "createdAt" | "updatedAt" | "status"> & {
          status?: ReportStatus;
        };
      }) {
        const now = new Date();
        const created: InMemoryReport = {
          ...args.data,
          id: nextId("rpt"),
          status: args.data.status ?? ReportStatus.pending,
          createdAt: now,
          updatedAt: now,
        };

        store.reports.push(created);
        return created;
      },
      async update(args: { where: Record<string, unknown>; data: Partial<InMemoryReport> }) {
        const target = store.reports.find((entry) => matchesWhere(entry, args.where));

        if (!target) {
          throw new Error("In-memory report not found.");
        }

        Object.assign(target, args.data, { updatedAt: new Date() });
        return target;
      },
      async count(args: { where?: Record<string, unknown> } = {}) {
        return store.reports.filter((entry) => matchesWhere(entry, args.where)).length;
      },
    },
    accommodationRating: {
      async findUnique(args: FindArgs) {
        const entry = store.accommodationRatings.find((rating) => matchesWhere(rating, args.where));
        return entry ? applySelect(entry, args.select) : null;
      },
      async findMany(args: FindArgs = {}) {
        const filtered = store.accommodationRatings.filter((entry) => matchesWhere(entry, args.where));
        const ordered = sortEntries(filtered, args.orderBy);
        return paginate(ordered.map((entry) => applySelect(entry, args.select)), args.skip, args.take);
      },
      async create(args: {
        data: Omit<InMemoryAccommodationRating, "id" | "createdAt" | "updatedAt" | "isVerifiedStay"> & {
          isVerifiedStay?: boolean;
        };
      }) {
        if (
          store.accommodationRatings.some(
            (entry) => entry.postId === args.data.postId && entry.userId === args.data.userId,
          )
        ) {
          throw new Error("In-memory accommodation rating already exists.");
        }

        const now = new Date();
        const created: InMemoryAccommodationRating = {
          ...args.data,
          id: nextId("rat"),
          isVerifiedStay: args.data.isVerifiedStay ?? false,
          createdAt: now,
          updatedAt: now,
        };

        store.accommodationRatings.push(created);
        return created;
      },
      async update(args: { where: Record<string, unknown>; data: Partial<InMemoryAccommodationRating> }) {
        const target = store.accommodationRatings.find((entry) => matchesWhere(entry, args.where));

        if (!target) {
          throw new Error("In-memory accommodation rating not found.");
        }

        Object.assign(target, args.data, { updatedAt: new Date() });
        return target;
      },
      async count(args: { where?: Record<string, unknown> } = {}) {
        return store.accommodationRatings.filter((entry) => matchesWhere(entry, args.where)).length;
      },
    },
    passwordResetToken: {
      async findUnique(args: FindArgs) {
        const entry = store.passwordResetTokens.find((t) => matchesWhere(t, args.where));
        return entry ? applySelect(entry, args.select) : null;
      },
      async create(args: { data: Omit<InMemoryPasswordResetToken, "id" | "createdAt" | "usedAt"> }) {
        const created: InMemoryPasswordResetToken = {
          ...args.data,
          id: nextId("prt"),
          usedAt: null,
          createdAt: new Date(),
        };
        store.passwordResetTokens.push(created);
        return created;
      },
      async update(args: { where: Record<string, unknown>; data: Partial<InMemoryPasswordResetToken> }) {
        const target = store.passwordResetTokens.find((entry) => matchesWhere(entry, args.where));
        if (!target) {
          throw new Error("In-memory password reset token not found.");
        }
        Object.assign(target, args.data);
        return target;
      },
    },
    async $transaction(operations: Promise<unknown>[]) {
      return Promise.all(operations);
    },
  };
}

const useInMemoryDb = process.env.USE_IN_MEMORY_DB === "true" && process.env.NODE_ENV !== "production";

const globalForInMemory = globalThis as unknown as {
  inMemoryStore: InMemoryStore | undefined;
  inMemoryBaselineLogged: boolean | undefined;
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const BASELINE_TAGS = baselineData.TAGS as string[];
const BASELINE_USERS = baselineData.BASELINE_USERS as Array<{
  email: string;
  username: string;
  displayName: string;
  bio: string;
  location: string;
  avatarUrl: string;
  stories: Array<{
    title: string;
    body: string;
    locationCity: string;
    locationCountry: string;
    propertyName: string;
    tripType: string;
    tags: string[];
    images: string[];
  }>;
}>;

const TRIP_TYPE_BY_KEY: Record<string, TripType> = {
  solo: TripType.solo,
  couple: TripType.couple,
  family: TripType.family,
  friends: TripType.friends,
  business: TripType.business,
};

const BASELINE_PASSWORD_HASH = "$2b$12$XJK5B0hXDm4P4tMG6todnuFPHuKFkF0PhqnLH4DU5Fa947p1Njc/C";
const BASELINE_ADMIN_EMAIL = "anna@trustora.local";

function createBaselineInMemoryStore(): InMemoryStore {
  const now = new Date();
  const randomDateWithinLast30Days = () => {
    const maxMs = 30 * 24 * 60 * 60 * 1000;
    return new Date(now.getTime() - Math.floor(Math.random() * maxMs));
  };

  const weightedScore = (weights: Array<[number, number]>) => {
    const roll = Math.random();
    let cumulative = 0;

    for (const [score, weight] of weights) {
      cumulative += weight;
      if (roll <= cumulative) {
        return score;
      }
    }

    return weights[weights.length - 1][0];
  };

  const randomCategoryScore = (category: string) => {
    // Realistic creator ratings: mostly 4/5, occasional 3.
    const defaultWeights: Array<[number, number]> = [
      [3, 0.14],
      [4, 0.52],
      [5, 0.34],
    ];

    const categoryWeights: Record<string, Array<[number, number]>> = {
      communication: [
        [3, 0.09],
        [4, 0.48],
        [5, 0.43],
      ],
      checkIn: [
        [3, 0.1],
        [4, 0.5],
        [5, 0.4],
      ],
      location: [
        [3, 0.12],
        [4, 0.5],
        [5, 0.38],
      ],
      value: [
        [3, 0.22],
        [4, 0.56],
        [5, 0.22],
      ],
      facilities: [
        [3, 0.2],
        [4, 0.54],
        [5, 0.26],
      ],
    };

    return weightedScore(categoryWeights[category] ?? defaultWeights);
  };

  const buildRandomAccommodationRating = () => {
    const cleanliness = randomCategoryScore("cleanliness");
    const accuracy = randomCategoryScore("accuracy");
    const checkIn = randomCategoryScore("checkIn");
    const communication = randomCategoryScore("communication");
    const location = randomCategoryScore("location");
    const value = randomCategoryScore("value");
    const comfort = randomCategoryScore("comfort");
    const facilities = randomCategoryScore("facilities");

    const categories = [
      cleanliness,
      accuracy,
      checkIn,
      communication,
      location,
      value,
      comfort,
      facilities,
    ];

    const overallScore =
      Math.round((categories.reduce((sum, score) => sum + score, 0) / categories.length) * 10) / 10;

    return {
      overallScore,
      cleanliness,
      accuracy,
      checkIn,
      communication,
      location,
      value,
      comfort,
      facilities,
      wouldStayAgain: Math.random() > 0.08,
      reviewText: null,
      isVerifiedStay: false,
    };
  };

  const toSlug = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 64);

  const preferredUserIds: Record<string, string> = {
    "anna@trustora.local": "usr_anna",
    "lukas@trustora.local": "usr_lukas",
    "sofia@trustora.local": "usr_sofia",
    "marco@trustora.local": "usr_marco",
    "yuki@trustora.local": "usr_yuki",
    "clara@trustora.local": "usr_clara",
    "james@trustora.local": "usr_james",
  };

  const users: InMemoryUser[] = BASELINE_USERS.map((seedUser, index) => ({
    id: preferredUserIds[seedUser.email] ?? `usr_${index + 1}`,
    email: seedUser.email,
    username: seedUser.username,
    displayName: seedUser.displayName,
    avatarUrl: seedUser.avatarUrl,
    bio: seedUser.bio,
    location: seedUser.location,
    role: seedUser.email === BASELINE_ADMIN_EMAIL ? UserRole.admin : UserRole.user,
    passwordHash: BASELINE_PASSWORD_HASH,
    isBanned: false,
    createdAt: randomDateWithinLast30Days(),
    updatedAt: now,
  }));

  const userIdByEmail = new Map(users.map((user) => [user.email, user.id]));

  const tags: InMemoryTag[] = BASELINE_TAGS.map((name, index) => ({
    id: `tag_${index + 1}`,
    name,
  }));
  const tagByName = new Map(tags.map((tag) => [tag.name, tag.id]));

  const slugCounts = new Map<string, number>();
  const postSeeds: Array<{
    id: string;
    slug: string;
    title: string;
    body: string;
    locationCity: string;
    locationCountry: string;
    propertyName: string;
    tripType: TripType;
    authorId: string;
    tags: string[];
    images: string[];
  }> = BASELINE_USERS.flatMap((seedUser, userIndex) => {
    const authorId = userIdByEmail.get(seedUser.email);
    if (!authorId) {
      return [];
    }

    return seedUser.stories.map((story, storyIndex) => {
      const baseSlug = toSlug(story.title);
      const collisionCount = slugCounts.get(baseSlug) ?? 0;
      slugCounts.set(baseSlug, collisionCount + 1);
      const slug = collisionCount === 0 ? baseSlug : `${baseSlug}-${String(collisionCount + 1).padStart(2, "0")}`;

      return {
        id: `post_${userIndex + 1}_${storyIndex + 1}`,
        slug,
        title: story.title,
        body: story.body,
        locationCity: story.locationCity,
        locationCountry: story.locationCountry,
        propertyName: story.propertyName,
        tripType: TRIP_TYPE_BY_KEY[story.tripType] ?? TripType.solo,
        authorId,
        tags: story.tags,
        images: story.images,
      };
    });
  });

  const experiencePosts: InMemoryExperiencePost[] = postSeeds.map((post) => {
    const createdAt = randomDateWithinLast30Days();

    return {
      id: post.id,
      slug: post.slug,
      status: "published",
      publishedAt: createdAt,
      title: post.title,
      body: post.body,
      locationCity: post.locationCity,
      locationCountry: post.locationCountry,
      propertyName: post.propertyName,
      tripType: post.tripType,
      authorId: post.authorId,
      createdAt,
      updatedAt: now,
    };
  });

  const postImages: InMemoryPostImage[] = postSeeds.flatMap((post) =>
    post.images.map((url, index) => ({
      id: `img_${post.id}_${index + 1}`,
      postId: post.id,
      cloudinaryUrl: url,
      order: index,
    })),
  );

  const postTags: InMemoryPostTag[] = postSeeds.flatMap((post) =>
    post.tags
      .map((tagName) => tagByName.get(tagName))
      .filter((tagId): tagId is string => Boolean(tagId))
      .map((tagId) => ({
        postId: post.id,
        tagId,
      })),
  );

  const likes: InMemoryLike[] = experiencePosts.slice(0, 18).map((post, index) => {
    const fallbackUser = users[index % users.length];
    const liker = users.find((user) => user.id !== post.authorId) ?? fallbackUser;

    return {
      id: `like_${index + 1}`,
      userId: liker.id,
      postId: post.id,
      createdAt: randomDateWithinLast30Days(),
    };
  });

  const commentBodies = [
    "Super useful notes. Keeping this one for my next trip planning.",
    "Great vibe in the photos and really practical details.",
    "Exactly the kind of stay review I like to read.",
    "Adding this to my saved list right now.",
  ];

  const comments: InMemoryComment[] = experiencePosts.slice(0, 16).map((post, index) => {
    const fallbackUser = users[(index + 1) % users.length];
    const author = users.find((user) => user.id !== post.authorId) ?? fallbackUser;
    const createdAt = randomDateWithinLast30Days();

    return {
      id: `cmt_${index + 1}`,
      body: commentBodies[index % commentBodies.length],
      postId: post.id,
      authorId: author.id,
      createdAt,
      updatedAt: createdAt,
    };
  });

  const follows: InMemoryFollow[] = [];
  let followIndex = 1;
  for (let i = 0; i < users.length; i += 1) {
    for (let j = i + 1; j < users.length; j += 1) {
      follows.push({
        id: `fll_${followIndex++}`,
        followerId: users[i].id,
        followingId: users[j].id,
        createdAt: now,
      });

      if (j % 2 === 0) {
        follows.push({
          id: `fll_${followIndex++}`,
          followerId: users[j].id,
          followingId: users[i].id,
          createdAt: now,
        });
      }
    }
  }

  const reportReasons = [
    "Spam or promotional content",
    "Harassment in the text",
    "Misleading stay description",
    "Inappropriate language",
    "Potential scam indicators",
    "Off-topic content",
  ];

  const reportTargets = [
    ...experiencePosts.slice(0, 8).map((post) => ({
      targetType: ReportTargetType.post,
      targetId: post.id,
      authorId: post.authorId,
    })),
    ...comments.slice(0, 8).map((comment) => ({
      targetType: ReportTargetType.comment,
      targetId: comment.id,
      authorId: comment.authorId,
    })),
  ];

  const statuses = [ReportStatus.pending, ReportStatus.resolved, ReportStatus.dismissed] as const;

  const reports: InMemoryReport[] = reportTargets.map((target, index) => {
    const reporterPool = users.filter((user) => user.id !== target.authorId);
    const reporter = reporterPool[index % reporterPool.length] ?? users[index % users.length];
    const createdAt = randomDateWithinLast30Days();

    return {
      id: `rpt_${index + 1}`,
      reporterId: reporter.id,
      targetType: target.targetType,
      targetId: target.targetId,
      reason: reportReasons[index % reportReasons.length],
      status: statuses[index % statuses.length],
      createdAt,
      updatedAt: createdAt,
    };
  });

  const accommodationRatings: InMemoryAccommodationRating[] = experiencePosts.map((post, index) => {
    const rating = buildRandomAccommodationRating();
    const createdAt = randomDateWithinLast30Days();

    return {
      id: `rat_${index + 1}`,
      postId: post.id,
      userId: post.authorId,
      ...rating,
      createdAt,
      updatedAt: createdAt,
    };
  });

  return {
    users,
    experiencePosts,
    postImages,
    tags,
    postTags,
    likes,
    comments,
    follows,
    reports,
    accommodationRatings,
    passwordResetTokens: [],
  };
}

const inMemoryStore =
  globalForInMemory.inMemoryStore ??
  (useInMemoryDb
    ? createBaselineInMemoryStore()
    : {
        users: [],
        experiencePosts: [],
        postImages: [],
        tags: [],
        postTags: [],
        likes: [],
        comments: [],
        follows: [],
        reports: [],
        accommodationRatings: [],
        passwordResetTokens: [],
      });

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

const inMemoryDb = createInMemoryDb(inMemoryStore);
type DbClient = typeof inMemoryDb;

export const db: DbClient = useInMemoryDb
  ? inMemoryDb
  : (prisma as unknown as DbClient);

if (useInMemoryDb && process.env.NODE_ENV !== "production") {
  if (!globalForInMemory.inMemoryBaselineLogged) {
    console.info(
      "[in-memory-db] Baseline loaded:",
      JSON.stringify({
        users: inMemoryStore.users.length,
        posts: inMemoryStore.experiencePosts.length,
        images: inMemoryStore.postImages.length,
        tags: inMemoryStore.tags.length,
        postTags: inMemoryStore.postTags.length,
        likes: inMemoryStore.likes.length,
        comments: inMemoryStore.comments.length,
        follows: inMemoryStore.follows.length,
        accommodationRatings: inMemoryStore.accommodationRatings.length,
      }),
    );
    globalForInMemory.inMemoryBaselineLogged = true;
  }

  globalForInMemory.inMemoryStore = inMemoryStore;
}

if (!useInMemoryDb && process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

