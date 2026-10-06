import type { CSSProperties, ReactNode } from "react";
/** 모든 조각의 바깥. 종이색 배경과 Pretendard 를 깐다. 한 화면에 하나. */
export interface PaperProps {
    children?: ReactNode;
    /** 화면 여백. 기본 56px 72px. */
    padding?: string;
    style?: CSSProperties;
}
export declare function Paper({ children, padding, style }: PaperProps): import("react").JSX.Element;
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
export declare function Rail({ name, routes, active, children, onRoute }: RailProps): import("react").JSX.Element;
/** 레일 아래 담담한 상태 문구. "정리되지 않은 것 7" */
export interface NoteProps {
    children: ReactNode;
    /** 세리프 작은 글씨 (보조). */
    sub?: boolean;
}
export declare function Note({ children, sub }: NoteProps): import("react").JSX.Element;
/** 세로로 흐르는 태그 목록. */
export interface TagsProps {
    tags: string[];
    active?: string;
    onSelect?: (tag: string) => void;
}
export declare function Tags({ tags, active, onSelect }: TagsProps): import("react").JSX.Element;
/** 오른쪽 위 모서리 글자. "+" 는 열리면 45°, "/" 는 열리면 24° 돈다. 글자 버튼은 edit · done 같은 작은 세리프. */
export interface CornerProps {
    /** "+" | "/" | 짧은 글자 */
    glyph: string;
    open?: boolean;
    dim?: boolean;
    onClick?: () => void;
}
export declare function Corner({ glyph, open, dim, onClick }: CornerProps): import("react").JSX.Element;
/** 목록 한 줄: 제목 왼쪽, 메타(도메인·태그·날짜) 오른쪽 세리프. 호버하면 진해지고 왼쪽에 짧은 선. */
export interface RowProps {
    title: ReactNode;
    /** 오른쪽에 차례로 놓이는 작은 정보. serif 는 도메인·날짜처럼 세리프로. */
    metas?: {
        text: string;
        serif?: boolean;
    }[];
    /** 호버 상태를 고정. */
    on?: boolean;
    onClick?: () => void;
}
export declare function Row({ title, metas, on, onClick }: RowProps): import("react").JSX.Element;
/** 월별 묶음 제목: 세리프 라벨, 다음 달부터 가는 선. */
export interface MonthProps {
    label: string;
    /** 첫 묶음이 아니면 true: 위에 가는 선. */
    line?: boolean;
    children?: ReactNode;
}
export declare function Month({ label, line, children }: MonthProps): import("react").JSX.Element;
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
export declare function Field({ size, placeholder, value, onChange, action, actionDim, onAction }: FieldProps): import("react").JSX.Element;
/** 밑줄로만 드러나는 글자 버튼. "발행" "저장" */
export interface LinkButtonProps {
    children: ReactNode;
    onClick?: () => void;
}
export declare function LinkButton({ children, onClick }: LinkButtonProps): import("react").JSX.Element;
/** 아주 작은 세리프 안내. "Esc 로 닫기" */
export declare function Hint({ children, onClick }: LinkButtonProps): import("react").JSX.Element;
/** 뒤를 흐리게 덮고 가운데에 시트를 띄운다. Paper 안에 두면 그 화면만 덮는다. */
export interface VeilProps {
    open: boolean;
    children?: ReactNode;
    onClose?: () => void;
}
export declare function Veil({ open, children, onClose }: VeilProps): import("react").JSX.Element;
/** 읽기 화면 머리: 제목, 부제목, 세리프 메타 한 줄. */
export interface HeadingProps {
    title: ReactNode;
    subtitle?: ReactNode;
    metas?: string[];
}
export declare function Heading({ title, subtitle, metas }: HeadingProps): import("react").JSX.Element;
/** 본문 문단. */
export declare function Paragraph({ children }: {
    children: ReactNode;
}): import("react").JSX.Element;
/** 포트폴리오 섹션: 세리프 라벨, 가는 선, 이름·설명·기간 행들. */
export interface CvSectionProps {
    label: string;
    rows: {
        title: string;
        sub?: string;
        when?: string;
    }[];
}
export declare function CvSection({ label, rows }: CvSectionProps): import("react").JSX.Element;
