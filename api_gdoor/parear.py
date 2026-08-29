"""Pareamento do agente GDOOR via console (legado — prefira parear_gui.py).
Cole aqui o token gerado em Configurações > Integração GDOOR no painel do
restaurante. Salvo em local_config.json (%APPDATA%\\DeliveryHubAgenteGdoor),
mesmo padrão do print-agent — nunca precisa editar arquivo na mão, e funciona
mesmo numa instalação empacotada sem .env nenhum.

Uso: dê duplo clique em parear.bat, ou rode "python parear.py" com o venv
32-bit ativado. Depois é só reiniciar o agente (iniciar.bat) pra aplicar.
"""
from app import local_config


def salvar_token(token: str, backend_url: str | None = None) -> None:
    token = token.strip()
    if not token:
        print("Token vazio — nada foi salvo.")
        return

    local_config.definir_token(token, backend_url.strip().rstrip('/') if backend_url else None)
    print(f"\nToken salvo em {local_config._config_path()}")
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
    atual = local_config.carregar()
    print(f"\nURL do servidor atual: {atual.get('backend_url') or local_config.DEFAULT_BACKEND_URL}")
    backend_url = input("Nova URL do servidor (ENTER pra manter a atual): ")
    salvar_token(token, backend_url or None)
    try:
        input("\nPressione ENTER pra fechar...")
    except EOFError:
        pass
