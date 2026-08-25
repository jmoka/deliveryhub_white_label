import React, { useState, useEffect, useRef } from 'react';
import Icon from '../../components/AppIcon';
import { confirmarEntrega, registrarOcorrencia, uploadComprovantePagamento } from '../../services/motoboyService';
import { gerarPixPayload, qrCodeUrl } from '../../utils/pixQrCode';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

// etapas: scan → ja_pago | pagamento → troco | exato | pix | pix_maquininha | pix_parcial | cartao → acao → ocorrencia

const EntregaBarcode = ({ pedido, onConfirmado, chavePix, restauranteNome, restauranteCidade, pago, taxaCartaoPercentual = 0 }) => {
  const [etapa, setEtapa] = useState('scan');
  const [scanning, setScanning] = useState(false);
  const [manual, setManual] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [trocoConfirmado, setTrocoConfirmado] = useState(false);
  const [exatoConfirmado, setExatoConfirmado] = useState(false);
  const [dinheiroInput, setDinheiroInput] = useState('');
  const [pixCombinadoInput, setPixCombinadoInput] = useState('');
  const [cartaoCombinadoInput, setCartaoCombinadoInput] = useState('');
  const [comprovantePreview, setComprovantePreview] = useState(null);
  const [comprovanteBase64, setComprovanteBase64] = useState(null);
  const [uploadandoFoto, setUploadandoFoto] = useState(false);
  const [erro, setErro] = useState(null);
  const scannerRef = useRef(null);
  const fileInputCameraRef = useRef(null);
  const fileInputGaleriaRef = useRef(null);
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
    setEtapa(pago ? 'ja_pago' : 'pagamento');
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
  const taxaCartaoValor = parseFloat(((total * taxaCartaoPercentual) / 100).toFixed(2));
  const totalComCartao = total + taxaCartaoValor;

  // Pagamento combinado — motoboy digita livremente quanto foi em cada forma,
  // as três somam pra fechar o total do pedido (taxa do cartão é cobrada à parte,
  // só sobre a fatia no cartão, não afeta essa conferência).
  const pixCombinadoVal = parseFloat(pixCombinadoInput.replace(',', '.')) || 0;
  const cartaoCombinadoVal = parseFloat(cartaoCombinadoInput.replace(',', '.')) || 0;
  const somaCombinado = parseFloat((dinheiroVal + pixCombinadoVal + cartaoCombinadoVal).toFixed(2));
  const somaCombinadoOk = Math.abs(somaCombinado - total) < 0.01;
  const taxaCartaoCombinado = cartaoCombinadoVal > 0 ? parseFloat(((cartaoCombinadoVal * taxaCartaoPercentual) / 100).toFixed(2)) : 0;
  const precisaComprovanteCombinado = pixCombinadoVal > 0 || cartaoCombinadoVal > 0;

  const comprimirImagem = (file) =>
    new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const MAX = 1200;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = url;
    });

  const handleFotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await comprimirImagem(file);
    setComprovanteBase64(base64);
    setComprovantePreview(base64);
    e.target.value = '';
  };

  const handleEntregar = async (entregaPagamento) => {
    setConfirmando(true);
    try {
      if (comprovanteBase64) {
        setUploadandoFoto(true);
        await uploadComprovantePagamento(pedido.id, comprovanteBase64);
        setUploadandoFoto(false);
      }
      await confirmarEntrega(pedido.id, entregaPagamento);
      onConfirmado();
    } catch (e) {
      setErro(e.message);
    } finally {
      setConfirmando(false);
      setUploadandoFoto(false);
    }
  };

  return (
    <div className="border-t border-[#E4E4E7] dark:border-[#3F3F46] pt-3 space-y-3">

      {/* ETAPA: SCAN */}
      {etapa === 'scan' && (
        <>
          <p className="text-xs font-semibold text-green-700 dark:text-green-400 text-center bg-green-50 dark:bg-green-950/30 rounded-xl px-3 py-2">
            Escaneie o código da comanda para confirmar entrega
          </p>
          <div id={divId} className={`rounded-xl overflow-hidden ${scanning ? 'block' : 'hidden'}`} />
          {!scanning ? (
            <button onClick={startScan}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2">
              <Icon name="ScanLine" size={16} /> Escanear comanda (câmera)
            </button>
          ) : (
            <button onClick={stopScan} className="w-full py-2 bg-[#F4F4F5] dark:bg-[#3F3F46] text-[#27272A] dark:text-[#F4F4F5] text-sm rounded-xl">
              Cancelar scan
            </button>
          )}
          <div className="flex gap-2">
            <input value={manual} onChange={(e) => setManual(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && validarCodigo(manual) && setEtapa(pago ? 'ja_pago' : 'pagamento')}
              placeholder={`Código manual (${expectedCode})`}
              className="flex-1 border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-green-500" />
            <button
              onClick={() => { if (validarCodigo(manual)) { setErro(null); setEtapa(pago ? 'ja_pago' : 'pagamento'); } else setErro('Código incorreto'); }}
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
          <p className="text-xs font-semibold text-center text-[#18181B] dark:text-[#F4F4F5] bg-green-50 dark:bg-green-950/30 rounded-xl px-3 py-2">
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
              className="w-full py-3 border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300 font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-green-100 dark:hover:bg-green-950/40 transition-colors">
              <Icon name="Banknote" size={16} /> Cliente pagou valor exato — sem troco
            </button>

            {chavePix ? (
              <>
                <button
                  onClick={() => setEtapa('pix')}
                  className="w-full py-3 border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-950/40 transition-colors">
                  <Icon name="QrCode" size={16} /> Cliente quer pagar com PIX
                </button>
              </>
            ) : (
              <p className="text-xs text-[#A1A1AA] dark:text-[#71717A] text-center bg-[#F4F4F5] dark:bg-[#3F3F46] rounded-xl px-3 py-2">
                PIX por QR Code indisponível — chave não configurada no restaurante
              </p>
            )}

            <button
              onClick={() => setEtapa('combinado')}
              className="w-full py-3 border-2 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30 text-purple-800 dark:text-purple-300 font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-purple-100 dark:hover:bg-purple-950/40 transition-colors">
              <Icon name="Split" size={16} /> Pagamento combinado (dinheiro + PIX + cartão)
            </button>

            <button
              onClick={() => setEtapa('pix_maquininha')}
              className="w-full py-3 border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-950/40 transition-colors">
              <Icon name="CreditCard" size={16} /> Cliente vai pagar PIX na maquininha
            </button>

            <button
              onClick={() => setEtapa('cartao')}
              className="w-full py-3 border-2 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-colors">
              <Icon name="CreditCard" size={16} /> Cliente vai pagar com cartão (maquininha)
            </button>
          </div>
          <button onClick={() => setEtapa('ocorrencia')}
            className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors">
            <Icon name="Clock" size={14} /> Não consegui entregar (pendência)
          </button>
        </>
      )}

      {/* ETAPA: JÁ PAGO — dono confirmou no painel, só falta confirmar a entrega */}
      {etapa === 'ja_pago' && (
        <>
          <div className="bg-green-50 dark:bg-green-950/30 border-2 border-green-300 dark:border-green-700 rounded-xl p-4 space-y-1 text-center">
            <p className="text-sm font-black text-green-800 dark:text-green-300">✅ Pagamento já confirmado</p>
            <p className="text-xs text-green-700 dark:text-green-400">O estabelecimento já marcou esse pedido como pago — não é necessário cobrar nada.</p>
          </div>
          <button
            onClick={() => handleEntregar()}
            disabled={confirmando}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-black text-sm rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
            <Icon name="CheckCircle2" size={16} /> {confirmando ? 'Confirmando...' : 'Confirmar Entrega'}
          </button>
          <button onClick={() => setEtapa('ocorrencia')}
            className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors">
            <Icon name="Clock" size={14} /> Não consegui entregar (pendência)
          </button>
        </>
      )}

      {/* ETAPA: TROCO */}
      {etapa === 'troco' && (
        <>
          <div className="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700 rounded-xl p-4 space-y-3">
            <p className="text-sm font-black text-amber-800 dark:text-amber-300 text-center">Confirmação de Troco</p>
            <div className="flex justify-between text-sm">
              <span className="text-amber-700 dark:text-amber-400">Receber do cliente:</span>
              <strong className="text-amber-900 dark:text-amber-200">{fmt(pedido.troco_para)}</strong>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-amber-700 dark:text-amber-400">Devolver de troco:</span>
              <strong className="text-amber-900 dark:text-amber-200">{fmt(trocoValor)}</strong>
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={trocoConfirmado}
                onChange={(e) => setTrocoConfirmado(e.target.checked)}
                className="mt-0.5 w-5 h-5 accent-amber-500 flex-shrink-0" />
              <span className="text-xs text-amber-900 dark:text-amber-200 leading-snug font-medium">
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
          <button onClick={() => setEtapa('pagamento')} className="w-full py-2 text-xs text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5]">
            ← Voltar
          </button>
        </>
      )}

      {/* ETAPA: VALOR EXATO */}
      {etapa === 'exato' && (
        <>
          <div className="bg-green-50 dark:bg-green-950/30 border-2 border-green-300 dark:border-green-700 rounded-xl p-4 space-y-3">
            <p className="text-sm font-black text-green-800 dark:text-green-300 text-center">Confirmar Recebimento</p>
            <div className="flex justify-between text-sm">
              <span className="text-green-700 dark:text-green-400">Valor recebido:</span>
              <strong className="text-green-900 dark:text-green-200">{fmt(total)}</strong>
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={exatoConfirmado}
                onChange={(e) => setExatoConfirmado(e.target.checked)}
                className="mt-0.5 w-5 h-5 accent-green-500 flex-shrink-0" />
              <span className="text-xs text-green-900 dark:text-green-200 leading-snug font-medium">
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
          <button onClick={() => setEtapa('pagamento')} className="w-full py-2 text-xs text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5]">
            ← Voltar
          </button>
        </>
      )}

      {/* Inputs de foto ocultos — compartilhados pelas etapas PIX e cartão */}
      <input
        ref={fileInputCameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFotoChange}
      />
      <input
        ref={fileInputGaleriaRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFotoChange}
      />

      {/* ETAPA: PIX TOTAL */}
      {etapa === 'pix' && (
        <>
          <p className="text-sm font-black text-blue-800 dark:text-blue-300 text-center">PIX — {fmt(total)}</p>
          {pixQr(total) ? (
            <div className="flex flex-col items-center gap-2">
              <img src={pixQr(total)} alt="QR Code PIX" className="w-[220px] h-[220px] rounded-xl border border-blue-200 dark:border-blue-800" />
              <p className="text-xs text-blue-700 dark:text-blue-400 text-center">Cliente escaneia com o app do banco</p>
            </div>
          ) : (
            <div className="text-center space-y-2">
              <p className="text-xs text-red-500 dark:text-red-400">Erro ao gerar QR Code</p>
              <button onClick={() => setEtapa('pix_maquininha')}
                className="text-xs font-bold text-blue-700 dark:text-blue-400 underline">
                Cobrar PIX na maquininha em vez disso
              </button>
            </div>
          )}

          {/* Comprovante */}
          {comprovantePreview ? (
            <div className="relative">
              <img src={comprovantePreview} alt="Comprovante" className="w-full max-h-40 object-cover rounded-xl border-2 border-green-300 dark:border-green-700" />
              <button
                onClick={() => { setComprovantePreview(null); setComprovanteBase64(null); }}
                className="absolute top-1 right-1 bg-white dark:bg-[#27272A] rounded-full p-1 shadow">
                <Icon name="X" size={14} className="text-gray-600" />
              </button>
              <p className="text-xs text-green-700 dark:text-green-400 text-center mt-1 font-semibold">✓ Comprovante capturado</p>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => fileInputCameraRef.current?.click()}
                className="flex-1 py-2.5 border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-950/40 transition-colors">
                <Icon name="Camera" size={16} /> Fotografar
              </button>
              <button
                onClick={() => fileInputGaleriaRef.current?.click()}
                className="flex-1 py-2.5 border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-950/40 transition-colors">
                <Icon name="Paperclip" size={16} /> Anexar
              </button>
            </div>
          )}

          {!comprovanteBase64 && (
            <p className="text-xs text-red-500 dark:text-red-400 text-center">Foto do comprovante é obrigatória</p>
          )}
          <button
            onClick={() => handleEntregar({ metodo: 'pix', pix: total })}
            disabled={confirmando || !comprovanteBase64}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-black text-sm rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
            <Icon name="CheckCircle2" size={16} />
            {uploadandoFoto ? 'Enviando foto...' : confirmando ? 'Confirmando...' : 'PIX Recebido — Marcar Entregue'}
          </button>
          <button onClick={() => setEtapa('pagamento')} className="w-full py-2 text-xs text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5]">
            ← Voltar
          </button>
        </>
      )}

      {/* ETAPA: CARTÃO (maquininha física) */}
      {etapa === 'cartao' && (
        <>
          <p className="text-sm font-black text-amber-800 dark:text-amber-300 text-center">Cartão — Cobrar na maquininha</p>
          <div className="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700 rounded-xl p-4 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-amber-700 dark:text-amber-400">Valor do pedido:</span>
              <strong className="text-amber-900 dark:text-amber-200">{fmt(total)}</strong>
            </div>
            {taxaCartaoValor > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-amber-700 dark:text-amber-400">Taxa do cartão ({taxaCartaoPercentual}%):</span>
                <strong className="text-amber-900 dark:text-amber-200">{fmt(taxaCartaoValor)}</strong>
              </div>
            )}
            <div className="flex justify-between text-sm pt-1 border-t border-amber-200 dark:border-amber-800">
              <span className="text-amber-800 dark:text-amber-300 font-bold">Cobrar do cliente:</span>
              <strong className="text-amber-900 dark:text-amber-200">{fmt(totalComCartao)}</strong>
            </div>
          </div>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] text-center">Informe esse valor (com a taxa) ao cliente antes de passar na maquininha.</p>

          {/* Comprovante */}
          {comprovantePreview ? (
            <div className="relative">
              <img src={comprovantePreview} alt="Comprovante" className="w-full max-h-40 object-cover rounded-xl border-2 border-green-300 dark:border-green-700" />
              <button
                onClick={() => { setComprovantePreview(null); setComprovanteBase64(null); }}
                className="absolute top-1 right-1 bg-white dark:bg-[#27272A] rounded-full p-1 shadow">
                <Icon name="X" size={14} className="text-gray-600" />
              </button>
              <p className="text-xs text-green-700 dark:text-green-400 text-center mt-1 font-semibold">✓ Comprovante capturado</p>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => fileInputCameraRef.current?.click()}
                className="flex-1 py-2.5 border-2 border-dashed border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-colors">
                <Icon name="Camera" size={16} /> Fotografar
              </button>
              <button
                onClick={() => fileInputGaleriaRef.current?.click()}
                className="flex-1 py-2.5 border-2 border-dashed border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-colors">
                <Icon name="Paperclip" size={16} /> Anexar
              </button>
            </div>
          )}
          {!comprovanteBase64 && (
            <p className="text-xs text-red-500 dark:text-red-400 text-center">Foto do comprovante é obrigatória</p>
          )}

          <button
            onClick={() => handleEntregar({ metodo: 'cartao', cartao: total })}
            disabled={confirmando || !comprovanteBase64}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-black text-sm rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
            <Icon name="CheckCircle2" size={16} />
            {uploadandoFoto ? 'Enviando foto...' : confirmando ? 'Confirmando...' : 'Cartão Recebido — Marcar Entregue'}
          </button>
          <button onClick={() => setEtapa('pagamento')} className="w-full py-2 text-xs text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5]">
            ← Voltar
          </button>
        </>
      )}

      {/* ETAPA: PIX NA MAQUININHA — fallback pro app não gerar o QR Code (ou o
          estabelecimento aceitar Pix direto na maquininha) — sem taxa, mesmo tratamento
          do PIX normal, só que sem depender da geração do QR pelo celular do motoboy. */}
      {etapa === 'pix_maquininha' && (
        <>
          <p className="text-sm font-black text-blue-800 dark:text-blue-300 text-center">PIX na maquininha — Cobrar {fmt(total)}</p>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] text-center">Informe esse valor ao cliente e escolha "Pix" na maquininha.</p>

          {/* Comprovante */}
          {comprovantePreview ? (
            <div className="relative">
              <img src={comprovantePreview} alt="Comprovante" className="w-full max-h-40 object-cover rounded-xl border-2 border-green-300 dark:border-green-700" />
              <button
                onClick={() => { setComprovantePreview(null); setComprovanteBase64(null); }}
                className="absolute top-1 right-1 bg-white dark:bg-[#27272A] rounded-full p-1 shadow">
                <Icon name="X" size={14} className="text-gray-600" />
              </button>
              <p className="text-xs text-green-700 dark:text-green-400 text-center mt-1 font-semibold">✓ Comprovante capturado</p>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => fileInputCameraRef.current?.click()}
                className="flex-1 py-2.5 border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-950/40 transition-colors">
                <Icon name="Camera" size={16} /> Fotografar
              </button>
              <button
                onClick={() => fileInputGaleriaRef.current?.click()}
                className="flex-1 py-2.5 border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-950/40 transition-colors">
                <Icon name="Paperclip" size={16} /> Anexar
              </button>
            </div>
          )}
          {!comprovanteBase64 && (
            <p className="text-xs text-red-500 dark:text-red-400 text-center">Foto do comprovante é obrigatória</p>
          )}

          <button
            onClick={() => handleEntregar({ metodo: 'pix', pix: total })}
            disabled={confirmando || !comprovanteBase64}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-black text-sm rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
            <Icon name="CheckCircle2" size={16} />
            {uploadandoFoto ? 'Enviando foto...' : confirmando ? 'Confirmando...' : 'PIX Recebido — Marcar Entregue'}
          </button>
          <button onClick={() => setEtapa('pagamento')} className="w-full py-2 text-xs text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5]">
            ← Voltar
          </button>
        </>
      )}

      {/* ETAPA: PAGAMENTO COMBINADO (dinheiro + PIX + cartão, em qualquer combinação) */}
      {etapa === 'combinado' && (
        <>
          <p className="text-sm font-black text-purple-800 dark:text-purple-300 text-center">Pagamento combinado — Total {fmt(total)}</p>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-[#71717A] dark:text-[#A1A1AA] font-medium">Dinheiro</label>
              <input
                type="number" step="0.01" min="0" value={dinheiroInput}
                onChange={(e) => setDinheiroInput(e.target.value)}
                placeholder="0,00"
                className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
              />
            </div>
            <div>
              <label className="text-xs text-[#71717A] dark:text-[#A1A1AA] font-medium">PIX</label>
              <input
                type="number" step="0.01" min="0" value={pixCombinadoInput}
                onChange={(e) => setPixCombinadoInput(e.target.value)}
                placeholder="0,00"
                className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
              />
            </div>
            <div>
              <label className="text-xs text-[#71717A] dark:text-[#A1A1AA] font-medium">Cartão (maquininha)</label>
              <input
                type="number" step="0.01" min="0" value={cartaoCombinadoInput}
                onChange={(e) => setCartaoCombinadoInput(e.target.value)}
                placeholder="0,00"
                className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-950/30 rounded-xl p-3 space-y-1 text-sm">
            {dinheiroVal > 0 && (
              <div className="flex justify-between"><span className="text-purple-700 dark:text-purple-400">Dinheiro</span><strong className="text-purple-900 dark:text-purple-200">{fmt(dinheiroVal)}</strong></div>
            )}
            {pixCombinadoVal > 0 && (
              <div className="flex justify-between"><span className="text-purple-700 dark:text-purple-400">PIX</span><strong className="text-purple-900 dark:text-purple-200">{fmt(pixCombinadoVal)}</strong></div>
            )}
            {cartaoCombinadoVal > 0 && (
              <div className="flex justify-between">
                <span className="text-purple-700 dark:text-purple-400">Cartão{taxaCartaoCombinado > 0 ? ` (+ taxa ${fmt(taxaCartaoCombinado)})` : ''}</span>
                <strong className="text-purple-900 dark:text-purple-200">{fmt(cartaoCombinadoVal + taxaCartaoCombinado)}</strong>
              </div>
            )}
            <div className={`flex justify-between pt-1 border-t border-purple-200 dark:border-purple-800 font-black ${somaCombinadoOk ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              <span>{somaCombinadoOk ? 'Confere ✓' : 'Falta alocar'}</span>
              <span>{somaCombinadoOk ? fmt(total) : fmt(total - somaCombinado)}</span>
            </div>
          </div>

          {pixCombinadoVal > 0 && pixQr(pixCombinadoVal) && (
            <div className="flex flex-col items-center gap-2">
              <img src={pixQr(pixCombinadoVal)} alt="QR Code PIX" className="w-[180px] h-[180px] rounded-xl border border-blue-200 dark:border-blue-800" />
              <p className="text-xs text-blue-700 dark:text-blue-400 text-center">Cliente escaneia para pagar {fmt(pixCombinadoVal)}</p>
            </div>
          )}

          {precisaComprovanteCombinado && (
            <>
              {comprovantePreview ? (
                <div className="relative">
                  <img src={comprovantePreview} alt="Comprovante" className="w-full max-h-40 object-cover rounded-xl border-2 border-green-300 dark:border-green-700" />
                  <button
                    onClick={() => { setComprovantePreview(null); setComprovanteBase64(null); }}
                    className="absolute top-1 right-1 bg-white dark:bg-[#27272A] rounded-full p-1 shadow">
                    <Icon name="X" size={14} className="text-gray-600" />
                  </button>
                  <p className="text-xs text-green-700 dark:text-green-400 text-center mt-1 font-semibold">✓ Comprovante capturado</p>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputCameraRef.current?.click()}
                    className="flex-1 py-2.5 border-2 border-dashed border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-purple-100 dark:hover:bg-purple-950/40 transition-colors">
                    <Icon name="Camera" size={16} /> Fotografar
                  </button>
                  <button
                    onClick={() => fileInputGaleriaRef.current?.click()}
                    className="flex-1 py-2.5 border-2 border-dashed border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-purple-100 dark:hover:bg-purple-950/40 transition-colors">
                    <Icon name="Paperclip" size={16} /> Anexar
                  </button>
                </div>
              )}
              {!comprovanteBase64 && (
                <p className="text-xs text-red-500 dark:text-red-400 text-center">Foto do comprovante é obrigatória (PIX e/ou cartão)</p>
              )}
            </>
          )}

          <button
            onClick={() => handleEntregar({ metodo: 'combinado', dinheiro: dinheiroVal, pix: pixCombinadoVal, cartao: cartaoCombinadoVal })}
            disabled={confirmando || !somaCombinadoOk || (precisaComprovanteCombinado && !comprovanteBase64)}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-black text-sm rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
            <Icon name="CheckCircle2" size={16} /> {uploadandoFoto ? 'Enviando foto...' : confirmando ? 'Confirmando...' : 'Pagamento Recebido — Entregue'}
          </button>
          <button onClick={() => setEtapa('pagamento')} className="w-full py-2 text-xs text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5]">
            ← Voltar
          </button>
        </>
      )}

      {/* ETAPA: AÇÃO FINAL */}
      {etapa === 'acao' && (
        <>
          <p className="text-xs font-semibold text-center text-[#18181B] dark:text-[#F4F4F5] bg-green-50 dark:bg-green-950/30 rounded-xl px-3 py-2">
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
          <button onClick={() => setEtapa('pagamento')} className="w-full py-2 text-xs text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5]">
            ← Voltar
          </button>
        </>
      )}

      {/* ETAPA: OCORRÊNCIA */}
      {etapa === 'ocorrencia' && (
        <>
          <p className="text-xs font-bold text-orange-700 dark:text-orange-400 mb-1">Descreva o motivo da pendência:</p>
          <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3}
            placeholder="Ex: Cliente não atendeu, endereço incorreto..."
            className="w-full border border-[#E4E4E7] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400 resize-none" />
          <div className="flex gap-2">
            <button onClick={() => setEtapa('acao')}
              className="flex-1 py-2.5 text-sm border border-[#E4E4E7] dark:border-[#3F3F46] rounded-xl text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F4F4F5] dark:hover:bg-[#3F3F46]">
              Voltar
            </button>
            <button onClick={handleOcorrencia} disabled={confirmando || motivo.trim().length < 10}
              className="flex-1 py-2.5 text-sm bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 disabled:opacity-50">
              {confirmando ? '...' : 'Registrar'}
            </button>
          </div>
          <p className="text-[10px] text-[#A1A1AA] dark:text-[#71717A] text-center">Mínimo 10 caracteres</p>
        </>
      )}

      {erro && <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-xl px-3 py-2">{erro}</p>}
    </div>
  );
};

export default EntregaBarcode;
