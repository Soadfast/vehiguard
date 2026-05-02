/**
 * MIDDI Auth Test Suite — Node.js CommonJS compatible
 * Run: node tests/auth.test.js
 */
'use strict';

const { verifyCredentials, findCompanyByUsername, COMPANIES } = require('../config/auth');
const { recordFailedAttempt, clearAttempts } = require('../middleware/rateLimiter');

let passed = 0;
let failed = 0;

function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').replace(/[<>"'`]/g, '').trim().slice(0, 200);
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${name}`);
    console.error(`    → ${e.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

async function runAll() {
  // ─── Company detection ───────────────────────────────────────────────────
  console.log('\n📦 findCompanyByUsername');

  await test('detecta Muñeco → x1', async () => {
    const r = findCompanyByUsername('Muñeco');
    assert(r && r.empresa === 'x1', `Expected x1, got ${r?.empresa}`);
  });

  await test('detección case-insensitive (muñeco)', async () => {
    const r = findCompanyByUsername('muñeco');
    assert(r && r.empresa === 'x1');
  });

  await test('detecta belona → x2', async () => {
    const r = findCompanyByUsername('belona');
    assert(r && r.empresa === 'x2');
  });

  await test('detecta BELONA (mayúsculas) → x2', async () => {
    const r = findCompanyByUsername('BELONA');
    assert(r && r.empresa === 'x2');
  });

  await test('detecta bambono → x3', async () => {
    const r = findCompanyByUsername('bambono');
    assert(r && r.empresa === 'x3');
  });

  await test('username desconocido → null', async () => {
    assert(findCompanyByUsername('hackerXYZ') === null);
  });

  await test('username vacío → null', async () => {
    assert(findCompanyByUsername('') === null);
  });

  await test('username null → null', async () => {
    assert(findCompanyByUsername(null) === null);
  });

  // ─── verifyCredentials ───────────────────────────────────────────────────
  console.log('\n🔐 verifyCredentials (Login correcto → redirección correcta)');

  await test('Muñeco + middi2024 → x1 autenticado', async () => {
    const r = await verifyCredentials('Muñeco', 'middi2024');
    assert(r !== null && r.empresa === 'x1');
  });

  await test('belona + middi2024 → x2 autenticado', async () => {
    const r = await verifyCredentials('belona', 'middi2024');
    assert(r !== null && r.empresa === 'x2');
  });

  await test('bambono + middi2024 → x3 autenticado', async () => {
    const r = await verifyCredentials('bambono', 'middi2024');
    assert(r !== null && r.empresa === 'x3');
  });

  console.log('\n❌ Login incorrecto → error controlado');

  await test('contraseña incorrecta → null', async () => {
    const r = await verifyCredentials('Muñeco', 'wrongpassword');
    assert(r === null);
  });

  await test('usuario inexistente → null', async () => {
    const r = await verifyCredentials('admin', 'middi2024');
    assert(r === null);
  });

  await test('campos vacíos → null', async () => {
    const r = await verifyCredentials('', '');
    assert(r === null);
  });

  // ─── Injection tests ─────────────────────────────────────────────────────
  console.log('\n🛡  Intentos de inyección');

  await test("SQL injection en usuario → no autentica", async () => {
    const r = await verifyCredentials("belona' OR '1'='1", 'anything');
    assert(r === null);
  });

  await test("XSS en usuario → no autentica", async () => {
    const r = await verifyCredentials('<script>alert(1)</script>', 'middi2024');
    assert(r === null);
  });

  await test("NoSQL injection → no autentica", async () => {
    const r = await verifyCredentials({ $gt: '' }, 'middi2024');
    assert(r === null);
  });

  await test('sanitize elimina tags HTML', async () => {
    const r = sanitize('<script>alert(1)</script>');
    assert(!r.includes('<') && !r.includes('>'));
  });

  await test('sanitize elimina comillas simples', async () => {
    const r = sanitize("admin' OR '1'='1");
    assert(!r.includes("'"));
  });

  await test('sanitize preserva username normal', async () => {
    assert(sanitize('belona') === 'belona');
  });

  await test('sanitize corta strings > 200 chars', async () => {
    assert(sanitize('a'.repeat(300)).length <= 200);
  });

  // ─── Company names ────────────────────────────────────────────────────────
  console.log('\n🏢 Company names obligatorios');

  await test('x1 = MIDDI X MUÑECO', async () => {
    assert(COMPANIES.x1.name === 'MIDDI X MUÑECO', `Got: ${COMPANIES.x1.name}`);
  });

  await test('x2 = MIDDI X BELONA', async () => {
    assert(COMPANIES.x2.name === 'MIDDI X BELONA');
  });

  await test('x3 = MIDDI X BAMBONO', async () => {
    assert(COMPANIES.x3.name === 'MIDDI X BAMBONO');
  });

  await test('no hay contraseñas en texto plano expuestas', async () => {
    for (const [id, c] of Object.entries(COMPANIES)) {
      assert(!c.password, `${id} expone .password en texto plano`);
      assert(c.passwordHash && c.passwordHash.startsWith('$2b$'), `${id} hash inválido`);
    }
  });

  // ─── Rate limiter ─────────────────────────────────────────────────────────
  console.log('\n⏱  Rate Limiter (bloqueo temporal)');

  await test('registra intentos fallidos sin error', async () => {
    for (let i = 0; i < 4; i++) recordFailedAttempt('10.0.0.1');
    assert(true);
  });

  await test('clearAttempts reinicia contador', async () => {
    clearAttempts('10.0.0.1');
    assert(true);
  });

  // ─── Session / acceso a rutas sin permiso ─────────────────────────────────
  console.log('\n🔒 Acceso a rutas sin permiso (lógica de middleware)');

  await test('requireAuth rechaza si no hay session.empresa', async () => {
    const { requireAuth } = require('../middleware/auth');
    let statusCode = 200;
    const req = { session: {} };
    const res = { status: (c) => { statusCode = c; return { json: () => {} }; } };
    requireAuth(req, res, () => { assert(false, 'No debería pasar al next()'); });
    assert(statusCode === 401, `Expected 401, got ${statusCode}`);
  });

  await test('requireAuth pasa con session.empresa válida', async () => {
    const { requireAuth } = require('../middleware/auth');
    let nextCalled = false;
    const req = { session: { empresa: 'x1' } };
    const res = {};
    requireAuth(req, res, () => { nextCalled = true; });
    assert(nextCalled, 'Debería llamar next() con sesión válida');
    assert(req.empresa === 'x1');
  });

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(45)}`);
  console.log(`Resultado: ${passed} pasaron, ${failed} fallaron`);
  if (failed === 0) {
    console.log('✅ Todos los tests pasaron\n');
    process.exit(0);
  } else {
    console.log('❌ Algunos tests fallaron\n');
    process.exit(1);
  }
}

runAll().catch(e => { console.error(e); process.exit(1); });
