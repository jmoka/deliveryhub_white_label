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
exports.TagsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let TagsService = class TagsService {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    async listar(apenasAtivas = true) {
        let q = this.supabase.client.from('tags_catalogo').select('*').order('ordem').order('name');
        if (apenasAtivas)
            q = q.eq('ativo', true);
        const { data, error } = await q;
        if (error)
            throw error;
        return { tags: data ?? [] };
    }
    async criar(body) {
        const { data, error } = await this.supabase.client
            .from('tags_catalogo')
            .insert({
            name: body.name,
            slug: body.slug,
            descricao: body.descricao ?? null,
            is_auto: body.is_auto ?? false,
            ordem: body.ordem ?? 0,
            ativo: true,
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async atualizar(id, body) {
        const campos = {};
        if (body.name !== undefined)
            campos.name = body.name;
        if (body.descricao !== undefined)
            campos.descricao = body.descricao;
        if (body.ordem !== undefined)
            campos.ordem = body.ordem;
        if (body.ativo !== undefined)
            campos.ativo = body.ativo;
        const { data, error } = await this.supabase.client
            .from('tags_catalogo').update(campos).eq('id', id).select().single();
        if (error)
            throw error;
        if (!data)
            throw new common_1.NotFoundException('Tag não encontrada');
        return data;
    }
    async remover(id) {
        const { error } = await this.supabase.client.from('tags_catalogo').delete().eq('id', id);
        if (error)
            throw error;
        return { ok: true };
    }
    async getCarrosseis(restaurantId) {
        const { tags } = await this.listar(true);
        const result = [];
        for (const tag of tags) {
            let produtos = [];
            if (tag.slug === 'mais_vendidos') {
                const { data: itens } = await this.supabase.client
                    .from('order_items')
                    .select('product_id, quantity')
                    .eq('restaurant_id', restaurantId);
                const counts = {};
                for (const i of itens ?? []) {
                    counts[i.product_id] = (counts[i.product_id] ?? 0) + (i.quantity ?? 1);
                }
                const topIds = Object.entries(counts)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 12)
                    .map(([id]) => Number(id));
                if (topIds.length > 0) {
                    const { data } = await this.supabase.client
                        .from('products').select('id, name, price, preco_promo, image_url, tags, destaque, is_active')
                        .in('id', topIds).eq('is_active', true);
                    const prodMap = Object.fromEntries((data ?? []).map((p) => [p.id, p]));
                    produtos = topIds.map((id) => prodMap[id]).filter(Boolean);
                }
            }
            else {
                const { data } = await this.supabase.client
                    .from('products')
                    .select('id, name, price, preco_promo, image_url, tags, destaque, is_active, category_id')
                    .contains('tags', [tag.slug])
                    .eq('is_active', true)
                    .limit(12);
                if (data) {
                    const { data: cats } = await this.supabase.client
                        .from('categories').select('id')
                        .or(`restaurant_id.eq.${restaurantId},restaurant_id.is.null`);
                    const catIds = new Set((cats ?? []).map((c) => c.id));
                    produtos = data.filter((p) => catIds.has(p.category_id));
                }
            }
            if (produtos.length > 0)
                result.push({ tag, produtos });
        }
        return result;
    }
};
exports.TagsService = TagsService;
exports.TagsService = TagsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], TagsService);
//# sourceMappingURL=tags.service.js.map