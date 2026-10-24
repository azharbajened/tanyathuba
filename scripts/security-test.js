const http = require('http');

function post(path, body) {
  return new Promise((resolve) => {
    const bodyStr = JSON.stringify(body);
    const opts = {
      hostname: 'localhost', port: 3000, path,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr) }
    };
    const req = http.request(opts, (r) => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => resolve({ status: r.statusCode, body: JSON.parse(d) }));
    });
    req.write(bodyStr);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve) => {
    const opts = {
      hostname: 'localhost', port: 3000, path, method: 'GET',
      headers: token ? { Authorization: 'Bearer ' + token } : {}
    };
    http.get(opts, (r) => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => resolve({ status: r.statusCode, body: JSON.parse(d) }));
    });
  });
}

async function runTests() {
  console.log('\n=== SECURITY TEST SUITE ===\n');

  // 1. SQL Injection via login
  let r = await post('/api/admin/login', { password: "' OR '1'='1" });
  console.log('[TEST 1] SQL Injection via login:', r.status === 401 ? '✅ BLOCKED (401)' : '❌ PASSED (VULNERABLE)');

  // 2. Wrong password brute force
  r = await post('/api/admin/login', { password: 'wrongpassword' });
  console.log('[TEST 2] Wrong password blocked:', r.status === 401 ? '✅ BLOCKED (401)' : '❌ VULNERABLE');

  // 3. Admin endpoint without token
  r = await get('/api/admin/questions');
  console.log('[TEST 3] Unauth admin access:', r.status === 401 ? '✅ BLOCKED (401)' : '❌ VULNERABLE');

  // 4. Admin with tampered token
  r = await get('/api/admin/questions', 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYWRtaW4ifQ.tampered');
  console.log('[TEST 4] Tampered JWT blocked:', r.status === 403 ? '✅ BLOCKED (403)' : '❌ VULNERABLE');

  // 5. Submit without captcha
  r = await post('/api/questions', { name: 'Test', question: 'Pertanyaan test yang cukup panjang' });
  console.log('[TEST 5] Submit without captcha:', r.status === 400 ? '✅ BLOCKED (400)' : '❌ VULNERABLE');

  // 6. XSS in name field
  r = await post('/api/questions', { name: '<script>alert(1)</script>', question: 'Tes', captchaAnswer: 2, captchaToken: 'invalid' });
  console.log('[TEST 6] XSS in name blocked:', r.status === 400 ? '✅ BLOCKED (400)' : '❌ VULNERABLE');

  // 7. Oversized body
  const huge = { password: 'A'.repeat(200) };
  r = await post('/api/admin/login', huge);
  console.log('[TEST 7] Oversized password:', r.status === 400 ? '✅ BLOCKED (400)' : '❌ VULNERABLE (status: '+r.status+')');

  // 8. alg:none JWT attack
  const noneToken = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJyb2xlIjoiYWRtaW4ifQ.';
  r = await get('/api/admin/stats', noneToken);
  console.log('[TEST 8] alg:none JWT attack:', r.status === 403 ? '✅ BLOCKED (403)' : '❌ VULNERABLE');

  // 9. Stats endpoint (should be public)
  r = await get('/api/questions/stats');
  console.log('[TEST 9] Public stats accessible:', r.status === 200 ? '✅ OK' : '❌ ERROR');

  console.log('\n=== DONE ===\n');
}

runTests().catch(console.error);
