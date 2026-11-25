import { api } from "../api.js";
import { sair } from "../auth.js";

const lista = document.getElementById("projetos-lista");
const erro = document.getElementById("projetos-erro");
const tentarNovamente = document.getElementById("tentar-novamente");
const contagem = document.getElementById("projetos-contagem");
const busca = document.getElementById("projetos-busca");
const filtroCategoria = document.getElementById("filtro-categoria");
const filtroStatus = document.getElementById("filtro-status");
const metricTotal = document.getElementById("metric-total");
const metricRascunho = document.getElementById("metric-rascunho");
const metricAprovados = document.getElementById("metric-aprovados");
let projetosCarregados = [];

document.getElementById("sair").addEventListener("click", sair);
tentarNovamente.addEventListener("click", carregarProjetos);
busca.addEventListener("input", renderizarProjetos);
filtroCategoria.addEventListener("change", renderizarProjetos);
filtroStatus.addEventListener("change", renderizarProjetos);

function criarTexto(tag, className, texto) {
  const elemento = document.createElement(tag);
  if (className) elemento.className = className;
  elemento.textContent = texto;
  return elemento;
}

function criarCartao(projeto) {
  const cartao = document.createElement("article");
  cartao.className = "projeto-card";

  const numero = projeto.protocolo || projeto.id;
  const cabecalho = document.createElement("div");
  cabecalho.className = "projeto-card-cabecalho";
  const categoria = criarTexto("span", "projeto-categoria", projeto.categoria || "Sem categoria");
  const statusTexto = projeto.status || "Status não informado";
  const status = criarTexto("span", "projeto-status", statusTexto);
  const statusNormalizado = statusTexto.toLocaleLowerCase("pt-BR");
  if (statusNormalizado.includes("rascunho")) status.classList.add("status-rascunho");
  else if (statusNormalizado.includes("aprov") || statusNormalizado.includes("public")) status.classList.add("status-publicado");
  else if (statusNormalizado.includes("curadoria")) status.classList.add("status-curadoria");
  cabecalho.append(categoria, status);

  const titulo = criarTexto("h3", "", `Projeto #${numero}`);
  const descricao = criarTexto("p", "projeto-card-descricao", projeto.descricao || "Sem descrição.");

  const rodape = document.createElement("div");
  rodape.className = "projeto-card-rodape";
  rodape.appendChild(criarTexto("span", "projeto-protocolo", `Protocolo ${projeto.protocolo || "—"}`));

  const detalhes = document.createElement("a");
  detalhes.className = "botao botao-contorno";
  detalhes.textContent = "Conhecer projeto";
  detalhes.setAttribute("aria-label", `Ver detalhes do projeto ${numero}`);
  const parametros = new URLSearchParams({ id: String(projeto.id) });
  if (projeto.protocolo) parametros.set("protocolo", String(projeto.protocolo));
  detalhes.href = `project.html?${parametros.toString()}`;
  rodape.appendChild(detalhes);

  const conteudo = document.createElement("div");
  conteudo.className = "projeto-card-conteudo";
  conteudo.append(cabecalho, titulo, descricao);
  cartao.append(conteudo, rodape);
  return cartao;
}

function atualizarMetricas(projetos) {
  const rascunhos = projetos.filter((projeto) =>
    String(projeto.status || "").toLocaleLowerCase("pt-BR").includes("rascunho"),
  ).length;
  const aprovados = projetos.filter((projeto) => {
    const status = String(projeto.status || "").toLocaleLowerCase("pt-BR");
    return status.includes("aprov") || status.includes("public");
  }).length;

  metricTotal.textContent = String(projetos.length);
  metricRascunho.textContent = String(rascunhos);
  metricAprovados.textContent = String(aprovados);
}

function preencherFiltro(select, valorInicial, valores) {
  select.replaceChildren(criarTexto("option", "", valorInicial));
  select.firstElementChild.value = "";
  valores.forEach((valor) => {
    const opcao = criarTexto("option", "", valor);
    opcao.value = valor;
    select.appendChild(opcao);
  });
}

function renderizarProjetos() {
  const consulta = busca.value.trim().toLocaleLowerCase("pt-BR");
  const categoriaSelecionada = filtroCategoria.value;
  const statusSelecionado = filtroStatus.value;
  const filtrados = projetosCarregados.filter((projeto) => {
    const textoBusca = [
      projeto.descricao,
      projeto.categoria,
      projeto.protocolo,
      projeto.status,
    ].join(" ").toLocaleLowerCase("pt-BR");
    return (!consulta || textoBusca.includes(consulta))
      && (!categoriaSelecionada || projeto.categoria === categoriaSelecionada)
      && (!statusSelecionado || projeto.status === statusSelecionado);
  });

  lista.replaceChildren();
  if (filtrados.length === 0) {
    const mensagem = projetosCarregados.length
      ? "Nenhum projeto corresponde a esses filtros. Experimente outros termos."
      : "Ainda não há projetos cadastrados.";
    lista.appendChild(criarTexto("p", "projetos-vazio", mensagem));
  } else {
    filtrados.forEach((projeto) => lista.appendChild(criarCartao(projeto)));
  }

  contagem.textContent = filtrados.length === projetosCarregados.length
    ? `${filtrados.length} ${filtrados.length === 1 ? "projeto" : "projetos"}`
    : `${filtrados.length} de ${projetosCarregados.length} projetos`;
  contagem.hidden = false;
}

async function carregarProjetos() {
  lista.replaceChildren(criarTexto("p", "projetos-carregando", "Carregando projetos..."));
  lista.setAttribute("aria-busy", "true");
  erro.hidden = true;
  tentarNovamente.hidden = true;

  try {
    // O endpoint atual declara o segmento final como "projetos {id}".
    const projetos = await api("/projetos/projetos%20todos");
    if (!Array.isArray(projetos) || projetos.some((projeto) => !projeto || typeof projeto !== "object")) {
      throw new Error("A resposta de projetos veio em um formato inesperado.");
    }
    projetosCarregados = projetos;
    atualizarMetricas(projetosCarregados);
    preencherFiltro(filtroCategoria, "Todas as áreas", [...new Set(
      projetosCarregados.map((projeto) => projeto.categoria).filter(Boolean),
    )].sort((a, b) => a.localeCompare(b, "pt-BR")));
    preencherFiltro(filtroStatus, "Todos os status", [...new Set(
      projetosCarregados.map((projeto) => projeto.status).filter(Boolean),
    )].sort((a, b) => a.localeCompare(b, "pt-BR")));
    renderizarProjetos();
  } catch (error) {
    if (error.message === "Nenhum projeto encontrado") {
      projetosCarregados = [];
      atualizarMetricas(projetosCarregados);
      renderizarProjetos();
      return;
    }
    lista.replaceChildren();
    erro.textContent = error.message || "Não foi possível carregar os projetos.";
    erro.hidden = false;
    tentarNovamente.hidden = false;
  } finally {
    lista.setAttribute("aria-busy", "false");
  }
}

carregarProjetos();
