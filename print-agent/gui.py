"""Janela mínima (Tkinter, nativo do Python) pro usuário não-técnico: cola o token,
vê as impressoras detectadas e acompanha o log de impressão. Pensado pro fluxo
"baixa e liga" — sem instalação de dependência de interface gráfica extra.
"""
import queue
import threading
import tkinter as tk
from tkinter import ttk, messagebox

import config
import printers
from agent import BackendClient, ciclo_processar_jobs, ciclo_reportar_impressoras, definir_ouvinte_log

INTERVALO_POLL_MS = 3000


class AgenteGUI:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("DeliveryHub — Agente de Impressão")
        self.root.geometry("480x420")

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

        self.status_var = tk.StringVar(value="Desconectado")
        ttk.Label(frame, textvariable=self.status_var, foreground="#B91C1C").pack(anchor="w", pady=(0, 8))

        ttk.Button(frame, text="Conectar", command=self._conectar).pack(fill=tk.X)

        ttk.Label(frame, text="Impressoras detectadas:").pack(anchor="w", pady=(12, 0))
        self.impressoras_var = tk.StringVar(value="—")
        ttk.Label(frame, textvariable=self.impressoras_var, wraplength=440).pack(anchor="w")

        ttk.Label(frame, text="Log:").pack(anchor="w", pady=(12, 0))
        self.log_text = tk.Text(frame, height=12, state="disabled")
        self.log_text.pack(fill=tk.BOTH, expand=True)

    def _carregar_config_existente(self) -> None:
        cfg = config.carregar()
        if cfg.get("token"):
            self.token_var.set(cfg["token"])
            self._conectar()

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

    def _conectar(self) -> None:
        token = self.token_var.get().strip()
        if not token:
            messagebox.showwarning("Token vazio", "Cole o token gerado em /restaurante/impressoras.")
            return

        cfg = config.definir_token(token)
        self.client = BackendClient(cfg["backend_url"], cfg["token"])

        try:
            info = self.client.me()
        except Exception as exc:  # noqa: BLE001
            self.status_var.set("Falha ao conectar")
            messagebox.showerror("Erro", f"Não foi possível conectar: {exc}")
            return

        self.status_var.set(f"Conectado — {info['restaurante']['name']}")
        self._log(f"Pareado com {info['restaurante']['name']}.")

        nomes = printers.listar_impressoras()
        self.impressoras_var.set(", ".join(nomes) if nomes else "Nenhuma impressora encontrada")
        try:
            ciclo_reportar_impressoras(self.client)
        except Exception as exc:  # noqa: BLE001
            self._log(f"Erro ao reportar impressoras: {exc}")

        if not self.rodando:
            self.rodando = True
            threading.Thread(target=self._loop_impressao, daemon=True).start()

    def _loop_impressao(self) -> None:
        while self.rodando and self.client:
            try:
                ciclo_processar_jobs(self.client)
            except Exception as exc:  # noqa: BLE001
                self._log(f"Erro no ciclo de impressão: {exc}")
            threading.Event().wait(3)


def main() -> None:
    root = tk.Tk()
    AgenteGUI(root)
    root.mainloop()


if __name__ == "__main__":
    main()
