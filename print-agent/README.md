# Agente de impressão local — DeliveryHub

App Python que roda no PC do restaurante, detecta as impressoras disponíveis
(instaladas no Windows ou compartilhadas na rede) e imprime as comandas que o
backend do DeliveryHub manda pra fila, sem depender de nenhum navegador aberto.

## Como rodar (modo desenvolvimento, sem instalar)

```bash
cd print-agent
pip install -r requirements.txt

# GUI (recomendado — cola o token, vê o log):
python gui.py

# ou linha de comando:
python agent.py
```

Na primeira vez, gere um token em `/restaurante/impressoras` (botão "Gerar
token de pareamento") e cole na janela do agente (ou passe via
`python agent.py --token SEU_TOKEN`).

## Como funciona

1. O agente se pareia com o restaurante via token (`x-agente-token`).
2. Reporta as impressoras que encontra no sistema (`win32print.EnumPrinters`
   no Windows, `lpstat -p` no Linux/Mac).
3. No painel (`/restaurante/impressoras`), o dono escolhe qual impressora
   detectada corresponde a cada setor (cozinha, bar...).
4. Quando o garçom envia itens pra um setor com impressora mapeada, o backend
   cria um trabalho de impressão. O agente puxa (`GET /jobs/pendentes` a cada
   3s), imprime (texto puro, via spooler nativo) e marca concluído.
5. Setores sem agente pareado continuam funcionando no modo antigo
   (`window.print()` no navegador de quem estiver com a tela aberta).

## Empacotamento (fora do escopo desta versão)

Rodar via `python agent.py`/`gui.py` é suficiente pra desenvolvimento e teste.
Gerar um `.exe` de distribuição (ex: via PyInstaller) fica como próximo passo,
depois do fluxo validado em uso real.
