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
exports.EmpresasService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let EmpresasService = class EmpresasService {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    gerarSlug(name) {
        return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim();
    }
    async listar(apenasAtivo) {
        let query = this.supabase.client
            .from('restaurants')
            .select('id, name, address, logo_url, comissao_pct, user_id, slug, bloqueado, created_at')
            .order('name');
        const { data, error } = await query;
        if (error)
            throw error;
        return { empresas: data, total: data?.length ?? 0 };
    }
    async buscar(id) {
        const { data, error } = await this.supabase.client
            .from('restaurants')
            .select('id, name, address, logo_url, business_hours, payment_config, comissao_pct, user_id, slug, created_at')
            .eq('id', id)
            .maybeSingle();
        if (error)
            throw error;
        if (!data)
            throw new common_1.NotFoundException(`Empresa ${id} não encontrada`);
        const { data: metricas } = await this.supabase.client
            .from('orders')
            .select('id, total, status')
            .eq('restaurant_id', id);
        const entregues = (metricas ?? []).filter((p) => p.status === 'delivered');
        const faturamento = entregues.reduce((acc, p) => acc + (p.total ?? 0), 0);
        return {
            empresa: data,
            metricas: {
                total_pedidos: metricas?.length ?? 0,
                pedidos_entregues: entregues.length,
                faturamento,
                comissao_acumulada: parseFloat((faturamento * (data.comissao_pct / 100)).toFixed(2)),
            },
        };
    }
    async criar(body) {
        const { data, error } = await this.supabase.client
            .from('restaurants')
            .insert({
            name: body.name,
            address: body.address ?? null,
            logo_url: body.logo_url ?? null,
            comissao_pct: body.comissao_pct ?? 5.0,
            user_id: body.user_id || null,
            slug: body.slug || this.gerarSlug(body.name),
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async atualizar(id, body) {
        const payload = { ...body, updated_at: new Date().toISOString() };
        if ('user_id' in payload && !payload.user_id)
            payload.user_id = null;
        const { data, error } = await this.supabase.client
            .from('restaurants')
            .update(payload)
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        if (!data)
            throw new common_1.NotFoundException(`Empresa ${id} não encontrada`);
        return data;
    }
    async bloquear(id, bloqueado) {
        const { data, error } = await this.supabase.client
            .from('restaurants')
            .update({ bloqueado, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select('id, name, bloqueado')
            .single();
        if (error)
            throw error;
        return data;
    }
    async remover(id) {
        const { error } = await this.supabase.client
            .from('restaurants')
            .delete()
            .eq('id', id);
        if (error)
            throw error;
        return { mensagem: `Empresa ${id} removida` };
    }
    async getConfig(id) {
        const { data } = await this.supabase.client
            .from('restaurants')
            .select('payment_config')
            .eq('id', id)
            .maybeSingle();
        const cfg = (data?.payment_config ?? {});
        return {
            pagbank_sandbox: cfg.pagbank_sandbox ?? true,
            pagbank_webhook_url: cfg.pagbank_webhook_url ?? '',
            pagbank_token_masked: cfg.pagbank_token
                ? `${'•'.repeat(8)}${String(cfg.pagbank_token).slice(-4)}`
                : null,
            configurado: !!cfg.pagbank_token,
        };
    }
    async updateConfig(id, body) {
        const { data: atual } = await this.supabase.client
            .from('restaurants')
            .select('payment_config')
            .eq('id', id)
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
        const { error } = await this.supabase.client
            .from('restaurants')
            .update({ payment_config: novo, updated_at: new Date().toISOString() })
            .eq('id', id);
        if (error)
            throw error;
        return this.getConfig(id);
    }
};
exports.EmpresasService = EmpresasService;
exports.EmpresasService = EmpresasService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], EmpresasService);
//# sourceMappingURL=empresas.service.js.map