"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestauranteService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const categorias_service_1 = require("../categorias/categorias.service");
const produtos_service_1 = require("../produtos/produtos.service");
const pedidos_service_1 = require("../pedidos/pedidos.service");
let RestauranteService = class RestauranteService {
    supabase;
    categorias;
    produtos;
    pedidos;
    constructor(supabase, categorias, produtos, pedidos) {
        this.supabase = supabase;
        this.categorias = categorias;
        this.produtos = produtos;
        this.pedidos = pedidos;
    }
    async minhaEmpresa(userId) {
        const { data, error } = await this.supabase.client
            .from('restaurants')
            .select('id, name, address, logo_url, slug, business_hours, payment_config, comissao_pct, created_at')
            .eq('user_id', userId)
            .maybeSingle();
        if (error)
            throw error;
        if (!data)
            throw new common_1.NotFoundException('Nenhum restaurante vinculado');
        const { data: pedidosData } = await this.supabase.client
            .from('orders')
            .select('id, total, status')
            .eq('restaurant_id', data.id);
        const entregues = (pedidosData ?? []).filter((p) => p.status === 'delivered');
        const pendentes = (pedidosData ?? []).filter((p) => ['pending', 'confirmed', 'ready', 'out_for_delivery'].includes(p.status));
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
    async meusPedidos(restaurantId, filtros) {
        return this.pedidos.listar({
            empresa_id: restaurantId,
            status: filtros.status,
            limite: filtros.limite ?? 50,
        });
    }
    async atualizarStatusPedido(pedidoId, restaurantId, status) {
        const { data: pedido } = await this.supabase.client
            .from('orders')
            .select('id')
            .eq('id', pedidoId)
            .eq('restaurant_id', restaurantId)
            .maybeSingle();
        if (!pedido)
            throw new common_1.NotFoundException('Pedido não encontrado neste restaurante');
        return this.pedidos.atualizarStatus(pedidoId, status);
    }
    async meusProdutos(restaurantId) {
        const { data, error } = await this.supabase.client
            .from('products')
            .select('id, name, description, price, preco_promo, image_url, is_active, category_id, tipo, destaque, created_at')
            .in('category_id', (await this.supabase.client
            .from('categories')
            .select('id')
            .eq('restaurant_id', restaurantId)
            .then((r) => (r.data ?? []).map((c) => c.id))))
            .order('destaque', { ascending: false })
            .order('name');
        if (error)
            throw error;
        return { produtos: data ?? [] };
    }
    async criarProduto(restaurantId, body) {
        const { data: cat } = await this.supabase.client
            .from('categories')
            .select('id')
            .eq('id', body.category_id)
            .eq('restaurant_id', restaurantId)
            .maybeSingle();
        if (!cat)
            throw new common_1.NotFoundException('Categoria não pertence a este restaurante');
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
        if (error)
            throw error;
        return data;
    }
    async toggleProduto(produtoId, restaurantId, ativo) {
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
            if (!cat)
                throw new common_1.NotFoundException('Produto não pertence a este restaurante');
        }
        return this.produtos.toggleAtivo(produtoId, ativo);
    }
    async minhasCategorias(restaurantId) {
        return this.categorias.listarPorEmpresa(restaurantId);
    }
    async criarCategoria(restaurantId, body) {
        return this.categorias.criar({ name: body.name, restaurant_id: restaurantId });
    }
    async listarClientes(restaurantId, filtros) {
        let query = this.supabase.client
            .from('customers')
            .select('id, name, email, phone_e164, address_json, notes, user_id, created_at')
            .eq('restaurant_id', restaurantId)
            .order('name');
        if (filtros.busca) {
            query = query.or(`name.ilike.%${filtros.busca}%,email.ilike.%${filtros.busca}%`);
        }
        if (filtros.limite)
            query = query.limit(filtros.limite);
        const { data, error } = await query;
        if (error)
            throw error;
        return { clientes: data ?? [], total: data?.length ?? 0 };
    }
    async criarCliente(restaurantId, body) {
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
        if (error)
            throw error;
        return data;
    }
    async atualizarCliente(clienteId, restaurantId, body) {
        const { data: existente } = await this.supabase.client
            .from('customers')
            .select('id')
            .eq('id', clienteId)
            .eq('restaurant_id', restaurantId)
            .maybeSingle();
        if (!existente)
            throw new common_1.NotFoundException('Cliente não encontrado neste restaurante');
        const { data, error } = await this.supabase.client
            .from('customers')
            .update({ ...body, updated_at: new Date().toISOString() })
            .eq('id', clienteId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async updateEmpresa(restaurantId, body) {
        const campos = { updated_at: new Date().toISOString() };
        if (body.name !== undefined)
            campos.name = body.name;
        if (body.address !== undefined)
            campos.address = body.address;
        if (body.logo_url !== undefined)
            campos.logo_url = body.logo_url;
        const { data, error } = await this.supabase.client
            .from('restaurants')
            .update(campos)
            .eq('id', restaurantId)
            .select('id, name, address, logo_url, slug')
            .maybeSingle();
        if (error)
            throw error;
        return data;
    }
    async getAparencia(restaurantId) {
        const { data } = await this.supabase.client
            .from('restaurants')
            .select('aparencia')
            .eq('id', restaurantId)
            .maybeSingle();
        return (data?.aparencia ?? {});
    }
    async updateAparencia(restaurantId, body) {
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
        if (error)
            throw error;
        return nova;
    }
    async getConfig(restaurantId) {
        const { data } = await this.supabase.client
            .from('restaurants')
            .select('payment_config')
            .eq('id', restaurantId)
            .maybeSingle();
        const cfg = (data?.payment_config ?? {});
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
    async updateConfig(restaurantId, body) {
        const { data: atual } = await this.supabase.client
            .from('restaurants')
            .select('payment_config')
            .eq('id', restaurantId)
            .maybeSingle();
        const cfg = (atual?.payment_config ?? {});
        const novo = { ...cfg };
        if (body.pagbank_token !== undefined && body.pagbank_token !== '') {
            novo.pagbank_token = body.pagbank_token;
        }
        if (body.pagbank_sandbox !== undefined)
            novo.pagbank_sandbox = body.pagbank_sandbox;
        if (body.pagbank_webhook_url !== undefined)
            novo.pagbank_webhook_url = body.pagbank_webhook_url;
        if (body.pagbank_seller_account_id !== undefined)
            novo.pagbank_seller_account_id = body.pagbank_seller_account_id;
        const { error } = await this.supabase.client
            .from('restaurants')
            .update({ payment_config: novo, updated_at: new Date().toISOString() })
            .eq('id', restaurantId);
        if (error)
            throw error;
        return this.getConfig(restaurantId);
    }
    async toggleStatus(restaurantId, aberto) {
        await this.updateAparencia(restaurantId, { aberto });
        return { aberto };
    }
    async getCaixa(restaurantId) {
        const { data } = await this.supabase.client
            .from('restaurants')
            .select('aparencia')
            .eq('id', restaurantId)
            .maybeSingle();
        const ap = data?.aparencia ?? {};
        const status_restaurante = ap.aberto !== false;
        const aberto = ap.caixa_aberto ?? false;
        const aberto_em = ap.caixa_aberto_em ?? null;
        const valor_inicial = ap.caixa_valor_inicial ?? 0;
        const saidas = ap.caixa_saidas ?? [];
        if (!aberto || !aberto_em) {
            return { status_restaurante, aberto: false, aberto_em: null, valor_inicial, saidas, pedidos: [], resumo: null };
        }
        const { data: ordersData } = await this.supabase.client
            .from('orders')
            .select('id, total, status, payment_method, created_at, customer_id')
            .eq('restaurant_id', restaurantId)
            .gte('created_at', aberto_em)
            .order('created_at', { ascending: false });
        const pedidos = ordersData ?? [];
        const entregues = pedidos.filter((p) => p.status === 'delivered');
        const em_andamento = pedidos.filter((p) => ['pending', 'confirmed', 'ready', 'out_for_delivery'].includes(p.status));
        const total_vendas = entregues.reduce((s, p) => s + (p.total ?? 0), 0);
        const total_saidas = saidas.reduce((s, e) => s + (e.valor ?? 0), 0);
        return {
            status_restaurante,
            aberto: true,
            aberto_em,
            valor_inicial,
            saidas,
            pedidos,
            resumo: {
                total_pedidos: pedidos.length,
                entregues: entregues.length,
                em_andamento: em_andamento.length,
                cancelados: pedidos.filter((p) => p.status === 'canceled').length,
                total_vendas,
                total_saidas,
                saldo: valor_inicial + total_vendas - total_saidas,
            },
        };
    }
    async abrirCaixa(restaurantId, valor_inicial) {
        await this.updateAparencia(restaurantId, {
            caixa_aberto: true,
            caixa_aberto_em: new Date().toISOString(),
            caixa_valor_inicial: valor_inicial,
            caixa_saidas: [],
        });
        return this.getCaixa(restaurantId);
    }
    async fecharCaixa(restaurantId) {
        const { data } = await this.supabase.client
            .from('restaurants')
            .select('aparencia')
            .eq('id', restaurantId)
            .maybeSingle();
        const ap = data?.aparencia ?? {};
        const aberto_em = ap.caixa_aberto_em ?? null;
        const saidas = ap.caixa_saidas ?? [];
        const historico = ap.caixa_historico ?? [];
        let resumo = null;
        let pedidos = [];
        if (aberto_em) {
            const { data: ordersData } = await this.supabase.client
                .from('orders')
                .select('id, total, status, payment_method, created_at')
                .eq('restaurant_id', restaurantId)
                .gte('created_at', aberto_em);
            pedidos = ordersData ?? [];
            const entregues = pedidos.filter((p) => p.status === 'delivered');
            const total_vendas = entregues.reduce((s, p) => s + (p.total ?? 0), 0);
            const total_saidas = saidas.reduce((s, e) => s + (e.valor ?? 0), 0);
            resumo = {
                total_pedidos: pedidos.length,
                entregues: entregues.length,
                em_andamento: pedidos.filter((p) => ['pending', 'confirmed', 'ready', 'out_for_delivery'].includes(p.status)).length,
                cancelados: pedidos.filter((p) => p.status === 'canceled').length,
                total_vendas,
                total_saidas,
                valor_inicial: ap.caixa_valor_inicial ?? 0,
                saldo: (ap.caixa_valor_inicial ?? 0) + total_vendas - total_saidas,
            };
        }
        const fechamento = {
            fechado_em: new Date().toISOString(),
            aberto_em,
            valor_inicial: ap.caixa_valor_inicial ?? 0,
            saidas,
            resumo,
        };
        const nova = {
            ...ap,
            caixa_aberto: false,
            caixa_aberto_em: null,
            caixa_valor_inicial: 0,
            caixa_saidas: [],
            caixa_historico: [fechamento, ...historico.slice(0, 29)],
        };
        await this.supabase.client
            .from('restaurants')
            .update({ aparencia: nova, updated_at: new Date().toISOString() })
            .eq('id', restaurantId);
        return { ...fechamento, pedidos };
    }
    async adicionarSaida(restaurantId, body) {
        const { data } = await this.supabase.client
            .from('restaurants')
            .select('aparencia')
            .eq('id', restaurantId)
            .maybeSingle();
        const saidas = (data?.aparencia?.caixa_saidas ?? []);
        const nova = { descricao: body.descricao, valor: body.valor, criado_em: new Date().toISOString() };
        await this.updateAparencia(restaurantId, { caixa_saidas: [...saidas, nova] });
        return nova;
    }
    async buscarPedidoDoRestaurante(restaurantId, pedidoId) {
        const resultado = await this.pedidos.buscar(pedidoId);
        if (resultado.pedido.restaurant_id !== restaurantId) {
            throw new common_1.NotFoundException('Pedido não encontrado neste restaurante');
        }
        if (resultado.itens.length > 0) {
            const prodIds = resultado.itens.map((i) => i.product_id);
            const { data: produtos } = await this.supabase.client
                .from('products')
                .select('id, name')
                .in('id', prodIds);
            const prodMap = Object.fromEntries((produtos ?? []).map((p) => [p.id, p.name]));
            resultado.itens = resultado.itens.map((i) => ({
                ...i,
                product_name: prodMap[i.product_id] ?? `Produto #${i.product_id}`,
            }));
        }
        return resultado;
    }
};
exports.RestauranteService = RestauranteService;
exports.RestauranteService = RestauranteService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        categorias_service_1.CategoriasService,
        produtos_service_1.ProdutosService,
        pedidos_service_1.PedidosService])
], RestauranteService);
//# sourceMappingURL=restaurante.service.js.map