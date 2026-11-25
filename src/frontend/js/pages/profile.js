import { getTokens } from "../api.js";
import { API_URL } from "../config.js";
import { atualizarPerfil, me, sair } from "../auth.js";

const card = document.getElementById("perfil-card");
const erro = document.getElementById("perfil-erro");
const tentarNovamente = document.getElementById("tentar-novamente");
const form = document.getElementById("form-perfil");
const campoBiografia = document.getElementById("biografia");
const campoFoto = document.getElementById("foto-perfil");
const botaoRemoverFoto = document.getElementById("remover-foto");
const fotoAjuda = document.getElementById("foto-ajuda");
const botaoSalvar = document.getElementById("salvar-perfil");
const erroAtualizacao = document.getElementById("erro-atualizar-perfil");
const sucessoAtualizacao = document.getElementById("sucesso-atualizar-perfil");
const usuarioToken = getTokens().access;
const formatosAceitos = ["image/png", "image/jpeg", "image/webp"];
let removerFoto = false;
let urlPreviewFoto = null;
let fotoPerfilAtual = "";

document.getElementById("sair").addEventListener("click", sair);
tentarNovamente.addEventListener("click", carregarPerfil);
form.addEventListener("submit", salvarAlteracoes);
campoFoto.addEventListener("change", selecionarFoto);
botaoRemoverFoto.addEventListener("click", marcarFotoParaRemocao);

if (!usuarioToken) {
  window.location.href = "login.html";
} else {
  carregarPerfil();
}

async function carregarPerfil() {
  erro.hidden = true;
  tentarNovamente.hidden = true;
  card.setAttribute("aria-busy", "true");

  try {
    const usuario = await me();
    const partesNome = usuario.nome.trim().split(/\s+/);

    document.getElementById("perfil-iniciais").textContent = partesNome
      .slice(0, 2)
      .map((parte) => parte[0])
      .join("")
      .toUpperCase();
    document.getElementById("perfil-nome").textContent = usuario.nome;
    document.getElementById("perfil-email").textContent = usuario.email;
    document.getElementById("perfil-id").textContent = `#${usuario.id}`;
    campoBiografia.value = usuario.biografia || "";
    fotoPerfilAtual = usuario.foto_perfil ? new URL(usuario.foto_perfil, API_URL).href : "";
    atualizarFoto(fotoPerfilAtual);
    form.hidden = false;

    const status = document.getElementById("perfil-status");
    const ativo = document.getElementById("perfil-ativo");
    status.textContent = usuario.ativo ? "Conta ativa" : "Conta inativa";
    ativo.textContent = usuario.ativo ? "Ativa" : "Inativa";
    status.classList.toggle("inativo", !usuario.ativo);
  } catch (errorCarregamento) {
    erro.textContent = `Não foi possível carregar seu perfil: ${errorCarregamento.message}`;
    erro.hidden = false;
    tentarNovamente.hidden = false;
  } finally {
    card.setAttribute("aria-busy", "false");
  }
}

function atualizarFoto(url) {
  const imagem = document.getElementById("perfil-foto");
  const iniciais = document.getElementById("perfil-iniciais");
  imagem.hidden = !url;
  if (url) imagem.src = url;
  else imagem.removeAttribute("src");
  iniciais.hidden = Boolean(url);
  botaoRemoverFoto.hidden = !url;
}

function limparFeedbackAtualizacao() {
  erroAtualizacao.hidden = true;
  sucessoAtualizacao.hidden = true;
}

function selecionarFoto() {
  limparFeedbackAtualizacao();
  const arquivo = campoFoto.files[0];
  if (!arquivo) return;

  if (!formatosAceitos.includes(arquivo.type)) {
    erroAtualizacao.textContent = "Selecione uma imagem PNG, JPG ou WebP.";
    erroAtualizacao.hidden = false;
    campoFoto.value = "";
    restaurarFotoAtual();
    return;
  }
  if (arquivo.size > 5 * 1024 * 1024) {
    erroAtualizacao.textContent = "A foto deve ter no máximo 5 MB.";
    erroAtualizacao.hidden = false;
    campoFoto.value = "";
    restaurarFotoAtual();
    return;
  }

  if (urlPreviewFoto) URL.revokeObjectURL(urlPreviewFoto);
  urlPreviewFoto = URL.createObjectURL(arquivo);
  removerFoto = false;
  fotoAjuda.textContent = arquivo.name;
  atualizarFoto(urlPreviewFoto);
}

function marcarFotoParaRemocao() {
  if (urlPreviewFoto) {
    URL.revokeObjectURL(urlPreviewFoto);
    urlPreviewFoto = null;
  }
  campoFoto.value = "";
  removerFoto = true;
  fotoAjuda.textContent = "A foto será removida ao salvar.";
  atualizarFoto("");
  limparFeedbackAtualizacao();
}

function restaurarFotoAtual() {
  if (urlPreviewFoto) {
    URL.revokeObjectURL(urlPreviewFoto);
    urlPreviewFoto = null;
  }
  fotoAjuda.textContent = removerFoto
    ? "A foto será removida ao salvar."
    : "PNG, JPG ou WebP. Tamanho máximo: 5 MB.";
  atualizarFoto(removerFoto ? "" : fotoPerfilAtual);
}

async function salvarAlteracoes(evento) {
  evento.preventDefault();
  limparFeedbackAtualizacao();
  botaoSalvar.disabled = true;
  botaoSalvar.textContent = "Salvando...";

  try {
    const usuarioAtualizado = await atualizarPerfil({
      biografia: campoBiografia.value,
      foto: campoFoto.files[0],
      removerFoto,
    });

    removerFoto = false;
    campoFoto.value = "";
    fotoAjuda.textContent = "PNG, JPG ou WebP. Tamanho máximo: 5 MB.";
    if (urlPreviewFoto) {
      URL.revokeObjectURL(urlPreviewFoto);
      urlPreviewFoto = null;
    }

    document.getElementById("perfil-nome").textContent = usuarioAtualizado.nome;
    document.getElementById("perfil-email").textContent = usuarioAtualizado.email;
    document.getElementById("perfil-id").textContent = `#${usuarioAtualizado.id}`;
    campoBiografia.value = usuarioAtualizado.biografia || "";
    fotoPerfilAtual = usuarioAtualizado.foto_perfil
      ? new URL(usuarioAtualizado.foto_perfil, API_URL).href
      : "";
    atualizarFoto(fotoPerfilAtual);
    sucessoAtualizacao.textContent = "Perfil atualizado com sucesso.";
    sucessoAtualizacao.hidden = false;
  } catch (erro) {
    erroAtualizacao.textContent = `Não foi possível salvar as alterações: ${erro.message}`;
    erroAtualizacao.hidden = false;
  } finally {
    botaoSalvar.disabled = false;
    botaoSalvar.textContent = "Salvar alterações";
  }
}
