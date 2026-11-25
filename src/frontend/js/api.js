import { API_URL } from "./config.js";

const CHAVES = { access: "rs_access", refresh: "rs_refresh" };

export const getTokens = () => ({
  access: localStorage.getItem(CHAVES.access),
  refresh: localStorage.getItem(CHAVES.refresh),
});

export function salvarTokens({ access, refresh }) {
  if (access) localStorage.setItem(CHAVES.access, access);
  if (refresh) localStorage.setItem(CHAVES.refresh, refresh);
}

export function limparTokens() {
  localStorage.removeItem(CHAVES.access);
  localStorage.removeItem(CHAVES.refresh);
}

// o FastAPI devolve "detail" como texto (400, 409) ou lista (422)
function mensagemDeErro(dados) {
  if (!dados || !dados.detail) return "Erro inesperado. Tente novamente.";
  if (typeof dados.detail === "string") return dados.detail;
  return dados.detail.map((e) => e.msg.replace("Value error, ", "")).join(" ");
}

async function renovarToken() {
  const { refresh } = getTokens();
  if (!refresh) return false;

  // a rota /auth/refresh é GET e lê o refresh token do header
  const resp = await fetch(`${API_URL}/auth/refresh`, {
    headers: { Authorization: `Bearer ${refresh}` },
  });
  if (!resp.ok) return false;

  const dados = await resp.json();
  salvarTokens({ access: dados.access_token });
  return true;
}

export async function api(caminho, { metodo = "GET", corpo, auth = true } = {}) {
  const enviar = () => {
    const ehFormulario = corpo instanceof FormData;
    const headers = ehFormulario ? {} : { "Content-Type": "application/json" };
    const { access } = getTokens();
    if (auth && access) headers.Authorization = `Bearer ${access}`;
    return fetch(`${API_URL}${caminho}`, {
      method: metodo,
      headers,
      body: corpo ? (ehFormulario ? corpo : JSON.stringify(corpo)) : undefined,
    });
  };

  let resp = await enviar();

  // access token expirou: renova uma vez e repete a chamada
  if (resp.status === 401 && auth && (await renovarToken())) {
    resp = await enviar();
  }

  const dados = await resp.json().catch(() => null);

  if (!resp.ok) {
    if (resp.status === 401 && auth) {
      limparTokens();
      window.location.href = new URL("../pages/login.html", import.meta.url).href;
    }
    throw new Error(mensagemDeErro(dados));
  }
  return dados;
}