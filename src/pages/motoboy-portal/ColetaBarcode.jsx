import React, { useState, useEffect, useRef } from 'react';
import Icon from '../../components/AppIcon';
import { confirmarColeta } from '../../services/motoboyService';

const ColetaBarcode = ({ pedidoId, onConfirmado }) => {
  const [scanning, setScanning] = useState(false);
  const [manual, setManual] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState(null);
  const scannerRef = useRef(null);
  const divId = `coleta-scan-${pedidoId}`;

  const handleConfirmar = async (barcode) => {
    if (!barcode?.trim()) return;
    setConfirmando(true);
    setErro(null);
    try {
      await confirmarColeta(pedidoId, barcode.trim());
      onConfirmado();
    } catch (e) {
      setErro(e.message);
    } finally {
      setConfirmando(false);
    }
  };

  const stopScan = async () => {
    try {
      if (scannerRef.current?.isScanning) await scannerRef.current.stop();
    } catch {}
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
        { fps: 10, qrbox: { width: 260, height: 90 } },
        (decoded) => {
          stopScan();
          handleConfirmar(decoded);
        },
        () => {},
      );
    } catch {
      setScanning(false);
      setErro('Câmera não disponível. Use o campo manual abaixo.');
    }
  };

  useEffect(() => () => { stopScan(); }, []);

  return (
    <div className="space-y-3 border-t border-[#E4E4E7] pt-3">
      <p className="text-xs font-semibold text-blue-700 text-center">
        Escaneie o código da comanda para confirmar que você tem o pedido
      </p>

      <div id={divId} className={`rounded-xl overflow-hidden ${scanning ? 'block' : 'hidden'}`} />

      {!scanning ? (
        <button
          onClick={startScan}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          <Icon name="ScanLine" size={16} />
          Escanear Comanda (câmera)
        </button>
      ) : (
        <button onClick={stopScan} className="w-full py-2 bg-[#F4F4F5] text-[#27272A] text-sm rounded-xl">
          Cancelar scan
        </button>
      )}

      <div className="flex gap-2">
        <input
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleConfirmar(manual)}
          placeholder="Digitar código manualmente"
          className="flex-1 border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={() => handleConfirmar(manual)}
          disabled={confirmando || !manual.trim()}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl disabled:opacity-50 hover:bg-blue-700 transition-colors"
        >
          {confirmando ? '...' : 'OK'}
        </button>
      </div>

      {erro && <p className="text-xs text-red-600">{erro}</p>}
    </div>
  );
};

export default ColetaBarcode;
