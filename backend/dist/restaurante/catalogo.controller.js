"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const os = __importStar(require("os"));
const PRODUTO_FIELDS = 'id, name, description, price, preco_promo, image_url, category_id, restaurant_id, tags, destaque, is_active';
let CatalogoController = class CatalogoController {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    async getAcesso() {
        const nets = os.networkInterfaces();
        const todos = [];
        for (const iface of Object.values(nets)) {
            for (const net of iface ?? []) {
                if (net.family === 'IPv4' && !net.internal)
                    todos.push(net.address);
            }
        }
        const score = (ip) => {
            if (/^192\.168\./.test(ip))
                return 0;
            if (/^10\./.test(ip))
                return 1;
            if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip))
                return 99;
            return 2;
        };
        const ips = todos.sort((a, b) => score(a) - score(b));
        const { data } = await this.supabase.client
            .from('platform_settings')
            .select('config')
            .eq('id', 1)
            .maybeSingle();
        const cfg = (data?.config ?? {});
        return {
            lan_ips: ips,
            porta: 4028,
            cloudflare_domain: cfg.cloudflare_domain || null,
        };
    }
    async listarRestaurantes() {
        const { data, error } = await this.supabase.client
            .from('restaurants')
            .select('id, name, address, logo_url, slug, aparencia')
            .not('slug', 'is', null)
            .eq('bloqueado', false)
            .order('name');
        if (error)
            throw error;
        return { restaurantes: data ?? [] };
    }
    async todosOsProdutos() {
        const { data: restaurantes } = await this.supabase.client
            .from('restaurants')
            .select('id, name, logo_url, slug, aparencia')
            .not('slug', 'is', null)
            .eq('bloqueado', false);
        if (!restaurantes?.length)
            return { produtos: [] };
        const restIds = restaurantes.map((r) => r.id);
        const restMap = Object.fromEntries(restaurantes.map((r) => [r.id, r]));
        const { data: produtos, error } = await this.supabase.client
            .from('products')
            .select(PRODUTO_FIELDS)
            .eq('is_active', true)
            .in('restaurant_id', restIds)
            .order('name')
            .limit(200);
        if (error)
            throw error;
        return {
            produtos: (produtos ?? []).map((p) => ({
                ...p,
                restaurante: restMap[p.restaurant_id] ?? null,
            })).filter((p) => p.restaurante),
        };
    }
    async cardapio(slug) {
        const { data: restaurante } = await this.supabase.client
            .from('restaurants')
            .select('id, name, address, logo_url, business_hours, slug, aparencia, frete_motoboy')
            .eq('slug', slug)
            .maybeSingle();
        if (!restaurante)
            throw new common_1.NotFoundException('Restaurante não encontrado');
        const { data: categorias } = await this.supabase.client
            .from('categories')
            .select('id, name')
            .or(`restaurant_id.eq.${restaurante.id},restaurant_id.is.null`)
            .order('name');
        const { data: produtos } = await this.supabase.client
            .from('products')
            .select(PRODUTO_FIELDS)
            .eq('is_active', true)
            .eq('restaurant_id', restaurante.id)
            .order('destaque', { ascending: false })
            .order('name');
        const catSet = new Set((categorias ?? []).map((c) => c.id));
        const cardapio = (categorias ?? []).map((cat) => ({
            ...cat,
            produtos: (produtos ?? []).filter((p) => p.category_id === cat.id),
        })).filter((cat) => cat.produtos.length > 0);
        const destaques = (produtos ?? []).filter((p) => p.destaque);
        const promos = (produtos ?? []).filter((p) => Array.isArray(p.tags) && p.tags.includes('promo') && p.preco_promo != null);
        const combos = [];
        return { restaurante, cardapio, destaques, promos, combos };
    }
};
exports.CatalogoController = CatalogoController;
__decorate([
    (0, common_1.Get)('acesso'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CatalogoController.prototype, "getAcesso", null);
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