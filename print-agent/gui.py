"""Janela mínima (Tkinter, nativo do Python) pro usuário não-técnico: cola o token,
vê as impressoras detectadas, liga/para o serviço e atualiza a lista de impressoras
sob demanda. Pensado pro fluxo "baixa e liga" — sem instalação de dependência de
interface gráfica extra.
"""
import queue
import threading
import tkinter as tk
import webbrowser
from datetime import datetime
from tkinter import ttk, messagebox

import config
import printers
from agent import (
    BackendClient,
    VERSAO,
    cancelar_job,
    ciclo_processar_jobs,
    ciclo_reportar_impressoras,
    definir_ouvinte_log,
    imprimir_job,
    preview_conteudo,
)
from config import DEFAULT_BACKEND_URL


def _formatar_data(iso: str) -> str:
    try:
        return datetime.fromisoformat(iso.replace("Z", "+00:00")).astimezone().strftime("%d/%m %H:%M")
    except (ValueError, AttributeError):
        return iso or "—"


class TelaPendentes(tk.Toplevel):
    """Mostra os trabalhos de impressão acumulados enquanto o agente estava desligado
    e exige uma decisão explícita antes do loop automático começar — sem isso, ligar
    o agente depois de um período parado reimprimia tudo de uma vez (desperdício de
    papel com comandas de um caixa já fechado)."""

    def __init__(self, parent: tk.Tk, client: BackendClient, jobs: list[dict]) -> None:
        super().__init__(parent)
        self.client = client
        self.jobs = jobs
        self.vars: list[tk.BooleanVar] = [tk.BooleanVar(value=False) for _ in jobs]

        self.title("Impressões pendentes")
        self.geometry("560x420")
        self.transient(parent)
        self.grab_set()
        self.protocol("WM_DELETE_WINDOW", self._confirmar)
        self.resizable(True, True)

        self._montar_widgets()

    def _montar_widgets(self) -> None:
        topo = ttk.Frame(self, padding=(12, 12, 12, 4))
        topo.pack(fill=tk.X)
        ttk.Label(
            topo,
            text=f"{len(self.jobs)} impressão(ões) pendente(s) acumulada(s) enquanto o agente estava desligado.",
            wraplength=520,
            justify=tk.LEFT,
        ).pack(anchor="w")
        ttk.Label(
            topo,
            text="Marque o que ainda vale a pena imprimir. O que ficar desmarcado é cancelado (não imprime).",
            wraplength=520,
            justify=tk.LEFT,
            foreground="#71717A",
        ).pack(anchor="w", pady=(4, 0))

        acoes = ttk.Frame(self, padding=(12, 4))
        acoes.pack(fill=tk.X)
        ttk.Button(acoes, text="Selecionar todas", command=self._selecionar_todas).pack(side=tk.LEFT, padx=(0, 6))
        ttk.Button(acoes, text="Limpar seleção", command=self._limpar_selecao).pack(side=tk.LEFT)

        container = ttk.Frame(self, padding=(12, 4))
        container.pack(fill=tk.BOTH, expand=True)

        canvas = tk.Canvas(container, highlightthickness=0)
        scrollbar = ttk.Scrollbar(container, orient="vertical", command=canvas.yview)
        lista = ttk.Frame(canvas)
        lista.bind("<Configure>", lambda _e: canvas.configure(scrollregion=canvas.bbox("all")))
        canvas.create_window((0, 0), window=lista, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        for var, job in zip(self.vars, self.jobs):
            texto = f"[{job['nome_sistema']}] {_formatar_data(job.get('criado_em'))} — {preview_conteudo(job['conteudo'])}"
            ttk.Checkbutton(lista, text=texto, variable=var).pack(anchor="w", pady=2)

        rodape = ttk.Frame(self, padding=12)
        rodape.pack(fill=tk.X)
        ttk.Button(rodape, text="Confirmar", command=self._confirmar).pack(side=tk.RIGHT)

    def _selecionar_todas(self) -> None:
        for var in self.vars:
            var.set(True)

    def _limpar_selecao(self) -> None:
        for var in self.vars:
            var.set(False)

    def _confirmar(self) -> None:
        for var, job in zip(self.vars, self.jobs):
            if var.get():
                imprimir_job(self.client, job)
            else:
                cancelar_job(self.client, job)
        self.grab_release()
        self.destroy()


class AgenteGUI:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title(f"DeliveryHub — Agente de Impressão v{VERSAO}")
        self.root.geometry("480x480")
        self.root.protocol("WM_DELETE_WINDOW", self._fechar)

        self.client: BackendClient | None = None
        self.fila_log: "queue.Queue[str]" = queue.Queue()
        self.rodando = False

        self._montar_widgets()
        definir_ouvinte_log(self._log)
        self._carregar_config_existente()
        self.root.after(200, self._drenar_log)

    def _montar_widgets(self) -> None:
        frame = ttk.Frame(self.root, padding=12)
        frame.pack(fill=tk.BOTH, expand=True)

        ttk.Label(frame, text="Token de pareamento").pack(anchor="w")
        self.token_var = tk.StringVar()
        ttk.Entry(frame, textvariable=self.token_var, show="•").pack(fill=tk.X, pady=(0, 8))

        ttk.Label(frame, text="URL do servidor").pack(anchor="w")
        self.backend_url_var = tk.StringVar(value=DEFAULT_BACKEND_URL)
        ttk.Entry(frame, textvariable=self.backend_url_var).pack(fill=tk.X, pady=(0, 8))

        self.status_var = tk.StringVar(value="Desconectado")
        ttk.Label(frame, textvariable=self.status_var, foreground="#B91C1C").pack(anchor="w", pady=(0, 8))

        botoes = ttk.Frame(frame)
        botoes.pack(fill=tk.X, pady=(0, 4))
        self.btn_iniciar = ttk.Button(botoes, text="▶ Ligar", command=self._ligar)
        self.btn_iniciar.pack(side=tk.LEFT, expand=True, fill=tk.X, padx=(0, 4))
        self.btn_parar = ttk.Button(botoes, text="■ Parar", command=self._parar, state="disabled")
        self.btn_parar.pack(side=tk.LEFT, expand=True, fill=tk.X)

        ttk.Button(frame, text="↻ Atualizar impressoras", command=self._atualizar_impressoras).pack(fill=tk.X, pady=(4, 12))

        ttk.Label(frame, text="Impressoras detectadas:").pack(anchor="w")
        self.impressoras_var = tk.StringVar(value="—")
        ttk.Label(frame, textvariable=self.impressoras_var, wraplength=440).pack(anchor="w", pady=(0, 8))

        ttk.Label(frame, text="Log:").pack(anchor="w")
        self.log_text = tk.Text(frame, height=12, state="disabled")
        self.log_text.pack(fill=tk.BOTH, expand=True)

        rodape = ttk.Frame(frame)
        rodape.pack(fill=tk.X, pady=(8, 0))
        ttk.Label(rodape, text=f"v{VERSAO}", foreground="#71717A").pack(side=tk.LEFT)
        link = ttk.Label(rodape, text="Ver instruções", foreground="#2563EB", cursor="hand2")
        link.pack(side=tk.RIGHT)
        link.bind("<Button-1>", lambda _e: webbrowser.open(
            "https://github.com/jmoka/deliveryhub_white_label/tree/main/print-agent",
        ))

    def _carregar_config_existente(self) -> None:
        cfg = config.carregar()
        self.backend_url_var.set(cfg.get("backend_url") or DEFAULT_BACKEND_URL)
        if cfg.get("token"):
            self.token_var.set(cfg["token"])
            self._ligar()

    def _log(self, mensagem: str) -> None:
        self.fila_log.put(mensagem)

    def _drenar_log(self) -> None:
        while not self.fila_log.empty():
            mensagem = self.fila_log.get()
            self.log_text.configure(state="normal")
            self.log_text.insert(tk.END, mensagem + "\n")
            self.log_text.see(tk.END)
            self.log_text.configure(state="disabled")
        self.root.after(200, self._drenar_log)

    def _conectar(self) -> bool:
        """Confirma o pareamento com o token atual. Retorna True se deu certo."""
        token = self.token_var.get().strip()
        if not token:
            messagebox.showwarning("Token vazio", "Cole o token gerado em /restaurante/impressoras.")
            return False

        backend_url = self.backend_url_var.get().strip() or DEFAULT_BACKEND_URL
        cfg = config.definir_token(token, backend_url)
        self.client = BackendClient(cfg["backend_url"], cfg["token"])

        try:
            info = self.client.me()
        except Exception as exc:  # noqa: BLE001
            self.status_var.set("Falha ao conectar")
            messagebox.showerror("Erro", f"Não foi possível conectar: {exc}")
            return False

        self.status_var.set(f"Conectado — {info['restaurante']['name']}")
        self._log(f"Pareado com {info['restaurante']['name']}.")
        return True

    def _atualizar_impressoras(self) -> None:
        nomes = printers.listar_impressoras()
        self.impressoras_var.set(", ".join(nomes) if nomes else "Nenhuma impressora encontrada")

        if not self.client:
            return
        try:
            ciclo_reportar_impressoras(self.client)
        except Exception as exc:  # noqa: BLE001
            self._log(f"Erro ao reportar impressoras: {exc}")

    def _revisar_pendentes(self) -> None:
        if not self.client:
            return
        try:
            jobs = self.client.jobs_pendentes()
        except Exception as exc:  # noqa: BLE001 — não bloqueia o "Ligar" por falha de rede aqui
            self._log(f"Erro ao consultar impressões pendentes: {exc}")
            return
        if not jobs:
            return
        self.root.wait_window(TelaPendentes(self.root, self.client, jobs))

    def _ligar(self) -> None:
        if self.rodando:
            return
        if not self._conectar():
            return

        self._atualizar_impressoras()
        self._revisar_pendentes()

        self.rodando = True
        self.btn_iniciar.configure(state="disabled")
        self.btn_parar.configure(state="normal")
        self._log("Agente ligado — aguardando trabalhos de impressão.")
        threading.Thread(target=self._loop_impressao, daemon=True).start()

    def _parar(self) -> None:
        self.rodando = False
        self.btn_iniciar.configure(state="normal")
        self.btn_parar.configure(state="disabled")
        self.status_var.set("Parado")
        self._log("Agente parado pelo usuário.")

    def _loop_impressao(self) -> None:
        while self.rodando and self.client:
            try:
                ciclo_processar_jobs(self.client)
            except Exception as exc:  # noqa: BLE001
                self._log(f"Erro no ciclo de impressão: {exc}")
            for _ in range(30):  # espera 3s em passos curtos, pra reagir rápido ao "Parar"
                if not self.rodando:
                    break
                threading.Event().wait(0.1)

    def _fechar(self) -> None:
        self.rodando = False
        self.root.destroy()


def main() -> None:
    root = tk.Tk()
    AgenteGUI(root)
    root.mainloop()


if __name__ == "__main__":
    main()
