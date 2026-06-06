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
            .select('id, name, address, logo_url, business_hours, payment_config, comissao_pct, created_at')
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
        return this.produtos.listarPorEmpresa(restaurantId);
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
        return this.produtos.criar(body);
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