# @deprecated Desde 09/03/2026.
# Substituído por `lib/scripts/database/init_db.ts`.
# Mantido em `_deprecated/` para referência histórica e rollback controlado.
"""
Script de inicialização do banco de dados PostgreSQL.

Aplica migrations de forma idempotente e, quando permitido pelo ambiente,
importa o catálogo inicial a partir de ``produtos_higienizados.json``.
"""

import json
import os
import sys
import time
from urllib.parse import urlparse

import psycopg2
from dotenv import load_dotenv
from psycopg2.extras import execute_values

AMBIENTES_VALIDOS = {"local", "producao"}
MIGRATIONS_DIR = "infra/migrations"
DATASET_FILE = "produtos_higienizados.json"


def normalizar_booleano(valor_bruto: str | None, padrao: bool) -> bool:
    if valor_bruto is None:
        return padrao

    valor_normalizado = valor_bruto.strip().lower()

    if valor_normalizado == "true":
        return True

    if valor_normalizado == "false":
        return False

    return padrao


def obter_ambiente_operacional() -> str:
    ambiente_bruto = (
        os.getenv("APP_ENV")
        or os.getenv("PG_ENV")
        or "local"
    ).strip().lower()

    if ambiente_bruto not in AMBIENTES_VALIDOS:
        print(
            "❌ Erro: APP_ENV inválido. "
            "Use apenas 'local' ou 'producao'."
        )
        sys.exit(1)

    return ambiente_bruto


def parse_db_url(url: str) -> dict:
    """
    Parseia a URL de conexão do PostgreSQL para obter credenciais individuais.
    """
    resultado = urlparse(url)
    return {
        "host": resultado.hostname,
        "port": resultado.port or 5432,
        "user": resultado.username,
        "password": resultado.password,
        "database": resultado.path.lstrip("/"),
    }


load_dotenv(".env")

APP_ENV = obter_ambiente_operacional()
DATABASE_URL = os.getenv("DATABASE_URL")
DEVE_RESETAR_BANCO = normalizar_booleano(
    os.getenv("INIT_DB_RESETAR_BANCO"),
    False,
)
DEVE_IMPORTAR_DADOS = normalizar_booleano(
    os.getenv("INIT_DB_IMPORTAR_DADOS"),
    APP_ENV == "local",
)

if not DATABASE_URL:
    print("❌ Erro: DATABASE_URL não definida. Configure no .env ou nas variáveis de ambiente.")
    sys.exit(1)

DB_CONFIG = parse_db_url(DATABASE_URL)


def create_database_if_not_exists():
    """Cria o banco da aplicação se ele ainda não existir."""
    if APP_ENV != "local":
        raise RuntimeError(
            "Criação automática de banco só é permitida em APP_ENV=local."
        )

    banco_alvo = DB_CONFIG["database"]
    print(f"🔨 Verificando banco de dados '{banco_alvo}'...")

    try:
        conexao = psycopg2.connect(
            host=DB_CONFIG["host"],
            port=DB_CONFIG["port"],
            user=DB_CONFIG["user"],
            password=DB_CONFIG["password"],
            database="postgres",
        )
        conexao.autocommit = True
        cursor = conexao.cursor()

        cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (banco_alvo,))
        existe = cursor.fetchone()

        if not existe:
            print(f"🆕 Criando banco de dados '{banco_alvo}'...")
            cursor.execute(f'CREATE DATABASE "{banco_alvo}"')
            print("✅ Banco criado com sucesso.")
        else:
            print(f"ℹ️ Banco '{banco_alvo}' já existe.")

        cursor.close()
        conexao.close()
    except Exception as erro:
        print(f"❌ Erro ao verificar/criar banco: {erro}")
        sys.exit(1)


def get_connection():
    """
    Tenta conectar ao banco usando a DATABASE_URL.
    Implementa retry com backoff para aguardar o container do PostgreSQL subir.
    """
    tentativas_restantes = 30

    while tentativas_restantes > 0:
        try:
            conexao = psycopg2.connect(dsn=DATABASE_URL)
            print("✅ Conectado ao PostgreSQL.")
            return conexao
        except psycopg2.OperationalError as erro:
            if "does not exist" in str(erro):
                create_database_if_not_exists()
            else:
                print(f"⏳ Aguardando banco... ({tentativas_restantes}) Erro: {erro}")

            time.sleep(1)
            tentativas_restantes -= 1

    print("❌ Erro: timeout de conexão com o banco.")
    sys.exit(1)


def reset_database(conexao):
    """
    Dropa todas as tabelas do schema public.
    Operação destrutiva permitida apenas em APP_ENV=local.
    """
    if APP_ENV != "local":
        print("❌ Reset de banco é permitido apenas em APP_ENV=local.")
        sys.exit(1)

    print("🗑️ Resetando banco de dados...")
    cursor = conexao.cursor()
    cursor.execute(
        """
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        """
    )
    tabelas = cursor.fetchall()

    if not tabelas:
        print("ℹ️ Nenhuma tabela encontrada para dropar.")
    else:
        for (tabela,) in tabelas:
            print(f"🗑️ Dropando: {tabela}")
            cursor.execute(f'DROP TABLE IF EXISTS "{tabela}" CASCADE')

        conexao.commit()
        print(f"✅ {len(tabelas)} tabela(s) dropada(s).")

    cursor.close()


def ensure_migrations_table(conexao):
    cursor = conexao.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS schema_migrations (
            migration_id VARCHAR(255) PRIMARY KEY,
            applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    conexao.commit()
    cursor.close()


def migration_already_applied(conexao, migration_id: str) -> bool:
    cursor = conexao.cursor()
    cursor.execute(
        "SELECT 1 FROM schema_migrations WHERE migration_id = %s",
        (migration_id,),
    )
    existe = cursor.fetchone() is not None
    cursor.close()
    return existe


def register_migration(conexao, migration_id: str):
    cursor = conexao.cursor()
    cursor.execute(
        "INSERT INTO schema_migrations (migration_id) VALUES (%s)",
        (migration_id,),
    )
    conexao.commit()
    cursor.close()


def apply_migrations(conexao):
    print("🚀 Iniciando migrations...")
    ensure_migrations_table(conexao)

    arquivos = sorted(
        [arquivo for arquivo in os.listdir(MIGRATIONS_DIR) if arquivo.endswith(".sql")]
    )

    if not arquivos:
        print("ℹ️ Nenhuma migration encontrada.")
        return

    migrations_aplicadas = 0
    migrations_puladas = 0

    for nome_arquivo in arquivos:
        if migration_already_applied(conexao, nome_arquivo):
            print(f"⏭️ Já aplicada: {nome_arquivo}")
            migrations_puladas += 1
            continue

        caminho_arquivo = os.path.join(MIGRATIONS_DIR, nome_arquivo)
        print(f"📄 Aplicando: {nome_arquivo}")

        cursor = conexao.cursor()
        with open(caminho_arquivo, "r", encoding="utf-8") as arquivo_migration:
            try:
                cursor.execute(arquivo_migration.read())
                conexao.commit()
                register_migration(conexao, nome_arquivo)
                migrations_aplicadas += 1
            except Exception as erro:
                conexao.rollback()
                if "already exists" in str(erro):
                    print(f"⚠️ Objeto já existe, registrando migration: {erro}")
                    register_migration(conexao, nome_arquivo)
                    migrations_puladas += 1
                else:
                    print(f"❌ Falha na migration {nome_arquivo}: {erro}")
                    sys.exit(1)

        cursor.close()

    print(
        f"✅ Migrations concluídas. "
        f"Aplicadas: {migrations_aplicadas}, Puladas: {migrations_puladas}"
    )


def import_data(conexao):
    if not os.path.exists(DATASET_FILE):
        print(f"ℹ️ Arquivo {DATASET_FILE} não encontrado. Pulando importação.")
        return

    print("📦 Iniciando importação de dados...")

    with open(DATASET_FILE, "r", encoding="utf-8") as arquivo_dataset:
        dados = json.load(arquivo_dataset)

    if not dados:
        print("ℹ️ Arquivo de dataset está vazio.")
        return

    insert_query = """
        INSERT INTO produtos (codigo_barras, descricao, marca, tamanho, imagem, preco_estimado)
        VALUES %s
        ON CONFLICT (codigo_barras) DO NOTHING
    """

    valores = []
    for item in dados:
        marca = (item.get("marca") or "Genérica")[:50]
        tamanho = (item.get("tamanho") or "Unidade")[:50]
        valores.append(
            (
                item["codigo_barras"],
                item["descricao"],
                marca,
                tamanho,
                item.get("imagem"),
                item.get("preco_estimado", 0),
            )
        )

    cursor = conexao.cursor()
    try:
        cursor.execute("SET LOCAL app.current_user_token = '00000000-0000-0000-0000-000000000000';")
        cursor.execute("SET LOCAL app.client_ip = 'localhost';")

        execute_values(cursor, insert_query, valores, page_size=1000)
        conexao.commit()
        print(f"✅ Importados {len(valores)} produtos com sucesso.")
    except Exception as erro:
        conexao.rollback()
        print(f"❌ Erro na importação: {erro}")
        sys.exit(1)
    finally:
        cursor.close()


def main():
    print(f"🌍 APP_ENV={APP_ENV}")
    print(f"📥 INIT_DB_IMPORTAR_DADOS={str(DEVE_IMPORTAR_DADOS).lower()}")
    print(f"🧨 INIT_DB_RESETAR_BANCO={str(DEVE_RESETAR_BANCO).lower()}")

    conexao = get_connection()

    if DEVE_RESETAR_BANCO:
        reset_database(conexao)

    apply_migrations(conexao)

    if DEVE_IMPORTAR_DADOS:
        import_data(conexao)
    else:
        print("ℹ️ Importação de dados desativada para este ambiente.")

    conexao.close()
    print("\n🎉 Inicialização do banco concluída.")


if __name__ == "__main__":
    main()
