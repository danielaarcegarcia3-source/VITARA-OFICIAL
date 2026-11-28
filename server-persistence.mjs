/** Persistencia PostgreSQL opcional. Sin DATABASE_URL, el modo local sigue usando JSON privado. */
import pg from 'pg';
const { Pool } = pg;
const keys = ['participation', 'requests'];
const initial = { participation: { version: 1, admin: null, profiles: [] }, requests: [] };
export function validateDocument(key, value) {
  if (key === 'requests' && Array.isArray(value)) return;
  if (key === 'participation' && value?.version === 1 && Array.isArray(value.profiles)) return;
  throw new Error('Almacenamiento inválido. Recupera un respaldo privado; no se ha sustituido por datos vacíos.');
}
export function serialExecutor({ maxPending = 40 } = {}) {
  let tail = Promise.resolve(), pending = 0;
  return async function run(operation) {
    if (pending >= maxPending) throw Object.assign(new Error('Hay demasiadas operaciones pendientes. Reintenta en unos segundos.'), { statusCode: 503 });
    pending++;
    const result = tail.then(operation);
    tail = result.catch(() => {});
    try { return await result; } finally { pending--; }
  };
}
export async function openPostgres({ connectionString = process.env.DATABASE_URL, testLocal = false } = {}) {
  if (!connectionString) return null;
  let url;
  try { url = new URL(connectionString); } catch { throw new Error('DATABASE_URL no tiene un formato válido.'); }
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('DATABASE_URL debe ser una conexión PostgreSQL.');
  if (!url.hostname || !url.pathname.slice(1)) throw new Error('DATABASE_URL requiere servidor y nombre de base.');
  // pg da prioridad a parámetros de URL sobre opciones del Pool (incluso ssl=0 y host).
  // Usar exclusivamente usuario/contraseña/servidor/puerto/base; TLS lo decide este adaptador.
  url.search = '';
  const localTest = testLocal && process.env.NODE_ENV === 'test' && process.env.RENDER !== 'true' && ['localhost','127.0.0.1','[::1]'].includes(url.hostname);
  const pool = new Pool({ connectionString: url.toString(), ssl: localTest ? false : { rejectUnauthorized: true }, enableChannelBinding: true, max: 3, connectionTimeoutMillis: 20000, idleTimeoutMillis: 30000, statement_timeout: 10000, query_timeout: 15000, application_name: 'vitara' });
  // Un error de socket no debe volcar a logs la conexión ni tumbar sin control el proceso.
  pool.on('error', () => {});
  const cache = new Map();
  async function refresh() {
    const { rows } = await pool.query('SELECT document_key, document_value, revision FROM vitara_documents WHERE document_key = ANY($1::text[])', [keys]);
    if (rows.length !== keys.length) throw new Error('Faltan documentos de VITARA. No se han recreado silenciosamente.');
    const next = new Map();
    for (const row of rows) { validateDocument(row.document_key, row.document_value); next.set(row.document_key, { value: row.document_value, revision: row.revision }); }
    cache.clear(); for (const [key,value] of next) cache.set(key,value);
  }
  try {
    // Esquema aislado por nombres; no toca otras tablas ni importa los JSON locales.
    // La revisión optimista evita sobrescribir cambios de otra instancia en un despliegue solapado.
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT pg_advisory_xact_lock(742190386)");
      const existed = (await client.query("SELECT to_regclass('vitara_documents') AS name")).rows[0].name;
      await client.query(`CREATE TABLE IF NOT EXISTS vitara_documents (
      document_key text PRIMARY KEY CHECK (document_key IN ('requests','participation')),
      document_value jsonb NOT NULL,
      revision bigint NOT NULL DEFAULT 0,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`);
      if (!existed) for (const key of keys) await client.query('INSERT INTO vitara_documents (document_key, document_value) VALUES ($1, $2::jsonb) ON CONFLICT (document_key) DO NOTHING', [key, JSON.stringify(initial[key])]);
      await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
    await refresh();
  } catch (error) { await pool.end(); throw error; }
  return {
    mode: 'postgres', refresh,
    current(key) { const row = cache.get(key); if (!row) throw new Error('Documento no inicializado.'); return structuredClone(row.value); },
    async save(key, value) {
      validateDocument(key, value);
      const row = cache.get(key); if (!row) throw new Error('Documento no inicializado.');
      const result = await pool.query('UPDATE vitara_documents SET document_value = $1::jsonb, revision = revision + 1, updated_at = now() WHERE document_key = $2 AND revision = $3 RETURNING revision', [JSON.stringify(value), key, row.revision]);
      if (result.rowCount !== 1) throw Object.assign(new Error('Otra instancia actualizó estos datos. Reintenta la operación; no se sobrescribieron registros.'), { statusCode: 409, status: 409 });
      cache.set(key, { value: structuredClone(value), revision: result.rows[0].revision });
    },
    async check() {
      const result = await pool.query('SELECT document_key FROM vitara_documents WHERE document_key = ANY($1::text[])', [keys]);
      if (result.rowCount !== keys.length) throw new Error('Almacenamiento incompleto.');
    },
    async close() { await pool.end(); }
  };
}
