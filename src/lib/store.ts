import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Item, ItemPatch, NewItem, Post, PostPatch, Work, WorkPatch } from "./types";

export interface Store {
  list(): Promise<Item[]>;
  findByUrl(url: string): Promise<Item | null>;
  create(input: NewItem): Promise<Item>;
  update(id: string, patch: ItemPatch): Promise<Item | null>;
  remove(id: string): Promise<boolean>;

  listPosts(): Promise<Post[]>;
  getPost(id: string): Promise<Post | null>;
  getPostBySlug(slug: string): Promise<Post | null>;
  createPost(input?: Partial<Pick<Post, "title" | "body">>): Promise<Post>;
  updatePost(id: string, patch: PostPatch): Promise<Post | null>;
  removePost(id: string): Promise<boolean>;

  listWorks(): Promise<Work[]>;
  getWork(id: string): Promise<Work | null>;
  getWorkBySlug(slug: string): Promise<Work | null>;
  createWork(): Promise<Work>;
  updateWork(id: string, patch: WorkPatch): Promise<Work | null>;
  removeWork(id: string): Promise<boolean>;
}

type WorkRow = {
  id: string;
  slug: string;
  title: string;
  kind: string;
  role: string;
  year: string;
  note: string;
  thumb: string;
  body: string;
  status: string;
  created_at: Date | string;
  updated_at: Date | string;
};

function rowToWork(r: WorkRow): Work {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    kind: r.kind,
    role: r.role,
    year: r.year,
    note: r.note,
    thumb: r.thumb,
    body: r.body,
    status: r.status === "published" ? "published" : "draft",
    createdAt: new Date(r.created_at).toISOString(),
    updatedAt: new Date(r.updated_at).toISOString(),
  };
}

/** Newest year first, then most recently edited. */
function sortWorks(works: Work[]): Work[] {
  return [...works].sort((a, b) => (b.year || "").localeCompare(a.year || "") || b.updatedAt.localeCompare(a.updatedAt));
}

type PostRow = {
  id: string;
  slug: string;
  title: string;
  body: string;
  tag: string;
  status: string;
  scope: string;
  created_at: Date | string;
  updated_at: Date | string;
  published_at: Date | string | null;
};

function rowToPost(r: PostRow): Post {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    body: r.body,
    tag: r.tag,
    status: r.status === "published" ? "published" : "draft",
    scope: r.scope === "unlisted" ? "unlisted" : "public",
    createdAt: new Date(r.created_at).toISOString(),
    updatedAt: new Date(r.updated_at).toISOString(),
    publishedAt: r.published_at ? new Date(r.published_at).toISOString() : null,
  };
}

/** Newest first: published posts by publish date, drafts by last edit. */
function sortPosts(posts: Post[]): Post[] {
  const key = (p: Post) => p.publishedAt ?? p.updatedAt;
  return [...posts].sort((a, b) => key(b).localeCompare(key(a)));
}

/* ---------- Postgres (production) ---------- */

type Row = {
  id: string;
  url: string;
  domain: string;
  title: string;
  description: string | null;
  image: string | null;
  memo: string;
  tag: string;
  created_at: Date | string;
};

function rowToItem(r: Row): Item {
  return {
    id: r.id,
    url: r.url,
    domain: r.domain,
    title: r.title,
    description: r.description ?? "",
    image: r.image ?? "",
    memo: r.memo,
    tag: r.tag,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

async function pgStore(connection: string): Promise<Store> {
  const { default: postgres } = await import("postgres");
  const g = globalThis as unknown as { __archiveSql?: ReturnType<typeof postgres>; __archiveReady?: Promise<void> };
  if (!g.__archiveSql) {
    g.__archiveSql = postgres(connection, { ssl: "require", max: 3, idle_timeout: 20, prepare: false });
  }
  const sql = g.__archiveSql;
  if (!g.__archiveReady) {
    g.__archiveReady = sql`
      CREATE TABLE IF NOT EXISTS items (
        id text PRIMARY KEY,
        url text NOT NULL UNIQUE,
        domain text NOT NULL,
        title text NOT NULL,
        description text,
        image text,
        memo text NOT NULL DEFAULT '',
        tag text NOT NULL DEFAULT '',
        created_at timestamptz NOT NULL DEFAULT now()
      )`
      .then(
        () => sql`
      CREATE TABLE IF NOT EXISTS posts (
        id text PRIMARY KEY,
        slug text NOT NULL UNIQUE,
        title text NOT NULL DEFAULT '',
        body text NOT NULL DEFAULT '',
        tag text NOT NULL DEFAULT '',
        status text NOT NULL DEFAULT 'draft',
        scope text NOT NULL DEFAULT 'public',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        published_at timestamptz
      )`,
      )
      .then(
        () => sql`
      CREATE TABLE IF NOT EXISTS works (
        id text PRIMARY KEY,
        slug text NOT NULL UNIQUE,
        title text NOT NULL DEFAULT '',
        kind text NOT NULL DEFAULT '',
        role text NOT NULL DEFAULT '',
        year text NOT NULL DEFAULT '',
        note text NOT NULL DEFAULT '',
        thumb text NOT NULL DEFAULT '',
        body text NOT NULL DEFAULT '',
        status text NOT NULL DEFAULT 'draft',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )`,
      )
      .then(() => undefined);
  }
  await g.__archiveReady;

  return {
    async listWorks() {
      const rows = await sql<WorkRow[]>`SELECT * FROM works`;
      return sortWorks(rows.map(rowToWork));
    },
    async getWork(id) {
      const rows = await sql<WorkRow[]>`SELECT * FROM works WHERE id = ${id} LIMIT 1`;
      return rows[0] ? rowToWork(rows[0]) : null;
    },
    async getWorkBySlug(slug) {
      const rows = await sql<WorkRow[]>`SELECT * FROM works WHERE slug = ${slug} LIMIT 1`;
      return rows[0] ? rowToWork(rows[0]) : null;
    },
    async createWork() {
      const id = randomUUID();
      const rows = await sql<WorkRow[]>`INSERT INTO works (id, slug, year) VALUES (${id}, ${"d-" + id.slice(0, 8)}, ${String(new Date().getFullYear())}) RETURNING *`;
      return rowToWork(rows[0]);
    },
    async updateWork(id, patch) {
      const rows = await sql<WorkRow[]>`
        UPDATE works SET
          slug = COALESCE(${patch.slug ?? null}, slug),
          title = COALESCE(${patch.title ?? null}, title),
          kind = COALESCE(${patch.kind ?? null}, kind),
          role = COALESCE(${patch.role ?? null}, role),
          year = COALESCE(${patch.year ?? null}, year),
          note = COALESCE(${patch.note ?? null}, note),
          thumb = COALESCE(${patch.thumb ?? null}, thumb),
          body = COALESCE(${patch.body ?? null}, body),
          status = COALESCE(${patch.status ?? null}, status),
          updated_at = now()
        WHERE id = ${id} RETURNING *`;
      return rows[0] ? rowToWork(rows[0]) : null;
    },
    async removeWork(id) {
      const rows = await sql`DELETE FROM works WHERE id = ${id} RETURNING id`;
      return rows.length > 0;
    },

    async listPosts() {
      const rows = await sql<PostRow[]>`SELECT * FROM posts`;
      return sortPosts(rows.map(rowToPost));
    },
    async getPost(id) {
      const rows = await sql<PostRow[]>`SELECT * FROM posts WHERE id = ${id} LIMIT 1`;
      return rows[0] ? rowToPost(rows[0]) : null;
    },
    async getPostBySlug(slug) {
      const rows = await sql<PostRow[]>`SELECT * FROM posts WHERE slug = ${slug} LIMIT 1`;
      return rows[0] ? rowToPost(rows[0]) : null;
    },
    async createPost(input = {}) {
      const id = randomUUID();
      const slug = "d-" + id.slice(0, 8); // draft slug; replaced when publishing
      const rows = await sql<PostRow[]>`
        INSERT INTO posts (id, slug, title, body) VALUES (${id}, ${slug}, ${input.title ?? ""}, ${input.body ?? ""}) RETURNING *`;
      return rowToPost(rows[0]);
    },
    async updatePost(id, patch) {
      const rows = await sql<PostRow[]>`
        UPDATE posts SET
          slug = COALESCE(${patch.slug ?? null}, slug),
          title = COALESCE(${patch.title ?? null}, title),
          body = COALESCE(${patch.body ?? null}, body),
          tag = COALESCE(${patch.tag ?? null}, tag),
          status = COALESCE(${patch.status ?? null}, status),
          scope = COALESCE(${patch.scope ?? null}, scope),
          updated_at = now(),
          published_at = CASE
            WHEN ${patch.status ?? null} = 'published' AND published_at IS NULL THEN now()
            WHEN ${patch.status ?? null} = 'draft' THEN NULL
            ELSE published_at END
        WHERE id = ${id} RETURNING *`;
      return rows[0] ? rowToPost(rows[0]) : null;
    },
    async removePost(id) {
      const rows = await sql`DELETE FROM posts WHERE id = ${id} RETURNING id`;
      return rows.length > 0;
    },

    async list() {
      const rows = await sql<Row[]>`SELECT * FROM items ORDER BY created_at DESC`;
      return rows.map(rowToItem);
    },
    async findByUrl(url) {
      const rows = await sql<Row[]>`SELECT * FROM items WHERE url = ${url} LIMIT 1`;
      return rows[0] ? rowToItem(rows[0]) : null;
    },
    async create(input) {
      const id = randomUUID();
      const rows = await sql<Row[]>`
        INSERT INTO items (id, url, domain, title, description, image, memo, tag)
        VALUES (${id}, ${input.url}, ${input.domain}, ${input.title}, ${input.description}, ${input.image}, ${input.memo}, ${input.tag})
        RETURNING *`;
      return rowToItem(rows[0]);
    },
    async update(id, patch) {
      const rows = await sql<Row[]>`
        UPDATE items SET
          memo = COALESCE(${patch.memo ?? null}, memo),
          tag = COALESCE(${patch.tag ?? null}, tag),
          title = COALESCE(${patch.title ?? null}, title)
        WHERE id = ${id} RETURNING *`;
      return rows[0] ? rowToItem(rows[0]) : null;
    },
    async remove(id) {
      const rows = await sql`DELETE FROM items WHERE id = ${id} RETURNING id`;
      return rows.length > 0;
    },
  };
}

/* ---------- JSON file (local development without a database) ---------- */

const FILE = path.join(process.cwd(), ".data", "items.json");
let fileLock: Promise<unknown> = Promise.resolve();

async function readFile(): Promise<Item[]> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as Item[];
  } catch {
    return [];
  }
}
async function writeFile(items: Item[]) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(items, null, 2), "utf8");
}
function locked<T>(fn: () => Promise<T>): Promise<T> {
  const next = fileLock.then(fn, fn);
  fileLock = next.catch(() => undefined);
  return next;
}

const POSTS_FILE = path.join(process.cwd(), ".data", "posts.json");
async function readPosts(): Promise<Post[]> {
  try {
    return JSON.parse(await fs.readFile(POSTS_FILE, "utf8")) as Post[];
  } catch {
    return [];
  }
}
async function writePosts(posts: Post[]) {
  await fs.mkdir(path.dirname(POSTS_FILE), { recursive: true });
  await fs.writeFile(POSTS_FILE, JSON.stringify(posts, null, 2), "utf8");
}

const WORKS_FILE = path.join(process.cwd(), ".data", "works.json");
async function readWorks(): Promise<Work[]> {
  try {
    return JSON.parse(await fs.readFile(WORKS_FILE, "utf8")) as Work[];
  } catch {
    return [];
  }
}
async function writeWorks(works: Work[]) {
  await fs.mkdir(path.dirname(WORKS_FILE), { recursive: true });
  await fs.writeFile(WORKS_FILE, JSON.stringify(works, null, 2), "utf8");
}

const fileStore: Store = {
  listWorks: () => locked(async () => sortWorks(await readWorks())),
  getWork: (id) => locked(async () => (await readWorks()).find((w) => w.id === id) ?? null),
  getWorkBySlug: (slug) => locked(async () => (await readWorks()).find((w) => w.slug === slug) ?? null),
  createWork: () =>
    locked(async () => {
      const works = await readWorks();
      const id = randomUUID();
      const now = new Date().toISOString();
      const work: Work = {
        id,
        slug: "d-" + id.slice(0, 8),
        title: "",
        kind: "",
        role: "",
        year: String(new Date().getFullYear()),
        note: "",
        thumb: "",
        body: "",
        status: "draft",
        createdAt: now,
        updatedAt: now,
      };
      works.push(work);
      await writeWorks(works);
      return work;
    }),
  updateWork: (id, patch) =>
    locked(async () => {
      const works = await readWorks();
      const w = works.find((x) => x.id === id);
      if (!w) return null;
      for (const k of ["slug", "title", "kind", "role", "year", "note", "thumb", "body", "status"] as const) {
        const v = patch[k];
        if (v !== undefined) (w as unknown as Record<string, string>)[k] = v;
      }
      w.updatedAt = new Date().toISOString();
      await writeWorks(works);
      return w;
    }),
  removeWork: (id) =>
    locked(async () => {
      const works = await readWorks();
      const next = works.filter((w) => w.id !== id);
      if (next.length === works.length) return false;
      await writeWorks(next);
      return true;
    }),

  listPosts: () => locked(async () => sortPosts(await readPosts())),
  getPost: (id) => locked(async () => (await readPosts()).find((p) => p.id === id) ?? null),
  getPostBySlug: (slug) => locked(async () => (await readPosts()).find((p) => p.slug === slug) ?? null),
  createPost: (input = {}) =>
    locked(async () => {
      const posts = await readPosts();
      const id = randomUUID();
      const now = new Date().toISOString();
      const post: Post = {
        id,
        slug: "d-" + id.slice(0, 8),
        title: input.title ?? "",
        body: input.body ?? "",
        tag: "",
        status: "draft",
        scope: "public",
        createdAt: now,
        updatedAt: now,
        publishedAt: null,
      };
      posts.push(post);
      await writePosts(posts);
      return post;
    }),
  updatePost: (id, patch) =>
    locked(async () => {
      const posts = await readPosts();
      const p = posts.find((x) => x.id === id);
      if (!p) return null;
      if (patch.slug !== undefined) p.slug = patch.slug;
      if (patch.title !== undefined) p.title = patch.title;
      if (patch.body !== undefined) p.body = patch.body;
      if (patch.tag !== undefined) p.tag = patch.tag;
      if (patch.scope !== undefined) p.scope = patch.scope;
      if (patch.status !== undefined) {
        if (patch.status === "published" && !p.publishedAt) p.publishedAt = new Date().toISOString();
        if (patch.status === "draft") p.publishedAt = null;
        p.status = patch.status;
      }
      p.updatedAt = new Date().toISOString();
      await writePosts(posts);
      return p;
    }),
  removePost: (id) =>
    locked(async () => {
      const posts = await readPosts();
      const next = posts.filter((p) => p.id !== id);
      if (next.length === posts.length) return false;
      await writePosts(next);
      return true;
    }),

  list: () => locked(async () => (await readFile()).sort((a, b) => b.createdAt.localeCompare(a.createdAt))),
  findByUrl: (url) => locked(async () => (await readFile()).find((i) => i.url === url) ?? null),
  create: (input) =>
    locked(async () => {
      const items = await readFile();
      const item: Item = { id: randomUUID(), ...input, createdAt: new Date().toISOString() };
      items.push(item);
      await writeFile(items);
      return item;
    }),
  update: (id, patch) =>
    locked(async () => {
      const items = await readFile();
      const it = items.find((i) => i.id === id);
      if (!it) return null;
      if (patch.memo !== undefined) it.memo = patch.memo;
      if (patch.tag !== undefined) it.tag = patch.tag;
      if (patch.title !== undefined) it.title = patch.title;
      await writeFile(items);
      return it;
    }),
  remove: (id) =>
    locked(async () => {
      const items = await readFile();
      const next = items.filter((i) => i.id !== id);
      if (next.length === items.length) return false;
      await writeFile(next);
      return true;
    }),
};

export class StoreError extends Error {
  constructor(public code: "no_database" | "db_failed", message: string) {
    super(message);
  }
}

/** DATABASE_URL first; otherwise any *_URL variable holding a Postgres connection string (custom prefixes from Vercel Storage). */
function findDatabaseUrl(): string | undefined {
  const direct = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (direct) return direct;
  const isPg = (v?: string) => !!v && /^postgres(ql)?:\/\//i.test(v);
  const keys = Object.keys(process.env)
    .filter((k) => /_URL$/i.test(k) && !/UNPOOLED|NON_POOLING|PRISMA/i.test(k) && isPg(process.env[k]))
    .sort();
  if (keys.length) return process.env[keys[0]];
  const pooled = Object.keys(process.env).find((k) => /_URL/i.test(k) && isPg(process.env[k]));
  return pooled ? process.env[pooled] : undefined;
}

export async function getStore(): Promise<Store> {
  const url = findDatabaseUrl();
  if (url) {
    try {
      return await pgStore(url);
    } catch (e) {
      throw new StoreError("db_failed", e instanceof Error ? e.message : String(e));
    }
  }
  // On Vercel the filesystem is read-only, so the JSON fallback can only ever read an empty list.
  if (process.env.VERCEL) throw new StoreError("no_database", "DATABASE_URL is not set on this deployment");
  return fileStore;
}

/** Normalize any thrown value into a JSON-able API error. */
export function storeErrorBody(e: unknown): { status: number; body: { error: string; detail?: string } } {
  if (e instanceof StoreError) return { status: 503, body: { error: e.code, detail: e.message } };
  return { status: 500, body: { error: "db_failed", detail: e instanceof Error ? e.message : String(e) } };
}

