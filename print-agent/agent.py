"""Agente local de impressão — detecta impressoras e imprime comandas do DeliveryHub.

Uso:
    python agent.py                  # roda o loop (pede o token na primeira vez)
    python agent.py --token SEU_TOKEN --backend-url https://...   # pareia direto
"""
import argparse
import sys
import time

import config
import printers
from backend_client import BackendClient

VERSAO = "1.0.0"

INTERVALO_POLL_SEGUNDOS = 3
INTERVALO_REPORTAR_IMPRESSORAS_CICLOS = 100  # ~5 min com poll de 3s


_ouvinte_log = None  # callback opcional (usado pela GUI); default é print no console


def definir_ouvinte_log(callback) -> None:
    global _ouvinte_log
    _ouvinte_log = callback


def log(mensagem: str) -> None:
    print(f"[agente] {mensagem}", flush=True)
    if _ouvinte_log:
        _ouvinte_log(mensagem)


def garantir_pareado(args: argparse.Namespace) -> dict:
    cfg = config.carregar()

    if args.token:
        cfg = config.definir_token(args.token, args.backend_url)

    if not cfg.get("token"):
        log("Nenhum token de pareamento configurado.")
        token = input("Cole o token gerado em /restaurante/impressoras: ").strip()
        if not token:
            log("Token vazio, encerrando.")
            sys.exit(1)
        cfg = config.definir_token(token)

    return cfg


def ciclo_reportar_impressoras(client: BackendClient) -> None:
    nomes = printers.listar_impressoras()
    if not nomes:
        log("Nenhuma impressora detectada no sistema.")
        return
    client.reportar_impressoras(nomes)
    log(f"Impressoras reportadas: {', '.join(nomes)}")


def ciclo_processar_jobs(client: BackendClient) -> None:
    jobs = client.jobs_pendentes()
    for job in jobs:
        job_id = job["id"]
        nome_sistema = job["nome_sistema"]
        conteudo = job["conteudo"]
        try:
            printers.imprimir_texto(nome_sistema, conteudo)
            client.marcar_concluido(job_id)
            log(f"Job {job_id} impresso em '{nome_sistema}'.")
        except Exception as exc:  # noqa: BLE001 — reporta qualquer falha de hardware/driver
            mensagem = str(exc)
            log(f"Erro ao imprimir job {job_id} em '{nome_sistema}': {mensagem}")
            try:
                client.marcar_erro(job_id, mensagem)
            except Exception:  # noqa: BLE001 — não deixa a falha de rede matar o loop
                log("Também falhou ao reportar o erro pro backend — vai tentar de novo no próximo ciclo.")


def rodar() -> None:
    parser = argparse.ArgumentParser(description="Agente local de impressão DeliveryHub")
    parser.add_argument("--token", help="Token de pareamento (gerado em /restaurante/impressoras)")
    parser.add_argument("--backend-url", help="URL do backend, se diferente do padrão")
    parser.add_argument("--version", action="version", version=f"agente-impressao {VERSAO}")
    args = parser.parse_args()

    log(f"Agente de impressão DeliveryHub v{VERSAO}")
    cfg = garantir_pareado(args)
    client = BackendClient(cfg["backend_url"], cfg["token"])

    try:
        info = client.me()
        log(f"Pareado com o restaurante: {info['restaurante']['name']}")
    except Exception as exc:  # noqa: BLE001
        log(f"Não foi possível confirmar o pareamento: {exc}")
        log("Verifique o token e a conexão, e tente novamente.")
        sys.exit(1)

    ciclo_reportar_impressoras(client)

    ciclos = 0
    log("Agente rodando — aguardando trabalhos de impressão...")
    while True:
        try:
            ciclo_processar_jobs(client)
        except Exception as exc:  # noqa: BLE001 — nunca deixa o loop morrer por erro de rede
            log(f"Erro no ciclo de impressão: {exc}")

        ciclos += 1
        if ciclos >= INTERVALO_REPORTAR_IMPRESSORAS_CICLOS:
            ciclos = 0
            try:
                ciclo_reportar_impressoras(client)
            except Exception as exc:  # noqa: BLE001
                log(f"Erro ao reportar impressoras: {exc}")

        time.sleep(INTERVALO_POLL_SEGUNDOS)


if __name__ == "__main__":
    rodar()
