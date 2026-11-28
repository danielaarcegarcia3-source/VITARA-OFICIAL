import crypto from "node:crypto";
/** OAuth Authorization Code + PKCE. Google verifica la cuenta; nunca se prueban direcciones por SMTP. */
export function createGoogleAuth({
  env = process.env,
  fetcher = fetch,
  now = Date.now,
} = {}) {
  const clientId = env.GOOGLE_CLIENT_ID || "",
    secret = env.GOOGLE_CLIENT_SECRET || "";
  let redirect;
  try {
    redirect = new URL(env.GOOGLE_REDIRECT_URI);
  } catch {
    /* No configurado: modo visitante explícito. */
  }
  const configured = !!(
    clientId &&
    secret &&
    redirect?.pathname === "/api/google/callback" &&
    !redirect.search &&
    !redirect.hash &&
    (redirect.protocol === "https:" ||
      (redirect.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(redirect.hostname) &&
        env.NODE_ENV !== "production"))
  );
  const signingKey = crypto
    .createHash("sha256")
    .update(secret || crypto.randomBytes(32))
    .digest();
  const identityCookie = "vitara_google_identity",
    flowCookie = "vitara_google_flow";
  const mac = (value) =>
    crypto.createHmac("sha256", signingKey).update(value).digest("base64url");
  const seal = (value) => {
    const encoded = Buffer.from(JSON.stringify(value)).toString("base64url");
    return encoded + "." + mac(encoded);
  };
  const cookies = (req) =>
    Object.fromEntries(
      String(req.headers.cookie || "")
        .split(";")
        .map((part) => part.trim().split(/=(.*)/s))
        .filter((parts) => parts.length >= 2),
    );
  function unseal(value) {
    try {
      const [data, signature] = String(value || "").split(".");
      if (!data || !signature || String(value).split(".").length !== 2)
        return null;
      const expected = Buffer.from(mac(data)),
        given = Buffer.from(signature);
      if (
        given.length !== expected.length ||
        !crypto.timingSafeEqual(given, expected)
      )
        return null;
      const item = JSON.parse(Buffer.from(data, "base64url"));
      return item.exp > now() ? item : null;
    } catch {
      return null;
    }
  }
  const cookie = (name, value, seconds) =>
    `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${seconds}${redirect?.protocol === "https:" ? "; Secure" : ""}`;
  const readIdentity = (req) =>
    configured
      ? (() => {
          const identity = unseal(cookies(req)[identityCookie]);
          return identity?.kind === "identity" &&
            typeof identity.sub === "string" &&
            typeof identity.email === "string"
            ? identity
            : null;
        })()
      : null;
  const send = (res, status, body) => {
    res.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify(body));
  };
  const back = (res, status) => {
    res.writeHead(303, {
      Location: "/?google=" + status,
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    });
    res.end();
  };
  const flows = new Map(),
    limits = new Map();
  async function handle(req, res, url) {
    if (!url.pathname.startsWith("/api/google/")) return false;
    if (url.pathname === "/api/google/session" && req.method === "GET") {
      const identity = readIdentity(req);
      send(res, 200, {
        ok: true,
        configured,
        identity: identity
          ? { email: identity.email, nombre: identity.nombre, verified: true }
          : null,
      });
      return true;
    }
    if (url.pathname === "/api/google/signout" && req.method === "POST") {
      const origin = req.headers.origin;
      if (origin && configured && origin !== redirect.origin) {
        send(res, 403, { ok: false, error: "Origen no permitido." });
        return true;
      }
      res.setHeader("Set-Cookie", [
        cookie(identityCookie, "", 0),
        cookie(flowCookie, "", 0),
      ]);
      send(res, 200, { ok: true });
      return true;
    }
    if (url.pathname === "/api/google/start" && req.method === "GET") {
      if (!configured) {
        back(res, "pendiente");
        return true;
      }
      const ip = req.socket?.remoteAddress || "unknown";
      const recent = limits.get(ip);
      if (recent && recent.exp > now() && recent.count >= 10) {
        send(res, 429, {
          ok: false,
          error: "Espera unos minutos antes de volver a conectar.",
        });
        return true;
      }
      limits.set(ip, {
        exp: now() + 600000,
        count: recent?.exp > now() ? recent.count + 1 : 1,
      });
      if (limits.size > 2000) limits.clear();
      for (const [key, value] of flows)
        if (value.exp <= now()) flows.delete(key);
      const state = crypto.randomBytes(32).toString("base64url"),
        verifier = crypto.randomBytes(48).toString("base64url"),
        exp = now() + 600000;
      if (flows.size >= 2000) {
        send(res, 429, {
          ok: false,
          error: "Vuelve a intentar en unos minutos.",
        });
        return true;
      }
      flows.set(state, { exp, verifier });
      res.setHeader(
        "Set-Cookie",
        cookie(flowCookie, seal({ kind: "flow", state, exp }), 600),
      );
      const target = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      target.search = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirect.href,
        response_type: "code",
        scope: "openid email profile",
        state,
        code_challenge: crypto
          .createHash("sha256")
          .update(verifier)
          .digest("base64url"),
        code_challenge_method: "S256",
        prompt: "select_account",
      }).toString();
      res.writeHead(303, {
        Location: target.href,
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
      });
      res.end();
      return true;
    }
    if (url.pathname === "/api/google/callback" && req.method === "GET") {
      const flow = unseal(cookies(req)[flowCookie]),
        state = url.searchParams.get("state"),
        saved = flows.get(state);
      flows.delete(state);
      res.setHeader("Set-Cookie", cookie(flowCookie, "", 0));
      if (
        !configured ||
        !flow ||
        flow.kind !== "flow" ||
        flow.state !== state ||
        !saved ||
        saved.exp <= now() ||
        url.searchParams.has("error") ||
        !url.searchParams.get("code")
      ) {
        back(res, "no_conectado");
        return true;
      }
      try {
        const response = await fetcher("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: secret,
            redirect_uri: redirect.href,
            grant_type: "authorization_code",
            code: url.searchParams.get("code"),
            code_verifier: saved.verifier,
          }),
          signal: AbortSignal.timeout(8000),
        });
        if (!response.ok) throw new Error("Intercambio rechazado");
        const token = await response.json();
        if (typeof token.access_token !== "string")
          throw new Error("Token ausente");
        const userResponse = await fetcher(
          "https://openidconnect.googleapis.com/v1/userinfo",
          {
            headers: { Authorization: "Bearer " + token.access_token },
            signal: AbortSignal.timeout(8000),
          },
        );
        if (!userResponse.ok) throw new Error("Identidad no disponible");
        const user = await userResponse.json();
        if (
          user.email_verified !== true ||
          typeof user.sub !== "string" ||
          !user.sub ||
          user.sub.length > 255 ||
          !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@gmail\.com$/i.test(
            user.email || "",
          ) ||
          user.email.length > 254
        )
          throw new Error("Se requiere Gmail verificado");
        const nombre = String(user.name || "Participante")
          .replace(/[<>\u0000-\u001f]/g, "")
          .slice(0, 50);
        res.setHeader("Set-Cookie", [
          cookie(flowCookie, "", 0),
          cookie(
            identityCookie,
            seal({
              kind: "identity",
              sub: user.sub,
              email: user.email.toLowerCase(),
              nombre,
              exp: now() + 86400000,
            }),
            86400,
          ),
        ]);
        back(res, "conectado");
      } catch {
        res.setHeader("Set-Cookie", [
          cookie(flowCookie, "", 0),
          cookie(identityCookie, "", 0),
        ]);
        back(res, "no_conectado");
      }
      return true;
    }
    send(res, 404, { ok: false, error: "Ruta no disponible." });
    return true;
  }
  return { handle, readIdentity };
}
