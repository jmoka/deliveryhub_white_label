"""Detecção de impressoras e envio de texto puro pra impressão — abstraído por SO.

Windows usa pywin32 (API nativa de spooler). Linux/Mac usam os comandos de linha
de comando `lpstat`/`lp` (suporte secundário, sem dependência compilada extra).
"""
import platform
import subprocess


def _sistema() -> str:
    return platform.system()


def listar_impressoras() -> list[str]:
    sistema = _sistema()

    if sistema == "Windows":
        import win32print

        flags = win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS
        impressoras = win32print.EnumPrinters(flags)
        return [nome for (_, _, nome, _) in impressoras]

    # Linux/Mac: `lpstat -p` lista, ex: "printer EPSON_TM_T20 is idle..."
    try:
        saida = subprocess.run(["lpstat", "-p"], capture_output=True, text=True, timeout=5)
        nomes = []
        for linha in saida.stdout.splitlines():
            partes = linha.split()
            if len(partes) >= 2 and partes[0] == "printer":
                nomes.append(partes[1])
        return nomes
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return []


def imprimir_texto(nome_impressora: str, conteudo: str) -> None:
    sistema = _sistema()

    if sistema == "Windows":
        import win32print

        handle = win32print.OpenPrinter(nome_impressora)
        try:
            texto = conteudo + "\n\n\n"  # avanço de papel no fim do ticket
            job = win32print.StartDocPrinter(handle, 1, ("Comanda DeliveryHub", None, "RAW"))
            try:
                win32print.StartPagePrinter(handle)
                win32print.WritePrinter(handle, texto.encode("cp850", errors="replace"))
                win32print.EndPagePrinter(handle)
            finally:
                win32print.EndDocPrinter(handle)
        finally:
            win32print.ClosePrinter(handle)
        return

    # Linux/Mac: manda via `lp -d <impressora>`, lendo do stdin
    processo = subprocess.run(
        ["lp", "-d", nome_impressora],
        input=conteudo.encode("utf-8"),
        capture_output=True,
        timeout=10,
    )
    if processo.returncode != 0:
        raise RuntimeError(processo.stderr.decode("utf-8", errors="replace") or "Falha ao imprimir (lp)")
