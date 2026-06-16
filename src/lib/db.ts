import { PrismaClient, ReportStatus, ReportTargetType, TripType, UserRole } from "@prisma/client";

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
      async create(args: { data: Omit<InMemoryExperiencePost, "id" | "createdAt" | "updatedAt"> }) {
        const now = new Date();
        const created: InMemoryExperiencePost = {
          ...args.data,
          id: nextId("post"),
          createdAt: now,
          updatedAt: now,
        };
        store.experiencePosts.push(created);
        return created;
      },
      async update(args: { where: Record<string, unknown>; data: Partial<InMemoryExperiencePost> }) {
        const target = store.experiencePosts.find((entry) => matchesWhere(entry, args.where));

        if (!target) {
          throw new Error("In-memory post not found.");
        }

        Object.assign(target, args.data, { updatedAt: new Date() });
        return target;
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
      async create(args: { data: Omit<InMemoryComment, "id" | "createdAt" | "updatedAt"> }) {
        const now = new Date();
        const created: InMemoryComment = {
          ...args.data,
          id: nextId("cmt"),
          createdAt: now,
          updatedAt: now,
        };

        store.comments.push(created);
        return created;
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
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const BASELINE_TAGS = [
  "beach",
  "city-break",
  "countryside",
  "luxury",
  "budget",
  "pet-friendly",
  "unique-stay",
  "remote-work",
] as const;

const BASELINE_PASSWORD_HASH = "$2b$12$XJK5B0hXDm4P4tMG6todnuFPHuKFkF0PhqnLH4DU5Fa947p1Njc/C";

function createBaselineInMemoryStore(): InMemoryStore {
  const now = new Date();
  const minutesAgo = (value: number) => new Date(now.getTime() - value * 60 * 1000);

  const users: InMemoryUser[] = [
    {
      id: "usr_anna",
      email: "anna@realbnb.local",
      username: "annawanders",
      displayName: "Anna Mueller",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
      bio: "Coffee first, then city walks and hidden guesthouse gems.",
      location: "Berlin, Germany",
      role: UserRole.user,
      passwordHash: BASELINE_PASSWORD_HASH,
      isBanned: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "usr_lukas",
      email: "lukas@realbnb.local",
      username: "lukasontheroad",
      displayName: "Lukas Schneider",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
      bio: "Chasing mountain air, surf spots, and practical stays for longer trips.",
      location: "Munich, Germany",
      role: UserRole.user,
      passwordHash: BASELINE_PASSWORD_HASH,
      isBanned: false,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const tags: InMemoryTag[] = BASELINE_TAGS.map((name, index) => ({
    id: `tag_${index + 1}`,
    name,
  }));
  const tagByName = new Map(tags.map((tag) => [tag.name, tag.id]));

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
  }> = [
    {
      id: "post_a_1",
      slug: "sunrise-rooftop-in-lisbon",
      title: "Sunrise Rooftop in Lisbon",
      body: "Quiet mornings, orange rooftops, and a tiny balcony that became my office for three days.",
      locationCity: "Lisbon",
      locationCountry: "Portugal",
      propertyName: "Alfama Rooftop Studio",
      tripType: TripType.solo,
      authorId: "usr_anna",
      tags: ["city-break", "remote-work"],
      images: [
        "https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?auto=format&fit=crop&w=1400&q=80",
        "https://images.unsplash.com/photo-1513735492246-483525079686?auto=format&fit=crop&w=1400&q=80",
      ],
    },
    {
      id: "post_a_2",
      slug: "slow-weekend-at-lake-como",
      title: "Slow Weekend at Lake Como",
      body: "A small villa near the water with mountain views and zero urge to check emails.",
      locationCity: "Como",
      locationCountry: "Italy",
      propertyName: "Villa Bellavista",
      tripType: TripType.couple,
      authorId: "usr_anna",
      tags: ["luxury", "countryside"],
      images: [
        "https://images.unsplash.com/photo-1505764706515-aa95265c5abc?auto=format&fit=crop&w=1400&q=80",
      ],
    },
    {
      id: "post_a_3",
      slug: "rainy-nights-in-kyoto",
      title: "Rainy Nights in Kyoto",
      body: "Tatami floors, tea every evening, and a calm neighborhood close to tiny ramen bars.",
      locationCity: "Kyoto",
      locationCountry: "Japan",
      propertyName: "Gion Garden Inn",
      tripType: TripType.solo,
      authorId: "usr_anna",
      tags: ["city-break", "unique-stay"],
      images: [
        "https://images.unsplash.com/photo-1492571350019-22de08371fd3?auto=format&fit=crop&w=1400&q=80",
      ],
    },
    {
      id: "post_a_4",
      slug: "budget-gem-in-valencia",
      title: "Budget Gem in Valencia",
      body: "Small room, great host, free bikes, and incredible local market food around the corner.",
      locationCity: "Valencia",
      locationCountry: "Spain",
      propertyName: "Ruzafa Guest Rooms",
      tripType: TripType.friends,
      authorId: "usr_anna",
      tags: ["budget", "city-break"],
      images: [
        "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1400&q=80",
        "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1400&q=80",
      ],
    },
    {
      id: "post_a_5",
      slug: "work-sprint-in-tallinn",
      title: "Work Sprint in Tallinn",
      body: "Fast wifi, minimalist apartment, and enough cafes nearby for a full week of focus.",
      locationCity: "Tallinn",
      locationCountry: "Estonia",
      propertyName: "Old Town Loft",
      tripType: TripType.business,
      authorId: "usr_anna",
      tags: ["remote-work", "city-break"],
      images: [
        "https://images.unsplash.com/photo-1519834785169-98be25ec3f84?auto=format&fit=crop&w=1400&q=80",
      ],
    },
    {
      id: "post_l_1",
      slug: "surf-house-in-ericeira",
      title: "Surf House in Ericeira",
      body: "Shared kitchen, sunset cliffs, and walking distance to two beginner-friendly beaches.",
      locationCity: "Ericeira",
      locationCountry: "Portugal",
      propertyName: "Blue Tide Surf House",
      tripType: TripType.friends,
      authorId: "usr_lukas",
      tags: ["beach", "budget"],
      images: [
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80",
        "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=80",
      ],
    },
    {
      id: "post_l_2",
      slug: "alpine-cabin-near-innsbruck",
      title: "Alpine Cabin near Innsbruck",
      body: "Wood interiors, fresh snow, and a sauna with mountain views after long hiking days.",
      locationCity: "Innsbruck",
      locationCountry: "Austria",
      propertyName: "Nordkette Cabin",
      tripType: TripType.couple,
      authorId: "usr_lukas",
      tags: ["countryside", "luxury"],
      images: [
        "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1400&q=80",
      ],
    },
    {
      id: "post_l_3",
      slug: "family-week-in-copenhagen",
      title: "Family Week in Copenhagen",
      body: "Bright apartment, stroller-friendly neighborhood, and parks in every direction.",
      locationCity: "Copenhagen",
      locationCountry: "Denmark",
      propertyName: "Norrebro Family Flat",
      tripType: TripType.family,
      authorId: "usr_lukas",
      tags: ["city-break", "pet-friendly"],
      images: [
        "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=1400&q=80",
      ],
    },
    {
      id: "post_l_4",
      slug: "remote-month-in-tbilisi",
      title: "Remote Month in Tbilisi",
      body: "Affordable loft, super welcoming host, and plenty of coworking spots nearby.",
      locationCity: "Tbilisi",
      locationCountry: "Georgia",
      propertyName: "Mtatsminda Loft",
      tripType: TripType.business,
      authorId: "usr_lukas",
      tags: ["remote-work", "budget"],
      images: [
        "https://images.unsplash.com/photo-1544989164-31b2b9a3161f?auto=format&fit=crop&w=1400&q=80",
        "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1400&q=80",
      ],
    },
    {
      id: "post_l_5",
      slug: "island-pause-in-hvar",
      title: "Island Pause in Hvar",
      body: "Stone house, crystal water, and simple evenings with local food and no schedule.",
      locationCity: "Hvar",
      locationCountry: "Croatia",
      propertyName: "Old Port Retreat",
      tripType: TripType.couple,
      authorId: "usr_lukas",
      tags: ["beach", "unique-stay"],
      images: [
        "https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?auto=format&fit=crop&w=1400&q=80",
      ],
    },
  ];

  const experiencePosts: InMemoryExperiencePost[] = postSeeds.map((post) => ({
    id: post.id,
    slug: post.slug,
    title: post.title,
    body: post.body,
    locationCity: post.locationCity,
    locationCountry: post.locationCountry,
    propertyName: post.propertyName,
    tripType: post.tripType,
    authorId: post.authorId,
    createdAt: now,
    updatedAt: now,
  }));

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

  const likes: InMemoryLike[] = [
    {
      id: "like_1",
      userId: "usr_anna",
      postId: "post_l_1",
      createdAt: now,
    },
    {
      id: "like_2",
      userId: "usr_anna",
      postId: "post_l_3",
      createdAt: now,
    },
    {
      id: "like_3",
      userId: "usr_lukas",
      postId: "post_a_1",
      createdAt: now,
    },
  ];

  const comments: InMemoryComment[] = [
    {
      id: "cmt_1",
      body: "Loved this write-up. Adding this place to my shortlist for late summer.",
      postId: "post_l_1",
      authorId: "usr_anna",
      createdAt: minutesAgo(45),
      updatedAt: minutesAgo(45),
    },
    {
      id: "cmt_2",
      body: "Great practical details, especially about location and transport.",
      postId: "post_l_2",
      authorId: "usr_anna",
      createdAt: minutesAgo(30),
      updatedAt: minutesAgo(30),
    },
    {
      id: "cmt_3",
      body: "Thanks for sharing this. The photos and notes made planning super easy.",
      postId: "post_a_1",
      authorId: "usr_lukas",
      createdAt: minutesAgo(20),
      updatedAt: minutesAgo(20),
    },
    {
      id: "cmt_4",
      body: "This sounds exactly like the kind of stay I was looking for.",
      postId: "post_a_2",
      authorId: "usr_lukas",
      createdAt: minutesAgo(10),
      updatedAt: minutesAgo(10),
    },
  ];

  return {
    users,
    experiencePosts,
    postImages,
    tags,
    postTags,
    likes,
    comments,
    follows: [],
    reports: [],
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
        passwordResetTokens: [],
      });

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

const inMemoryDb = createInMemoryDb(inMemoryStore);

export const db = useInMemoryDb
  ? inMemoryDb
  : prisma;

if (useInMemoryDb && process.env.NODE_ENV !== "production") {
  globalForInMemory.inMemoryStore = inMemoryStore;
}

if (!useInMemoryDb && process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
