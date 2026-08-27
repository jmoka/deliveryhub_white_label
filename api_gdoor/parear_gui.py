"""Janela de pareamento do agente GDOOR — mesmo espírito do DeliveryHubAgente.exe
(print-agent): uma caixa mostrando se o GDOOR foi detectado e qual CNPJ ele tem
cadastrado, um campo pra colar o token gerado no painel, e um botão Conectar."""
import tkinter as tk
from pathlib import Path

from app import firebird_client

BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / ".env"
ENV_EXAMPLE_PATH = BASE_DIR / ".env.example"

COR_FUNDO = "#18181B"
COR_CAIXA = "#27272A"
COR_BORDA = "#3F3F46"
COR_TEXTO = "#F4F4F5"
COR_TEXTO_FRACO = "#A1A1AA"
COR_LARANJA = "#FF441F"
COR_VERDE = "#4ADE80"
COR_AMARELO = "#FBBF24"
COR_VERMELHO = "#F87171"


def _detectar_gdoor():
    """Retorna (status, cnpj_ou_mensagem) — status é 'ok' | 'sem_cnpj' | 'erro'."""
    try:
        cnpj = firebird_client.ler_cnpj_emitente()
        return ("ok", cnpj) if cnpj else ("sem_cnpj", None)
    except Exception as e:
        return "erro", str(e)


def _token_atual() -> str:
    if not ENV_PATH.exists():
        return ""
    for linha in ENV_PATH.read_text(encoding="utf-8").splitlines():
        if linha.startswith("GDOOR_AGENTE_TOKEN="):
            return linha.split("=", 1)[1].strip()
    return ""


def _salvar_token(token: str) -> None:
    if ENV_PATH.exists():
        linhas = ENV_PATH.read_text(encoding="utf-8").splitlines()
    elif ENV_EXAMPLE_PATH.exists():
        linhas = ENV_EXAMPLE_PATH.read_text(encoding="utf-8").splitlines()
    else:
        linhas = []

    novas, encontrado = [], False
    for linha in linhas:
        if linha.startswith("GDOOR_AGENTE_TOKEN="):
            novas.append(f"GDOOR_AGENTE_TOKEN={token}")
            encontrado = True
        else:
            novas.append(linha)
    if not encontrado:
        novas.append(f"GDOOR_AGENTE_TOKEN={token}")

    ENV_PATH.write_text("\n".join(novas) + "\n", encoding="utf-8")


class JanelaPareamento(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("DeliveryHub — Agente GDOOR")
        self.geometry("420x380")
        self.resizable(False, False)
        self.configure(bg=COR_FUNDO)

        self._montar_ui()
        self.after(100, self._atualizar_status_gdoor)

    def _montar_ui(self):
        pad = {"padx": 20}

        tk.Label(self, text="Integração GDOOR", font=("Segoe UI", 14, "bold"),
                 bg=COR_FUNDO, fg=COR_TEXTO).pack(pady=(20, 2), **pad, anchor="w")
        tk.Label(self, text="Conecta esse computador ao painel DeliveryHub",
                 font=("Segoe UI", 9), bg=COR_FUNDO, fg=COR_TEXTO_FRACO).pack(**pad, anchor="w")

        # Caixa de status do GDOOR local
        caixa = tk.Frame(self, bg=COR_CAIXA, highlightbackground=COR_BORDA, highlightthickness=1)
        caixa.pack(fill="x", pady=16, **pad)

        self.lbl_gdoor = tk.Label(caixa, text="Verificando GDOOR...", font=("Segoe UI", 10, "bold"),
                                   bg=COR_CAIXA, fg=COR_TEXTO, anchor="w", wraplength=360, justify="left")
        self.lbl_gdoor.pack(fill="x", padx=12, pady=(8, 0))

        self.lbl_cnpj = tk.Label(caixa, text="", font=("Segoe UI", 9), bg=COR_CAIXA,
                                  fg=COR_TEXTO_FRACO, anchor="w", wraplength=360, justify="left")
        self.lbl_cnpj.pack(fill="x", padx=12, pady=(0, 10))

        # Campo de token
        tk.Label(self, text="Token de conexão", font=("Segoe UI", 9, "bold"),
                 bg=COR_FUNDO, fg=COR_TEXTO).pack(**pad, anchor="w", pady=(4, 0))
        tk.Label(self, text="Gerado em Configurações > Integração GDOOR, no painel",
                 font=("Segoe UI", 8), bg=COR_FUNDO, fg=COR_TEXTO_FRACO).pack(**pad, anchor="w")

        self.entry_token = tk.Entry(self, font=("Consolas", 10), bg=COR_CAIXA, fg=COR_TEXTO,
                                     insertbackground=COR_TEXTO, relief="flat",
                                     highlightbackground=COR_BORDA, highlightthickness=1)
        self.entry_token.pack(fill="x", pady=(6, 4), ipady=6, **pad)
        self.entry_token.insert(0, _token_atual())

        self.lbl_msg = tk.Label(self, text="", font=("Segoe UI", 9), bg=COR_FUNDO, fg=COR_TEXTO, wraplength=380, justify="left")
        self.lbl_msg.pack(**pad, anchor="w")

        self.btn_conectar = tk.Button(self, text="Conectar", font=("Segoe UI", 10, "bold"),
                                       bg=COR_LARANJA, fg="white", relief="flat",
                                       activebackground="#E63A19", activeforeground="white",
                                       cursor="hand2", command=self._conectar)
        self.btn_conectar.pack(fill="x", pady=16, ipady=8, **pad)

    def _atualizar_status_gdoor(self):
        status, valor = _detectar_gdoor()
        if status == "ok":
            self.lbl_gdoor.config(text="✓ GDOOR detectado", fg=COR_VERDE)
            self.lbl_cnpj.config(text=f"CNPJ cadastrado: {valor}\nPrecisa bater com o \"CNPJ esperado\" do painel.")
        elif status == "sem_cnpj":
            self.lbl_gdoor.config(text="⚠ GDOOR conectado, mas sem CNPJ cadastrado", fg=COR_AMARELO)
            self.lbl_cnpj.config(text="Cadastre o CNPJ na tela Emitente do GDOOR antes de conectar.")
        else:
            self.lbl_gdoor.config(text="✗ GDOOR não encontrado nesta máquina", fg=COR_VERMELHO)
            self.lbl_cnpj.config(text=f"Detalhe: {valor}"[:120])

    def _conectar(self):
        token = self.entry_token.get().strip()
        if not token:
            self.lbl_msg.config(text="Cole o token antes de conectar.", fg=COR_VERMELHO)
            return
        _salvar_token(token)
        self.lbl_msg.config(
            text="Token salvo! Reinicie o agente (iniciar.bat) para aplicar a conexão.",
            fg=COR_VERDE,
        )


if __name__ == "__main__":
    JanelaPareamento().mainloop()
