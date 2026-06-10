import React, { useState, useEffect, useRef } from 'react';
import Icon from '../../components/AppIcon';
import { confirmarEntrega, registrarOcorrencia } from '../../services/motoboyService';

const EntregaBarcode = ({ pedido, onConfirmado }) => {
  const [etapa, setEtapa] = useState('scan'); // scan | acao | ocorrencia
  const [scanning, setScanning] = useState(false);
  const [manual, setManual] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState(null);
  const scannerRef = useRef(null);
  const divId = `entrega-scan-${pedido.id}`;

  const expectedCode = String(pedido.id).padStart(8, '0');

  const validarCodigo = (code) => code.replace(/\D/g, '') === expectedCode.replace(/\D/g, '');

  const handleScanSuccess = (decoded) => {
    stopScan();
    if (!validarCodigo(decoded)) {
      setErro(`Código não corresponde ao pedido #${pedido.id}`);
      return;
    }
    setErro(null);
    setEtapa('acao');
  };

  const stopScan = async () => {
    try { if (scannerRef.current?.isScanning) await scannerRef.current.stop(); } catch {}
    scannerRef.current = null;
    setScanning(false);
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

  const handleEntregar = async () => {
    setConfirmando(true);
    try {
      await confirmarEntrega(pedido.id);
      onConfirmado();
    } catch (e) { setErro(e.message); } finally { setConfirmando(false); }
  };

  const handleOcorrencia = async () => {
    if (motivo.trim().length < 10) return;
    setConfirmando(true);
    try {
      await registrarOcorrencia(pedido.id, 'pendente', motivo.trim());
      onConfirmado();
    } catch (e) { setErro(e.message); } finally { setConfirmando(false); }
  };

  return (
    <div className="border-t border-[#E4E4E7] pt-3 space-y-3">
      {etapa === 'scan' && (
        <>
          <p className="text-xs font-semibold text-green-700 text-center bg-green-50 rounded-xl px-3 py-2">
            Escaneie o QR da comanda para confirmar entrega
          </p>
          <div id={divId} className={`rounded-xl overflow-hidden ${scanning ? 'block' : 'hidden'}`} />
          {!scanning ? (
            <button onClick={startScan}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2">
              <Icon name="ScanLine" size={16} /> Escanear QR da comanda
            </button>
          ) : (
            <button onClick={stopScan} className="w-full py-2 bg-[#F4F4F5] text-[#27272A] text-sm rounded-xl">
              Cancelar scan
            </button>
          )}
          <div className="flex gap-2">
            <input value={manual} onChange={(e) => setManual(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && validarCodigo(manual) && setEtapa('acao')}
              placeholder={`Código manual (${expectedCode})`}
              className="flex-1 border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-green-500" />
            <button onClick={() => { if (validarCodigo(manual)) { setErro(null); setEtapa('acao'); } else setErro('Código incorreto'); }}
              disabled={!manual.trim()}
              className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-xl disabled:opacity-50 hover:bg-green-700">
              OK
            </button>
          </div>
        </>
      )}

      {etapa === 'acao' && (
        <>
          <p className="text-xs font-semibold text-center text-[#18181B] bg-green-50 rounded-xl px-3 py-2">
            ✅ Código confirmado — Pedido #{pedido.id}
          </p>
          <button onClick={handleEntregar} disabled={confirmando}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-black text-sm rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
            <Icon name="CheckCircle2" size={16} />
            {confirmando ? 'Confirmando...' : 'Entregue!'}
          </button>
          <button onClick={() => setEtapa('ocorrencia')} disabled={confirmando}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
            <Icon name="Clock" size={14} /> Não consegui entregar (pendência)
          </button>
          <button onClick={() => setEtapa('scan')} className="w-full py-2 text-xs text-[#71717A] hover:text-[#18181B]">
            ← Reler QR
          </button>
        </>
      )}

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
