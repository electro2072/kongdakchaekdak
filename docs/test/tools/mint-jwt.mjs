// 로컬 블랙박스 테스트용 JWT 발급기 (외부 의존성 없음, HS256).
// 사용: node docs/test/tools/mint-jwt.mjs <userId> [secret] [expSeconds]
// 기본 secret = local 프로필 기본값(application.yml의 JWT_SECRET 미설정 시).
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
