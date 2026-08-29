"""Janela de pareamento do agente GDOOR — mesmo espírito do DeliveryHubAgente.exe
(print-agent): uma caixa mostrando se o GDOOR foi detectado e qual CNPJ ele tem
cadastrado, um campo pra colar o token gerado no painel, e um botão Conectar."""
import tkinter as tk

import requests

from app import firebird_client, local_config

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
    return local_config.carregar().get("token") or ""


def _url_atual() -> str:
    return local_config.carregar().get("backend_url") or local_config.DEFAULT_BACKEND_URL


def _salvar_token(token: str, backend_url: str) -> None:
    local_config.definir_token(token, backend_url)


def _testar_conexao(token: str, backend_url: str) -> tuple[bool, str]:
    """Confirma de verdade que o token+URL funcionam contra o servidor —
    mesmo espírito do print-agent (gui.py chama client.me() antes de dizer
    que conectou). Retorna (sucesso, mensagem)."""
    try:
        resp = requests.get(
            f"{backend_url}/agente-gdoor/me",
            headers={"x-gdoor-agente-token": token},
            timeout=10,
        )
    except requests.exceptions.RequestException as e:
        return False, f"Não foi possível conectar em {backend_url}: {e}"

    if resp.status_code == 200:
        nome = resp.json().get("restaurante", {}).get("name", "?")
        return True, f"Conectado! Restaurante: {nome}"
    if resp.status_code == 401:
        return False, "Token inválido — gere um novo em Configurações > Integração GDOOR no painel."
    if resp.status_code == 403:
        return False, "Conectou, mas o módulo GDOOR não está habilitado pra essa loja (fale com o suporte)."
    return False, f"Servidor respondeu {resp.status_code} — confira a URL do servidor."


class JanelaPareamento(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("DeliveryHub — Agente GDOOR")
        self.geometry("640x480")
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
                                   bg=COR_CAIXA, fg=COR_TEXTO, anchor="w", wraplength=580, justify="left")
        self.lbl_gdoor.pack(fill="x", padx=12, pady=(8, 0))

        self.lbl_cnpj = tk.Label(caixa, text="", font=("Segoe UI", 9), bg=COR_CAIXA,
                                  fg=COR_TEXTO_FRACO, anchor="w", wraplength=580, justify="left")
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

        # Campo de URL do servidor — mesmo padrão do print-agent (gui.py): sem
        # isso, uma instalação que herdou/testou com um .env local (ex.:
        # SERVER_DELIVERY_URL=http://127.0.0.1:3002) fica presa em localhost e
        # nunca sincroniza em produção, sem jeito de corrigir pela GUI.
        tk.Label(self, text="URL do servidor", font=("Segoe UI", 9, "bold"),
                 bg=COR_FUNDO, fg=COR_TEXTO).pack(**pad, anchor="w", pady=(4, 0))
        tk.Label(self, text="Deixe como está, a menos que o suporte peça pra mudar",
                 font=("Segoe UI", 8), bg=COR_FUNDO, fg=COR_TEXTO_FRACO).pack(**pad, anchor="w")

        self.entry_url = tk.Entry(self, font=("Consolas", 10), bg=COR_CAIXA, fg=COR_TEXTO,
                                   insertbackground=COR_TEXTO, relief="flat",
                                   highlightbackground=COR_BORDA, highlightthickness=1)
        self.entry_url.pack(fill="x", pady=(6, 4), ipady=6, **pad)
        self.entry_url.insert(0, _url_atual())

        self.lbl_msg = tk.Label(self, text="", font=("Segoe UI", 9), bg=COR_FUNDO, fg=COR_TEXTO, wraplength=600, justify="left")
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
        # rstrip da barra final — o poller monta URL como f"{backend_url}/agente-gdoor/..."
        # e uma barra dupla (ex.: usuário cola a URL com "/" no final) pode
        # quebrar dependendo de como o proxy/servidor trata a rota.
        backend_url = (self.entry_url.get().strip() or local_config.DEFAULT_BACKEND_URL).rstrip('/')

        self.lbl_msg.config(text="Conectando...", fg=COR_TEXTO_FRACO)
        self.btn_conectar.config(state="disabled")
        self.update_idletasks()

        sucesso, mensagem = _testar_conexao(token, backend_url)
        if sucesso:
            _salvar_token(token, backend_url)
            self.lbl_msg.config(text=f"✓ {mensagem} Reinicie o agente (iniciar.bat) para aplicar.", fg=COR_VERDE)
        else:
            self.lbl_msg.config(text=f"✗ {mensagem}", fg=COR_VERMELHO)
        self.btn_conectar.config(state="normal")


if __name__ == "__main__":
    JanelaPareamento().mainloop()
