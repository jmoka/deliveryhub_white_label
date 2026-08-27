"""Pareamento do agente GDOOR — cole aqui o token gerado em Configurações >
Integração GDOOR no painel do restaurante. Ele é salvo direto no arquivo
.env (campo GDOOR_AGENTE_TOKEN), sem precisar abrir o arquivo na mão.

Uso: dê duplo clique em parear.bat, ou rode "python parear.py" com o venv
32-bit ativado. Depois é só reiniciar o agente (iniciar.bat) pra aplicar.
"""
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / ".env"
ENV_EXAMPLE_PATH = BASE_DIR / ".env.example"


def _linhas_atuais() -> list[str]:
    if ENV_PATH.exists():
        return ENV_PATH.read_text(encoding="utf-8").splitlines()
    if ENV_EXAMPLE_PATH.exists():
        # Primeira vez rodando aqui — parte do exemplo em vez de criar um .env vazio.
        print(f".env ainda não existia, criando a partir de {ENV_EXAMPLE_PATH.name}...")
        return ENV_EXAMPLE_PATH.read_text(encoding="utf-8").splitlines()
    return []


def salvar_token(token: str) -> None:
    token = token.strip()
    if not token:
        print("Token vazio — nada foi salvo.")
        return

    linhas = _linhas_atuais()
    novas: list[str] = []
    encontrado = False
    for linha in linhas:
        if linha.startswith("GDOOR_AGENTE_TOKEN="):
            novas.append(f"GDOOR_AGENTE_TOKEN={token}")
            encontrado = True
        else:
            novas.append(linha)
    if not encontrado:
        novas.append(f"GDOOR_AGENTE_TOKEN={token}")

    ENV_PATH.write_text("\n".join(novas) + "\n", encoding="utf-8")
    print(f"\nToken salvo em {ENV_PATH}")
    print("Agora reinicie o agente (feche a janela e rode iniciar.bat de novo) pra aplicar.")


def _mostrar_cnpj_local() -> None:
    # Mesmo CNPJ que o agente vai reportar continuamente depois de pareado
    # (app/poller.py) — mostrar aqui já na hora do pareamento avisa na hora se
    # está errado, em vez de só descobrir depois pelo aviso no painel.
    try:
        from app import firebird_client
        cnpj = firebird_client.ler_cnpj_emitente()
    except Exception as e:
        print(f"(Não consegui ler o CNPJ do GDOOR agora: {e})")
        print("Confira se o GDOOR/Firebird está rodando — o pareamento salva o token mesmo assim.")
        return

    if cnpj:
        print(f"\nCNPJ encontrado no GDOOR local (cadastro Emitente): {cnpj}")
        print("Esse é o CNPJ que precisa bater com o cadastrado em 'CNPJ esperado no GDOOR' no painel.")
    else:
        print("\nNão encontrei CNPJ cadastrado no Emitente do GDOOR local — cadastre lá antes de continuar.")


if __name__ == "__main__":
    print("=== Pareamento do agente GDOOR ===")
    _mostrar_cnpj_local()
    print("\nCole abaixo o token gerado em Configurações > Integração GDOOR no painel do restaurante.\n")
    token = input("Token: ")
    salvar_token(token)
    try:
        input("\nPressione ENTER pra fechar...")
    except EOFError:
        pass
