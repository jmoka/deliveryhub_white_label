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
exports.ProdutosService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let ProdutosService = class ProdutosService {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    async listarPorEmpresa(empresaId, apenasAtivos) {
        const { data: cats } = await this.supabase.client
            .from('categories')
            .select('id')
            .eq('restaurant_id', empresaId);
        const catIds = (cats ?? []).map((c) => c.id);
        if (catIds.length === 0)
            return { produtos: [], total: 0 };
        let query = this.supabase.client
            .from('products')
            .select('id, name, description, price, image_url, is_active, category_id, created_at')
            .in('category_id', catIds)
            .order('name');
        if (apenasAtivos)
            query = query.eq('is_active', true);
        const { data, error } = await query;
        if (error)
            throw error;
        return { produtos: data, total: data?.length ?? 0 };
    }
    async buscar(id) {
        const { data, error } = await this.supabase.client
            .from('products')
            .select('id, name, description, price, image_url, is_active, category_id, created_at')
            .eq('id', id)
            .maybeSingle();
        if (error)
            throw error;
        if (!data)
            throw new common_1.NotFoundException(`Produto ${id} não encontrado`);
        return data;
    }
    async criar(body) {
        const { data, error } = await this.supabase.client
            .from('products')
            .insert({
            name: body.name,
            description: body.description ?? null,
            price: body.price,
            image_url: body.image_url ?? null,
            category_id: body.category_id,
            is_active: true,
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async atualizar(id, body) {
        const { data, error } = await this.supabase.client
            .from('products')
            .update({ ...body, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        if (!data)
            throw new common_1.NotFoundException(`Produto ${id} não encontrado`);
        return data;
    }
    async toggleAtivo(id, ativo) {
        const { data, error } = await this.supabase.client
            .from('products')
            .update({ is_active: ativo, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select('id, name, is_active')
            .single();
        if (error)
            throw error;
        if (!data)
            throw new common_1.NotFoundException(`Produto ${id} não encontrado`);
        return data;
    }
    async remover(id) {
        const { error } = await this.supabase.client
            .from('products')
            .delete()
            .eq('id', id);
        if (error)
            throw error;
        return { mensagem: `Produto ${id} removido` };
    }
};
exports.ProdutosService = ProdutosService;
exports.ProdutosService = ProdutosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], ProdutosService);
//# sourceMappingURL=produtos.service.js.map