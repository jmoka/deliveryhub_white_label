import React, { useState, useEffect, useCallback } from 'react';
import { getCaixasAbertos, abrirCaixa, fecharCaixa } from '../../services/restauranteService';
import Icon from '../../components/AppIcon';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

// Caixas secundários (Bar, Salão...) além do Principal — que já tem seu próprio card
// acima. Permite abrir mais um ponto de venda simultâneo e fechar cada um sozinho.
const OutrosCaixasPanel = () => {
  const [caixas, setCaixas] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nomeOperador, setNomeOperador] = useState('');
  const [nome, setNome] = useState('');
  const [valorInicial, setValorInicial] = useState('');
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(() => {
    getCaixasAbertos().then((lista) => setCaixas(lista.filter((c) => !c.is_principal))).catch(() => {});
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const handleAbrir = async () => {
    if (!nomeOperador.trim() || !nome.trim()) { setErro('Informe o nome do operador e o nome do caixa (ex: Bar)'); return; }
    setErro(null);
    setSalvando(true);
    try {
      await abrirCaixa({ nome_operador: nomeOperador.trim(), nome: nome.trim(), valor_inicial: parseFloat(valorInicial) || 0, is_principal: false });
      setNomeOperador(''); setNome(''); setValorInicial(''); setMostrarForm(false);
      carregar();
    } catch (e) { setErro(e.message); } finally { setSalvando(false); }
  };

  const handleFechar = async (caixa) => {
    const dinheiro = caixa.resumo?.especie_calculada ?? 0;
    let permitir_pendencias = false;
    try {
      await fecharCaixa({ caixa_id: caixa.id, dinheiro_contado: dinheiro });
    } catch (e) {
      if (e.data?.pedidos || e.data?.comandas || e.data?.mesas) {
        const total = (e.data.pedidos_abertos ?? 0) + (e.data.comandas_abertas ?? 0) + (e.data.mesas_abertas ?? 0);
        if (!window.confirm(`Este caixa tem ${total} pendência(s) em aberto. Fechar mesmo assim e deixar pendente (fiado)?`)) return;
        permitir_pendencias = true;
      } else {
        alert(e.message);
        return;
      }
    }
    if (permitir_pendencias) {
      try { await fecharCaixa({ caixa_id: caixa.id, dinheiro_contado: dinheiro, permitir_pendencias: true }); } catch (e) { alert(e.message); return; }
    }
    carregar();
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E4E4E7] p-5 mt-4">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="Layers" size={18} className="text-[#FF441F]" />
        <h2 className="font-bold text-[#18181B]">Outros caixas</h2>
        <button onClick={() => setMostrarForm((v) => !v)}
          className="ml-auto text-xs font-bold text-[#FF441F] hover:underline">
          {mostrarForm ? 'Cancelar' : '+ Abrir caixa'}
        </button>
      </div>

      {mostrarForm && (
        <div className="space-y-2 mb-4 p-3 bg-[#FAFAFA] rounded-xl">
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do caixa (ex: Bar, Salão)"
            className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />
          <input value={nomeOperador} onChange={(e) => setNomeOperador(e.target.value)} placeholder="Nome do operador"
            className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />
          <input type="number" min="0" step="0.01" value={valorInicial} onChange={(e) => setValorInicial(e.target.value)}
            placeholder="Valor inicial (R$)"
            className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]" />
          {erro && <p className="text-xs text-red-600">{erro}</p>}
          <button onClick={handleAbrir} disabled={salvando}
            className="w-full py-2 bg-[#FF441F] text-white text-sm font-bold rounded-xl hover:bg-[#E63A19] disabled:opacity-50">
            {salvando ? 'Abrindo...' : 'Abrir caixa'}
          </button>
        </div>
      )}

      {caixas.length === 0 ? (
        <p className="text-xs text-[#A1A1AA]">Nenhum outro caixa aberto além do Principal.</p>
      ) : (
        <div className="space-y-2">
          {caixas.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-3 bg-[#FAFAFA] rounded-xl">
              <div>
                <p className="text-sm font-bold text-[#18181B]">{c.nome}</p>
                <p className="text-xs text-[#71717A]">{c.nome_operador} · {fmt(c.resumo?.total_vendas)} em vendas</p>
              </div>
              <button onClick={() => handleFechar(c)}
                className="px-3 py-1.5 text-xs font-bold bg-red-500 text-white rounded-lg hover:bg-red-600">
                Fechar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OutrosCaixasPanel;
