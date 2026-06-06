import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class PlataformaService {
  constructor(private supabase: SupabaseService) {}

  async metricas() {
    const [
      { data: empresas },
      { data: pedidos },
      { data: comissoes },
    ] = await Promise.all([
      this.supabase.client.from('restaurants').select('id, name, comissao_pct'),
      this.supabase.client.from('orders').select('id, total, status, restaurant_id'),
      this.supabase.client.from('plataforma_comissoes').select('comissao_valor, empresa_id, criado_em'),
    ]);

    const entregues = (pedidos ?? []).filter((p) => p.status === 'delivered');
    const cancelados = (pedidos ?? []).filter((p) => p.status === 'canceled');
    const faturamentoTotal = entregues.reduce((acc, p) => acc + (p.total ?? 0), 0);
    const comissaoTotal = (comissoes ?? []).reduce((acc, c) => acc + (c.comissao_valor ?? 0), 0);

    // Faturamento por empresa (top 5)
    const porEmpresa: Record<number, { nome: string; faturamento: number; comissao: number }> = {};
    for (const e of empresas ?? []) {
      porEmpresa[e.id] = { nome: e.name, faturamento: 0, comissao: 0 };
    }
    for (const p of entregues) {
      if (porEmpresa[p.restaurant_id]) {
        porEmpresa[p.restaurant_id].faturamento += p.total ?? 0;
      }
    }
    for (const c of comissoes ?? []) {
      if (porEmpresa[c.empresa_id]) {
        porEmpresa[c.empresa_id].comissao += c.comissao_valor ?? 0;
      }
    }

    const topEmpresas = Object.entries(porEmpresa)
      .map(([id, v]) => ({ empresa_id: parseInt(id), ...v }))
      .sort((a, b) => b.faturamento - a.faturamento)
      .slice(0, 5);

    return {
      resumo: {
        total_empresas: empresas?.length ?? 0,
        total_pedidos: pedidos?.length ?? 0,
        pedidos_entregues: entregues.length,
        pedidos_cancelados: cancelados.length,
        faturamento_total: parseFloat(faturamentoTotal.toFixed(2)),
        comissao_total: parseFloat(comissaoTotal.toFixed(2)),
        ticket_medio: entregues.length > 0 ? parseFloat((faturamentoTotal / entregues.length).toFixed(2)) : 0,
      },
      top_empresas: topEmpresas,
    };
  }

  async comissoes(filtros: {
    empresa_id?: number;
    data_inicio?: string;
    data_fim?: string;
    limite?: number;
  }) {
    let query = this.supabase.client
      .from('plataforma_comissoes')
      .select('id, empresa_id, pedido_id, valor_venda, comissao_pct, comissao_valor, criado_em')
      .order('criado_em', { ascending: false })
      .limit(filtros.limite ?? 100);

    if (filtros.empresa_id) query = query.eq('empresa_id', filtros.empresa_id);
    if (filtros.data_inicio) query = query.gte('criado_em', filtros.data_inicio);
    if (filtros.data_fim) query = query.lte('criado_em', filtros.data_fim + 'T23:59:59');

    const { data, error } = await query;
    if (error) throw error;

    const total = (data ?? []).reduce((acc, c) => acc + (c.comissao_valor ?? 0), 0);

    return {
      comissoes: data,
      total_registros: data?.length ?? 0,
      total_comissao: parseFloat(total.toFixed(2)),
    };
  }

  async comissoesPorEmpresa(empresaId: number) {
    const [{ data: empresa }, { data: comissoes }, { data: pedidos }] = await Promise.all([
      this.supabase.client
        .from('restaurants')
        .select('id, name, comissao_pct')
        .eq('id', empresaId)
        .maybeSingle(),
      this.supabase.client
        .from('plataforma_comissoes')
        .select('id, pedido_id, valor_venda, comissao_pct, comissao_valor, criado_em')
        .eq('empresa_id', empresaId)
        .order('criado_em', { ascending: false }),
      this.supabase.client
        .from('orders')
        .select('id, total, status')
        .eq('restaurant_id', empresaId),
    ]);

    const comissaoTotal = (comissoes ?? []).reduce((acc, c) => acc + (c.comissao_valor ?? 0), 0);
    const entregues = (pedidos ?? []).filter((p) => p.status === 'delivered');
    const faturamento = entregues.reduce((acc, p) => acc + (p.total ?? 0), 0);

    return {
      empresa,
      metricas: {
        total_pedidos: pedidos?.length ?? 0,
        pedidos_entregues: entregues.length,
        faturamento: parseFloat(faturamento.toFixed(2)),
        comissao_total: parseFloat(comissaoTotal.toFixed(2)),
      },
      comissoes: comissoes ?? [],
    };
  }
}
