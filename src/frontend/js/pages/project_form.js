import { api } from "../api.js";
import { me, sair } from "../auth.js";

const formulario = document.getElementById("form-projeto");
const campoDescricao = document.getElementById("descricao");
const campoCategoria = document.getElementById("categoria");
const titulo = document.getElementById("form-titulo");
const botaoSalvar = document.getElementById("salvar-projeto");
const erro = document.getElementById("form-erro");
const sucesso = document.getElementById("form-sucesso");
const linkSucesso = document.getElementById("form-sucesso-link");
const parametros = new URLSearchParams(window.location.search);
const idParametro = parametros.get("id");
const editando = idParametro !== null;
const id = Number(idParametro);

document.getElementById("sair").addEventListener("click", sair);

function mostrarErro(mensagem) {
  erro.textContent = mensagem;
  erro.hidden = false;
  sucesso.hidden = true;
  linkSucesso.hidden = true;
}

async function carregarProjeto() {
  if (!editando) return;
  if (!Number.isSafeInteger(id) || id <= 0) {
    mostrarErro("Identificador de projeto inválido.");
    botaoSalvar.disabled = true;
    return;
  }

  titulo.textContent = "Editar projeto";
  document.title = "Editar projeto · REC SCIENCE";
  botaoSalvar.textContent = "Salvar alterações";
  try {
    const resposta = await api(`/projetos/listar_projetos?id_projeto=${encodeURIComponent(id)}`);
    const projeto = Array.isArray(resposta) ? resposta[0] : resposta;
    if (!projeto) throw new Error("Nenhum projeto encontrado.");
    campoDescricao.value = projeto.descricao || "";
    campoCategoria.value = projeto.categoria || "";
  } catch (error) {
    mostrarErro(error.message || "Não foi possível carregar o projeto.");
    botaoSalvar.disabled = true;
  }
}

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  erro.hidden = true;
  sucesso.hidden = true;
  linkSucesso.hidden = true;
  botaoSalvar.disabled = true;
  botaoSalvar.textContent = editando ? "Salvando..." : "Cadastrando...";

  const dados = {
    descricao: campoDescricao.value.trim(),
    categoria: campoCategoria.value.trim(),
  };

  try {
    if (editando) {
      await api(`/projetos/editar_projeto/${encodeURIComponent(id)}`, {
        metodo: "PATCH",
        corpo: dados,
      });
      sucesso.textContent = "Projeto atualizado com sucesso.";
      linkSucesso.href = `project.html?id=${encodeURIComponent(id)}`;
      linkSucesso.textContent = "Ver projeto";
    } else {
      const usuario = await me();
      if (!usuario || !Number.isSafeInteger(Number(usuario.id)) || Number(usuario.id) <= 0) {
        throw new Error("Não foi possível identificar sua conta para cadastrar o projeto.");
      }
      const resposta = await api("/projetos/criar_projeto", {
        metodo: "POST",
        corpo: { ...dados, usuario: Number(usuario.id) },
      });
      sucesso.textContent = resposta.protocolo
        ? `Projeto cadastrado como rascunho. Guarde seu protocolo: ${resposta.protocolo}.`
        : "Projeto cadastrado como rascunho.";
      linkSucesso.href = "projects.html";
      linkSucesso.textContent = "Ver projetos";
      formulario.reset();
    }
    sucesso.hidden = false;
    linkSucesso.hidden = false;
  } catch (error) {
    mostrarErro(error.message || "Não foi possível salvar o projeto.");
  } finally {
    botaoSalvar.disabled = false;
    botaoSalvar.textContent = editando ? "Salvar alterações" : "Cadastrar projeto";
  }
});

carregarProjeto();
