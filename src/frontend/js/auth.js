import { api, salvarTokens, limparTokens } from "./api.js";

export const criarConta = ({ nome, email, senha }) =>
  api("/auth/criar_conta", { metodo: "POST", corpo: { nome, email, senha }, auth: false });

export async function login(email, senha) {
  const dados = await api("/auth/login", {
    metodo: "POST",
    corpo: { email, senha },
    auth: false,
  });
  salvarTokens({ access: dados.access_token, refresh: dados.refresh_token });
  return dados;
}

export const me = () => api("/auth/auth_me");

export function atualizarPerfil({ biografia, foto, removerFoto }) {
  const dados = new FormData();
  dados.set("biografia", biografia);
  if (foto) dados.set("foto", foto);
  if (removerFoto) dados.set("remover_foto", "true");
  return api("/auth/perfil", { metodo: "PATCH", corpo: dados });
}

export function sair() {
  limparTokens();
  window.location.href = new URL("../pages/login.html", import.meta.url).href;
}