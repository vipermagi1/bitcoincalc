# Bitcoin 가격 계산기

Upbit의 Bitcoin/KRW 가격을 실시간으로 가져와서 다양한 계산값을 보여주는 웹 애플리케이션입니다.

## 기능

- 실시간 Bitcoin 가격 조회 (Upbit API)
- 원화 ↔ Bitcoin 변환 계산
- 다양한 수량별 가치 계산
- 10초마다 자동 가격 업데이트
- 반응형 디자인

## 기술 스택

- React 19
- Vite
- Upbit Public API
- Vercel (배포)

## 로컬 개발

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

개발 서버는 `http://localhost:5173`에서 실행됩니다.

## 빌드

```bash
npm run build
```

빌드된 파일은 `dist` 폴더에 생성됩니다.

## Vercel 배포

1. GitHub에 프로젝트를 푸시합니다.
2. [Vercel](https://vercel.com)에 로그인합니다.
3. "New Project"를 클릭하고 GitHub 저장소를 선택합니다.
4. Vercel이 자동으로 프로젝트를 감지하고 배포합니다.

또는 Vercel CLI를 사용할 수 있습니다:

```bash
npm i -g vercel
vercel
```

## API 구조

- `/api/proxy` - Vercel 서버리스 함수 (Upbit API 프록시)

## 주의사항

- Upbit API는 CORS 제한이 있을 수 있어, 프로덕션 환경에서는 Vercel 서버리스 함수를 통해 프록시를 사용합니다.
- 개발 환경에서는 Vite 프록시를 사용합니다.
