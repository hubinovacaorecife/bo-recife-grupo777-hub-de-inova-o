import { getTokens } from "../api.js";
import { me, sair } from "../auth.js";

const area = document.getElementById("area-usuario");

function mostrarVisitante() {
  area.innerHTML = '<a class="botao pequeno botao-contorno" href="pages/create_account.html">Criar conta</a><a class="botao pequeno" href="pages/login.html">Entrar</a>';
}

async function iniciar() {
  if (!getTokens().access) return mostrarVisitante();
  try {
    const usuario = await me();
    area.textContent = "";
    const nome = document.createElement("span");
    nome.textContent = `Olá, ${usuario.nome}`;        // textContent, nunca innerHTML
    const projetos = document.createElement("a");
    projetos.className = "botao pequeno botao-contorno";
    projetos.href = "pages/projects.html";
    projetos.textContent = "Projetos";
    const perfil = document.createElement("a");
    perfil.className = "botao pequeno botao-contorno";
    perfil.href = "pages/profile.html";
    perfil.textContent = "Perfil";
    const btn = document.createElement("button");
    btn.className = "botao pequeno";
    btn.textContent = "Sair";
    btn.addEventListener("click", sair);
    area.append(nome, projetos, perfil, btn);
  } catch {
    mostrarVisitante();
  }
}

iniciar();