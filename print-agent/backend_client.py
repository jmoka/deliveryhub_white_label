"""Cliente HTTP do backend (server_delivery) — endpoints do agente de impressão."""
import requests

TIMEOUT = 10


class BackendClient:
    def __init__(self, backend_url: str, token: str):
        self.base = f"{backend_url.rstrip('/')}/agente-impressao"
        self.headers = {"x-agente-token": token, "Content-Type": "application/json"}

    def me(self) -> dict:
        r = requests.get(f"{self.base}/me", headers=self.headers, timeout=TIMEOUT)
        r.raise_for_status()
        return r.json()

    def reportar_impressoras(self, nomes: list[str]) -> None:
        r = requests.post(
            f"{self.base}/impressoras",
            json={"impressoras": nomes},
            headers=self.headers,
            timeout=TIMEOUT,
        )
        r.raise_for_status()

    def jobs_pendentes(self) -> list[dict]:
        r = requests.get(f"{self.base}/jobs/pendentes", headers=self.headers, timeout=TIMEOUT)
        r.raise_for_status()
        return r.json()

    def marcar_concluido(self, job_id: int) -> None:
        r = requests.post(f"{self.base}/jobs/{job_id}/concluido", headers=self.headers, timeout=TIMEOUT)
        r.raise_for_status()

    def marcar_erro(self, job_id: int, mensagem: str) -> None:
        r = requests.post(
            f"{self.base}/jobs/{job_id}/erro",
            json={"mensagem": mensagem},
            headers=self.headers,
            timeout=TIMEOUT,
        )
        r.raise_for_status()
