# archive

링크를 저장하고 나중에 찾아보는 개인용 링크 아카이브.

카카오톡 "나에게 보내기"에 쌓이던 링크를 한곳에 모읍니다. 붙여넣기 한 번으로 저장되고, 태그로 나중에 다시 찾을 수 있습니다.

https://yeoziphab.vercel.app

<img width="1917" height="906" alt="image" src="https://github.com/user-attachments/assets/2b73daba-d576-43a8-8312-99541ccfc5ae" />


## 기능

- 링크 저장: 페이지 아무 곳에나 붙여넣기, 또는 `+` 버튼으로 메모·태그와 함께 저장
- 일괄 저장: 카카오톡 대화처럼 여러 링크가 섞인 텍스트를 붙여넣으면 링크만 추출해 한 번에 저장
- 메타데이터 자동 수집: 제목, 설명, 썸네일(OG 태그)
- 검색: `/` 키로 제목·메모·도메인·태그 실시간 검색
- 태그 필터, 월별 목록, "정리되지 않은 것" 모아 보기
- 호버 미리보기에서 메모·태그 수정 및 삭제
- 쓰기 권한 보호: 토큰이 있는 브라우저만 저장·수정·삭제 가능, 그 외에는 읽기 전용

## 사용법

| 동작 | 방법 |
|---|---|
| 저장 | 페이지에서 `Ctrl+V` / `⌘V`, 또는 오른쪽 위 `+` |
| 여러 개 저장 | 링크가 포함된 텍스트를 통째로 붙여넣기 |
| 검색 | `/` 키 또는 오른쪽 위 `/`. Enter로 유지, Esc로 닫기 |
| 태그로 좁히기 | 왼쪽 태그 목록 클릭 |
| 미정리 항목 보기 | 왼쪽 위 "정리되지 않은 것 N" 클릭 |
| 수정·삭제 | 행에 마우스를 올린 뒤 오른쪽 미리보기의 "수정" |
| 원본 열기 | 제목 또는 미리보기 썸네일 클릭 |

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

http://localhost:3000 에서 열립니다. 데이터베이스가 없으면 `.data/items.json` 파일에 저장되고, 쓰기 제한도 없습니다.

### 환경 변수

`.env.example`을 참고해 `.env.local`을 만듭니다.

| 변수 | 설명 |
|---|---|
| `DATABASE_URL` | Postgres 연결 문자열. 없으면 JSON 파일 저장소를 사용합니다. `STORAGE_URL`처럼 접두어가 붙은 이름도 자동 인식합니다. |
| `ARCHIVE_TOKEN` | 쓰기 토큰. 설정하면 이 값을 가진 브라우저만 저장·수정·삭제할 수 있습니다. 비우면 누구나 쓸 수 있습니다. |

테이블은 첫 요청 때 자동으로 생성됩니다.

### Vercel 배포

1. 이 저장소를 fork 하거나 push 한 뒤 [vercel.com/new](https://vercel.com/new)에서 Import 합니다.
2. 프로젝트의 **Storage** 탭에서 Neon(Postgres)을 만들고 프로젝트에 연결합니다. `DATABASE_URL`이 자동으로 추가됩니다.
3. **Settings → Environment Variables**에 `ARCHIVE_TOKEN`을 추가합니다. 값은 길고 무작위한 문자열이면 됩니다.
   ```bash
   node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"
   ```
4. **Redeploy** 합니다.
5. 브라우저에서 `https://<사이트>/key?t=<ARCHIVE_TOKEN>`을 한 번 엽니다. 그 브라우저에 1년짜리 쓰기 쿠키가 저장됩니다. 해제하려면 `/key?t=`를 엽니다.

## 기술 스택

- Next.js 16 (App Router), React 19, TypeScript
- Postgres (`postgres` 드라이버), 로컬 폴백은 JSON 파일
- 외부 UI 라이브러리 없이 CSS만 사용

