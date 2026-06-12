import React, { useState, useEffect, useRef } from 'react';
import Icon from '../../components/AppIcon';
import { confirmarEntrega, registrarOcorrencia } from '../../services/motoboyService';
import { gerarPixPayload, qrCodeUrl } from '../../utils/pixQrCode';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

// etapas: scan → pagamento → troco | exato | pix | pix_parcial → acao → ocorrencia

const EntregaBarcode = ({ pedido, onConfirmado, chavePix, restauranteNome, restauranteCidade }) => {
  const [etapa, setEtapa] = useState('scan');
  const [scanning, setScanning] = useState(false);
  const [manual, setManual] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [trocoConfirmado, setTrocoConfirmado] = useState(false);
  const [exatoConfirmado, setExatoConfirmado] = useState(false);
  const [dinheiroInput, setDinheiroInput] = useState('');
  const [erro, setErro] = useState(null);
  const scannerRef = useRef(null);
  const divId = `entrega-scan-${pedido.id}`;

  const expectedCode = String(pedido.id).padStart(8, '0');
  const temTroco = pedido.payment_method === 'cash' && Number(pedido.troco_para) > Number(pedido.total);
  const trocoValor = temTroco ? Number(pedido.troco_para) - Number(pedido.total) : 0;
  const total = Number(pedido.total);

  const validarCodigo = (code) => code.replace(/\D/g, '').padStart(8, '0') === expectedCode;

  const stopScan = async () => {
    try { if (scannerRef.current?.isScanning) await scannerRef.current.stop(); } catch {}
    scannerRef.current = null;
    setScanning(false);
  };

  const handleScanSuccess = (decoded) => {
    stopScan();
    if (!validarCodigo(decoded)) { setErro(`Código não corresponde ao pedido #${pedido.id}`); return; }
    setErro(null);
    setEtapa('pagamento');
  };

  const startScan = async () => {
    setErro(null);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      scannerRef.current = new Html5Qrcode(divId);
      setScanning(true);
      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decoded) => handleScanSuccess(decoded),
        () => {},
      );
    } catch {
      setScanning(false);
      setErro('Câmera indisponível. Use o campo manual.');
    }
  };

  useEffect(() => () => { stopScan(); }, []); // eslint-disable-line

  const handleEntregar = async (entregaPagamento) => {
    setConfirmando(true);
    try { await confirmarEntrega(pedido.id, entregaPagamento); onConfirmado(); }
    catch (e) { setErro(e.message); }
    finally { setConfirmando(false); }
  };

  const handleOcorrencia = async () => {
    if (motivo.trim().length < 10) return;
    setConfirmando(true);
    try { await registrarOcorrencia(pedido.id, 'pendente', motivo.trim()); onConfirmado(); }
    catch (e) { setErro(e.message); }
    finally { setConfirmando(false); }
  };

  // Gera QR PIX para o valor especificado
  const pixQr = (valor) => {
    if (!chavePix) return null;
    const payload = gerarPixPayload({
      chave: chavePix,
      nome: restauranteNome,
      cidade: restauranteCidade,
      valor,
      txid: `ped${pedido.id}`,
    });
    return qrCodeUrl(payload);
  };

  const dinheiroVal = parseFloat(dinheiroInput.replace(',', '.')) || 0;
  const pixParcialVal = dinheiroVal > 0 && dinheiroVal < total ? total - dinheiroVal : 0;

  return (
    <div className="border-t border-[#E4E4E7] pt-3 space-y-3">

      {/* ETAPA: SCAN */}
      {etapa === 'scan' && (
        <>
          <p className="text-xs font-semibold text-green-700 text-center bg-green-50 rounded-xl px-3 py-2">
            Escaneie o código da comanda para confirmar entrega
          </p>
          <div id={divId} className={`rounded-xl overflow-hidden ${scanning ? 'block' : 'hidden'}`} />
          {!scanning ? (
            <button onClick={startScan}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2">
              <Icon name="ScanLine" size={16} /> Escanear comanda (câmera)
            </button>
          ) : (
            <button onClick={stopScan} className="w-full py-2 bg-[#F4F4F5] text-[#27272A] text-sm rounded-xl">
              Cancelar scan
            </button>
          )}
          <div className="flex gap-2">
            <input value={manual} onChange={(e) => setManual(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && validarCodigo(manual) && setEtapa('pagamento')}
              placeholder={`Código manual (${expectedCode})`}
              className="flex-1 border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-green-500" />
            <button
              onClick={() => { if (validarCodigo(manual)) { setErro(null); setEtapa('pagamento'); } else setErro('Código incorreto'); }}
              disabled={!manual.trim()}
              className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-xl disabled:opacity-50 hover:bg-green-700">
              OK
            </button>
          </div>
        </>
      )}

      {/* ETAPA: ESCOLHA DE PAGAMENTO */}
      {etapa === 'pagamento' && (
        <>
          <p className="text-xs font-semibold text-center text-[#18181B] bg-green-50 rounded-xl px-3 py-2">
            ✅ Código confirmado — Como o cliente vai pagar?
          </p>
          <div className="space-y-2">
            <button
              onClick={() => setEtapa(temTroco ? 'troco' : 'acao')}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors">
              <Icon name="CheckCircle2" size={16} /> Conforme pedido
              {temTroco && <span className="text-xs opacity-80">({fmt(pedido.troco_para)} → troco {fmt(trocoValor)})</span>}
            </button>

            <button
              onClick={() => setEtapa('exato')}
              className="w-full py-3 border-2 border-green-200 bg-green-50 text-green-800 font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-green-100 transition-colors">
              <Icon name="Banknote" size={16} /> Cliente pagou valor exato — sem troco
            </button>

            {chavePix ? (
              <>
                <button
                  onClick={() => setEtapa('pix')}
                  className="w-full py-3 border-2 border-blue-200 bg-blue-50 text-blue-800 font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors">
                  <Icon name="QrCode" size={16} /> Cliente quer pagar com PIX
                </button>
                <button
                  onClick={() => setEtapa('pix_parcial')}
                  className="w-full py-3 border-2 border-purple-200 bg-purple-50 text-purple-800 font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-purple-100 transition-colors">
                  <Icon name="Split" size={16} /> Dinheiro + PIX (combinado)
                </button>
              </>
            ) : (
              <p className="text-xs text-[#A1A1AA] text-center bg-[#F4F4F5] rounded-xl px-3 py-2">
                PIX indisponível — chave não configurada no restaurante
              </p>
            )}
          </div>
          <button onClick={() => setEtapa('ocorrencia')}
            className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors">
            <Icon name="Clock" size={14} /> Não consegui entregar (pendência)
          </button>
        </>
      )}

      {/* ETAPA: TROCO */}
      {etapa === 'troco' && (
        <>
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 space-y-3">
            <p className="text-sm font-black text-amber-800 text-center">Confirmação de Troco</p>
            <div className="flex justify-between text-sm">
              <span className="text-amber-700">Receber do cliente:</span>
              <strong className="text-amber-900">{fmt(pedido.troco_para)}</strong>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-amber-700">Devolver de troco:</span>
              <strong className="text-amber-900">{fmt(trocoValor)}</strong>
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={trocoConfirmado}
                onChange={(e) => setTrocoConfirmado(e.target.checked)}
                className="mt-0.5 w-5 h-5 accent-amber-500 flex-shrink-0" />
              <span className="text-xs text-amber-900 leading-snug font-medium">
                Confirmo que recebi <strong>{fmt(pedido.troco_para)}</strong> e passei <strong>{fmt(trocoValor)}</strong> de troco
              </span>
            </label>
          </div>
          <button
            onClick={() => handleEntregar({ metodo: 'conforme', dinheiro: Number(pedido.troco_para) })}
            disabled={!trocoConfirmado || confirmando}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-black text-sm rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
            <Icon name="CheckCircle2" size={16} /> {confirmando ? 'Confirmando...' : 'Confirmar e Marcar Entregue'}
          </button>
          <button onClick={() => setEtapa('pagamento')} className="w-full py-2 text-xs text-[#71717A] hover:text-[#18181B]">
            ← Voltar
          </button>
        </>
      )}

      {/* ETAPA: VALOR EXATO */}
      {etapa === 'exato' && (
        <>
          <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 space-y-3">
            <p className="text-sm font-black text-green-800 text-center">Confirmar Recebimento</p>
            <div className="flex justify-between text-sm">
              <span className="text-green-700">Valor recebido:</span>
              <strong className="text-green-900">{fmt(total)}</strong>
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={exatoConfirmado}
                onChange={(e) => setExatoConfirmado(e.target.checked)}
                className="mt-0.5 w-5 h-5 accent-green-500 flex-shrink-0" />
              <span className="text-xs text-green-900 leading-snug font-medium">
                Confirmo que recebi <strong>{fmt(total)}</strong> em dinheiro, valor exato, sem troco
              </span>
            </label>
          </div>
          <button
            onClick={() => handleEntregar({ metodo: 'exato', dinheiro: total })}
            disabled={!exatoConfirmado || confirmando}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-black text-sm rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
            <Icon name="CheckCircle2" size={16} /> {confirmando ? 'Confirmando...' : 'Entregue!'}
          </button>
          <button onClick={() => setEtapa('pagamento')} className="w-full py-2 text-xs text-[#71717A] hover:text-[#18181B]">
            ← Voltar
          </button>
        </>
      )}

      {/* ETAPA: PIX TOTAL */}
      {etapa === 'pix' && (
        <>
          <p className="text-sm font-black text-blue-800 text-center">PIX — {fmt(total)}</p>
          {pixQr(total) ? (
            <div className="flex flex-col items-center gap-2">
              <img src={pixQr(total)} alt="QR Code PIX" className="w-[220px] h-[220px] rounded-xl border border-blue-200" />
              <p className="text-xs text-blue-700 text-center">Cliente escaneia com o app do banco</p>
            </div>
          ) : (
            <p className="text-xs text-red-500 text-center">Erro ao gerar QR Code</p>
          )}
          <button
            onClick={() => handleEntregar({ metodo: 'pix', pix: total })}
            disabled={confirmando}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-black text-sm rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
            <Icon name="CheckCircle2" size={16} /> {confirmando ? 'Confirmando...' : 'PIX Recebido — Marcar Entregue'}
          </button>
          <button onClick={() => setEtapa('pagamento')} className="w-full py-2 text-xs text-[#71717A] hover:text-[#18181B]">
            ← Voltar
          </button>
        </>
      )}

      {/* ETAPA: PIX PARCIAL (dinheiro + PIX) */}
      {etapa === 'pix_parcial' && (
        <>
          <p className="text-sm font-black text-purple-800 text-center">Dinheiro + PIX — Total {fmt(total)}</p>
          <div className="space-y-2">
            <p className="text-xs text-[#71717A] font-medium">Quanto o cliente paga em dinheiro?</p>
            <input
              type="number" step="0.01" min="0.01" max={total - 0.01}
              value={dinheiroInput}
              onChange={(e) => setDinheiroInput(e.target.value)}
              placeholder="Ex: 10,00"
              className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
            />
            {pixParcialVal > 0 && (
              <>
                <div className="flex justify-between text-sm bg-purple-50 rounded-xl px-3 py-2">
                  <span className="text-purple-700">Dinheiro:</span>
                  <strong className="text-purple-900">{fmt(dinheiroVal)}</strong>
                </div>
                <div className="flex justify-between text-sm bg-blue-50 rounded-xl px-3 py-2">
                  <span className="text-blue-700">PIX a cobrar:</span>
                  <strong className="text-blue-900">{fmt(pixParcialVal)}</strong>
                </div>
                {pixQr(pixParcialVal) && (
                  <div className="flex flex-col items-center gap-2 mt-1">
                    <img src={pixQr(pixParcialVal)} alt="QR Code PIX parcial" className="w-[200px] h-[200px] rounded-xl border border-blue-200" />
                    <p className="text-xs text-blue-700 text-center">Cliente escaneia para pagar {fmt(pixParcialVal)}</p>
                  </div>
                )}
              </>
            )}
          </div>
          <button
            onClick={() => handleEntregar({ metodo: 'pix_parcial', dinheiro: dinheiroVal, pix: pixParcialVal })}
            disabled={confirmando || pixParcialVal <= 0}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-black text-sm rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
            <Icon name="CheckCircle2" size={16} /> {confirmando ? 'Confirmando...' : 'Pagamento Recebido — Entregue'}
          </button>
          <button onClick={() => setEtapa('pagamento')} className="w-full py-2 text-xs text-[#71717A] hover:text-[#18181B]">
            ← Voltar
          </button>
        </>
      )}

      {/* ETAPA: AÇÃO FINAL */}
      {etapa === 'acao' && (
        <>
          <p className="text-xs font-semibold text-center text-[#18181B] bg-green-50 rounded-xl px-3 py-2">
            ✅ Confirme a entrega do pedido #{pedido.id}
          </p>
          <button
            onClick={() => handleEntregar({ metodo: 'conforme', dinheiro: total })}
            disabled={confirmando}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-black text-sm rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
            <Icon name="CheckCircle2" size={16} />
            {confirmando ? 'Confirmando...' : 'Entregue!'}
          </button>
          <button onClick={() => setEtapa('ocorrencia')} disabled={confirmando}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
            <Icon name="Clock" size={14} /> Não consegui entregar (pendência)
          </button>
          <button onClick={() => setEtapa('pagamento')} className="w-full py-2 text-xs text-[#71717A] hover:text-[#18181B]">
            ← Voltar
          </button>
        </>
      )}

      {/* ETAPA: OCORRÊNCIA */}
      {etapa === 'ocorrencia' && (
        <>
          <p className="text-xs font-bold text-orange-700 mb-1">Descreva o motivo da pendência:</p>
          <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3}
            placeholder="Ex: Cliente não atendeu, endereço incorreto..."
            className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400 resize-none" />
          <div className="flex gap-2">
            <button onClick={() => setEtapa('acao')}
              className="flex-1 py-2.5 text-sm border border-[#E4E4E7] rounded-xl text-[#71717A] hover:bg-[#F4F4F5]">
              Voltar
            </button>
            <button onClick={handleOcorrencia} disabled={confirmando || motivo.trim().length < 10}
              className="flex-1 py-2.5 text-sm bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 disabled:opacity-50">
              {confirmando ? '...' : 'Registrar'}
            </button>
          </div>
          <p className="text-[10px] text-[#A1A1AA] text-center">Mínimo 10 caracteres</p>
        </>
      )}

      {erro && <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{erro}</p>}
    </div>
  );
};

export default EntregaBarcode;
