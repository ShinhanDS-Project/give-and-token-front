# Blockchain Dashboard Frontend

루트에 독립된 React 프론트 앱입니다.

## 실행

```bash
npm install
npm run dev
```

## API 연결 방식

- 기본값은 `mock` 데이터로 동작합니다.
- 실제 스프링 백엔드(`final-project`)와 연결하려면 `.env`를 만들고 아래처럼 설정합니다.

```env
VITE_USE_MOCK_DATA=false
VITE_API_BASE_URL=http://localhost:8080
```

## 현재 구현 페이지

- `/` : 전체 트랜잭션 목록 + 검색 + 페이징
- `/wallets/:walletAddress` : 지갑 상세 + 관련 트랜잭션 목록 + 페이징
- `/transactions/:txHash` : 트랜잭션 상세

## 프론트가 기대하는 API 예시

- `GET /api/blockchain/transactions?page=1&keyword=...`
- `GET /api/blockchain/wallets/{walletAddress}?page=1`
- `GET /api/blockchain/transactions/{txHash}`
