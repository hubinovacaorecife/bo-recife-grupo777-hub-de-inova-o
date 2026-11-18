from sqlalchemy import create_engine, Column, String, Integer, Boolean, Float, ForeignKey
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

    def __init__(self, nome, email, senha, ativo=True, admin=False, curador=False ):
        self.nome = nome 
        self.email = email
        self.senha = senha
        self.ativo = ativo
        self.curador = curador

class Projeto(Base):
    __tablename__ = "projetos"

    id = Column("id", Integer, primary_key=True, autoincrement=True)
    categoria = Column("categoria", String) #educaçao, saude, meio-ambiente, mobilidade urbana
    descricao = Column("descricao", String)
    status = Column("status", String, default="Rascunho") #em análise, aprovado, reprovado, cancelado
    usuario = Column ("usuario", ForeignKey("usuarios.id"))
    data_criacao = Column("data_criacao", String)
    

    def __init__(self, usuario, descricao, categoria, status="Rascunho", data_criacao=None):
        self.usuario = usuario
        self.descricao = descricao
        self.categoria = categoria
        self.status = status
        self.data_criacao = data_criacao


        


    