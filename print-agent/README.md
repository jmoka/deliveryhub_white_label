# Agente de impressão local — DeliveryHub

App Python que roda no PC do restaurante, detecta as impressoras disponíveis
(instaladas no Windows ou compartilhadas na rede) e imprime as comandas que o
backend do DeliveryHub manda pra fila, sem depender de nenhum navegador aberto.

## Download (recomendado — sem instalar Python)

**[⬇ Baixar DeliveryHubAgente.exe](https://raw.githubusercontent.com/jmoka/deliveryhub_white_label/main/print-agent/releases/DeliveryHubAgente.exe)**

Baixa só esse arquivo (não precisa clonar o repositório inteiro). Executa com
duplo clique, cola o token de pareamento (gerado em `/restaurante/impressoras`)
e clica **▶ Ligar**.

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

Na janela (`gui.py`): **▶ Ligar** conecta e começa a imprimir os trabalhos
pendentes; **■ Parar** interrompe (sem perder o pareamento); **↻ Atualizar
impressoras** reescaneia o sistema e reenvia a lista pro backend (útil depois
de instalar uma impressora nova).

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

## Gerar o executável (Windows)

Pro usuário final não precisar instalar Python — "baixa e liga":

```bash
cd print-agent
build.bat
```

Gera `dist\DeliveryHubAgente.exe` (um único arquivo, ~10MB, sem instalação —
só copiar e executar). `dist/`/`build/` são pastas de trabalho do PyInstaller
e ficam fora do git (`.gitignore`) — depois de rebuildar, copie o resultado
pra `print-agent/releases/DeliveryHubAgente.exe` (essa pasta **é** versionada,
é o que o link de download acima aponta) e commite, pra manter o link sempre
atualizado com a última versão.
