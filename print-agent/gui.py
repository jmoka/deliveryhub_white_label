"""Janela mínima (Tkinter, nativo do Python) pro usuário não-técnico: cola o token,
vê as impressoras detectadas, liga/para o serviço e atualiza a lista de impressoras
sob demanda. Pensado pro fluxo "baixa e liga" — sem instalação de dependência de
interface gráfica extra.
"""
import queue
import threading
import tkinter as tk
import webbrowser
from tkinter import ttk, messagebox

import config
import printers
from agent import BackendClient, VERSAO, ciclo_processar_jobs, ciclo_reportar_impressoras, definir_ouvinte_log
from config import DEFAULT_BACKEND_URL


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

    def _ligar(self) -> None:
        if self.rodando:
            return
        if not self._conectar():
            return

        self._atualizar_impressoras()

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
