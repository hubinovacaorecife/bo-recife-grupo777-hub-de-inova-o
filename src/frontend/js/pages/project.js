import { api } from "../api.js";
import { sair } from "../auth.js";

const detalhe = document.getElementById("projeto-detalhe");
const categoria = document.getElementById("projeto-categoria");
const titulo = document.getElementById("projeto-titulo");
const identificador = document.getElementById("projeto-id");
const descricao = document.getElementById("projeto-descricao");
const erro = document.getElementById("projeto-erro");
const permissao = document.getElementById("projeto-permissao");
const editar = document.getElementById("editar-projeto");

document.getElementById("sair").addEventListener("click", sair);

async function podeEditar(projetoId, protocolo) {
  if (!protocolo || !Number.isSafeInteger(protocolo) || protocolo <= 0) return false;
  const resposta = await api(`/projetos/meus_projetos?protocolo=${encodeURIComponent(protocolo)}`);
  return Number(resposta.projeto && resposta.projeto.id) === projetoId;
}

async function carregarProjeto() {
  const parametros = new URLSearchParams(window.location.search);
  const id = Number(parametros.get("id"));
  if (!Number.isSafeInteger(id) || id <= 0) {
    detalhe.hidden = true;
    erro.textContent = "Identificador de projeto inválido.";
    erro.hidden = false;
    detalhe.setAttribute("aria-busy", "false");
    return;
  }

  try {
    const resposta = await api(`/projetos/listar_projetos?id_projeto=${encodeURIComponent(id)}`);
    const projeto = Array.isArray(resposta) ? resposta[0] : resposta;
    if (!projeto || !Number.isSafeInteger(Number(projeto.id))) {
      throw new Error("Nenhum projeto encontrado.");
    }

    categoria.textContent = projeto.categoria || "Sem categoria";
    titulo.textContent = `Projeto #${projeto.id}`;
    identificador.textContent = `Identificador ${projeto.id}`;
    descricao.textContent = projeto.descricao || "Sem descrição.";
    document.title = `Projeto #${projeto.id} · REC SCIENCE`;

    const protocolo = Number(parametros.get("protocolo"));
    try {
      if (await podeEditar(id, protocolo)) {
        editar.href = `project_form.html?id=${encodeURIComponent(id)}`;
        editar.hidden = false;
      } else {
        permissao.textContent = protocolo
          ? "A edição está disponível apenas para quem cadastrou o projeto."
          : "Abra este projeto pela lista para verificar as opções de edição da sua conta.";
        permissao.hidden = false;
      }
    } catch (errorEdicao) {
      permissao.textContent = errorEdicao.message === "Projeto não encontrado."
        ? "A edição está disponível apenas para quem cadastrou o projeto."
        : `Não foi possível confirmar a permissão de edição: ${errorEdicao.message}`;
      permissao.hidden = false;
    }
  } catch (errorCarregamento) {
    detalhe.hidden = true;
    erro.textContent = errorCarregamento.message || "Não foi possível carregar o projeto.";
    erro.hidden = false;
  } finally {
    detalhe.setAttribute("aria-busy", "false");
  }
}

carregarProjeto();
