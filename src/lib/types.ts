export interface Item {
  id: string;
  url: string;
  domain: string;
  title: string;
  description: string;
  image: string;
  memo: string;
  tag: string;
  createdAt: string; // ISO
}

export type NewItem = Pick<Item, "url" | "domain" | "title" | "description" | "image" | "memo" | "tag">;
export type ItemPatch = Partial<Pick<Item, "memo" | "tag" | "title">>;

export type PostStatus = "draft" | "published";
export type PostScope = "public" | "unlisted";

export interface Post {
  id: string;
  slug: string;
  title: string;
  body: string;
  tag: string;
  status: PostStatus;
  scope: PostScope;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export type PostPatch = Partial<Pick<Post, "slug" | "title" | "body" | "tag" | "status" | "scope">>;
