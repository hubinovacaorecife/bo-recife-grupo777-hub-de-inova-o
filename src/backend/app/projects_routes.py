from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .dependencies import pegar_sessao, verificar_token
from .schemas import ProjetoSchema, ProjetoUpdate
from .models import Projeto, Usuario
import secrets


projects_router = APIRouter(prefix="/projetos", tags=["projetos"], dependencies=[Depends(verificar_token)])



def gerar_protocolo(db: Session) -> int:
  while True:
    protocolo = secrets.randbelow(90_000) + 10_000
    existe = db.query(Projeto).filter(Projeto.protocolo == protocolo).first()
    if not existe:
      return protocolo

@projects_router.post("/criar_projeto")
async def criar_projeto(db:  Session = Depends(pegar_sessao), projeto_schema: ProjetoSchema = None):
    novo_projeto = Projeto(
        protocolo=gerar_protocolo(db),
        usuario=projeto_schema.usuario,
        descricao=projeto_schema.descricao,
        categoria=projeto_schema.categoria,
        data_criacao=projeto_schema.data_criacao,
        status="Rascunho"
    )
    db.add(novo_projeto)
    db.commit()
    db.refresh(novo_projeto)
    return{"mensagem": "Projeto criado com sucesso!",
           "protocolo": novo_projeto.protocolo
    }

#enviar curadoria, e se aprovado publicar
#editar projeto
#cancelar projeto apenas como rascunho

@projects_router.post("/projeto/cancelar/{id_projeto}")
async def cancelar_projeto(id_projeto: int, db: Session = Depends(pegar_sessao), usuario: Usuario = Depends(pegar_sessao)):
    projeto = db.query(Projeto).filter(Projeto.id==id_projeto).first()
    if not projeto:
        raise HTTPException(status_code=400,detail="Projeto não encontrado")
    if not usuario.curador:
        raise  HTTPException(status_code=401, detail="Você não tem autorização para fazer essa modificação")
    db.commit()
    return {
        "mensagem": f"Projeto número: {id_projeto} cancelado com sucesso!",
        "projeto": projeto
    }

@projects_router.get("/listar_projetos")
def listar_projetos(id_projeto: int, db: Session = Depends(pegar_sessao)):
    projetos = db.query(Projeto).filter(Projeto.id==id_projeto).first()
    if not projetos:
        raise HTTPException(status_code=404, detail="Nenhum projeto encontrado")
    return [
        {
            "id": projetos.id,
            "titulo": projetos.titulo,
            "descricao": projetos.descricao,
            "categoria": projetos.categoria,
            "status": projetos.status,
            "protocolo": projetos.protocolo,
            "ods": projetos.ods,
            "ano": projetos.ano,
            "autores": projetos.autores,
            "instituicao": projetos.instituicao,
            "origem": projetos.origem,
            "fonte_url": projetos.fonte_url,
        }
    ]

@projects_router.get("/meus_projetos")
def meus_projetos(protocolo: int, session: Session = Depends(pegar_sessao),  usuario: Usuario = Depends(verificar_token)):
    projeto = session.query(Projeto).filter(Projeto.protocolo==protocolo, Projeto.usuario==usuario.id).first()
    if not projeto:
        raise HTTPException(status_code=404,detail="Projeto não encontrado.")
    
    return {
        "projeto": projeto
    }

@projects_router.get("/projetos {id}")
def info_projetos(session: Session = Depends(pegar_sessao)):
    projetos = session.query(Projeto).all()
    if not projetos:
        raise HTTPException(status_code=404, detail="Nenhum projeto encontrado")
    return [
        {
            "id": projeto.id,
            "titulo": projeto.titulo,
            "descricao": projeto.descricao,
            "categoria": projeto.categoria,
            "status": projeto.status,
            "protocolo": projeto.protocolo,
            "ods": projeto.ods,
            "ano": projeto.ano,
            "autores": projeto.autores,
            "instituicao": projeto.instituicao,
            "origem": projeto.origem,
            "fonte_url": projeto.fonte_url,
        }
        for projeto in projetos
    ]

@projects_router.patch("/editar_projeto/{id_projeto}")
def editar_projetos(
    id_projeto: int,
    dados: ProjetoUpdate,
    session: Session = Depends(pegar_sessao),
    usuario: Usuario = Depends(verificar_token),):
    projeto = session.query(Projeto).filter(
        Projeto.id == id_projeto,
        Projeto.usuario == usuario.id,
    ).first()
    if not projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    projeto.descricao = dados.descricao
    projeto.categoria = dados.categoria

    session.commit()
    session.refresh(projeto)
    return {
        "mensagem": "Projeto editado com sucesso!",
        "projeto": {
            "id": projeto.id,
            "descricao": projeto.descricao,
            "categoria": projeto.categoria,
            "status": projeto.status,
            "protocolo": projeto.protocolo,
        },
    }



#enviar curadoria, e se aprovado publicar
#editar projeto
#cancelar projeto apenas como rascunho