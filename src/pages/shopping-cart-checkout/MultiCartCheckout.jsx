import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import { cartByRestaurant, cartClearRestaurant, cartCount } from '../../utils/multiCart';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const MultiCartCheckout = () => {
  const navigate = useNavigate();
  const [grupos, setGrupos] = useState(() => Object.values(cartByRestaurant()));

  if (grupos.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#F4F4F5] p-6">
        <Icon name="ShoppingCart" size={48} className="text-[#E4E4E7]" />
        <p className="text-[#71717A] font-medium">Carrinho vazio</p>
        <button onClick={() => navigate('/')} className="px-4 py-2 bg-[#FF441F] text-white rounded-xl text-sm font-bold">
          Ver restaurantes
        </button>
      </div>
    );
  }

  const handleCheckoutGrupo = (grupo) => {
    const carrinho = grupo.items.map((i) => ({
      id: i.produto_id,
      name: i.name,
      price: i.price,
      image_url: i.image_url ?? null,
      qtd: i.qty,
    }));
    cartClearRestaurant(grupo.restaurante_id);
    navigate('/shopping-cart-checkout', {
      state: {
        carrinho,
        restauranteId: grupo.restaurante_id,
        restauranteSlug: grupo.slug ?? '',
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#F4F4F5] pb-16">
      <header className="sticky top-0 z-30 bg-white border-b border-[#E4E4E7] h-14 flex items-center px-4 gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-[#F4F4F5] rounded-lg">
          <Icon name="ArrowLeft" size={18} className="text-[#71717A]" />
        </button>
        <h1 className="font-black text-[#18181B]">Carrinho ({cartCount()} itens)</h1>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 flex items-start gap-2">
          <Icon name="Info" size={15} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            Você tem itens de <strong>{grupos.length} restaurantes</strong>. Finalize cada pedido separadamente para escolher endereço e forma de pagamento.
          </p>
        </div>

        {grupos.map((grupo) => {
          const subtotal = grupo.items.reduce((s, i) => s + i.price * i.qty, 0);
          return (
            <div key={grupo.restaurante_id} className="bg-white rounded-2xl border border-[#E4E4E7] overflow-hidden">
              {/* Header restaurante */}
              <div className="px-4 py-3 border-b border-[#F4F4F5] flex items-center gap-2">
                <Icon name="Store" size={14} className="text-[#FF441F]" />
                <p className="text-sm font-black text-[#18181B] flex-1">{grupo.nome}</p>
                <span className="text-xs text-[#71717A]">{grupo.items.length} item{grupo.items.length > 1 ? 's' : ''}</span>
              </div>

              {/* Itens */}
              <div className="p-4 space-y-3">
                {grupo.items.map((item) => (
                  <div key={item._key} className="flex items-center gap-3">
                    {item.image_url && (
                      <img src={item.image_url} alt={item.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#18181B] truncate">{item.name}</p>
                      <p className="text-xs text-[#71717A]">{item.qty}× {fmt(item.price)}</p>
                    </div>
                    <p className="text-sm font-bold text-[#FF441F] flex-shrink-0">{fmt(item.price * item.qty)}</p>
                  </div>
                ))}

                <div className="pt-2 border-t border-[#F4F4F5] flex justify-between text-sm">
                  <span className="text-[#71717A]">Subtotal</span>
                  <span className="font-bold text-[#18181B]">{fmt(subtotal)}</span>
                </div>
              </div>

              {/* Botão checkout individual */}
              <div className="px-4 pb-4">
                <button
                  onClick={() => handleCheckoutGrupo(grupo)}
                  className="w-full py-3 bg-[#FF441F] hover:bg-[#E63A19] text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Icon name="ShoppingBag" size={15} />
                  Finalizar pedido — {grupo.nome}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MultiCartCheckout;
