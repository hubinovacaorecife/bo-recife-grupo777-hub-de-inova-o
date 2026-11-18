from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .dependencies import pegar_sessao, verificar_token
from .schemas import ProjetoSchema
from .models import Projeto, Usuario



projects_router = APIRouter(prefix="/projetos", tags=["projetos"], dependencies=[Depends(verificar_token)])


@projects_router.post("/criar_projeto")
async def criar_projeto(projeto_schema: ProjetoSchema, session: Session = Depends(pegar_sessao)):
    novo_projeto = Projeto(
        usuario=projeto_schema.usuario,
        descricao=projeto_schema.descricao,
        categoria=projeto_schema.categoria,
        data_criacao=projeto_schema.data_criacao,
        status="Rascunho"
    )
    session.add(novo_projeto)
    session.commit()
    return{"mensagem": "Projeto criado com sucesso!"}

#enviar curadoria, e se aprovado publicar
#editar projeto
#cancelar projeto 

@projects_router.post("/projeto/cancelar/{id_projeto}")
async def cancelar_projeto(id_projeto: int, session: Session = Depends(pegar_sessao), usuario: Usuario = Depends(pegar_sessao)):
    projeto = session.query(Projeto).filter(Projeto.id==id_projeto).first()
    if not projeto:
        raise HTTPException(status_code=400,detail="Projeto não encontrado")
    if not usuario.curador:
        raise  HTTPException(status_code=401, detail="Você não tem autorização para fazer essa modificação")
    session.commit()
    return {
        "mensagem": f"Projeto número: {id_projeto} cancelado com sucesso!",
        "projeto": projeto
    }

@projects_router.get("/listar{id_projeto}")
def listar_projetos(id_projeto: int, db: Session = Depends(pegar_sessao)):
    projetos = db.query(Projeto).filter(Projeto.id==id_projeto).first()
    if not projetos:
        raise HTTPException(status_code=404, detail="Nenhum projeto encontrado")
    return [
        {
        "descricao": projeto.descricao,
        "categoria": projeto.categoria,
    }
    for projeto in projetos
    ]

@projects_router.get("/meus_projetos")
def meus_projetos( session: Session = Depends(pegar_sessao)):
    projeto = session.query(Projeto).filter().first()
    if not projeto:
        raise HTTPException(status_code=400,detail="Você ainda não possui nenhum projeto.")
    
    return {
        "projeto": projeto
    }

@projects_router.patch("/editar_projeto")
def editar_projetos(id_projeto: int, categoria: str, session: Session = Depends(pegar_sessao)):
    projeto = session.query(Projeto).filter(Projeto.id==id_projeto, Projeto.categoria==categoria).first()
    if not projeto:
        raise HTTPException(status_code=400,detail="Projeto não encontrado")
    editar_projetos = Projeto(
        usuario=projeto.usuario,
        descricao=projeto.descricao,
        categoria=projeto.categoria,
        status="Rascunho"
    )
    session.add(editar_projetos)
    session.commit()
    return{"mensagem": "Projeto editado com sucesso!"}