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
exports.PedidosService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const STATUS_VALIDOS = ['pending', 'confirmed', 'ready', 'out_for_delivery', 'delivered', 'canceled'];
let PedidosService = class PedidosService {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    async listar(filtros) {
        let query = this.supabase.client
            .from('orders')
            .select('id, total, status, payment_method, restaurant_id, customer_id, user_id, created_at')
            .order('created_at', { ascending: false })
            .limit(filtros.limite ?? 50);
        if (filtros.empresa_id)
            query = query.eq('restaurant_id', filtros.empresa_id);
        if (filtros.status)
            query = query.eq('status', filtros.status);
        if (filtros.user_id)
            query = query.eq('user_id', filtros.user_id);
        if (filtros.data_inicio)
            query = query.gte('created_at', filtros.data_inicio);
        if (filtros.data_fim)
            query = query.lte('created_at', filtros.data_fim + 'T23:59:59');
        const { data, error } = await query;
        if (error)
            throw error;
        return { pedidos: data, total: data?.length ?? 0 };
    }
    async buscar(id) {
        const { data: pedido, error } = await this.supabase.client
            .from('orders')
            .select('id, total, status, payment_method, restaurant_id, customer_id, user_id, motoboy_id, motoboy_lat, motoboy_lng, motoboy_location_at, delivery_notes, delivery_occurrence, created_at, updated_at')
            .eq('id', id)
            .maybeSingle();
        if (error)
            throw error;
        if (!pedido)
            throw new common_1.NotFoundException(`Pedido ${id} não encontrado`);
        const [{ data: itens }, { data: cliente }, { data: empresa }] = await Promise.all([
            this.supabase.client
                .from('order_items')
                .select('id, quantity, unit_price, product_id')
                .eq('order_id', id),
            this.supabase.client
                .from('customers')
                .select('id, name, email, phone_e164, address_json')
                .eq('id', pedido.customer_id)
                .maybeSingle(),
            this.supabase.client
                .from('restaurants')
                .select('id, name, comissao_pct')
                .eq('id', pedido.restaurant_id)
                .maybeSingle(),
        ]);
        return { pedido, itens: itens ?? [], cliente, empresa };
    }
    async criar(body) {
        if (!body.itens?.length)
            throw new common_1.BadRequestException('Pedido precisa de pelo menos 1 item');
        const prodIds = body.itens.map((i) => i.product_id);
        const { data: produtos, error: errProd } = await this.supabase.client
            .from('products')
            .select('id, price, is_active')
            .in('id', prodIds);
        if (errProd)
            throw errProd;
        const prodMap = Object.fromEntries((produtos ?? []).map((p) => [p.id, p]));
        for (const item of body.itens) {
            const prod = prodMap[item.product_id];
            if (!prod)
                throw new common_1.BadRequestException(`Produto ${item.product_id} não encontrado`);
            if (!prod.is_active)
                throw new common_1.BadRequestException(`Produto ${item.product_id} inativo`);
        }
        const total = body.itens.reduce((acc, item) => {
            return acc + prodMap[item.product_id].price * item.quantity;
        }, 0);
        let customerId = body.customer_id ?? null;
        if (!customerId && body.user_id) {
            const { data: c } = await this.supabase.client
                .from('customers')
                .select('id')
                .eq('user_id', body.user_id)
                .maybeSingle();
            if (c)
                customerId = c.id;
        }
        const { data: pedido, error: errPedido } = await this.supabase.client
            .from('orders')
            .insert({
            restaurant_id: body.restaurant_id,
            customer_id: customerId,
            payment_method: body.payment_method,
            user_id: body.user_id,
            total: parseFloat(total.toFixed(2)),
            status: 'pending',
        })
            .select()
            .single();
        if (errPedido)
            throw errPedido;
        const itensPrepared = body.itens.map((item) => ({
            order_id: pedido.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: prodMap[item.product_id].price,
        }));
        const { error: errItens } = await this.supabase.client
            .from('order_items')
            .insert(itensPrepared);
        if (errItens)
            throw errItens;
        return { pedido, itens: itensPrepared };
    }
    async atualizarStatus(id, status) {
        if (!STATUS_VALIDOS.includes(status)) {
            throw new common_1.BadRequestException(`Status inválido: ${status}`);
        }
        const { data, error } = await this.supabase.client
            .from('orders')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select('id, status, total, restaurant_id, updated_at')
            .single();
        if (error)
            throw error;
        if (!data)
            throw new common_1.NotFoundException(`Pedido ${id} não encontrado`);
        return data;
    }
    async cancelar(id) {
        return this.atualizarStatus(id, 'canceled');
    }
};
exports.PedidosService = PedidosService;
exports.PedidosService = PedidosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], PedidosService);
//# sourceMappingURL=pedidos.service.js.map