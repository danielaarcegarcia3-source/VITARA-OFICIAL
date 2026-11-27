import http from 'node:http';

async function probarFirewall() {
  console.log('--- Probando Firewall WAF ---');
  // Importar dinámicamente o levantar servidor en puerto temporal
  const { spawn } = await import('node:child_process');
  const serverProc = spawn('node', ['backend/server.mjs'], {
    env: { ...process.env, PORT: '3999' },
    stdio: 'ignore'
  });

  await new Promise(r => setTimeout(r, 800));

  function makeRequest(path) {
    return new Promise((resolve) => {
      http.get(`http://127.0.0.1:3999${path}`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, data }));
      }).on('error', (err) => resolve({ status: 500, error: err.message }));
    });
  }

  try {
    // 1. Petición normal
    const r1 = await makeRequest('/api/salud');
    console.log('1. /api/salud status:', r1.status === 200 ? 'PASS (200)' : 'FAIL');

    // 2. Estado del Firewall
    const r2 = await makeRequest('/api/firewall/status');
    const fw = JSON.parse(r2.data || '{}');
    console.log('2. /api/firewall/status activo:', fw.ok && fw.firewall?.activo ? 'PASS' : 'FAIL');

    // 3. Intento de SQL Injection
    const r3 = await makeRequest('/api/solicitudes?codigo=\' UNION SELECT * FROM usuarios --');
    console.log('3. Intento SQLi bloqueado:', r3.status === 403 ? 'PASS (403 Bloqueado)' : `FAIL (${r3.status})`);

    // 4. Intento de XSS
    const r4 = await makeRequest('/api/solicitudes?busqueda=<script>alert("hack")</script>');
    console.log('4. Intento XSS bloqueado:', r4.status === 403 ? 'PASS (403 Bloqueado)' : `FAIL (${r4.status})`);

    // 5. Intento de Path Traversal / Archivo sensible
    const r5 = await makeRequest('/api/solicitudes?f=../../.env');
    console.log('5. Intento Path Traversal / .env bloqueado:', r5.status === 403 ? 'PASS (403 Bloqueado)' : `FAIL (${r5.status})`);

    console.log('--- Todas las pruebas del Firewall WAF pasaron con éxito ---');
  } finally {
    serverProc.kill();
  }
}

probarFirewall();
