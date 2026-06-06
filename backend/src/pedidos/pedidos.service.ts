import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

const STATUS_VALIDOS = ['pending', 'confirmed', 'ready', 'out_for_delivery', 'delivered', 'canceled'] as const;
type Status = typeof STATUS_VALIDOS[number];

@Injectable()
export class PedidosService {
  constructor(private supabase: SupabaseService) {}

  async listar(filtros: {
    empresa_id?: number;
    status?: string;
    user_id?: string;
    data_inicio?: string;
    data_fim?: string;
    limite?: number;
  }) {
    let query = this.supabase.client
      .from('orders')
      .select('id, total, status, payment_method, restaurant_id, customer_id, user_id, created_at')
      .order('created_at', { ascending: false })
      .limit(filtros.limite ?? 50);

    if (filtros.empresa_id) query = query.eq('restaurant_id', filtros.empresa_id);
    if (filtros.status) query = query.eq('status', filtros.status);
    if (filtros.user_id) query = query.eq('user_id', filtros.user_id);
    if (filtros.data_inicio) query = query.gte('created_at', filtros.data_inicio);
    if (filtros.data_fim) query = query.lte('created_at', filtros.data_fim + 'T23:59:59');

    const { data, error } = await query;
    if (error) throw error;
    return { pedidos: data, total: data?.length ?? 0 };
  }

  async buscar(id: number) {
    const { data: pedido, error } = await this.supabase.client
      .from('orders')
      .select('id, total, status, payment_method, restaurant_id, customer_id, user_id, created_at, updated_at')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!pedido) throw new NotFoundException(`Pedido ${id} não encontrado`);

    const [{ data: itens }, { data: cliente }, { data: empresa }] = await Promise.all([
      this.supabase.client
        .from('order_items')
        .select('id, quantity, unit_price, product_id')
        .eq('order_id', id),
      this.supabase.client
        .from('customers')
        .select('id, name, email, phone_e164, address_json')
        .eq('id', pedido.customer_id)
        .maybeSingle(),
      this.supabase.client
        .from('restaurants')
        .select('id, name, comissao_pct')
        .eq('id', pedido.restaurant_id)
        .maybeSingle(),
    ]);

    return { pedido, itens: itens ?? [], cliente, empresa };
  }

  async criar(body: {
    restaurant_id: number;
    customer_id?: number;
    payment_method: string;
    user_id: string;
    itens: { product_id: number; quantity: number }[];
  }) {
    if (!body.itens?.length) throw new BadRequestException('Pedido precisa de pelo menos 1 item');

    // Busca preços dos produtos
    const prodIds = body.itens.map((i) => i.product_id);
    const { data: produtos, error: errProd } = await this.supabase.client
      .from('products')
      .select('id, price, is_active')
      .in('id', prodIds);

    if (errProd) throw errProd;

    const prodMap = Object.fromEntries((produtos ?? []).map((p) => [p.id, p]));

    for (const item of body.itens) {
      const prod = prodMap[item.product_id];
      if (!prod) throw new BadRequestException(`Produto ${item.product_id} não encontrado`);
      if (!prod.is_active) throw new BadRequestException(`Produto ${item.product_id} inativo`);
    }

    const total = body.itens.reduce((acc, item) => {
      return acc + prodMap[item.product_id].price * item.quantity;
    }, 0);

    // Cria pedido
    const { data: pedido, error: errPedido } = await this.supabase.client
      .from('orders')
      .insert({
        restaurant_id: body.restaurant_id,
        customer_id: body.customer_id ?? null,
        payment_method: body.payment_method,
        user_id: body.user_id,
        total: parseFloat(total.toFixed(2)),
        status: 'pending',
      })
      .select()
      .single();

    if (errPedido) throw errPedido;

    // Cria itens
    const itensPrepared = body.itens.map((item) => ({
      order_id: pedido.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: prodMap[item.product_id].price,
    }));

    const { error: errItens } = await this.supabase.client
      .from('order_items')
      .insert(itensPrepared);

    if (errItens) throw errItens;

    return { pedido, itens: itensPrepared };
  }

  async atualizarStatus(id: number, status: Status) {
    if (!STATUS_VALIDOS.includes(status)) {
      throw new BadRequestException(`Status inválido: ${status}`);
    }

    const { data, error } = await this.supabase.client
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, status, total, restaurant_id, updated_at')
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundException(`Pedido ${id} não encontrado`);

    // Comissão registrada automaticamente via trigger on_order_delivered quando status = 'delivered'
    return data;
  }

  async cancelar(id: number) {
    return this.atualizarStatus(id, 'canceled');
  }
}
