import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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

  async editarProduto(produtoId: number, restaurantId: number, body: any) {
    const { data: prod } = await this.supabase.client
      .from('products').select('id, category_id').eq('id', produtoId).maybeSingle();
    if (!prod) throw new NotFoundException('Produto não encontrado');

    const { data: cat } = await this.supabase.client
      .from('categories').select('id').eq('id', prod.category_id).eq('restaurant_id', restaurantId).maybeSingle();
    if (!cat) throw new NotFoundException('Produto não pertence a este restaurante');

    const update: any = {};
    if (body.name !== undefined) update.name = body.name;
    if (body.description !== undefined) update.description = body.description ?? null;
    if (body.price !== undefined) update.price = body.price;
    if (body.preco_promo !== undefined) update.preco_promo = body.preco_promo ?? null;
    if (body.image_url !== undefined) update.image_url = body.image_url ?? null;
    if (body.tipo !== undefined) update.tipo = body.tipo;
    if (body.destaque !== undefined) update.destaque = body.destaque;
    if (body.category_id !== undefined) update.category_id = body.category_id;

    const { data, error } = await this.supabase.client
      .from('products').update(update).eq('id', produtoId).select().single();
    if (error) throw error;
    return data;
  }

  async deletarProduto(produtoId: number, restaurantId: number) {
    const { data: prod } = await this.supabase.client
      .from('products').select('id, category_id').eq('id', produtoId).maybeSingle();
    if (!prod) throw new NotFoundException('Produto não encontrado');

    const { data: cat } = await this.supabase.client
      .from('categories').select('id').eq('id', prod.category_id).eq('restaurant_id', restaurantId).maybeSingle();
    if (!cat) throw new NotFoundException('Produto não pertence a este restaurante');

    const { error } = await this.supabase.client.from('products').delete().eq('id', produtoId);
    if (error) throw error;
    return { ok: true };
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

  async updateEmpresa(restaurantId: number, body: { name?: string; address?: string; logo_url?: string }) {
    const campos: Record<string, any> = { updated_at: new Date().toISOString() };
    if (body.name !== undefined) campos.name = body.name;
    if (body.address !== undefined) campos.address = body.address;
    if (body.logo_url !== undefined) campos.logo_url = body.logo_url;

    const { data, error } = await this.supabase.client
      .from('restaurants')
      .update(campos)
      .eq('id', restaurantId)
      .select('id, name, address, logo_url, slug')
      .maybeSingle();

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

  async toggleStatus(restaurantId: number, aberto: boolean) {
    if (aberto) {
      const { data: caixaAberto } = await this.supabase.client
        .from('caixas').select('id').eq('restaurant_id', restaurantId).eq('status', 'aberto').maybeSingle();
      if (!caixaAberto) {
        throw new BadRequestException('Abra o caixa antes de abrir o restaurante');
      }
    }
    await this.updateAparencia(restaurantId, { aberto });
    return { aberto };
  }

  async getCozinha(restaurantId: number) {
    const { data, error } = await this.supabase.client
      .from('orders')
      .select('id, total, status, payment_method, created_at, customer_id, customers(name, phone_e164)')
      .eq('restaurant_id', restaurantId)
      .in('status', ['confirmed', 'preparing'])
      .order('created_at', { ascending: true });
    if (error) throw error;

    const pedidos = await Promise.all(
      (data ?? []).map(async (o: any) => {
        const { data: itensRaw } = await this.supabase.client
          .from('order_items')
          .select('id, quantity, unit_price, product_id')
          .eq('order_id', o.id);

        let itens: any[] = itensRaw ?? [];
        if (itens.length > 0) {
          const prodIds = itens.map((i) => i.product_id);
          const { data: prods } = await this.supabase.client
            .from('products').select('id, name').in('id', prodIds);
          const prodMap = Object.fromEntries((prods ?? []).map((p: any) => [p.id, p.name]));
          itens = itens.map((i) => ({ ...i, product_name: prodMap[i.product_id] ?? `Produto #${i.product_id}` }));
        }
        return { ...o, itens };
      }),
    );
    return { pedidos };
  }

  private readonly STATUS_ABERTOS = ['pending', 'confirmed', 'preparing', 'ready', 'motoboy_collecting', 'out_for_delivery'];

  private calcularResumo(pedidos: any[], saidas: any[], valor_inicial: number) {
    const entregues = pedidos.filter((p) => p.status === 'delivered');
    const total_vendas = entregues.reduce((s: number, p: any) => s + (p.total ?? 0), 0);
    const total_saidas = saidas.reduce((s: number, e: any) => s + (e.valor ?? 0), 0);
    return {
      total_pedidos: pedidos.length,
      entregues: entregues.length,
      em_andamento: pedidos.filter((p: any) => this.STATUS_ABERTOS.includes(p.status)).length,
      cancelados: pedidos.filter((p: any) => p.status === 'canceled').length,
      total_vendas,
      total_saidas,
      saldo: valor_inicial + total_vendas - total_saidas,
    };
  }

  async getCaixa(restaurantId: number) {
    const { data: restaurantData } = await this.supabase.client
      .from('restaurants')
      .select('aparencia, saldo_caixa')
      .eq('id', restaurantId)
      .maybeSingle();
    const status_restaurante: boolean = (restaurantData?.aparencia?.aberto) !== false;
    const saldo_caixa: number = restaurantData?.saldo_caixa ?? 0;

    // Saldo de caixas fechados que não passaram pelo fluxo de destinação
    // (criados antes da feature — o dinheiro físico ainda existe e deve ser contabilizado)
    const { data: caixasSemDestinacao } = await this.supabase.client
      .from('caixas')
      .select('resumo, destinacao_fechamento')
      .eq('restaurant_id', restaurantId)
      .eq('status', 'fechado')
      .is('destinacao_fechamento', null);

    const saldo_fechados_pendente: number = (caixasSemDestinacao ?? []).reduce((sum: number, c: any) => {
      return sum + (c.resumo?.saldo ?? 0);
    }, 0);

    const { data: caixa } = await this.supabase.client
      .from('caixas')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('status', 'aberto')
      .maybeSingle();

    if (!caixa) {
      const { data: expirado } = await this.supabase.client
        .from('caixas').select('*').eq('restaurant_id', restaurantId).eq('status', 'expirado').maybeSingle();
      return { status_restaurante, aberto: false, expirado: !!expirado, caixa_expirado: expirado ?? null, pedidos: [], resumo: null, saldo_caixa, saldo_fechados_pendente };
    }

    // Auto-expirar após 8h
    const aberto_em = new Date(caixa.aberto_em);
    const oitoHoras = 8 * 60 * 60 * 1000;
    if (Date.now() - aberto_em.getTime() > oitoHoras) {
      await this.supabase.client.from('caixas').update({ status: 'expirado' }).eq('id', caixa.id);
      return { status_restaurante, aberto: false, expirado: true, caixa_expirado: { ...caixa, status: 'expirado' }, pedidos: [], resumo: null, saldo_caixa, saldo_fechados_pendente };
    }

    const { data: ordersData } = await this.supabase.client
      .from('orders')
      .select('id, total, status, payment_method, created_at, updated_at, customer_id, motoboy_id, caixa_id, customers(name, phone_e164), motoboys(name)')
      .eq('restaurant_id', restaurantId)
      .or(`caixa_id.eq.${caixa.id},and(caixa_id.is.null,created_at.gte.${caixa.aberto_em})`)
      .order('created_at', { ascending: false });

    const pedidos = ordersData ?? [];
    const saidas = (caixa.saidas ?? []) as any[];
    const resumo = this.calcularResumo(pedidos, saidas, caixa.valor_inicial);

    return {
      status_restaurante,
      aberto: true,
      expirado: false,
      id: caixa.id,
      nome_operador: caixa.nome_operador,
      aberto_em: caixa.aberto_em,
      valor_inicial: caixa.valor_inicial,
      saidas,
      pedidos,
      resumo,
      saldo_caixa,
      saldo_fechados_pendente,
    };
  }

  async abrirCaixa(restaurantId: number, body: { nome_operador: string; valor_inicial?: number }) {
    if (!body.nome_operador?.trim()) throw new BadRequestException('Nome do operador é obrigatório');

    const { data: existente } = await this.supabase.client
      .from('caixas').select('id, status').eq('restaurant_id', restaurantId)
      .in('status', ['aberto', 'expirado']).maybeSingle();

    if (existente?.status === 'aberto') throw new ConflictException('Já existe um caixa aberto');
    if (existente?.status === 'expirado') throw new ConflictException('Existe um caixa expirado. Feche-o antes de abrir outro');

    // Usar saldo_caixa como valor_inicial padrão se não informado
    const { data: restaurant } = await this.supabase.client
      .from('restaurants').select('saldo_caixa').eq('id', restaurantId).maybeSingle();
    const saldoCaixaAtual = restaurant?.saldo_caixa ?? 0;
    const valorInicial = body.valor_inicial !== undefined ? body.valor_inicial : saldoCaixaAtual;

    const { data: novo, error } = await this.supabase.client
      .from('caixas')
      .insert({ restaurant_id: restaurantId, nome_operador: body.nome_operador.trim(), valor_inicial: valorInicial })
      .select('*')
      .single();

    if (error) throw error;

    // Zerar saldo_caixa — o valor agora está dentro do caixa aberto
    await this.supabase.client.from('restaurants')
      .update({ saldo_caixa: 0 }).eq('id', restaurantId);

    return this.getCaixa(restaurantId);
  }

  async fecharCaixa(restaurantId: number, body?: { banco?: number; retirada?: number; permanece?: number }) {
    const { data: caixa } = await this.supabase.client
      .from('caixas').select('*').eq('restaurant_id', restaurantId)
      .in('status', ['aberto', 'expirado']).maybeSingle();

    if (!caixa) throw new NotFoundException('Nenhum caixa aberto');

    const { data: pedidosAbertos } = await this.supabase.client
      .from('orders').select('id, status, total')
      .eq('caixa_id', caixa.id)
      .in('status', this.STATUS_ABERTOS);

    if ((pedidosAbertos ?? []).length > 0) {
      throw new ConflictException({
        message: 'Existem pedidos em aberto neste caixa',
        pedidos_abertos: pedidosAbertos!.length,
        pedidos: pedidosAbertos,
      });
    }

    const { data: todosPedidos } = await this.supabase.client
      .from('orders').select('id, total, status, payment_method, created_at')
      .or(`caixa_id.eq.${caixa.id},and(caixa_id.is.null,created_at.gte.${caixa.aberto_em})`);

    const saidas = (caixa.saidas ?? []) as any[];
    const resumo = this.calcularResumo(todosPedidos ?? [], saidas, caixa.valor_inicial);
    const fechado_em = new Date().toISOString();

    // Destinação do saldo: banco + retirada + permanece
    const saldo = resumo.saldo;
    const banco = body?.banco ?? 0;
    const retirada = body?.retirada ?? 0;
    const permanece = body?.permanece ?? Math.max(0, saldo - banco - retirada);
    const destinacao_fechamento = { banco, retirada, permanece, saldo };

    await this.supabase.client.from('caixas')
      .update({ status: 'fechado', fechado_em, resumo, destinacao_fechamento })
      .eq('id', caixa.id);

    // Atualizar saldo físico em caixa (para pré-preencher próxima abertura)
    await this.supabase.client.from('restaurants')
      .update({ saldo_caixa: permanece }).eq('id', restaurantId);

    return { fechamento: { id: caixa.id, aberto_em: caixa.aberto_em, fechado_em, nome_operador: caixa.nome_operador, valor_inicial: caixa.valor_inicial, saidas, resumo, destinacao_fechamento } };
  }

  async fecharComTransferencia(restaurantId: number, body: { nome_operador: string; valor_inicial?: number }) {
    if (!body.nome_operador?.trim()) throw new BadRequestException('Nome do operador do novo caixa é obrigatório');

    const { data: caixa } = await this.supabase.client
      .from('caixas').select('*').eq('restaurant_id', restaurantId)
      .in('status', ['aberto', 'expirado']).maybeSingle();

    if (!caixa) throw new NotFoundException('Nenhum caixa aberto para fechar');

    // Fechar caixa atual (com resumo)
    const { data: todosPedidos } = await this.supabase.client
      .from('orders').select('id, total, status, payment_method, created_at')
      .or(`caixa_id.eq.${caixa.id},and(caixa_id.is.null,created_at.gte.${caixa.aberto_em})`);

    const saidas = (caixa.saidas ?? []) as any[];
    const resumo = this.calcularResumo(todosPedidos ?? [], saidas, caixa.valor_inicial);
    const fechado_em = new Date().toISOString();
    await this.supabase.client.from('caixas')
      .update({ status: 'fechado', fechado_em, resumo }).eq('id', caixa.id);

    // Abrir novo caixa
    const { data: novoCaixa, error } = await this.supabase.client
      .from('caixas')
      .insert({ restaurant_id: restaurantId, nome_operador: body.nome_operador.trim(), valor_inicial: body.valor_inicial ?? 0 })
      .select('*').single();
    if (error) throw error;

    // Transferir pedidos abertos para o novo caixa
    await this.supabase.client
      .from('orders')
      .update({ caixa_id: novoCaixa.id })
      .eq('restaurant_id', restaurantId)
      .in('status', this.STATUS_ABERTOS)
      .eq('caixa_id', caixa.id);

    return {
      fechamento: { id: caixa.id, aberto_em: caixa.aberto_em, fechado_em, nome_operador: caixa.nome_operador, resumo },
      novo_caixa: novoCaixa,
    };
  }

  async getCaixaHistorico(restaurantId: number) {
    const { data, error } = await this.supabase.client
      .from('caixas')
      .select('id, nome_operador, valor_inicial, status, aberto_em, fechado_em, resumo')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return { historico: data ?? [] };
  }

  async getCaixaDetalhe(restaurantId: number, caixaId: number) {
    const { data: caixa, error } = await this.supabase.client
      .from('caixas').select('*').eq('id', caixaId).eq('restaurant_id', restaurantId).maybeSingle();
    if (error) throw error;
    if (!caixa) throw new NotFoundException('Caixa não encontrado');

    const { data: pedidos } = await this.supabase.client
      .from('orders')
      .select('id, total, status, payment_method, created_at, customers(name)')
      .or(`caixa_id.eq.${caixa.id},and(caixa_id.is.null,created_at.gte.${caixa.aberto_em})`)
      .order('created_at', { ascending: false });

    return { caixa, pedidos: pedidos ?? [] };
  }

  async adicionarSaida(restaurantId: number, body: { descricao: string; valor: number; meio?: string }) {
    const { data: caixa } = await this.supabase.client
      .from('caixas').select('id, saidas').eq('restaurant_id', restaurantId).eq('status', 'aberto').maybeSingle();
    if (!caixa) throw new NotFoundException('Nenhum caixa aberto');

    const saidas = (caixa.saidas ?? []) as any[];
    const nova: any = { descricao: body.descricao, valor: body.valor, criado_em: new Date().toISOString() };
    if (body.meio) nova.meio = body.meio;
    await this.supabase.client.from('caixas').update({ saidas: [...saidas, nova] }).eq('id', caixa.id);
    return nova;
  }

  async uploadImage(folder: string, file: Express.Multer.File) {
    const BUCKET = 'restaurante-imagens';
    await this.setupStorage();

    const ext = (file.originalname.split('.').pop() ?? 'jpg').toLowerCase();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error } = await this.supabase.client.storage
      .from(BUCKET)
      .upload(path, file.buffer, { cacheControl: '3600', upsert: false, contentType: file.mimetype });

    if (error) throw error;

    const { data } = this.supabase.client.storage.from(BUCKET).getPublicUrl(path);
    return { url: data.publicUrl };
  }

  async setupStorage() {
    const BUCKET = 'restaurante-imagens';
    const { data: buckets } = await this.supabase.client.storage.listBuckets();
    const exists = (buckets ?? []).some((b: any) => b.id === BUCKET);

    if (!exists) {
      const { error } = await this.supabase.client.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024,
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
      });
      if (error) throw error;
    }
    return { ok: true, bucket: BUCKET, criado: !exists };
  }

  async getRelatorio(restaurantId: number, de: string, ate: string) {
    const { data: orders, error } = await this.supabase.client
      .from('orders')
      .select('id, total, status, payment_method, created_at, customer_id, customers(name)')
      .eq('restaurant_id', restaurantId)
      .gte('created_at', de)
      .lte('created_at', ate)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const orderIds = (orders ?? []).map((o: any) => o.id);

    if (orderIds.length === 0) {
      const { data: caixasVazio } = await this.supabase.client
        .from('caixas').select('id, saidas').eq('restaurant_id', restaurantId)
        .lte('aberto_em', ate).or(`fechado_em.is.null,fechado_em.gte.${de}`);
      const deD = new Date(de); const ateD = new Date(ate);
      const saidasVazio: any[] = [];
      for (const c of (caixasVazio ?? [])) {
        for (const s of (c.saidas ?? [])) {
          const d = new Date(s.criado_em);
          if (d >= deD && d <= ateD) saidasVazio.push(s);
        }
      }
      const totalSaidasVazio = saidasVazio.reduce((sum, s) => sum + (s.valor ?? 0), 0);
      return {
        pedidos: [],
        saidas: saidasVazio,
        resumo: { total_pedidos: 0, entregues: 0, cancelados: 0, em_andamento: 0, total_vendas: 0, ticket_medio: 0, por_pagamento: {}, total_saidas: totalSaidasVazio, saldo_liquido: -totalSaidasVazio },
      };
    }

    const { data: allItems } = await this.supabase.client
      .from('order_items')
      .select('id, order_id, product_id, quantity, unit_price')
      .in('order_id', orderIds);

    const productIds = [...new Set<number>((allItems ?? []).map((i: any) => i.product_id))];
    const { data: allProds } = productIds.length > 0
      ? await this.supabase.client.from('products').select('id, name').in('id', productIds)
      : { data: [] };

    const prodMap = Object.fromEntries((allProds ?? []).map((p: any) => [p.id, p.name]));
    const itemsByOrder = (allItems ?? []).reduce((acc: any, item: any) => {
      if (!acc[item.order_id]) acc[item.order_id] = [];
      acc[item.order_id].push({ ...item, product_name: prodMap[item.product_id] ?? `#${item.product_id}` });
      return acc;
    }, {});

    const pedidos = (orders ?? []).map((o: any) => ({ ...o, itens: itemsByOrder[o.id] ?? [] }));

    const entregues = pedidos.filter((p: any) => p.status === 'delivered');
    const cancelados = pedidos.filter((p: any) => p.status === 'canceled');
    const em_andamento = pedidos.filter((p: any) => !['canceled', 'delivered'].includes(p.status));
    const nao_cancelados = pedidos.filter((p: any) => p.status !== 'canceled');
    const total_vendas = entregues.reduce((s: number, p: any) => s + (p.total ?? 0), 0);
    const por_pagamento = nao_cancelados.reduce((acc: any, p: any) => {
      const m = p.payment_method ?? 'unknown';
      if (!acc[m]) acc[m] = { count: 0, total: 0 };
      acc[m].count++;
      acc[m].total += p.total ?? 0;
      return acc;
    }, {} as Record<string, { count: number; total: number }>);

    // Saídas de caixas que se sobrepõem ao período
    const { data: caixasPeriodo } = await this.supabase.client
      .from('caixas')
      .select('id, saidas')
      .eq('restaurant_id', restaurantId)
      .lte('aberto_em', ate)
      .or(`fechado_em.is.null,fechado_em.gte.${de}`);

    const deDate = new Date(de);
    const ateDate = new Date(ate);
    const saidas: any[] = [];
    for (const c of (caixasPeriodo ?? [])) {
      for (const s of (c.saidas ?? [])) {
        const d = new Date(s.criado_em);
        if (d >= deDate && d <= ateDate) saidas.push(s);
      }
    }
    const total_saidas = saidas.reduce((sum, s) => sum + (s.valor ?? 0), 0);

    return {
      pedidos,
      saidas,
      resumo: {
        total_pedidos: pedidos.length,
        entregues: entregues.length,
        cancelados: cancelados.length,
        em_andamento: em_andamento.length,
        total_vendas,
        ticket_medio: entregues.length > 0 ? total_vendas / entregues.length : 0,
        por_pagamento,
        total_saidas,
        saldo_liquido: total_vendas - total_saidas,
      },
    };
  }

  async buscarPedidoDoRestaurante(restaurantId: number, pedidoId: number) {
    const resultado = await this.pedidos.buscar(pedidoId);
    if (resultado.pedido.restaurant_id !== restaurantId) {
      throw new NotFoundException('Pedido não encontrado neste restaurante');
    }

    if (resultado.itens.length > 0) {
      const prodIds = resultado.itens.map((i: any) => i.product_id);
      const { data: produtos } = await this.supabase.client
        .from('products')
        .select('id, name')
        .in('id', prodIds);
      const prodMap = Object.fromEntries((produtos ?? []).map((p: any) => [p.id, p.name]));
      resultado.itens = resultado.itens.map((i: any) => ({
        ...i,
        product_name: prodMap[i.product_id] ?? `Produto #${i.product_id}`,
      }));
    }

    return resultado;
  }
}
