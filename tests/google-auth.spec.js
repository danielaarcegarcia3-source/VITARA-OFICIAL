import { test, expect } from "@playwright/test";
import { createGoogleAuth } from "../google-auth.mjs";
import crypto from "node:crypto";
import { startIsolatedServer } from "./helpers/server.mjs";
const env = {
  GOOGLE_CLIENT_ID: "client.test",
  GOOGLE_CLIENT_SECRET: "secret-only-for-isolated-automated-tests",
  GOOGLE_REDIRECT_URI: "https://vitara.example.test/api/google/callback",
};
function response() {
  return {
    headers: {},
    status: 0,
    setHeader(k, v) {
      this.headers[k] = v;
    },
    writeHead(status, headers = {}) {
      this.status = status;
      Object.assign(this.headers, headers);
    },
    end(body) {
      this.body = body;
    },
  };
}
function req(url, cookie = "") {
  return {
    method: "GET",
    url,
    headers: { cookie },
    socket: { remoteAddress: "test" },
  };
}
async function invoke(auth, path, cookie = "") {
  const request = req(path, cookie),
    res = response();
  await auth.handle(request, res, new URL(path, "https://vitara.example.test"));
  return res;
}

test("OAuth usa PKCE, estado ligado a cookie y verificación real del proveedor, sin simular Google", async () => {
  const calls = [];
  const auth = createGoogleAuth({
    env,
    fetcher: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        json: async () =>
          url.endsWith("/token")
            ? { access_token: "isolated-token" }
            : {
                sub: "isolated-sub",
                email: "demo@gmail.com",
                email_verified: true,
                name: "Prueba Google",
              },
      };
    },
  });
  const start = await invoke(auth, "/api/google/start");
  expect(start.status).toBe(303);
  const target = new URL(start.headers.Location);
  expect(target.origin).toBe("https://accounts.google.com");
  expect(target.searchParams.get("code_challenge_method")).toBe("S256");
  expect(target.searchParams.get("scope")).toBe("openid email profile");
  const state = target.searchParams.get("state"),
    cookie = start.headers["Set-Cookie"].split(";")[0];
  const done = await invoke(
    auth,
    "/api/google/callback?code=code&state=" + state,
    cookie,
  );
  expect(done.headers.Location).toBe("/?google=conectado");
  expect(calls[0].url).toBe("https://oauth2.googleapis.com/token");
  expect(
    crypto
      .createHash("sha256")
      .update(calls[0].options.body.get("code_verifier"))
      .digest("base64url"),
  ).toBe(target.searchParams.get("code_challenge"));
  expect(calls[1].url).toBe("https://openidconnect.googleapis.com/v1/userinfo");
  const identity = done.headers["Set-Cookie"][1];
  expect(identity).toContain("HttpOnly");
  expect(identity).toContain("Secure");
  expect(auth.readIdentity(req("/", identity.split(";")[0])).email).toBe(
    "demo@gmail.com",
  );
  expect(
    auth.readIdentity(req("/", identity.split(";")[0] + "tampered")),
  ).toBeNull();
  const replay = await invoke(
    auth,
    "/api/google/callback?code=code&state=" + state,
    cookie,
  );
  expect(replay.headers.Location).toBe("/?google=no_conectado");
});

test("cuenta no verificada, estado incorrecto y fallo de Google se rechazan sin cuenta falsa", async () => {
  for (const mode of ["unverified", "network", "state"]) {
    const auth = createGoogleAuth({
      env,
      fetcher: async (url) => {
        if (mode === "network") throw new Error("No network");
        return {
          ok: true,
          json: async () =>
            url.endsWith("/token")
              ? { access_token: "test" }
              : { sub: "test", email: "fake@gmail.com", email_verified: false },
        };
      },
    });
    const start = await invoke(auth, "/api/google/start");
    const state = new URL(start.headers.Location).searchParams.get("state");
    const result = await invoke(
      auth,
      "/api/google/callback?code=test&state=" +
        (mode === "state" ? "wrong" : state),
      start.headers["Set-Cookie"].split(";")[0],
    );
    expect(result.headers.Location).toBe("/?google=no_conectado");
    expect(auth.readIdentity(req("/"))).toBeNull();
  }
});

test("sin configuración no ofrece autenticación falsa; Gmail escrito a mano no se registra", async () => {
  const server = await startIsolatedServer();
  try {
    const status = await fetch(server.base + "/api/google/session").then((r) =>
      r.json(),
    );
    expect(status.configured).toBe(false);
    const fake = await fetch(server.base + "/api/perfiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: "Prueba aislada",
        email: "inventado@gmail.com",
        rol: "CIU",
        consent: true,
      }),
    });
    expect(fake.status).toBe(403);
    expect((await fake.json()).error).toContain("Google");
    expect((await fetch(server.base + "/google-auth.mjs")).status).toBe(404);
  } finally {
    await server.dispose();
  }
});

test("caducidad, límites y separación de cookies de flujo/identidad", async () => {
  let clock = 1000;
  const auth = createGoogleAuth({
    env,
    now: () => clock,
    fetcher: async () => {
      throw new Error("No debe contactar al proveedor");
    },
  });
  const first = await invoke(auth, "/api/google/start"),
    flowCookie = first.headers["Set-Cookie"].split(";")[0];
  expect(
    auth.readIdentity(
      req(
        "/",
        flowCookie.replace("vitara_google_flow=", "vitara_google_identity="),
      ),
    ),
  ).toBeNull();
  for (let i = 1; i < 10; i++)
    expect((await invoke(auth, "/api/google/start")).status).toBe(303);
  expect((await invoke(auth, "/api/google/start")).status).toBe(429);
  clock += 600001;
  const state = new URL(first.headers.Location).searchParams.get("state");
  expect(
    (
      await invoke(
        auth,
        "/api/google/callback?code=test&state=" + state,
        flowCookie,
      )
    ).headers.Location,
  ).toBe("/?google=no_conectado");
  const insecure = createGoogleAuth({
    env: {
      ...env,
      NODE_ENV: "production",
      GOOGLE_REDIRECT_URI: "http://localhost/api/google/callback",
    },
  });
  expect(
    JSON.parse((await invoke(insecure, "/api/google/session")).body).configured,
  ).toBe(false);
});

test("backend integra identidad del proveedor simulado: recuperación, rotación y sin autoridad administrativa", async () => {
  const auth = createGoogleAuth({
    env,
    fetcher: async (url) => ({
      ok: true,
      json: async () =>
        url.endsWith("/token")
          ? { access_token: "isolated" }
          : {
              sub: "isolated-sub",
              email: "participante@gmail.com",
              email_verified: true,
              name: "Prueba aislada",
            },
    }),
  });
  const start = await invoke(auth, "/api/google/start");
  const state = new URL(start.headers.Location).searchParams.get("state");
  const done = await invoke(
    auth,
    "/api/google/callback?code=isolated&state=" + state,
    start.headers["Set-Cookie"].split(";")[0],
  );
  const cookie = done.headers["Set-Cookie"][1].split(";")[0];
  const server = await startIsolatedServer(env);
  const profile = {
    nombre: "Participante aislado",
    email: "participante@gmail.com",
    rol: "AGC",
    consent: true,
  };
  const register = () =>
    fetch(server.base + "/api/perfiles", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify(profile),
    });
  try {
    const created = await register();
    expect(created.status).toBe(201);
    const first = await created.json();
    expect(first.profile.emailVerified).toBe(true);
    expect(first.profile.identityProvider).toBe("google");
    expect(first.profile.googleSub).toBeUndefined();
    const recovered = await register();
    expect(recovered.status).toBe(200);
    const second = await recovered.json();
    expect(second.profile.id).toBe(first.profile.id);
    expect(second.token).not.toBe(first.token);
    expect(
      (
        await fetch(server.base + "/api/perfil", {
          headers: { Authorization: "Bearer " + first.token },
        })
      ).status,
    ).toBe(401);
    expect(
      (
        await fetch(server.base + "/api/admin/usuarios", {
          headers: { Authorization: "Bearer " + second.token },
        })
      ).status,
    ).toBe(401);
    expect(
      (
        await fetch(server.base + "/api/perfil", {
          headers: { Authorization: "Bearer " + second.token },
        })
      ).status,
    ).toBe(200);
    const signout = await fetch(server.base + "/api/google/signout", {
      method: "POST",
    });
    expect(signout.headers.get("set-cookie")).toContain("Max-Age=0");
  } finally {
    await server.dispose();
  }
});

 test('inicio desde preview redirige al dominio del callback antes de crear cookies',async()=>{const auth=createGoogleAuth({env});const res=response();const request=req('/api/google/start');request.headers.host='preview.example.test';await auth.handle(request,res,new URL('https://preview.example.test/api/google/start'));expect(res.headers.Location).toBe('https://vitara.example.test/api/google/start');expect(res.headers['Set-Cookie']).toBeUndefined();});
