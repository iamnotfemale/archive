# archive

종이 한 장, 먹 한 색. 링크를 남기고, 나중에 조용히 꺼내 보는 개인 아카이브.

- 붙여넣기 한 번으로 저장 (페이지 아무 곳에나 `Ctrl/⌘+V`). 카톡 대화를 통째로 붙여넣으면 링크만 골라 한꺼번에 남깁니다.
- 제목·설명·썸네일은 서버가 자동으로 가져옵니다. 사용자는 "왜 남기나요" 한 줄과 태그만.
- `/` 로 검색, 왼쪽 여백의 태그로 좁히기, 행에 마우스를 올리면 오른쪽 여백에 미리보기.

## 로컬 실행

```bash
npm install
npm run dev
```

데이터베이스가 없으면 `.data/items.json` 파일에 저장됩니다. 쓰기 제한도 없습니다.

## 배포 (GitHub + Vercel, 개인 계정)

1. GitHub에 빈 저장소를 만들고 푸시합니다.

   ```bash
   git remote add origin https://github.com/<계정>/archive.git
   git push -u origin main
   ```

2. [vercel.com/new](https://vercel.com/new) 에서 그 저장소를 Import 합니다. 프레임워크는 Next.js로 자동 인식됩니다. 일단 Deploy.

3. 데이터베이스를 붙입니다. Vercel 프로젝트 → **Storage** 탭 → **Create Database** → **Neon (Postgres)** → 무료 플랜으로 생성 → 프로젝트에 Connect. `DATABASE_URL` 환경 변수가 자동으로 추가됩니다. 테이블은 첫 요청 때 자동으로 만들어집니다.

4. 쓰기 열쇠를 정합니다. 프로젝트 → **Settings → Environment Variables** 에 `ARCHIVE_TOKEN` 을 추가합니다. 값은 길고 무작위한 문자열이면 됩니다. 예를 들어 터미널에서:

   ```bash
   node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"
   ```

5. **Deployments** 에서 최신 배포를 **Redeploy** 합니다 (환경 변수를 반영하기 위해).

6. 브라우저에서 한 번만 `https://<사이트>/key?t=<ARCHIVE_TOKEN>` 을 엽니다. 그 브라우저는 1년 동안 쓰기 권한을 가집니다. 다른 사람은 읽기만 됩니다. 열쇠를 빼려면 `/key?t=` 을 엽니다.


## 환경 변수

| 이름 | 설명 |
|---|---|
| `DATABASE_URL` | Postgres 연결 문자열. Neon 연동 시 자동. 없으면 JSON 파일 저장소 |
| `ARCHIVE_TOKEN` | 쓰기 열쇠. 없으면 누구나 쓸 수 있음 (로컬용) |

## 구조

```
src/app/page.tsx            메인 (서버에서 목록 로드)
src/app/key/route.ts        열쇠 쿠키 발급
src/app/api/items           목록·저장 / 수정·삭제
src/app/api/meta            OG 메타데이터 미리보기
src/components/Archive.tsx  메인 화면 (리스트·검색·태그·미리보기·편집·붙여넣기·중앙 입력 오버레이)
src/lib/store.ts            Postgres 또는 JSON 파일 저장소
src/lib/meta.ts             메타데이터 수집
```
