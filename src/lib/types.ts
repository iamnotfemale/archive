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
  pos: number; // 목록 순서 (작을수록 위, 0 = 아직 정렬 안 함)
}

export type PostPatch = Partial<Pick<Post, "slug" | "title" | "subtitle" | "body" | "tag" | "status" | "scope" | "pos">>;

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
  pos: number; // 목록 순서 (작을수록 위)
  createdAt: string;
  updatedAt: string;
}

export type WorkPatch = Partial<Pick<Work, "slug" | "title" | "kind" | "role" | "year" | "note" | "thumb" | "body" | "status" | "pos">>;

/** /portfolio 의 이력 부분. 사이트의 수정 모드에서 고친다. */
export interface CvRow {
  id: string;
  title: string;
  sub: string;
  when: string;
  rows?: CvRow[]; // 하위 항목 (한 단계, 펼침/접힘)
}
export interface CvSection {
  id: string;
  label: string;
  rows: CvRow[];
}
export interface Contact {
  id: string;
  label: string;
  value: string;
  href: string;
}
export interface Profile {
  intro: string;
  sub: string;
  sections: CvSection[];
  contacts: Contact[];
}
