import type { Profile } from "@/lib/types";
import { site } from "./site";
import { cv } from "./portfolio";

/** 사이트에서 한 번도 고치지 않았을 때 쓰는 기본값. 이후에는 DB의 profile 이 우선한다. */
export function defaultProfile(): Profile {
  return {
    intro: site.intro,
    sub: site.sub,
    sections: cv.map((b, i) => ({
      id: `s${i + 1}`,
      label: b.label,
      rows: b.rows.map((r, j) => ({ id: `s${i + 1}r${j + 1}`, title: r.title, sub: r.sub, when: r.when })),
    })),
    contacts: site.contacts.map((c, i) => ({ id: `c${i + 1}`, label: c.label, value: c.value, href: c.href })),
  };
}
