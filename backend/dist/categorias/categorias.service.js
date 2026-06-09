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
exports.CategoriasService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let CategoriasService = class CategoriasService {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    async listarGlobais() {
        const { data, error } = await this.supabase.client
            .from('categories')
            .select('id, name, icon_name, color_primary, color_secondary, created_at')
            .is('restaurant_id', null)
            .order('name');
        if (error)
            throw error;
        const catIds = (data ?? []).map((c) => c.id);
        let prodCount = {};
        if (catIds.length > 0) {
            const { data: prods } = await this.supabase.client
                .from('products')
                .select('category_id')
                .in('category_id', catIds);
            for (const p of prods ?? []) {
                prodCount[p.category_id] = (prodCount[p.category_id] ?? 0) + 1;
            }
        }
        return {
            categorias: (data ?? []).map((c) => ({ ...c, total_produtos: prodCount[c.id] ?? 0 })),
            total: data?.length ?? 0,
        };
    }
    async listarPorEmpresa(empresaId) {
        const { data, error } = await this.supabase.client
            .from('categories')
            .select('id, name, icon_name, color_primary, color_secondary, restaurant_id, created_at')
            .eq('restaurant_id', empresaId)
            .order('name');
        if (error)
            throw error;
        const catIds = (data ?? []).map((c) => c.id);
        let prodCount = {};
        if (catIds.length > 0) {
            const { data: prods } = await this.supabase.client
                .from('products')
                .select('category_id')
                .in('category_id', catIds);
            for (const p of prods ?? []) {
                prodCount[p.category_id] = (prodCount[p.category_id] ?? 0) + 1;
            }
        }
        return {
            categorias: (data ?? []).map((c) => ({ ...c, total_produtos: prodCount[c.id] ?? 0 })),
            total: data?.length ?? 0,
        };
    }
    async criarGlobal(body) {
        const { data, error } = await this.supabase.client
            .from('categories')
            .insert({
            name: body.name,
            icon_name: body.icon_name,
            color_primary: body.color_primary,
            color_secondary: body.color_secondary,
            restaurant_id: null,
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async criar(body) {
        const { data, error } = await this.supabase.client
            .from('categories')
            .insert({ name: body.name, restaurant_id: body.restaurant_id })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async atualizarGlobal(id, body) {
        const campos = { updated_at: new Date().toISOString() };
        if (body.name !== undefined)
            campos.name = body.name;
        if (body.icon_name !== undefined)
            campos.icon_name = body.icon_name;
        if (body.color_primary !== undefined)
            campos.color_primary = body.color_primary;
        if (body.color_secondary !== undefined)
            campos.color_secondary = body.color_secondary;
        const { data, error } = await this.supabase.client
            .from('categories')
            .update(campos)
            .eq('id', id)
            .is('restaurant_id', null)
            .select()
            .single();
        if (error)
            throw error;
        if (!data)
            throw new common_1.NotFoundException(`Categoria ${id} não encontrada`);
        return data;
    }
    async atualizar(id, body) {
        const { data, error } = await this.supabase.client
            .from('categories')
            .update({ name: body.name, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        if (!data)
            throw new common_1.NotFoundException(`Categoria ${id} não encontrada`);
        return data;
    }
    async remover(id) {
        const { error } = await this.supabase.client
            .from('categories')
            .delete()
            .eq('id', id);
        if (error)
            throw error;
        return { mensagem: `Categoria ${id} removida` };
    }
};
exports.CategoriasService = CategoriasService;
exports.CategoriasService = CategoriasService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], CategoriasService);
//# sourceMappingURL=categorias.service.js.map