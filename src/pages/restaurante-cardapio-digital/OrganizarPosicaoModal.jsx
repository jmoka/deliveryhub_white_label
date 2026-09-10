import React, { useState } from 'react';
import {
  DndContext, closestCorners, PointerSensor, useSensor, useSensors, DragOverlay, useDroppable,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Icon from '../../components/AppIcon';
import { chaveDoBloco, pesoCategoria, pesoGrupo, distribuicaoAutomaticaPorPeso } from '../../utils/printCardapioImpresso';

// Blocos do organizador = mesma unidade indivisível da impressão (grupo
// nomeado inteiro, ou categoria avulsa) — só entra quem tem pelo menos 1
// produto selecionado, porque quem não tem não aparece na impressão de jeito
// nenhum (ver montarArgsImpressao em index.jsx), então não faz sentido
// posicionar um bloco que nunca vai imprimir.
const construirBlocosComSelecao = (grupos, selecionados) => {
  const blocos = [];
  for (const grupo of grupos) {
    if (grupo.nome) {
      const categoriasComItens = grupo.categorias
        .map((c) => ({ ...c, produtos: c.produtos.filter((p) => selecionados.has(p.id)) }))
        .filter((c) => c.produtos.length > 0);
      if (categoriasComItens.length === 0) continue;
      blocos.push({ tipo: 'grupo', grupo: { ...grupo, categorias: categoriasComItens } });
    } else {
      for (const categoria of grupo.categorias) {
        const produtos = categoria.produtos.filter((p) => selecionados.has(p.id));
        if (produtos.length === 0) continue;
        blocos.push({ tipo: 'categoria', categoria: { ...categoria, produtos } });
      }
    }
  }
  return blocos;
};

const tituloDoBloco = (bloco) => (bloco.tipo === 'grupo' ? bloco.grupo.nome : bloco.categoria.nome);
const subtituloDoBloco = (bloco) =>
  bloco.tipo === 'grupo'
    ? `${bloco.grupo.categorias.length} categoria(s) · ${bloco.grupo.categorias.reduce((s, c) => s + c.produtos.length, 0)} item(ns)`
    : `${bloco.categoria.produtos.length} item(ns)`;
const pesoDoBloco = (bloco) => (bloco.tipo === 'grupo' ? pesoGrupo(bloco.grupo) : pesoCategoria(bloco.categoria));

const CartaoBloco = ({ id, titulo, subtitulo, tipo, arrastando }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      className={`cursor-grab active:cursor-grabbing rounded-xl border px-3 py-2.5 mb-2 bg-white dark:bg-[#27272A] select-none touch-none ${
        arrastando ? 'shadow-lg' : ''
      } ${tipo === 'grupo' ? 'border-[#FF441F]/40' : 'border-[#E4E4E7] dark:border-[#3F3F46]'}`}>
      <div className="flex items-center gap-2">
        <Icon name="GripVertical" size={14} className="text-[#A1A1AA] flex-shrink-0" />
        <div className="min-w-0">
          <p className={`text-sm font-bold truncate ${tipo === 'grupo' ? 'text-[#FF441F] uppercase' : 'text-[#18181B] dark:text-[#F4F4F5]'}`}>{titulo}</p>
          <p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA]">{subtitulo}</p>
        </div>
      </div>
    </div>
  );
};

// Coluna precisa ser droppable ELA MESMA (não só cada item via sortable) —
// senão não dá pra soltar um bloco numa coluna que ficou vazia, já que não
// sobra nenhum item ali pra servir de alvo da colisão.
const Coluna = ({ id, titulo, chaves, blocosPorChave }) => {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className="flex-1 min-w-0 bg-[#F4F4F5] dark:bg-[#18181B] rounded-xl p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-[#71717A] dark:text-[#A1A1AA] mb-2">{titulo}</p>
      <SortableContext items={chaves} strategy={verticalListSortingStrategy}>
        <div className="min-h-[100px]">
          {chaves.map((chave) => {
            const bloco = blocosPorChave.get(chave);
            if (!bloco) return null;
            return (
              <CartaoBloco key={chave} id={chave} titulo={tituloDoBloco(bloco)} subtitulo={subtituloDoBloco(bloco)} tipo={bloco.tipo} />
            );
          })}
          {chaves.length === 0 && (
            <p className="text-xs text-[#A1A1AA] text-center py-8 border-2 border-dashed border-[#E4E4E7] dark:border-[#3F3F46] rounded-lg">
              Arraste um bloco pra cá
            </p>
          )}
        </div>
      </SortableContext>
    </div>
  );
};

/**
 * Organizador visual (arrastar/soltar) das 2 colunas da impressão — grava um
 * layout manual (`layout_colunas`) que passa a ser usado por
 * printCardapioImpresso.js em vez do algoritmo automático por peso.
 *
 * Props: grupos (árvore ordenada, mesma que a tela principal usa pra
 * imprimir), selecionados (Set de product_id marcados), layoutInicial
 * ({col1,col2}|null, o que já estava salvo), onSalvar(novoLayout), onClose.
 */
const OrganizarPosicaoModal = ({ grupos, selecionados, layoutInicial, onSalvar, onClose }) => {
  const blocos = construirBlocosComSelecao(grupos, selecionados);
  const blocosPorChave = new Map(blocos.map((b) => [chaveDoBloco(b), b]));
  const chavesValidas = new Set(blocosPorChave.keys());

  const [colunas, setColunas] = useState(() => {
    const temLayoutValido = layoutInicial && (
      (layoutInicial.col1 ?? []).some((c) => chavesValidas.has(c)) ||
      (layoutInicial.col2 ?? []).some((c) => chavesValidas.has(c))
    );
    if (temLayoutValido) {
      const base = {
        col1: (layoutInicial.col1 ?? []).filter((c) => chavesValidas.has(c)),
        col2: (layoutInicial.col2 ?? []).filter((c) => chavesValidas.has(c)),
      };
      // Bloco que apareceu depois do último layout salvo (produto novo
      // marcado, categoria criada) entra na coluna mais curta.
      const usados = new Set([...base.col1, ...base.col2]);
      for (const chave of chavesValidas) {
        if (usados.has(chave)) continue;
        (base.col1.length <= base.col2.length ? base.col1 : base.col2).push(chave);
      }
      return base;
    }
    // Sem layout salvo ainda — parte do mesmo cálculo automático que a
    // impressão usaria, pra não começar de uma bagunça sem relação nenhuma
    // com o que já está saindo hoje.
    return distribuicaoAutomaticaPorPeso(blocos.map((b) => ({ chave: chaveDoBloco(b), peso: pesoDoBloco(b) })));
  });

  const [activeId, setActiveId] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const colunaDaChave = (chave) => (colunas.col1.includes(chave) ? 'col1' : colunas.col2.includes(chave) ? 'col2' : null);

  const handleDragStart = (event) => setActiveId(event.active.id);

  // Move o card pra outra coluna DURANTE o arraste (feedback visual em
  // tempo real) — a posição fina dentro da coluna final é resolvida no
  // dragEnd (arrayMove).
  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const colOrigem = colunaDaChave(active.id);
    const colDestino = colunaDaChave(over.id) ?? (over.id === 'col1' || over.id === 'col2' ? over.id : null);
    if (!colOrigem || !colDestino || colOrigem === colDestino) return;

    setColunas((atual) => {
      const origem = atual[colOrigem].filter((c) => c !== active.id);
      const destino = [...atual[colDestino]];
      const indiceOver = destino.indexOf(over.id);
      destino.splice(indiceOver === -1 ? destino.length : indiceOver, 0, active.id);
      return { ...atual, [colOrigem]: origem, [colDestino]: destino };
    });
  };

  const handleDragEnd = (event) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const col = colunaDaChave(active.id);
    if (!col) return;
    const oldIndex = colunas[col].indexOf(active.id);
    const newIndex = colunas[col].indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
      onSalvar(colunas);
      return;
    }
    const nova = { ...colunas, [col]: arrayMove(colunas[col], oldIndex, newIndex) };
    setColunas(nova);
    onSalvar(nova);
  };

  const blocoAtivo = activeId ? blocosPorChave.get(activeId) : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-[#27272A] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4E4E7] dark:border-[#3F3F46]">
          <div>
            <h2 className="text-lg font-bold text-[#18181B] dark:text-[#F4F4F5]">Organizar posição</h2>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Arraste os blocos pra definir a ordem e a coluna de cada um na impressão.</p>
          </div>
          <button onClick={onClose} className="text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5]">
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {blocos.length === 0 ? (
            <p className="text-sm text-[#A1A1AA] text-center py-8">Nenhum item selecionado pra organizar ainda — marque produtos na tela anterior primeiro.</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCorners}
              onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
              <div className="flex gap-4">
                <Coluna id="col1" titulo="Coluna 1" chaves={colunas.col1} blocosPorChave={blocosPorChave} />
                <Coluna id="col2" titulo="Coluna 2" chaves={colunas.col2} blocosPorChave={blocosPorChave} />
              </div>
              <DragOverlay>
                {blocoAtivo ? (
                  <CartaoBloco id={activeId} titulo={tituloDoBloco(blocoAtivo)} subtitulo={subtituloDoBloco(blocoAtivo)} tipo={blocoAtivo.tipo} arrastando />
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#E4E4E7] dark:border-[#3F3F46] flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-[#FF441F] text-white text-sm font-bold rounded-xl">Fechar</button>
        </div>
      </div>
    </div>
  );
};

export default OrganizarPosicaoModal;
