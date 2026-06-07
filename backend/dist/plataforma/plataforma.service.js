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
exports.PlataformaService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let PlataformaService = class PlataformaService {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    async metricas() {
        const [{ data: empresas }, { data: pedidos }, { data: comissoes },] = await Promise.all([
            this.supabase.client.from('restaurants').select('id, name, comissao_pct'),
            this.supabase.client.from('orders').select('id, total, status, restaurant_id'),
            this.supabase.client.from('plataforma_comissoes').select('comissao_valor, empresa_id, criado_em'),
        ]);
        const entregues = (pedidos ?? []).filter((p) => p.status === 'delivered');
        const cancelados = (pedidos ?? []).filter((p) => p.status === 'canceled');
        const faturamentoTotal = entregues.reduce((acc, p) => acc + (p.total ?? 0), 0);
        const comissaoTotal = (comissoes ?? []).reduce((acc, c) => acc + (c.comissao_valor ?? 0), 0);
        const porEmpresa = {};
        for (const e of empresas ?? []) {
            porEmpresa[e.id] = { nome: e.name, faturamento: 0, comissao: 0 };
        }
        for (const p of entregues) {
            if (porEmpresa[p.restaurant_id]) {
                porEmpresa[p.restaurant_id].faturamento += p.total ?? 0;
            }
        }
        for (const c of comissoes ?? []) {
            if (porEmpresa[c.empresa_id]) {
                porEmpresa[c.empresa_id].comissao += c.comissao_valor ?? 0;
            }
        }
        const topEmpresas = Object.entries(porEmpresa)
            .map(([id, v]) => ({ empresa_id: parseInt(id), ...v }))
            .sort((a, b) => b.faturamento - a.faturamento)
            .slice(0, 5);
        return {
            resumo: {
                total_empresas: empresas?.length ?? 0,
                total_pedidos: pedidos?.length ?? 0,
                pedidos_entregues: entregues.length,
                pedidos_cancelados: cancelados.length,
                faturamento_total: parseFloat(faturamentoTotal.toFixed(2)),
                comissao_total: parseFloat(comissaoTotal.toFixed(2)),
                ticket_medio: entregues.length > 0 ? parseFloat((faturamentoTotal / entregues.length).toFixed(2)) : 0,
            },
            top_empresas: topEmpresas,
        };
    }
    async comissoes(filtros) {
        let query = this.supabase.client
            .from('plataforma_comissoes')
            .select('id, empresa_id, pedido_id, valor_venda, comissao_pct, comissao_valor, criado_em')
            .order('criado_em', { ascending: false })
            .limit(filtros.limite ?? 100);
        if (filtros.empresa_id)
            query = query.eq('empresa_id', filtros.empresa_id);
        if (filtros.data_inicio)
            query = query.gte('criado_em', filtros.data_inicio);
        if (filtros.data_fim)
            query = query.lte('criado_em', filtros.data_fim + 'T23:59:59');
        const { data, error } = await query;
        if (error)
            throw error;
        const total = (data ?? []).reduce((acc, c) => acc + (c.comissao_valor ?? 0), 0);
        return {
            comissoes: data,
            total_registros: data?.length ?? 0,
            total_comissao: parseFloat(total.toFixed(2)),
        };
    }
    async getConfig() {
        const { data } = await this.supabase.client
            .from('platform_settings')
            .select('config')
            .eq('id', 1)
            .maybeSingle();
        const cfg = (data?.config ?? {});
        return {
            pagbank_platform_account_id: cfg.pagbank_platform_account_id ?? '',
            pagbank_sandbox: cfg.pagbank_sandbox ?? true,
            pagbank_platform_token_masked: cfg.pagbank_platform_token
                ? `${'•'.repeat(8)}${String(cfg.pagbank_platform_token).slice(-4)}`
                : null,
            configurado: !!(cfg.pagbank_platform_token && cfg.pagbank_platform_account_id),
        };
    }
    async updateConfig(body) {
        const { data: atual } = await this.supabase.client
            .from('platform_settings')
            .select('config')
            .eq('id', 1)
            .maybeSingle();
        const cfg = (atual?.config ?? {});
        const novo = { ...cfg };
        if (body.pagbank_platform_token?.trim()) {
            novo.pagbank_platform_token = body.pagbank_platform_token.trim();
        }
        if (body.pagbank_platform_account_id !== undefined) {
            novo.pagbank_platform_account_id = body.pagbank_platform_account_id;
        }
        if (body.pagbank_sandbox !== undefined) {
            novo.pagbank_sandbox = body.pagbank_sandbox;
        }
        const { error } = await this.supabase.client
            .from('platform_settings')
            .update({ config: novo, updated_at: new Date().toISOString() })
            .eq('id', 1);
        if (error)
            throw error;
        return this.getConfig();
    }
    async comissoesPorEmpresa(empresaId) {
        const [{ data: empresa }, { data: comissoes }, { data: pedidos }] = await Promise.all([
            this.supabase.client
                .from('restaurants')
                .select('id, name, comissao_pct')
                .eq('id', empresaId)
                .maybeSingle(),
            this.supabase.client
                .from('plataforma_comissoes')
                .select('id, pedido_id, valor_venda, comissao_pct, comissao_valor, criado_em')
                .eq('empresa_id', empresaId)
                .order('criado_em', { ascending: false }),
            this.supabase.client
                .from('orders')
                .select('id, total, status')
                .eq('restaurant_id', empresaId),
        ]);
        const comissaoTotal = (comissoes ?? []).reduce((acc, c) => acc + (c.comissao_valor ?? 0), 0);
        const entregues = (pedidos ?? []).filter((p) => p.status === 'delivered');
        const faturamento = entregues.reduce((acc, p) => acc + (p.total ?? 0), 0);
        return {
            empresa,
            metricas: {
                total_pedidos: pedidos?.length ?? 0,
                pedidos_entregues: entregues.length,
                faturamento: parseFloat(faturamento.toFixed(2)),
                comissao_total: parseFloat(comissaoTotal.toFixed(2)),
            },
            comissoes: comissoes ?? [],
        };
    }
};
exports.PlataformaService = PlataformaService;
exports.PlataformaService = PlataformaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], PlataformaService);
//# sourceMappingURL=plataforma.service.js.map