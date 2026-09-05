# yeoziphab

개인 웹사이트. 링크 아카이브, 글, 포트폴리오가 한 곳에 있습니다.

https://yeoziphab.vercel.app

<img width="1917" height="906" alt="image" src="https://github.com/user-attachments/assets/2b73daba-d576-43a8-8312-99541ccfc5ae" />

| 경로 | 내용 |
|---|---|
| `/` | 이름과 세 갈래 |
| `/archive` | 링크 아카이브. 붙여넣기로 저장, 태그·검색·호버 미리보기 |
| `/write` | 글. 목록, 편집기(자동 저장·발행), 읽기 화면 |
| `/portfolio` | CV 겸 포트폴리오. 작업 상세는 `/portfolio/<slug>` (`/work`는 여기로 넘어옵니다) |

## 기능

**archive**

- 링크 저장: 페이지 아무 곳에나 붙여넣기, 또는 `+` 버튼으로 메모·태그와 함께 저장
- 일괄 저장: 카카오톡 대화처럼 여러 링크가 섞인 텍스트를 붙여넣으면 링크만 추출해 한 번에 저장
- 메타데이터 자동 수집: 제목, 설명, 썸네일(OG 태그)
- 검색: `/` 키로 제목·메모·도메인·태그 실시간 검색
- 태그 필터, 월별 목록, "정리되지 않은 것" 모아 보기
- 호버 미리보기에서 제목·메모·태그 수정 및 삭제

**write**

- `+`로 초안을 만들고 제목·부제목·본문을 쓰면 자동 저장 (`Ctrl/⌘+S`로 즉시 저장). 주소(`/write/<slug>`)는 본문 위에서 바로 정합니다
- "발행"을 누르면 아래에 태그와 공개 범위(전체 공개 / 링크 있는 사람만)가 펼쳐집니다
- 본문은 문단 단위이고 작은 마크다운을 이해합니다: `## 소제목`, `> 인용`, `- 목록`, `![캡션](이미지주소)`, `**굵게**`, `[글자](주소)`, 그냥 붙여넣은 주소
- 초안은 열쇠가 있는 브라우저에서만 목록에 보입니다

**portfolio**

- 소개 · 경력 · 학력 · 작업을 한 장으로. 작업 행에 마우스를 올리면 오른쪽 여백에 썸네일과 한 줄
- 작업은 사이트에서 씁니다. 열쇠가 있으면 오른쪽 위 `+`로 만들고, 제목·부제목·주소(`/portfolio/<slug>`)·연도·본문을 채운 뒤 "발행"합니다. 본문 마크다운은 글과 같고, 목록 호버 썸네일은 본문의 첫 이미지입니다
- 이미지는 편집기 아래 "이미지"로 올리거나 본문에 붙여넣습니다. 저장소는 Vercel Blob (아래 배포 6번)
- 오른쪽 위 `PDF ↓`는 인쇄용 레이아웃으로 PDF 저장
- 이름·소개·연락처는 `src/content/site.ts`, 경력·학력은 `src/content/portfolio.ts`에 있습니다

**공통**

- 쓰기 권한 보호: 토큰이 있는 브라우저만 저장·수정·삭제·발행 가능, 그 외에는 읽기 전용
- 폰에서는 한 열로 접히고, 행을 탭하면 아래에서 시트가 올라옵니다

## 사용법

| 동작 | 방법 |
|---|---|
| 링크 저장 | `/archive`에서 `Ctrl+V` / `⌘V`, 또는 오른쪽 위 `+` |
| 여러 링크 저장 | 링크가 포함된 텍스트를 통째로 붙여넣기 |
| 검색 | `/` 키 또는 오른쪽 위 `/`. Enter로 유지, Esc로 닫기 |
| 태그로 좁히기 | 왼쪽 태그 목록 클릭 |
| 링크 수정·삭제 | 행에 마우스를 올린 뒤 오른쪽 미리보기의 "수정" |
| 새 글 | `/write`에서 오른쪽 위 `+` |
| 발행 | 편집기 아래 "발행" → 태그·범위·주소 확인 → "발행하기". Esc로 닫기 |
| 글 수정·삭제 | 읽기 화면 날짜 줄 오른쪽의 "수정 · 삭제" |
| 새 작업 | `/portfolio`에서 오른쪽 위 `+` |
| 작업 수정·삭제 | 작업 상세 연도 줄 오른쪽의 "수정 · 삭제" |

## 직접 설치하기

### 요구 사항

- Node.js 20 이상
- Postgres (배포 시). 로컬에서는 없어도 됩니다.

### 로컬 실행

```bash
git clone https://github.com/iamnotfemale/archive.git
cd archive
npm install
npm run dev
```

http://localhost:3000 에서 열립니다. 데이터베이스가 없으면 `.data/` 아래 JSON 파일에 저장되고, 쓰기 제한도 없습니다.

### 환경 변수

`.env.example`을 참고해 `.env.local`을 만듭니다.

| 변수 | 설명 |
|---|---|
| `DATABASE_URL` | Postgres 연결 문자열. 없으면 JSON 파일 저장소를 사용합니다. `STORAGE_URL`처럼 접두어가 붙은 이름도 자동 인식합니다. |
| `ARCHIVE_TOKEN` | 쓰기 토큰. 설정하면 이 값을 가진 브라우저만 저장·수정·삭제·발행할 수 있습니다. 비우면 누구나 쓸 수 있습니다. |
| `BLOB_READ_WRITE_TOKEN` | 이미지 업로드용 Vercel Blob 토큰. Blob 연결 시 자동. 없으면 로컬에서는 `public/uploads/`에 저장하고, 배포에서는 업로드가 꺼집니다. |

테이블(`items`, `posts`, `works`)은 첫 요청 때 자동으로 생성됩니다.

### Vercel 배포

1. 이 저장소를 fork 하거나 push 한 뒤 [vercel.com/new](https://vercel.com/new)에서 Import 합니다.
2. 프로젝트의 **Storage** 탭에서 Neon(Postgres)을 만들고 프로젝트에 연결합니다. `DATABASE_URL`이 자동으로 추가됩니다.
3. **Settings → Environment Variables**에 `ARCHIVE_TOKEN`을 추가합니다. 값은 길고 무작위한 문자열이면 됩니다.
   ```bash
   node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"
   ```
4. **Redeploy** 합니다.
5. 브라우저에서 `https://<사이트>/key?t=<ARCHIVE_TOKEN>`을 한 번 엽니다. 그 브라우저에 1년짜리 쓰기 쿠키가 저장됩니다. 해제하려면 `/key?t=`를 엽니다.
6. 이미지를 올리려면 **Storage** 탭에서 **Blob** 스토어를 만들어 프로젝트에 연결합니다. `BLOB_READ_WRITE_TOKEN`이 자동으로 추가되고, Redeploy 후 편집기에서 업로드가 됩니다.

## 기술 스택

- Next.js 16 (App Router), React 19, TypeScript
- Postgres (`postgres` 드라이버), 로컬 폴백은 JSON 파일
- 외부 UI 라이브러리 없이 CSS만 사용
