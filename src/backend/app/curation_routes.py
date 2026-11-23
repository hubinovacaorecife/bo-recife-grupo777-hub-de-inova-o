from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .dependencies import pegar_sessao, verificar_token
from .schemas import ProjetoSchema, ProjetoUpdate
from .models import Projeto, Usuario
import secrets

curation_router = APIRouter(prefix="/curadoria", tags=["curadoria"], dependencies=[Depends(verificar_token)])
