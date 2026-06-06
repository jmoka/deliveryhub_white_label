import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class EmpresasService {
  constructor(private supabase: SupabaseService) {}

  async listar(apenasAtivo?: boolean) {
    let query = this.supabase.client
      .from('restaurants')
      .select('id, name, address, logo_url, comissao_pct, user_id, created_at')
      .order('name');

    const { data, error } = await query;
    if (error) throw error;
    return { empresas: data, total: data?.length ?? 0 };
  }

  async buscar(id: number) {
    const { data, error } = await this.supabase.client
      .from('restaurants')
      .select('id, name, address, logo_url, business_hours, payment_config, comissao_pct, user_id, created_at')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new NotFoundException(`Empresa ${id} não encontrada`);

    const { data: metricas } = await this.supabase.client
      .from('orders')
      .select('id, total, status')
      .eq('restaurant_id', id);

    const entregues = (metricas ?? []).filter((p) => p.status === 'delivered');
    const faturamento = entregues.reduce((acc, p) => acc + (p.total ?? 0), 0);

    return {
      empresa: data,
      metricas: {
        total_pedidos: metricas?.length ?? 0,
        pedidos_entregues: entregues.length,
        faturamento,
        comissao_acumulada: parseFloat((faturamento * (data.comissao_pct / 100)).toFixed(2)),
      },
    };
  }

  async criar(body: {
    name: string;
    address?: string;
    logo_url?: string;
    comissao_pct?: number;
    user_id?: string;
  }) {
    const { data, error } = await this.supabase.client
      .from('restaurants')
      .insert({
        name: body.name,
        address: body.address ?? null,
        logo_url: body.logo_url ?? null,
        comissao_pct: body.comissao_pct ?? 5.0,
        user_id: body.user_id ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async atualizar(id: number, body: Partial<{
    name: string;
    address: string;
    logo_url: string;
    comissao_pct: number;
    business_hours: object;
    payment_config: object;
    user_id: string;
  }>) {
    const { data, error } = await this.supabase.client
      .from('restaurants')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundException(`Empresa ${id} não encontrada`);
    return data;
  }

  async remover(id: number) {
    const { error } = await this.supabase.client
      .from('restaurants')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { mensagem: `Empresa ${id} removida` };
  }
}
