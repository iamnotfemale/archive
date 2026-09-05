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
  subtitle: string;
  body: string;
  tag: string;
  status: PostStatus;
  scope: PostScope;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export type PostPatch = Partial<Pick<Post, "slug" | "title" | "subtitle" | "body" | "tag" | "status" | "scope">>;

/** 포트폴리오 작업. 본문은 글과 같은 마크다운. */
export interface Work {
  id: string;
  slug: string;
  title: string;
  kind: string; // 브랜딩 · 제품 · 연구 …
  role: string;
  year: string;
  note: string; // 목록 호버 미리보기 한두 줄
  thumb: string; // 호버 썸네일 이미지 주소
  body: string;
  status: PostStatus;
  createdAt: string;
  updatedAt: string;
}

export type WorkPatch = Partial<Pick<Work, "slug" | "title" | "kind" | "role" | "year" | "note" | "thumb" | "body" | "status">>;
