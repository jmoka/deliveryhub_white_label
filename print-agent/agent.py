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

VERSAO = "1.1.0"

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


def _versao_tupla(versao: str) -> tuple[int, ...]:
    try:
        return tuple(int(parte) for parte in versao.strip().split("."))
    except ValueError:
        return (0,)


def versao_mais_nova(remota: str, local: str) -> bool:
    return _versao_tupla(remota) > _versao_tupla(local)


def verificar_atualizacao(client: BackendClient) -> dict | None:
    """Consulta a versão mais recente do agente no backend. Retorna as infos
    (versao/download_url) se houver uma mais nova que a instalada, ou None se já
    está atualizado ou a checagem falhou — nunca impede o agente de funcionar,
    é só um aviso."""
    try:
        info = client.versao_disponivel()
    except Exception:  # noqa: BLE001 — checagem é best-effort
        return None
    remota = info.get("versao")
    if not remota or not versao_mais_nova(remota, VERSAO):
        return None
    return info


def ciclo_reportar_impressoras(client: BackendClient) -> None:
    nomes = printers.listar_impressoras()
    if not nomes:
        log("Nenhuma impressora detectada no sistema.")
        return
    client.reportar_impressoras(nomes)
    log(f"Impressoras reportadas: {', '.join(nomes)}")


def imprimir_job(client: BackendClient, job: dict) -> None:
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


def cancelar_job(client: BackendClient, job: dict) -> None:
    job_id = job["id"]
    try:
        client.marcar_cancelado(job_id)
        log(f"Job {job_id} cancelado (descartado sem imprimir).")
    except Exception as exc:  # noqa: BLE001
        log(f"Erro ao cancelar job {job_id}: {exc}")


def ciclo_processar_jobs(client: BackendClient) -> None:
    jobs = client.jobs_pendentes()
    for job in jobs:
        imprimir_job(client, job)


def preview_conteudo(conteudo: str, tamanho: int = 40) -> str:
    """Primeira linha não-vazia do ticket, cortada — só pra identificar o job numa lista."""
    for linha in conteudo.splitlines():
        linha = linha.strip()
        if linha:
            return linha if len(linha) <= tamanho else linha[: tamanho - 1] + "…"
    return "(sem conteúdo)"


def revisar_pendentes_console(client: BackendClient) -> None:
    """Mostra os jobs acumulados enquanto o agente estava desligado e pede uma decisão
    explícita antes do loop automático começar — evita reimprimir comandas antigas
    (ex.: caixa já fechado) de uma vez só e desperdiçar papel."""
    jobs = client.jobs_pendentes()
    if not jobs:
        return

    print(f"\nHá {len(jobs)} impressão(ões) pendente(s) acumulada(s):")
    for i, job in enumerate(jobs, start=1):
        print(f"  {i}. [{job['nome_sistema']}] {preview_conteudo(job['conteudo'])}")

    print("\nO que fazer com elas?")
    print("  [T] Imprimir todas")
    print("  [C] Cancelar todas (não imprime nenhuma)")
    print("  [S] Selecionar quais imprimir por número (ex: 1,3) — as demais são canceladas")
    escolha = input("Escolha (T/C/S) [C]: ").strip().upper() or "C"

    if escolha == "T":
        selecionados = set(range(1, len(jobs) + 1))
    elif escolha == "S":
        bruto = input("Números a imprimir (separados por vírgula): ").strip()
        try:
            selecionados = {int(n) for n in bruto.split(",") if n.strip()}
        except ValueError:
            log("Entrada inválida — nada será impresso, todas as pendências serão canceladas.")
            selecionados = set()
    else:
        selecionados = set()

    for i, job in enumerate(jobs, start=1):
        if i in selecionados:
            imprimir_job(client, job)
        else:
            cancelar_job(client, job)


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

    atualizacao = verificar_atualizacao(client)
    if atualizacao:
        log(f"Nova versão do agente disponível: v{atualizacao['versao']} (você está na v{VERSAO}).")
        log(f"Baixe em: {atualizacao.get('download_url', '')}")

    ciclo_reportar_impressoras(client)
    revisar_pendentes_console(client)

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
