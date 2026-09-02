"use client";

import { suggestions } from "@/lib/tags";

type Props = {
  tags: string[];
  input: string;
  open: boolean;
  onPick: (tag: string) => void;
  gap?: number;
};

export default function TagSuggest({ tags, input, open, onPick, gap = 18 }: Props) {
  const list = suggestions(tags, input);
  const show = open && list.length > 0;
  return (
    <div className="suggest" style={{ paddingTop: show ? 12 : 0, maxHeight: show ? 80 : 0, opacity: show ? 1 : 0, columnGap: gap }}>
      {list.map((name, i) => (
        <span
          key={name}
          style={{ animationDelay: `${i * 40}ms` }}
          onMouseDown={(e) => {
            e.preventDefault();
            onPick(name);
          }}
        >
          {name}
        </span>
      ))}
    </div>
  );
}
