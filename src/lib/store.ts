import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Item, ItemPatch, NewItem } from "./types";

export interface Store {
  list(): Promise<Item[]>;
  findByUrl(url: string): Promise<Item | null>;
  create(input: NewItem): Promise<Item>;
  update(id: string, patch: ItemPatch): Promise<Item | null>;
  remove(id: string): Promise<boolean>;
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
      )`.then(() => undefined);
  }
  await g.__archiveReady;

  return {
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

const fileStore: Store = {
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

