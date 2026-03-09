"""
Script utilitario para remover tokens gerados por pagamentos mockados.

Remove registros da tabela `tokens` cujo `pagamento_id` siga o padrao
usado pelo gateway mockado:

    PIX-MOCKADO_<timestamp>_SEM-SUSTO

Exemplo:

.. code-block:: bash

    python scripts/remove_pagamentos_mockados.py
"""
import os
import sys

import psycopg2
from dotenv import load_dotenv


PADRAO_PAGAMENTO_MOCKADO = "PIX-MOCKADO_%_SEM-SUSTO"


def obter_database_url() -> str:
    """Carrega a DATABASE_URL a partir do .env local ou variaveis de ambiente."""
    load_dotenv(".env")
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        print("❌ Erro: DATABASE_URL nao definida. Configure no .env ou nas variaveis de ambiente.")
        sys.exit(1)

    return database_url


def remover_tokens_mockados() -> None:
    """Remove tokens associados a pagamentos mockados e exibe um resumo da operacao."""
    database_url = obter_database_url()

    try:
        conn = psycopg2.connect(dsn=database_url)
    except psycopg2.OperationalError as erro:
        print(f"❌ Erro ao conectar no PostgreSQL: {erro}")
        sys.exit(1)

    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    DELETE FROM tokens
                    WHERE pagamento_id LIKE %s
                    RETURNING pagamento_id
                    """,
                    (PADRAO_PAGAMENTO_MOCKADO,),
                )
                pagamentos_removidos = cur.fetchall()

        if not pagamentos_removidos:
            print("ℹ️  Nenhum token mockado encontrado para remocao.")
            return

        print(f"✅ {len(pagamentos_removidos)} token(s) mockado(s) removido(s) com sucesso!")
        for (pagamento_id,) in pagamentos_removidos:
            print(f"   - {pagamento_id}")
    except Exception as erro:
        print(f"❌ Erro ao remover tokens mockados: {erro}")
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    remover_tokens_mockados()
