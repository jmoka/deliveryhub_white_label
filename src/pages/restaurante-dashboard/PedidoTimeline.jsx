import React from 'react';

const STEPS = [
  { key: 'pending',            color: 'bg-yellow-400', label: 'Recebido' },
  { key: 'confirmed',          color: 'bg-blue-400',   label: 'Confirmado' },
  { key: 'preparing',          color: 'bg-orange-400', label: 'Preparo' },
  { key: 'ready',              color: 'bg-purple-400', label: 'Pronto' },
  { key: 'motoboy_collecting', color: 'bg-sky-400',    label: 'Motoboy' },
  { key: 'out_for_delivery',   color: 'bg-indigo-400', label: 'Saiu' },
  { key: 'delivered',          color: 'bg-green-400',  label: 'Entregue' },
];

const PedidoTimeline = ({ status }) => {
  if (status === 'canceled') return (
    <p className="hidden md:block text-[10px] text-red-500 font-semibold mt-1.5 pt-1.5 border-t border-[#F4F4F5]">
      Cancelado
    </p>
  );

  const currentIdx = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="hidden md:flex items-end mt-2 pt-2 border-t border-[#F4F4F5]">
      {STEPS.map((step, idx) => {
        const isPast    = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isLast    = idx === STEPS.length - 1;
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className={`rounded-full border-2 transition-all ${
                isCurrent ? `w-5 h-5 ${step.color} border-transparent ring-2 ring-offset-1 ring-current` :
                isPast    ? `w-4 h-4 ${step.color} border-transparent opacity-70` :
                            'w-3.5 h-3.5 bg-white border-[#D4D4D8]'
              }`} />
              <span className={`text-[8px] font-semibold leading-none whitespace-nowrap ${
                isCurrent ? 'text-[#18181B]' : isPast ? 'text-[#A1A1AA]' : 'text-[#D4D4D8]'
              }`}>
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div className={`flex-1 h-0.5 mx-1 mb-4 rounded-full ${isPast ? 'bg-[#D4D4D8]' : 'bg-[#F0F0F0]'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default PedidoTimeline;
