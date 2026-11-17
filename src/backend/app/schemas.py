from pydantic import BaseModel, ConfigDict, EmailStr, field_validator
from typing import Optional

class UsuarioSchema(BaseModel):
    nome: str
    email: str
    senha: str
    ativo: Optional[bool]

    @field_validator("senha")
    @classmethod
    def validar_tamanho_da_senha(cls, senha: str) -> str:
        if len(senha.encode("utf-8")) > 72:
            raise ValueError("A senha deve ter no máximo 72 bytes.")
        return senha

    @field_validator("email")
    @classmethod
    def checar_dominio_gmail(cls, email: str) -> str:
        if not email.lower().endswith("@gmail.com"):
            raise ValueError("Apenas e-mails como dominio @gmail.com são permitidos.")
        return email

class Config:
    from_attributes = True

class ProjetoSchema(BaseModel):
    descricao: str
    categoria: str
    

class Config:
    from_attributes = True

class LoginSchema(BaseModel):
    email:str
    senha:str

    @field_validator("email")
    @classmethod
    def checar_dominio_gmail(cls, email: str) -> str:
            if not email.lower().endswith("@gmail.com"):
                raise ValueError("Apenas e-mails como dominio @gmail.com são permitidos.")
            return email


class Config:
    from_attributes = True
