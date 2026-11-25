import logging
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.exc import SQLAlchemyError
from .dependencies import pegar_sessao, verificar_refresh_token, verificar_token
from .models import Usuario
from .security import bcrypt_context, ALGORITHOM, ACESS_TOKEN_EXPIRE_MINUTES, SECRET_KEY
from .schemas import UsuarioSchema, LoginSchema
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from fastapi.security import OAuth2PasswordRequestForm



auth_router = APIRouter(prefix="/auth", tags=["auth"])
UPLOADS_DIR = Path(__file__).resolve().parent.parent / "uploads"
PROFILE_PHOTOS_DIR = UPLOADS_DIR / "profile_photos"
MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024
logger = logging.getLogger(__name__)


def _extensao_imagem(conteudo: bytes) -> str | None:
    if conteudo.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"
    if conteudo.startswith(b"\xff\xd8\xff"):
        return ".jpg"
    if len(conteudo) >= 12 and conteudo[:4] == b"RIFF" and conteudo[8:12] == b"WEBP":
        return ".webp"
    return None


def _dados_perfil(usuario: Usuario) -> dict:
    return {
        "id": usuario.id,
        "nome": usuario.nome,
        "email": usuario.email,
        "ativo": usuario.ativo,
        "biografia": usuario.biografia,
        "foto_perfil": usuario.foto_perfil,
    }


def _remover_foto_antiga(url: str | None) -> None:
    prefixo = "/uploads/profile_photos/"
    if not url or not url.startswith(prefixo):
        return

    nome_arquivo = url[len(prefixo):]
    caminho = (PROFILE_PHOTOS_DIR / nome_arquivo).resolve()
    if caminho.parent != PROFILE_PHOTOS_DIR.resolve():
        return

    try:
        caminho.unlink(missing_ok=True)
    except OSError:
        logger.exception("Não foi possível remover a foto de perfil antiga.")


def criar_token(
    id_usuario,
    duracao_token=timedelta(minutes=ACESS_TOKEN_EXPIRE_MINUTES),
    tipo_token="access",
):
    data_expiracao = datetime.now(timezone.utc) + duracao_token
    dic_info = {"sub": str(id_usuario), "exp": data_expiracao, "type": tipo_token}
    jwt_codificado = jwt.encode(dic_info, SECRET_KEY, ALGORITHOM)
    return jwt_codificado

def autenticar_usuario(email, senha, session):
    usuario = session.query(Usuario).filter(Usuario.email==email).first()
    if not usuario:
        return False
    elif  not bcrypt_context.verify(senha, usuario.senha):
        return False

    return usuario


@auth_router.post("/criar_conta")
async def criar_conta(usuario_schema:UsuarioSchema, session = Depends(pegar_sessao)):
    usuario= session.query(Usuario).filter(Usuario.email==usuario_schema.email).first()
    if usuario:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail="Já existe um usuário com este e-mail.")

    else:
        senha_criptografada = bcrypt_context.hash(usuario_schema.senha)
        novo_usuario = Usuario(usuario_schema.nome,usuario_schema.email,senha_criptografada,)
        session.add(novo_usuario)
        session.commit()
        return{"mensagem":"Usuário cadastrado com sucesso"}

@auth_router.post("/login")
async def login(login_schema:LoginSchema, session: Session = Depends(pegar_sessao)):
    usuario = autenticar_usuario(login_schema.email, login_schema.senha, session)
    if not usuario:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail="Nenhum usuário encontrado ou credenciais inválidas .",)
    else:
        acess_token = criar_token(usuario.id)
        refresh_token = criar_token(
            usuario.id,
            duracao_token=timedelta(days=7),
            tipo_token="refresh",
        )
        return {
            "access_token": acess_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }

    
@auth_router.post("/login-form")
async def login_form( dados_formulario:OAuth2PasswordRequestForm = Depends(), session: Session = Depends(pegar_sessao)):
    usuario = autenticar_usuario(dados_formulario.username, dados_formulario.password, session)
    if not usuario:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail="Nenhum usuário encontrado ou credenciais inválidas .",)
    else:
        acess_token = criar_token(usuario.id)
        return {
            "access_token": acess_token,
            "token_type": "bearer",
        }
    
@auth_router.get("/refresh")
async def use_refresh_token(usuario: Usuario = Depends(verificar_refresh_token)):
    acess_token = criar_token(usuario.id)
    return {
        "access_token": acess_token,
        "token_type": "bearer",
    }

@auth_router.get("/auth_me")
def obter_me(usuario: Usuario = Depends(verificar_token)):
    if not usuario:
         raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado.",)

    return _dados_perfil(usuario)

@auth_router.patch("/perfil")
async def editar_perfil(
    biografia: str | None = Form(default=None, max_length=1000),
    foto: UploadFile | None = File(default=None),
    remover_foto: bool = Form(default=False),
    usuario: Usuario = Depends(verificar_token),
    session: Session = Depends(pegar_sessao),
):
    if foto is not None and remover_foto:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Envie uma foto ou solicite a remoção, não ambos.",
        )
    if biografia is None and foto is None and not remover_foto:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Informe ao menos um campo para atualizar.",
        )

    if biografia is not None:
        usuario.biografia = biografia.strip() or None

    foto_antiga = usuario.foto_perfil
    novo_arquivo: Path | None = None
    alterou_foto = foto is not None or remover_foto

    if foto is not None:
        try:
            conteudo = await foto.read(MAX_PROFILE_PHOTO_BYTES + 1)
        finally:
            await foto.close()

        if not conteudo:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="O arquivo de foto está vazio.",
            )
        if len(conteudo) > MAX_PROFILE_PHOTO_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                detail="A foto deve ter no máximo 5 MB.",
            )

        extensao = _extensao_imagem(conteudo)
        if extensao is None:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="Envie uma imagem PNG, JPG ou WebP válida.",
            )

        PROFILE_PHOTOS_DIR.mkdir(parents=True, exist_ok=True)
        nome_arquivo = f"{uuid4().hex}{extensao}"
        novo_arquivo = PROFILE_PHOTOS_DIR / nome_arquivo
        novo_arquivo.write_bytes(conteudo)
        usuario.foto_perfil = f"/uploads/profile_photos/{nome_arquivo}"
    elif remover_foto:
        usuario.foto_perfil = None

    try:
        session.commit()
        session.refresh(usuario)
    except SQLAlchemyError:
        session.rollback()
        if novo_arquivo is not None:
            novo_arquivo.unlink(missing_ok=True)
        raise

    if alterou_foto and foto_antiga != usuario.foto_perfil:
        _remover_foto_antiga(foto_antiga)

    return _dados_perfil(usuario)


