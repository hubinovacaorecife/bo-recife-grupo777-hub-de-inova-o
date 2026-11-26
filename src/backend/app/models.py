from sqlalchemy import create_engine, Column, String, Integer, Boolean, Float, ForeignKey, Text
from sqlalchemy.orm import declarative_base


#cria a conexão do seu banco
db = create_engine("sqlite:///banco.db")

#cria a base do banco
Base = declarative_base()

#cria as classes/tabelas do banco

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column("id", Integer, primary_key=True, autoincrement=True)
    nome = Column ("nome", String)
    email = Column ("email", String, nullable=False)
    senha = Column ("senha", String)
    ativo = Column ("ativo", Boolean)
    curador = Column ("curador", Boolean, default=False)
    biografia = Column("biografia", Text, nullable=True)
    foto_perfil = Column("foto_perfil", String, nullable=True)

    def __init__(self, nome, email, senha, ativo=True, admin=False, curador=False ):
        self.nome = nome 
        self.email = email
        self.senha = senha
        self.ativo = ativo
        self.curador = curador

class Projeto(Base):
    __tablename__ = "projetos"

    id = Column("id", Integer, primary_key=True, autoincrement=True)
    titulo = Column("titulo", String, nullable=True)
    categoria = Column("categoria", String)  # educacao, saude, meio-ambiente, mobilidade urbana
    descricao = Column("descricao", Text, nullable=True)
    status = Column("status", String, default="Rascunho")  # em análise, aprovado, reprovado, cancelado
    usuario = Column("usuario", ForeignKey("usuarios.id"), nullable=True)
    data_criacao = Column("data_criacao", String, nullable=True)
    protocolo = Column("protocolo", Integer, unique=True, index=True, nullable=False)

    # Campos para importação externa (OpenAlex / repositórios)
    ods = Column("ods", Integer, nullable=True)
    ano = Column("ano", Integer, nullable=True)
    autores = Column("autores", Text, nullable=True)
    instituicao = Column("instituicao", String, nullable=True)
    origem = Column("origem", String, default="manual")  # "manual" ou "importado"
    fonte_id = Column("fonte_id", String, unique=True, index=True, nullable=True)
    fonte_url = Column("fonte_url", String, nullable=True)
    

    # def __init__(self, usuario, protocolo, descricao, categoria, status="Rascunho", data_criacao=None):
    #     self.usuario = usuario
    #     self.descricao = descricao
    #     self.categoria = categoria
    #     self.status = status
    #     self.data_criacao = data_criacao
    #     self.protocolo = protocolo


        


    