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
      .select('id, name, address, logo_url, business_hours, payment_config, comissao_pct, created_at')
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
    return this.produtos.listarPorEmpresa(restaurantId);
  }

  async criarProduto(
    restaurantId: number,
    body: { name: string; description?: string; price: number; image_url?: string; category_id: number },
  ) {
    const { data: cat } = await this.supabase.client
      .from('categories')
      .select('id')
      .eq('id', body.category_id)
      .eq('restaurant_id', restaurantId)
      .maybeSingle();

    if (!cat) throw new NotFoundException('Categoria não pertence a este restaurante');

    return this.produtos.criar(body);
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
}
