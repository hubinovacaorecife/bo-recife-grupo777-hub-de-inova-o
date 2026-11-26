import os
import re
import sys
from datetime import datetime
import requests
from sqlalchemy import func
from sqlalchemy.orm import sessionmaker
from app.models import Projeto, db

BASE = "https://api.openalex.org"
CHAVE = os.getenv("OPENALEX_API_KEY")

ODS_AREA = {3: "saude", 4: "educacao", 9: "tecnologia", 11: "cidades_mobilidade",
            6: "meio_ambiente", 12: "meio_ambiente", 13: "meio_ambiente",
            14: "meio_ambiente", 15: "meio_ambiente"}


def get(caminho, **params):
    params["api_key"] = CHAVE
    r = requests.get(BASE + caminho, params=params, timeout=30)
    r.raise_for_status()
    return r.json()


def numero_ods(trabalho):
    lista = trabalho.get("sustainable_development_goals") or []
    if not lista:
        return None
    melhor = max(lista, key=lambda o: o.get("score", 0))
    try:
        return int(str(melhor["id"]).rstrip("/").split("/")[-1])
    except ValueError:
        return None


def main(entrada, limite=50):
    if not CHAVE:
        sys.exit("Defina OPENALEX_API_KEY no ambiente.")

    # passo 1: se vier um nome, só lista candidatos para você escolher o ID
    if not re.fullmatch(r"I\d+", entrada):
        for i in get("/institutions", search=entrada, per_page=5)["results"]:
            print(i["id"].split("/")[-1], "|", i["display_name"], "|", i.get("country_code"))
        sys.exit("Rode de novo passando o ID escolhido (ex.: I123456789).")

    nome = get(f"/institutions/{entrada}")["display_name"]
    dados = get(
        "/works",
        filter=f"institutions.id:{entrada},publication_year:>2019,type:article",
        per_page=min(limite, 100),
        select="id,doi,title,publication_year,authorships,sustainable_development_goals",
    )

    sessao = sessionmaker(bind=db)()

    # Busca o maior protocolo atual no banco para gerar os próximos sequencialmente
    ultimo_protocolo = sessao.query(func.max(Projeto.protocolo)).scalar() or 100000
    hoje = datetime.now().strftime("%Y-%m-%d")

    novos = 0
    for w in dados["results"]:
        if not w.get("title") or sessao.query(Projeto).filter_by(fonte_id=w["id"]).first():
            continue
        ods = numero_ods(w)
        autores = ", ".join(a["author"]["display_name"] for a in (w.get("authorships") or [])[:5])
        ultimo_protocolo += 1

        sessao.add(Projeto(
            titulo=w["title"],
            descricao=None,
            categoria=ODS_AREA.get(ods, "outros"),
            ods=ods,
            ano=w.get("publication_year"),
            autores=autores,
            instituicao=nome,
            status="aprovado",
            usuario=None,
            data_criacao=hoje,
            protocolo=ultimo_protocolo,
            origem="importado",
            fonte_id=w["id"],
            fonte_url=w.get("doi") or w["id"],
        ))
        novos += 1
    sessao.commit()
    print(f"{novos} publicações novas de {nome}.")


if __name__ == "__main__":
    main(sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 50)