# Multisig Anonymous VC Demo - Monorepo

이 프로젝트는 pnpm 모노레포 구조로 변환되었으며, Next.js API는 NestJS 백엔드로 분리되었습니다.

## 프로젝트 구조

```
multisig-anon-vc-demo/
├── apps/
│   ├── frontend/          # Next.js frontend application (포트 3000)
│   └── backend/           # NestJS backend application (포트 3001)
├── packages/              # 공유 패키지 (미래 사용을 위한 예약)
├── pnpm-workspace.yaml    # pnpm 워크스페이스 설정
└── package.json           # 루트 패키지 설정
```

## 설정

### 1. 의존성 설치

루트 디렉토리에서:

```bash
pnpm install
```

### 2. 환경 변수 설정

백엔드 환경변수 (`apps/backend/.env`):
```env
INFURA_PROJECT_ID=your_infura_project_id_here
KMS_SECRET_KEY=your-secret-key-at-least-32-chars-long1234567890
MONGODB_URI=mongodb://localhost:27017/multisig-anon-vc-demo
```

프론트엔드 환경변수 (`apps/frontend/.env.local`):
```env
NEXT_PUBLIC_INFURA_PROJECT_ID=your_infura_project_id_here
```

> **참고**: INFURA_PROJECT_ID를 설정하지 않으면 로컬 Hardhat 네트워크를 사용합니다.

## 개발 서버 실행

### 백엔드만 실행
```bash
pnpm dev:backend
```

### 프론트엔드만 실행
```bash
pnpm dev
```

### 모든 앱 동시 실행
```bash
pnpm dev:all
```

## 빌드

### 모든 앱 빌드
```bash
pnpm build
```

### 개별 앱 빌드
```bash
# 백엔드 빌드
pnpm --filter backend build

# 프론트엔드 빌드
pnpm --filter frontend build
```

## API 엔드포인트

백엔드가 제공하는 API 엔드포인트들:

### Group APIs (포트 3001)
- `POST /group/create` - 그룹 DID 생성
- `POST /group/add-member` - 그룹에 멤버 추가
- `POST /group/export-key` - 키 내보내기 (데모용)

### Issuance APIs (포트 3001)
- `POST /issuance/create-proposal` - VC 발급 제안 생성
- `GET /issuance/get-proposal?proposalId=ID` - 제안 조회
- `POST /issuance/vote` - 제안에 투표
- `POST /issuance/vote2` - 테스트용 투표 API
- `POST /issuance/issue-vc` - VC 발급

## 변경 사항

1. **모노레포 구조**: pnpm 워크스페이스를 사용하여 모노레포로 변환
2. **백엔드 분리**: Next.js API routes를 NestJS 컨트롤러로 마이그레이션
3. **포트 분리**: 
   - 프론트엔드: http://localhost:3000
   - 백엔드: http://localhost:3001
4. **CORS 설정**: 백엔드에서 프론트엔드 요청을 허용하도록 설정
5. **API 호출 업데이트**: 프론트엔드에서 백엔드 API로 요청하도록 수정

## 개발 팁

- 백엔드와 프론트엔드가 각각 독립적으로 실행됩니다
- 백엔드 코드 변경 시 자동 재시작됩니다
- 프론트엔드는 Turbopack을 사용하여 빠른 개발 서버를 제공합니다
- MongoDB 연결이 필요한 기능들은 적절한 환경변수 설정이 필요합니다

---

## 원본 프로젝트 정보

This demo implements the Setup Phase of the Anonymous Multi-Party Approval Protocol for Verifiable Credentials. It demonstrates creating a DID for a Semaphore group (not individual members) and publishing the group information in the DID Document.

## Features

- **Group DID Creation**: Creates a DID specifically for a Semaphore group entity
- **Semaphore Integration**: Manages anonymous group membership using Semaphore protocol
- **DID Document Service Endpoints**: Publishes Semaphore group details in the DID Document
- **Member Management**: Add members to the group while maintaining privacy

## Technologies

- **Next.js 15**: React framework
- **NestJS**: Backend framework
- **TypeScript**: Type safety
- **Veramo**: DID and VC management
- **Semaphore Protocol**: Zero-knowledge group membership
- **MongoDB**: Database for persistence
- **Ethers.js**: Ethereum interactions