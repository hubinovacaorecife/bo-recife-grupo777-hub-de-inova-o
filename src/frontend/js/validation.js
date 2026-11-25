export function validarEmail(valor) {
  const email = valor.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return "E-mail inválido.";
  if (!email.endsWith("@gmail.com")) return "Use um e-mail @gmail.com."; // regra atual da API
  return "";
}

export function validarSenha(senha) {
  if (senha.length < 6) return "A senha precisa ter pelo menos 6 caracteres.";
  return "";
}