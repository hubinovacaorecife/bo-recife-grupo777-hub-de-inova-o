import { criarConta, login } from "../auth.js";
import { validarEmail, validarSenha } from "../validation.js";

const form = document.getElementById("form-conta");
const erro = document.getElementById("erro");
const botao = form.querySelector('button[type="submit"]');

const mostrarErro = (msg) => { erro.textContent = msg; erro.hidden = !msg; };

document.querySelectorAll("[data-alternar-senha]").forEach((alternador) => {
  alternador.addEventListener("click", () => {
    const senha = document.getElementById(alternador.dataset.alternarSenha);
    const mostrar = senha.type === "password";
    const descricao = senha.id === "confirmar-senha" ? "confirmação da senha" : "senha";
    senha.type = mostrar ? "text" : "password";
    alternador.setAttribute("aria-pressed", String(mostrar));
    alternador.setAttribute("aria-label", `${mostrar ? "Ocultar" : "Mostrar"} ${descricao}`);
    alternador.parentElement.classList.toggle("mostrando", mostrar);
  });
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  mostrarErro("");

  const nome = form.nome.value.trim();
  const email = form.email.value.trim().toLowerCase();
  const senha = form.senha.value;
  const confirmarSenha = document.getElementById("confirmar-senha").value;

  if (!nome) return mostrarErro("Informe seu nome.");
  const erroEmail = validarEmail(email);
  if (erroEmail) return mostrarErro(erroEmail);
  const erroSenha = validarSenha(senha);
  if (erroSenha) return mostrarErro(erroSenha);
  if (senha !== confirmarSenha) return mostrarErro("As senhas não conferem.");
  if (!form.termos.checked) return mostrarErro("Aceite os termos para continuar.");

  botao.disabled = true;
  botao.textContent = "Criando...";
  try {
    await criarConta({ nome, email, senha });
    await login(email, senha);                  // já entra logado
    window.location.href = "../index.html";
  } catch (err) {
    mostrarErro(err.message);                   // ex.: "E-mail já cadastrado"
  } finally {
    botao.disabled = false;
    botao.textContent = "Criar conta";
  }
});