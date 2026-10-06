import type { CSSProperties, ReactNode } from "react";

/** 모든 조각의 바깥. 종이색 배경과 Pretendard 를 깐다. 한 화면에 하나. */
export interface PaperProps {
  children?: ReactNode;
  /** 화면 여백. 기본 56px 72px. */
  padding?: string;
  style?: CSSProperties;
}
export function Paper({ children, padding = "56px 72px", style }: PaperProps) {
  return (
    <div className="yz" style={{ position: "relative", minHeight: 320, padding, ...style }}>
      {children}
    </div>
  );
}

/** 왼쪽 레일: 이름, 라우트 목록, 그 아래 페이지별 내용. */
export interface RailProps {
  /** 왼쪽 위 이름. */
  name: string;
  /** "/archive" 같은 라우트 라벨들. */
  routes: string[];
  /** 현재 라우트 (routes 중 하나). */
  active?: string;
  /** 라우트 아래에 오는 페이지별 내용 (상태 문구, 태그 등). */
  children?: ReactNode;
  onRoute?: (route: string) => void;
}
export function Rail({ name, routes, active, children, onRoute }: RailProps) {
  return (
    <div className="yz-rail">
      <span className="yz-wordmark">{name}</span>
      <nav className="yz-routes">
        {routes.map((r) => (
          <span key={r} className={`yz-route${r === active ? " active" : ""}`} onClick={() => onRoute?.(r)}>
            {r}
          </span>
        ))}
      </nav>
      {children && <div className="yz-rail-body">{children}</div>}
    </div>
  );
}

/** 레일 아래 담담한 상태 문구. "정리되지 않은 것 7" */
export interface NoteProps {
  children: ReactNode;
  /** 세리프 작은 글씨 (보조). */
  sub?: boolean;
}
export function Note({ children, sub }: NoteProps) {
  return <div className={sub ? "yz-sub" : "yz-note"}>{children}</div>;
}

/** 세로로 흐르는 태그 목록. */
export interface TagsProps {
  tags: string[];
  active?: string;
  onSelect?: (tag: string) => void;
}
export function Tags({ tags, active, onSelect }: TagsProps) {
  return (
    <div className="yz-tags">
      {tags.map((t) => (
        <span key={t} className={`yz-tag${t === active ? " active" : ""}`} onClick={() => onSelect?.(t)}>
          {t}
        </span>
      ))}
    </div>
  );
}

/** 오른쪽 위 모서리 글자. "+" 는 열리면 45°, "/" 는 열리면 24° 돈다. 글자 버튼은 edit · done 같은 작은 세리프. */
export interface CornerProps {
  /** "+" | "/" | 짧은 글자 */
  glyph: string;
  open?: boolean;
  dim?: boolean;
  onClick?: () => void;
}
export function Corner({ glyph, open, dim, onClick }: CornerProps) {
  const kind = glyph === "+" ? "plus" : glyph === "/" ? "slash" : "text";
  return (
    <span className={`yz-corner ${kind}${open ? " open" : ""}${dim ? " dim" : ""}`} onClick={onClick}>
      {glyph}
    </span>
  );
}

/** 목록 한 줄: 제목 왼쪽, 메타(도메인·태그·날짜) 오른쪽 세리프. 호버하면 진해지고 왼쪽에 짧은 선. */
export interface RowProps {
  title: ReactNode;
  /** 오른쪽에 차례로 놓이는 작은 정보. serif 는 도메인·날짜처럼 세리프로. */
  metas?: { text: string; serif?: boolean }[];
  /** 호버 상태를 고정. */
  on?: boolean;
  onClick?: () => void;
}
export function Row({ title, metas = [], on, onClick }: RowProps) {
  return (
    <div className={`yz-row${on ? " on" : ""}`} onClick={onClick}>
      <span className="yz-row-line" />
      <span className="yz-row-title">{title}</span>
      {metas.map((m, i) => (
        <span key={i} className={`yz-row-meta${m.serif ? " serif" : ""}`}>
          {m.text}
        </span>
      ))}
    </div>
  );
}

/** 월별 묶음 제목: 세리프 라벨, 다음 달부터 가는 선. */
export interface MonthProps {
  label: string;
  /** 첫 묶음이 아니면 true: 위에 가는 선. */
  line?: boolean;
  children?: ReactNode;
}
export function Month({ label, line, children }: MonthProps) {
  return (
    <div>
      <div className="yz-month">{label}</div>
      {line && <div className="yz-month-line" />}
      <div className="yz-month-rows">{children}</div>
    </div>
  );
}

/** 밑줄 하나뿐인 입력칸. lg 는 20px(링크·검색), md 는 15px(메모), sm 은 13px(태그). */
export interface FieldProps {
  size?: "lg" | "md" | "sm";
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  /** 오른쪽 끝 글자 버튼. "남기기" */
  action?: string;
  actionDim?: boolean;
  onAction?: () => void;
}
export function Field({ size = "md", placeholder, value, onChange, action, actionDim, onAction }: FieldProps) {
  return (
    <div className={`yz-field ${size}`}>
      <input value={value} onChange={(e) => onChange?.(e.target.value)} placeholder={placeholder} spellCheck={false} />
      {action && (
        <span className={`yz-action${actionDim ? " dim" : ""}`} onClick={onAction}>
          {action}
        </span>
      )}
    </div>
  );
}

/** 밑줄로만 드러나는 글자 버튼. "발행" "저장" */
export interface LinkButtonProps {
  children: ReactNode;
  onClick?: () => void;
}
export function LinkButton({ children, onClick }: LinkButtonProps) {
  return (
    <span className="yz-link" onClick={onClick}>
      {children}
    </span>
  );
}

/** 아주 작은 세리프 안내. "Esc 로 닫기" */
export function Hint({ children, onClick }: LinkButtonProps) {
  return (
    <span className="yz-hint" onClick={onClick}>
      {children}
    </span>
  );
}

/** 뒤를 흐리게 덮고 가운데에 시트를 띄운다. Paper 안에 두면 그 화면만 덮는다. */
export interface VeilProps {
  open: boolean;
  children?: ReactNode;
  onClose?: () => void;
}
export function Veil({ open, children, onClose }: VeilProps) {
  return (
    <div
      className={`yz-veil${open ? " open" : ""}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="yz-sheet">{children}</div>
    </div>
  );
}

/** 읽기 화면 머리: 제목, 부제목, 세리프 메타 한 줄. */
export interface HeadingProps {
  title: ReactNode;
  subtitle?: ReactNode;
  metas?: string[];
}
export function Heading({ title, subtitle, metas = [] }: HeadingProps) {
  return (
    <div>
      <h1 className="yz-title">{title}</h1>
      {subtitle && <div className="yz-subtitle">{subtitle}</div>}
      {metas.length > 0 && (
        <div className="yz-meta">
          {metas.map((m, i) => (
            <span key={i}>{m}</span>
          ))}
        </div>
      )}
    </div>
  );
}

/** 본문 문단. */
export function Paragraph({ children }: { children: ReactNode }) {
  return <p className="yz-p">{children}</p>;
}

/** 포트폴리오 섹션: 세리프 라벨, 가는 선, 이름·설명·기간 행들. */
export interface CvSectionProps {
  label: string;
  rows: { title: string; sub?: string; when?: string }[];
}
export function CvSection({ label, rows }: CvSectionProps) {
  return (
    <div>
      <div className="yz-cv-label" style={{ marginBottom: 10 }}>
        {label}
      </div>
      <div className="yz-cv-line" />
      {rows.map((r, i) => (
        <div key={i} className="yz-cv-row">
          <span className="yz-cv-title">{r.title}</span>
          <span className="yz-cv-sub">{r.sub}</span>
          <span className="yz-cv-when">{r.when}</span>
        </div>
      ))}
    </div>
  );
}
