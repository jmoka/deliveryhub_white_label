import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CategoriasService } from '../categorias/categorias.service';
import { ProdutosService } from '../produtos/produtos.service';
import { PedidosService } from '../pedidos/pedidos.service';

@Injectable()
export class RestauranteService {
  constructor(
    private supabase: SupabaseService,
    private categorias: CategoriasService,
    private produtos: ProdutosService,
    private pedidos: PedidosService,
  ) {}

  async minhaEmpresa(userId: string) {
    const { data, error } = await this.supabase.client
      .from('restaurants')
      .select('id, name, address, logo_url, slug, business_hours, payment_config, comissao_pct, created_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new NotFoundException('Nenhum restaurante vinculado');

    const { data: pedidosData } = await this.supabase.client
      .from('orders')
      .select('id, total, status')
      .eq('restaurant_id', data.id);

    const entregues = (pedidosData ?? []).filter((p) => p.status === 'delivered');
    const pendentes = (pedidosData ?? []).filter((p) =>
      ['pending', 'confirmed', 'ready', 'out_for_delivery'].includes(p.status),
    );
    const faturamento = entregues.reduce((acc, p) => acc + (p.total ?? 0), 0);

    return {
      empresa: data,
      metricas: {
        total_pedidos: pedidosData?.length ?? 0,
        pedidos_pendentes: pendentes.length,
        pedidos_entregues: entregues.length,
        faturamento,
      },
    };
  }

  async meusPedidos(restaurantId: number, filtros: { status?: string; limite?: number }) {
    return this.pedidos.listar({
      empresa_id: restaurantId,
      status: filtros.status,
      limite: filtros.limite ?? 50,
    });
  }

  async atualizarStatusPedido(pedidoId: number, restaurantId: number, status: string) {
    const { data: pedido } = await this.supabase.client
      .from('orders')
      .select('id')
      .eq('id', pedidoId)
      .eq('restaurant_id', restaurantId)
      .maybeSingle();

    if (!pedido) throw new NotFoundException('Pedido não encontrado neste restaurante');

    return this.pedidos.atualizarStatus(pedidoId, status as any);
  }

  async meusProdutos(restaurantId: number) {
    const { data, error } = await this.supabase.client
      .from('products')
      .select('id, name, description, price, preco_promo, image_url, is_active, category_id, tipo, destaque, created_at')
      .in(
        'category_id',
        (await this.supabase.client
          .from('categories')
          .select('id')
          .eq('restaurant_id', restaurantId)
          .then((r) => (r.data ?? []).map((c) => c.id))),
      )
      .order('destaque', { ascending: false })
      .order('name');

    if (error) throw error;
    return { produtos: data ?? [] };
  }

  async criarProduto(
    restaurantId: number,
    body: {
      name: string; description?: string; price: number; image_url?: string;
      category_id: number; tipo?: string; preco_promo?: number; destaque?: boolean;
    },
  ) {
    const { data: cat } = await this.supabase.client
      .from('categories')
      .select('id')
      .eq('id', body.category_id)
      .eq('restaurant_id', restaurantId)
      .maybeSingle();

    if (!cat) throw new NotFoundException('Categoria não pertence a este restaurante');

    const { data, error } = await this.supabase.client
      .from('products')
      .insert({
        name: body.name,
        description: body.description ?? null,
        price: body.price,
        preco_promo: body.preco_promo ?? null,
        image_url: body.image_url ?? null,
        category_id: body.category_id,
        tipo: body.tipo ?? 'normal',
        destaque: body.destaque ?? false,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async toggleProduto(produtoId: number, restaurantId: number, ativo: boolean) {
    const { data: prod } = await this.supabase.client
      .from('products')
      .select('id, category_id')
      .eq('id', produtoId)
      .maybeSingle();

    if (prod) {
      const { data: cat } = await this.supabase.client
        .from('categories')
        .select('id')
        .eq('id', prod.category_id)
        .eq('restaurant_id', restaurantId)
        .maybeSingle();

      if (!cat) throw new NotFoundException('Produto não pertence a este restaurante');
    }

    return this.produtos.toggleAtivo(produtoId, ativo);
  }

  async minhasCategorias(restaurantId: number) {
    return this.categorias.listarPorEmpresa(restaurantId);
  }

  async criarCategoria(restaurantId: number, body: { name: string }) {
    return this.categorias.criar({ name: body.name, restaurant_id: restaurantId });
  }

  async listarClientes(restaurantId: number, filtros: { busca?: string; limite?: number }) {
    let query = this.supabase.client
      .from('customers')
      .select('id, name, email, phone_e164, address_json, notes, user_id, created_at')
      .eq('restaurant_id', restaurantId)
      .order('name');

    if (filtros.busca) {
      query = query.or(`name.ilike.%${filtros.busca}%,email.ilike.%${filtros.busca}%`);
    }

    if (filtros.limite) query = query.limit(filtros.limite);

    const { data, error } = await query;
    if (error) throw error;
    return { clientes: data ?? [], total: data?.length ?? 0 };
  }

  async criarCliente(
    restaurantId: number,
    body: { name: string; email?: string; phone_e164?: string; address_json?: object; notes?: string },
  ) {
    const { data, error } = await this.supabase.client
      .from('customers')
      .insert({
        name: body.name,
        email: body.email ?? null,
        phone_e164: body.phone_e164 ?? null,
        address_json: body.address_json ?? {},
        notes: body.notes ?? null,
        restaurant_id: restaurantId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async atualizarCliente(
    clienteId: number,
    restaurantId: number,
    body: Partial<{ name: string; email: string; phone_e164: string; address_json: object; notes: string }>,
  ) {
    const { data: existente } = await this.supabase.client
      .from('customers')
      .select('id')
      .eq('id', clienteId)
      .eq('restaurant_id', restaurantId)
      .maybeSingle();

    if (!existente) throw new NotFoundException('Cliente não encontrado neste restaurante');

    const { data, error } = await this.supabase.client
      .from('customers')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', clienteId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getAparencia(restaurantId: number) {
    const { data } = await this.supabase.client
      .from('restaurants')
      .select('aparencia')
      .eq('id', restaurantId)
      .maybeSingle();
    return (data?.aparencia ?? {}) as Record<string, any>;
  }

  async updateAparencia(restaurantId: number, body: Record<string, any>) {
    const { data: atual } = await this.supabase.client
      .from('restaurants')
      .select('aparencia')
      .eq('id', restaurantId)
      .maybeSingle();

    const nova = { ...(atual?.aparencia ?? {}), ...body };

    const { error } = await this.supabase.client
      .from('restaurants')
      .update({ aparencia: nova, updated_at: new Date().toISOString() })
      .eq('id', restaurantId);

    if (error) throw error;
    return nova;
  }

  async getConfig(restaurantId: number) {
    const { data } = await this.supabase.client
      .from('restaurants')
      .select('payment_config')
      .eq('id', restaurantId)
      .maybeSingle();

    const cfg = (data?.payment_config ?? {}) as Record<string, any>;

    return {
      pagbank_sandbox: cfg.pagbank_sandbox ?? true,
      pagbank_webhook_url: cfg.pagbank_webhook_url ?? '',
      pagbank_token_masked: cfg.pagbank_token
        ? `${'•'.repeat(8)}${String(cfg.pagbank_token).slice(-4)}`
        : null,
      pagbank_seller_account_id: cfg.pagbank_seller_account_id ?? '',
      configurado: !!cfg.pagbank_token,
      split_ativo: !!(cfg.pagbank_seller_account_id),
    };
  }

  async updateConfig(
    restaurantId: number,
    body: { pagbank_token?: string; pagbank_sandbox?: boolean; pagbank_webhook_url?: string; pagbank_seller_account_id?: string },
  ) {
    const { data: atual } = await this.supabase.client
      .from('restaurants')
      .select('payment_config')
      .eq('id', restaurantId)
      .maybeSingle();

    const cfg = (atual?.payment_config ?? {}) as Record<string, any>;

    const novo: Record<string, any> = { ...cfg };
    if (body.pagbank_token !== undefined && body.pagbank_token !== '') {
      novo.pagbank_token = body.pagbank_token;
    }
    if (body.pagbank_sandbox !== undefined) novo.pagbank_sandbox = body.pagbank_sandbox;
    if (body.pagbank_webhook_url !== undefined) novo.pagbank_webhook_url = body.pagbank_webhook_url;
    if (body.pagbank_seller_account_id !== undefined) novo.pagbank_seller_account_id = body.pagbank_seller_account_id;

    const { error } = await this.supabase.client
      .from('restaurants')
      .update({ payment_config: novo, updated_at: new Date().toISOString() })
      .eq('id', restaurantId);

    if (error) throw error;
    return this.getConfig(restaurantId);
  }
}
