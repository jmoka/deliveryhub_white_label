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
exports.MotoboyService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let MotoboyService = class MotoboyService {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    async listar(restaurantId) {
        const { data, error } = await this.supabase.client
            .from('motoboys')
            .select('id, name, phone, access_token, is_active, created_at')
            .eq('restaurant_id', restaurantId)
            .order('name');
        if (error)
            throw error;
        return { motoboys: data ?? [] };
    }
    async criar(restaurantId, body) {
        const { data, error } = await this.supabase.client
            .from('motoboys')
            .insert({ restaurant_id: restaurantId, name: body.name, phone: body.phone ?? null })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async toggle(id, restaurantId, ativo) {
        const { data, error } = await this.supabase.client
            .from('motoboys')
            .update({ is_active: ativo })
            .eq('id', id)
            .eq('restaurant_id', restaurantId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async atribuir(pedidoId, restaurantId, motoboyId) {
        const { data: mb } = await this.supabase.client
            .from('motoboys')
            .select('id')
            .eq('id', motoboyId)
            .eq('restaurant_id', restaurantId)
            .maybeSingle();
        if (!mb)
            throw new common_1.NotFoundException('Motoboy não encontrado neste restaurante');
        const { error } = await this.supabase.client
            .from('orders')
            .update({ motoboy_id: motoboyId, status: 'out_for_delivery', updated_at: new Date().toISOString() })
            .eq('id', pedidoId)
            .eq('restaurant_id', restaurantId);
        if (error)
            throw error;
        return { ok: true, status: 'out_for_delivery' };
    }
    async meusPedidos(motoboyId) {
        const { data, error } = await this.supabase.client
            .from('orders')
            .select('id, total, status, payment_method, created_at, updated_at, motoboy_lat, motoboy_lng, customer_id')
            .eq('motoboy_id', motoboyId)
            .not('status', 'in', '("delivered","canceled")')
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        const pedidos = await Promise.all((data ?? []).map(async (p) => {
            if (!p.customer_id)
                return p;
            const { data: c } = await this.supabase.client
                .from('customers')
                .select('name, phone_e164, address_json')
                .eq('id', p.customer_id)
                .maybeSingle();
            return { ...p, cliente: c };
        }));
        return { pedidos };
    }
    async atualizarLocalizacao(pedidoId, motoboyId, lat, lng) {
        const { error } = await this.supabase.client
            .from('orders')
            .update({ motoboy_lat: lat, motoboy_lng: lng, motoboy_location_at: new Date().toISOString() })
            .eq('id', pedidoId)
            .eq('motoboy_id', motoboyId);
        if (error)
            throw error;
        return { ok: true };
    }
    async confirmarEntrega(pedidoId, motoboyId) {
        const { data: pedido } = await this.supabase.client
            .from('orders')
            .select('id, status')
            .eq('id', pedidoId)
            .eq('motoboy_id', motoboyId)
            .maybeSingle();
        if (!pedido)
            throw new common_1.NotFoundException('Pedido não encontrado ou não atribuído a você');
        const { error } = await this.supabase.client
            .from('orders')
            .update({ status: 'delivered', updated_at: new Date().toISOString() })
            .eq('id', pedidoId);
        if (error)
            throw error;
        return { ok: true, pedido_id: pedidoId, status: 'delivered' };
    }
    async infoMotoboy(motoboyId) {
        const { data } = await this.supabase.client
            .from('motoboys')
            .select('id, name, phone, restaurant_id')
            .eq('id', motoboyId)
            .maybeSingle();
        return data;
    }
};
exports.MotoboyService = MotoboyService;
exports.MotoboyService = MotoboyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], MotoboyService);
//# sourceMappingURL=motoboy.service.js.map