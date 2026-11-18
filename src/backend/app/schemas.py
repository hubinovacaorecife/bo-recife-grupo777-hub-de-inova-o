from pydantic import BaseModel, ConfigDict, EmailStr, field_validator, Field
from datetime import datetime

# Domínios aceitos no cadastro. Para liberar qualquer domínio, use None.
DOMINIOS_PERMITIDOS = {"gmail.com"}


def _normalizar_email(email: str) -> str:
    return email.strip().lower()


# ---------- Usuários ----------
class UsuarioSchema(BaseModel):
    nome: str
    email: EmailStr
    senha: str

    @field_validator("email")
    @classmethod
    def validar_email(cls, email: str) -> str:
        email = _normalizar_email(email)
        dominio = email.split("@")[-1]
        if DOMINIOS_PERMITIDOS and dominio not in DOMINIOS_PERMITIDOS:
            raise ValueError(
                "Domínio não permitido. Use: " + ", ".join(sorted(DOMINIOS_PERMITIDOS))
            )
        return email

    @field_validator("senha")
    @classmethod
    def validar_senha(cls, senha: str) -> str:
        if len(senha) < 6:
            raise ValueError("A senha precisa ter pelo menos 6 caracteres.")
        if len(senha.encode("utf-8")) > 72:
            raise ValueError("A senha deve ter no máximo 72 bytes.")
        return senha


class LoginSchema(BaseModel):
    email: EmailStr
    senha: str

    @field_validator("email")
    @classmethod
    def normalizar(cls, email: str) -> str:
        return _normalizar_email(email)      # sem restrição de domínio


class UsuarioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    email: EmailStr
    ativo: bool
    admin: bool
    curador: bool                            # sem a senha


# ---------- Projetos ----------
class ProjetoSchema(BaseModel):
    usuario: int
    descricao: str
    categoria: str
    data_criacao: datetime = Field(default_factory=datetime.now)

class ProjetoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    usuario: int
    descricao: str
    categoria: str
    status: str