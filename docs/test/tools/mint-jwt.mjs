// 블랙박스 테스트용 JWT 발급기 (외부 의존성 없음, HS256).
// 사용: node docs/test/tools/mint-jwt.mjs <userId> [secret] [expSeconds]
//
// ⚠️ secret 은 반드시 실제로 서버가 쓰는 값을 넣을 것:
//   - 로컬 gradle bootRun: backend/.env 의 JWT_SECRET  (application.yml 기본값 아님!)
//       node docs/test/tools/mint-jwt.mjs 9001 "$(grep '^JWT_SECRET=' backend/.env | cut -d= -f2-)"
//   - Railway: Railway 환경변수 JWT_SECRET
//   생략 시 application.yml 의 기본값을 쓰는데, .env 나 배포 환경에선 대부분 401 난다.
import crypto from 'node:crypto';

const userId = process.argv[2] ?? '1';
const secret =
  process.argv[3] ?? 'please-change-this-dev-only-jwt-secret-before-deploying';
const expSeconds = Number(process.argv[4] ?? 3600);

const b64u = (buf) =>
  Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const now = Math.floor(Date.now() / 1000);
const header = b64u(JSON.stringify({alg: 'HS256', typ: 'JWT'}));
const payload = b64u(
  JSON.stringify({sub: String(userId), iat: now, exp: now + expSeconds}),
);
const sig = b64u(
  crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest(),
);
process.stdout.write(`${header}.${payload}.${sig}`);
