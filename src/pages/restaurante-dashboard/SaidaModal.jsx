import React, { useState } from 'react';

const SaidaModal = ({ onConfirmar, onFechar, salvando }) => {
  const [form, setForm] = useState({ descricao: '', valor: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.descricao || !form.valor) return;
    onConfirmar({ descricao: form.descricao, valor: parseFloat(form.valor) });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="text-base font-bold text-[#18181B] mb-4">Registrar Saída</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-[#71717A] mb-1">Descrição</label>
            <input
              value={form.descricao}
              onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
              placeholder="Ex: Troco, compra de ingrediente..."
              className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#71717A] mb-1">Valor (R$)</label>
            <input
              type="number" min="0.01" step="0.01"
              value={form.valor}
              onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
              placeholder="0,00"
              className="w-full border border-[#E4E4E7] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF441F]"
              required
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onFechar}
              className="flex-1 py-2 text-sm border border-[#E4E4E7] rounded-xl text-[#71717A] hover:bg-[#F4F4F5]">
              Cancelar
            </button>
            <button type="submit" disabled={salvando}
              className="flex-1 py-2 text-sm bg-[#FF441F] text-white rounded-xl font-semibold hover:bg-[#E63A19] disabled:opacity-50">
              {salvando ? 'Salvando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaidaModal;
