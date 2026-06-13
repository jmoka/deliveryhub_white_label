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
            .select('id, total, troco_para, status, payment_method, created_at, updated_at, motoboy_lat, motoboy_lng, customer_id, delivery_notes, delivery_occurrence')
            .eq('motoboy_id', motoboyId)
            .not('status', 'in', '("delivered","canceled")')
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        const pedidos = await Promise.all((data ?? []).map(async (p) => {
            const [{ data: c }, { data: itensRaw }] = await Promise.all([
                p.customer_id
                    ? this.supabase.client
                        .from('customers')
                        .select('name, phone_e164, address_json')
                        .eq('id', p.customer_id)
                        .maybeSingle()
                    : Promise.resolve({ data: null }),
                this.supabase.client
                    .from('order_items')
                    .select('id, quantity, unit_price, product_id')
                    .eq('order_id', p.id),
            ]);
            let itens = itensRaw ?? [];
            if (itens.length > 0) {
                const prodIds = itens.map((i) => i.product_id);
                const { data: prods } = await this.supabase.client
                    .from('products')
                    .select('id, name')
                    .in('id', prodIds);
                const prodMap = Object.fromEntries((prods ?? []).map((pr) => [pr.id, pr.name]));
                itens = itens.map((i) => ({ ...i, product_name: prodMap[i.product_id] ?? `Produto #${i.product_id}` }));
            }
            return { ...p, cliente: c, itens };
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
    async confirmarEntrega(pedidoId, motoboyId, entregaPagamento) {
        const { data: pedido } = await this.supabase.client
            .from('orders')
            .select('id, status, restaurant_id, total')
            .eq('id', pedidoId)
            .eq('motoboy_id', motoboyId)
            .maybeSingle();
        if (!pedido)
            throw new common_1.NotFoundException('Pedido não encontrado ou não atribuído a você');
        const updatePayload = { status: 'delivered', updated_at: new Date().toISOString() };
        if (entregaPagamento)
            updatePayload.entrega_pagamento = entregaPagamento;
        const { error } = await this.supabase.client
            .from('orders')
            .update(updatePayload)
            .eq('id', pedidoId);
        if (error)
            throw error;
        if (entregaPagamento && pedido.restaurant_id) {
            const { data: caixa } = await this.supabase.client
                .from('caixas')
                .select('id, entradas')
                .eq('restaurant_id', pedido.restaurant_id)
                .eq('status', 'aberto')
                .maybeSingle();
            if (caixa) {
                const entradas = (caixa.entradas ?? []);
                const novas = [];
                const agora = new Date().toISOString();
                if ((entregaPagamento.dinheiro ?? 0) > 0) {
                    novas.push({
                        descricao: `Entrega pedido #${pedidoId} — dinheiro`,
                        valor: entregaPagamento.dinheiro,
                        meio: 'dinheiro',
                        criado_em: agora,
                    });
                }
                if ((entregaPagamento.pix ?? 0) > 0) {
                    novas.push({
                        descricao: `Entrega pedido #${pedidoId} — PIX`,
                        valor: entregaPagamento.pix,
                        meio: 'pix',
                        criado_em: agora,
                    });
                }
                if (novas.length > 0) {
                    await this.supabase.client
                        .from('caixas')
                        .update({ entradas: [...entradas, ...novas] })
                        .eq('id', caixa.id);
                }
            }
        }
        return { ok: true, pedido_id: pedidoId, status: 'delivered' };
    }
    async registrarOcorrencia(pedidoId, motoboyId, tipo, motivo) {
        const { data: pedido } = await this.supabase.client
            .from('orders')
            .select('id, status')
            .eq('id', pedidoId)
            .eq('motoboy_id', motoboyId)
            .maybeSingle();
        if (!pedido)
            throw new common_1.NotFoundException('Pedido não encontrado ou não atribuído a você');
        const update = {
            delivery_notes: motivo.trim(),
            delivery_occurrence: tipo,
            updated_at: new Date().toISOString(),
        };
        if (tipo === 'cancelada')
            update.status = 'canceled';
        const { error } = await this.supabase.client
            .from('orders')
            .update(update)
            .eq('id', pedidoId);
        if (error)
            throw error;
        return { ok: true, pedido_id: pedidoId, tipo, status: update.status ?? pedido.status };
    }
    async pedidosDisponiveis(motoboyId) {
        const mb = await this.infoMotoboy(motoboyId);
        if (!mb)
            throw new common_1.NotFoundException('Motoboy não encontrado');
        const { data, error } = await this.supabase.client
            .from('orders')
            .select('id, total, status, payment_method, created_at, customer_id')
            .eq('restaurant_id', mb.restaurant_id)
            .eq('status', 'ready')
            .is('motoboy_id', null)
            .order('created_at', { ascending: true });
        if (error)
            throw error;
        const pedidos = await Promise.all((data ?? []).map(async (p) => {
            const { data: c } = p.customer_id
                ? await this.supabase.client
                    .from('customers')
                    .select('name, phone_e164, address_json')
                    .eq('id', p.customer_id)
                    .maybeSingle()
                : { data: null };
            const { data: itensRaw } = await this.supabase.client
                .from('order_items')
                .select('id, quantity, unit_price, product_id')
                .eq('order_id', p.id);
            return { ...p, cliente: c, itens: itensRaw ?? [] };
        }));
        return { pedidos };
    }
    async pegarPedido(pedidoId, motoboyId) {
        const mb = await this.infoMotoboy(motoboyId);
        if (!mb)
            throw new common_1.NotFoundException('Motoboy não encontrado');
        const { data, error } = await this.supabase.client
            .from('orders')
            .update({ motoboy_id: motoboyId, status: 'motoboy_collecting', updated_at: new Date().toISOString() })
            .eq('id', pedidoId)
            .eq('restaurant_id', mb.restaurant_id)
            .eq('status', 'ready')
            .is('motoboy_id', null)
            .select('id');
        if (error)
            throw error;
        if (!data || data.length === 0) {
            throw new common_1.ConflictException('Pedido já foi pego por outro motoboy ou não está disponível');
        }
        return { ok: true, pedido_id: pedidoId, status: 'motoboy_collecting' };
    }
    async reivindicarPedido(pedidoId, motoboyId) {
        const mb = await this.infoMotoboy(motoboyId);
        if (!mb)
            throw new common_1.NotFoundException('Motoboy não encontrado');
        const { data, error } = await this.supabase.client
            .from('orders')
            .update({ motoboy_id: motoboyId, status: 'motoboy_collecting', updated_at: new Date().toISOString() })
            .eq('id', pedidoId)
            .eq('restaurant_id', mb.restaurant_id)
            .in('status', ['ready', 'preparing', 'confirmed'])
            .is('motoboy_id', null)
            .select('id');
        if (error)
            throw error;
        if (!data || data.length === 0) {
            throw new common_1.ConflictException('Pedido não encontrado, já foi atribuído ou não está disponível');
        }
        return { ok: true, pedido_id: pedidoId, status: 'motoboy_collecting' };
    }
    async confirmarColeta(pedidoId, motoboyId, barcode) {
        const expected = String(pedidoId).padStart(8, '0');
        const scanned = barcode.replace(/\D/g, '').padStart(8, '0');
        if (scanned !== expected) {
            throw new common_1.BadRequestException('Código de barras não confere com este pedido');
        }
        const { data: pedido } = await this.supabase.client
            .from('orders')
            .select('id, total, troco_para, payment_method, restaurant_id')
            .eq('id', pedidoId)
            .eq('motoboy_id', motoboyId)
            .eq('status', 'motoboy_collecting')
            .maybeSingle();
        if (!pedido)
            throw new common_1.ConflictException('Pedido não está aguardando coleta ou não pertence a você');
        const { error } = await this.supabase.client
            .from('orders')
            .update({ status: 'out_for_delivery', updated_at: new Date().toISOString() })
            .eq('id', pedidoId);
        if (error)
            throw error;
        const trocoValor = pedido.payment_method === 'cash' && pedido.troco_para > pedido.total
            ? Number(pedido.troco_para) - Number(pedido.total)
            : 0;
        if (trocoValor > 0) {
            const { data: caixa } = await this.supabase.client
                .from('caixas')
                .select('id, saidas')
                .eq('restaurant_id', pedido.restaurant_id)
                .eq('status', 'aberto')
                .maybeSingle();
            if (caixa) {
                const saidas = (caixa.saidas ?? []);
                const novaSaida = {
                    descricao: `Troco pedido #${pedidoId}`,
                    valor: trocoValor,
                    meio: 'dinheiro',
                    criado_em: new Date().toISOString(),
                };
                await this.supabase.client
                    .from('caixas')
                    .update({ saidas: [...saidas, novaSaida] })
                    .eq('id', caixa.id);
            }
        }
        return { ok: true, pedido_id: pedidoId, status: 'out_for_delivery', troco: trocoValor };
    }
    async uploadComprovante(pedidoId, motoboyId, base64) {
        const { data: pedido } = await this.supabase.client
            .from('orders')
            .select('id')
            .eq('id', pedidoId)
            .eq('motoboy_id', motoboyId)
            .maybeSingle();
        if (!pedido)
            throw new common_1.NotFoundException('Pedido não encontrado ou não atribuído a você');
        const matches = base64.match(/^data:(image\/\w+);base64,(.+)$/);
        const mimeType = matches ? matches[1] : 'image/jpeg';
        const raw = matches ? matches[2] : base64;
        const buffer = Buffer.from(raw, 'base64');
        const ext = mimeType === 'image/png' ? 'png' : 'jpg';
        const path = `pedido-${pedidoId}-${Date.now()}.${ext}`;
        const { error: uploadError } = await this.supabase.client.storage
            .from('comprovantes-pix')
            .upload(path, buffer, { contentType: mimeType, upsert: true });
        if (uploadError)
            throw uploadError;
        const { data: { publicUrl } } = this.supabase.client.storage
            .from('comprovantes-pix')
            .getPublicUrl(path);
        await this.supabase.client
            .from('orders')
            .update({ comprovante_pix_url: publicUrl, updated_at: new Date().toISOString() })
            .eq('id', pedidoId);
        return { url: publicUrl };
    }
    async infoMotoboy(motoboyId) {
        const { data: mb } = await this.supabase.client
            .from('motoboys')
            .select('id, name, phone, restaurant_id')
            .eq('id', motoboyId)
            .maybeSingle();
        if (!mb)
            return null;
        const { data: rest } = await this.supabase.client
            .from('restaurants')
            .select('name, payment_config')
            .eq('id', mb.restaurant_id)
            .maybeSingle();
        return {
            ...mb,
            restaurante_nome: rest?.name ?? null,
            restaurante_cidade: null,
            chave_pix: rest?.payment_config?.chave_pix ?? null,
        };
    }
};
exports.MotoboyService = MotoboyService;
exports.MotoboyService = MotoboyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], MotoboyService);
//# sourceMappingURL=motoboy.service.js.map