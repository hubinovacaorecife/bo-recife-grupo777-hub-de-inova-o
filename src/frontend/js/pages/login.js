import { login } from "../auth.js";

const form = document.getElementById("form-login");
const erro = document.getElementById("erro");
const botao = form.querySelector('button[type="submit"]');

const mostrarErro = (msg) => { erro.textContent = msg; erro.hidden = !msg; };

document.querySelectorAll("[data-alternar-senha]").forEach((alternador) => {
  alternador.addEventListener("click", () => {
    const senha = document.getElementById(alternador.dataset.alternarSenha);
    const mostrar = senha.type === "password";
    senha.type = mostrar ? "text" : "password";
    alternador.setAttribute("aria-pressed", String(mostrar));
    alternador.setAttribute("aria-label", `${mostrar ? "Ocultar" : "Mostrar"} senha`);
    alternador.parentElement.classList.toggle("mostrando", mostrar);
  });
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  mostrarErro("");

  const email = form.email.value.trim().toLowerCase();
  const senha = form.senha.value;

  // no login só se confere o formato; a API decide se a conta existe
  if (!/^\S+@\S+\.\S+$/.test(email)) return mostrarErro("E-mail inválido.");
  if (!senha) return mostrarErro("Informe a senha.");

  botao.disabled = true;
  botao.textContent = "Entrando...";
  try {
    await login(email, senha);
    window.location.href = "../index.html";
  } catch (err) {
    mostrarErro(err.message);
  } finally {
    botao.disabled = false;
    botao.textContent = "Entrar";
  }
});