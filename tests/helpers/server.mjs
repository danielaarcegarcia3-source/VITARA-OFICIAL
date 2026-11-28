import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

// Backend completo y consistente: no mezclar sesiones de servicios aislados con API de la preview.
export async function startIsolatedServer(overrides = {}) {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vitara-browser-'));
  const reservation = http.createServer(); reservation.listen(0, '127.0.0.1'); await once(reservation, 'listening');
  const port = reservation.address().port; await new Promise(resolve => reservation.close(resolve));
  const env = { ...process.env, PORT: String(port), VITARA_DATA_DIR: dir, NODE_ENV:'test', VITARA_ALLOW_DEMO_PROFILES:'1' };
  for (const key of ['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','GOOGLE_REDIRECT_URI','DATABASE_URL','RENDER','VITARA_PG_LOCAL_TEST','ADMIN_TOKEN','ADMIN_USUARIO','ADMIN_CLAVE','VITARA_SETUP_KEY','VITARA_REQUESTS_FILE','VITARA_AI_KEY','VITARA_AI_MODEL','VITARA_AI_ENDPOINT']) delete env[key];
  Object.assign(env, overrides);
  const child = spawn(process.execPath, ['server.mjs'], { cwd: root, env, stdio: ['ignore','pipe','pipe'] });
  const dispose = async () => {
    if (child.exitCode === null) { const done = once(child, 'exit'); child.kill('SIGTERM'); await done; }
    fs.rmSync(dir, { recursive: true, force: true });
  };
  try {
    await new Promise((resolve, reject) => {
      let output = ''; const timer = setTimeout(() => reject(new Error('No arrancó el servidor aislado: ' + output)), 10000);
      const log = chunk => { output += chunk; if (output.includes('Servidor HTTP & SSE')) { clearTimeout(timer); resolve(); } };
      child.stdout.on('data', log); child.stderr.on('data', log);
      child.once('exit', () => { clearTimeout(timer); reject(new Error(output)); });
    });
  } catch (error) { await dispose(); throw error; }
  return { base: `http://127.0.0.1:${port}`, dir, dispose };
}
