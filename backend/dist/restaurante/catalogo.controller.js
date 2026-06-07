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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogoController = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let CatalogoController = class CatalogoController {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    async listarRestaurantes() {
        const { data, error } = await this.supabase.client
            .from('restaurants')
            .select('id, name, address, logo_url, slug')
            .not('slug', 'is', null)
            .order('name');
        if (error)
            throw error;
        return { restaurantes: data ?? [] };
    }
    async todosOsProdutos() {
        const { data: restaurantes } = await this.supabase.client
            .from('restaurants')
            .select('id, name, logo_url, slug')
            .not('slug', 'is', null);
        if (!restaurantes?.length)
            return { produtos: [] };
        const restIds = restaurantes.map((r) => r.id);
        const { data: categorias } = await this.supabase.client
            .from('categories')
            .select('id, restaurant_id')
            .in('restaurant_id', restIds);
        const catIds = (categorias ?? []).map((c) => c.id);
        if (!catIds.length)
            return { produtos: [] };
        const { data: produtos, error } = await this.supabase.client
            .from('products')
            .select('id, name, description, price, preco_promo, image_url, category_id, tipo, destaque')
            .eq('is_active', true)
            .in('category_id', catIds)
            .order('name')
            .limit(200);
        if (error)
            throw error;
        const catToRest = Object.fromEntries((categorias ?? []).map((c) => [c.id, c.restaurant_id]));
        const restMap = Object.fromEntries(restaurantes.map((r) => [r.id, r]));
        const resultado = (produtos ?? []).map((p) => ({
            ...p,
            restaurante: restMap[catToRest[p.category_id]] ?? null,
        })).filter((p) => p.restaurante);
        return { produtos: resultado };
    }
    async cardapio(slug) {
        const { data: restaurante } = await this.supabase.client
            .from('restaurants')
            .select('id, name, address, logo_url, business_hours, slug, aparencia')
            .eq('slug', slug)
            .maybeSingle();
        if (!restaurante)
            throw new common_1.NotFoundException('Restaurante não encontrado');
        const { data: categorias } = await this.supabase.client
            .from('categories')
            .select('id, name')
            .eq('restaurant_id', restaurante.id)
            .order('name');
        const { data: produtos } = await this.supabase.client
            .from('products')
            .select('id, name, description, price, preco_promo, image_url, category_id, tipo, destaque')
            .eq('is_active', true)
            .in('category_id', (categorias ?? []).map((c) => c.id))
            .order('destaque', { ascending: false })
            .order('name');
        const cardapio = (categorias ?? []).map((cat) => ({
            ...cat,
            produtos: (produtos ?? []).filter((p) => p.category_id === cat.id && p.tipo === 'normal'),
        })).filter((cat) => cat.produtos.length > 0);
        const destaques = (produtos ?? []).filter((p) => p.destaque);
        const promos = (produtos ?? []).filter((p) => p.tipo === 'promo');
        const combos = (produtos ?? []).filter((p) => p.tipo === 'combo');
        return { restaurante, cardapio, destaques, promos, combos };
    }
};
exports.CatalogoController = CatalogoController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CatalogoController.prototype, "listarRestaurantes", null);
__decorate([
    (0, common_1.Get)('produtos'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CatalogoController.prototype, "todosOsProdutos", null);
__decorate([
    (0, common_1.Get)(':slug'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CatalogoController.prototype, "cardapio", null);
exports.CatalogoController = CatalogoController = __decorate([
    (0, common_1.Controller)('r'),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], CatalogoController);
//# sourceMappingURL=catalogo.controller.js.map