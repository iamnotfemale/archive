// src/index.tsx
import { jsx, jsxs } from "react/jsx-runtime";
function Paper({ children, padding = "56px 72px", style }) {
  return /* @__PURE__ */ jsx("div", { className: "yz", style: { position: "relative", minHeight: 320, padding, ...style }, children });
}
function Rail({ name, routes, active, children, onRoute }) {
  return /* @__PURE__ */ jsxs("div", { className: "yz-rail", children: [
    /* @__PURE__ */ jsx("span", { className: "yz-wordmark", children: name }),
    /* @__PURE__ */ jsx("nav", { className: "yz-routes", children: routes.map((r) => /* @__PURE__ */ jsx("span", { className: `yz-route${r === active ? " active" : ""}`, onClick: () => onRoute?.(r), children: r }, r)) }),
    children && /* @__PURE__ */ jsx("div", { className: "yz-rail-body", children })
  ] });
}
function Note({ children, sub }) {
  return /* @__PURE__ */ jsx("div", { className: sub ? "yz-sub" : "yz-note", children });
}
function Tags({ tags, active, onSelect }) {
  return /* @__PURE__ */ jsx("div", { className: "yz-tags", children: tags.map((t) => /* @__PURE__ */ jsx("span", { className: `yz-tag${t === active ? " active" : ""}`, onClick: () => onSelect?.(t), children: t }, t)) });
}
function Corner({ glyph, open, dim, onClick }) {
  const kind = glyph === "+" ? "plus" : glyph === "/" ? "slash" : "text";
  return /* @__PURE__ */ jsx("span", { className: `yz-corner ${kind}${open ? " open" : ""}${dim ? " dim" : ""}`, onClick, children: glyph });
}
function Row({ title, metas = [], on, onClick }) {
  return /* @__PURE__ */ jsxs("div", { className: `yz-row${on ? " on" : ""}`, onClick, children: [
    /* @__PURE__ */ jsx("span", { className: "yz-row-line" }),
    /* @__PURE__ */ jsx("span", { className: "yz-row-title", children: title }),
    metas.map((m, i) => /* @__PURE__ */ jsx("span", { className: `yz-row-meta${m.serif ? " serif" : ""}`, children: m.text }, i))
  ] });
}
function Month({ label, line, children }) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("div", { className: "yz-month", children: label }),
    line && /* @__PURE__ */ jsx("div", { className: "yz-month-line" }),
    /* @__PURE__ */ jsx("div", { className: "yz-month-rows", children })
  ] });
}
function Field({ size = "md", placeholder, value, onChange, action, actionDim, onAction }) {
  return /* @__PURE__ */ jsxs("div", { className: `yz-field ${size}`, children: [
    /* @__PURE__ */ jsx("input", { value, onChange: (e) => onChange?.(e.target.value), placeholder, spellCheck: false }),
    action && /* @__PURE__ */ jsx("span", { className: `yz-action${actionDim ? " dim" : ""}`, onClick: onAction, children: action })
  ] });
}
function LinkButton({ children, onClick }) {
  return /* @__PURE__ */ jsx("span", { className: "yz-link", onClick, children });
}
function Hint({ children, onClick }) {
  return /* @__PURE__ */ jsx("span", { className: "yz-hint", onClick, children });
}
function Veil({ open, children, onClose }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: `yz-veil${open ? " open" : ""}`,
      onMouseDown: (e) => {
        if (e.target === e.currentTarget) onClose?.();
      },
      children: /* @__PURE__ */ jsx("div", { className: "yz-sheet", children })
    }
  );
}
function Heading({ title, subtitle, metas = [] }) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("h1", { className: "yz-title", children: title }),
    subtitle && /* @__PURE__ */ jsx("div", { className: "yz-subtitle", children: subtitle }),
    metas.length > 0 && /* @__PURE__ */ jsx("div", { className: "yz-meta", children: metas.map((m, i) => /* @__PURE__ */ jsx("span", { children: m }, i)) })
  ] });
}
function Paragraph({ children }) {
  return /* @__PURE__ */ jsx("p", { className: "yz-p", children });
}
function CvSection({ label, rows }) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("div", { className: "yz-cv-label", style: { marginBottom: 10 }, children: label }),
    /* @__PURE__ */ jsx("div", { className: "yz-cv-line" }),
    rows.map((r, i) => /* @__PURE__ */ jsxs("div", { className: "yz-cv-row", children: [
      /* @__PURE__ */ jsx("span", { className: "yz-cv-title", children: r.title }),
      /* @__PURE__ */ jsx("span", { className: "yz-cv-sub", children: r.sub }),
      /* @__PURE__ */ jsx("span", { className: "yz-cv-when", children: r.when })
    ] }, i))
  ] });
}
export {
  Corner,
  CvSection,
  Field,
  Heading,
  Hint,
  LinkButton,
  Month,
  Note,
  Paper,
  Paragraph,
  Rail,
  Row,
  Tags,
  Veil
};
