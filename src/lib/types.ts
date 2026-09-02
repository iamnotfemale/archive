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
