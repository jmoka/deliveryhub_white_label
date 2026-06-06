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
exports.PagamentosService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const supabase_service_1 = require("../supabase/supabase.service");
const pagbank_client_1 = require("./pagbank.client");
const STATUS_PAGOS = ['PAID', 'COMPLETED', 'AVAILABLE'];
let PagamentosService = class PagamentosService {
    supabase;
    config;
    pagbank;
    webhookUrl;
    constructor(supabase, config) {
        this.supabase = supabase;
        this.config = config;
        const token = this.config.get('PAGBANK_TOKEN') ?? '';
        const sandbox = this.config.get('PAGBANK_SANDBOX') !== 'false';
        this.webhookUrl = this.config.get('PAGBANK_WEBHOOK_URL') ?? 'http://localhost:3002/pagamentos/webhook';
        this.pagbank = new pagbank_client_1.PagBankClient(token, sandbox);
    }
    async buscarPedido(orderId) {
        const { data, error } = await this.supabase.client
            .from('orders')
            .select('id, total, status, restaurant_id, user_id')
            .eq('id', orderId)
            .maybeSingle();
        if (error)
            throw error;
        if (!data)
            throw new common_1.NotFoundException(`Pedido ${orderId} não encontrado`);
        return data;
    }
    limparCpf(cpf) {
        return cpf.replace(/\D/g, '');
    }
    async criarPix(body) {
        const pedido = await this.buscarPedido(body.order_id);
        if (pedido.status !== 'pending') {
            throw new common_1.BadRequestException('Pedido não está pendente de pagamento');
        }
        const valorCentavos = Math.round(pedido.total * 100);
        const refId = `DELIVERY_${pedido.id}_${Date.now()}`;
        const resposta = await this.pagbank.criarOrdemPix({
            reference_id: refId,
            valor_centavos: valorCentavos,
            customer: {
                name: body.customer.name,
                email: body.customer.email,
                tax_id: this.limparCpf(body.customer.tax_id),
            },
            itens: [{ name: `Pedido #${pedido.id}`, quantity: 1, unit_amount: valorCentavos }],
            webhook_url: this.webhookUrl,
        });
        const qrCode = resposta?.qr_codes?.[0];
        const pixCode = qrCode?.text ?? null;
        const pixQrUrl = qrCode?.links?.find((l) => l.media === 'image/png')?.href ?? null;
        const { data: pagamento, error } = await this.supabase.client
            .from('pagamentos')
            .insert({
            order_id: pedido.id,
            pagbank_order_id: resposta.id,
            tipo: 'pix',
            status: 'pending',
            valor: pedido.total,
            pix_code: pixCode,
            pix_qr_url: pixQrUrl,
        })
            .select()
            .single();
        if (error)
            throw error;
        return {
            pagamento_id: pagamento.id,
            pix_code: pixCode,
            pix_qr_url: pixQrUrl,
            pagbank_order_id: resposta.id,
            expira_em: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };
    }
    async criarCartao(body) {
        const pedido = await this.buscarPedido(body.order_id);
        if (pedido.status !== 'pending') {
            throw new common_1.BadRequestException('Pedido não está pendente de pagamento');
        }
        const valorCentavos = Math.round(pedido.total * 100);
        const refId = `DELIVERY_${pedido.id}_${Date.now()}`;
        const tipo = body.tipo ?? 'CREDIT_CARD';
        const resposta = await this.pagbank.criarOrdemCartao({
            reference_id: refId,
            valor_centavos: valorCentavos,
            customer: {
                name: body.customer.name,
                email: body.customer.email,
                tax_id: this.limparCpf(body.customer.tax_id),
            },
            itens: [{ name: `Pedido #${pedido.id}`, quantity: 1, unit_amount: valorCentavos }],
            card_encrypted: body.card_encrypted,
            parcelas: body.parcelas ?? 1,
            tipo,
            webhook_url: this.webhookUrl,
        });
        const charge = resposta?.charges?.[0];
        const statusPagamento = STATUS_PAGOS.includes(charge?.status) ? 'paid' : 'pending';
        const { data: pagamento, error } = await this.supabase.client
            .from('pagamentos')
            .insert({
            order_id: pedido.id,
            pagbank_order_id: resposta.id,
            pagbank_charge_id: charge?.id ?? null,
            tipo: tipo === 'CREDIT_CARD' ? 'credit_card' : 'debit_card',
            status: statusPagamento,
            valor: pedido.total,
            pago_em: statusPagamento === 'paid' ? new Date().toISOString() : null,
        })
            .select()
            .single();
        if (error)
            throw error;
        if (statusPagamento === 'paid') {
            await this.supabase.client
                .from('orders')
                .update({ status: 'confirmed', updated_at: new Date().toISOString() })
                .eq('id', pedido.id);
        }
        return {
            pagamento_id: pagamento.id,
            status: statusPagamento,
            pagbank_order_id: resposta.id,
            charge_id: charge?.id,
        };
    }
    async buscarPorPedido(orderId) {
        const { data, error } = await this.supabase.client
            .from('pagamentos')
            .select('id, tipo, status, valor, pix_code, pix_qr_url, pagbank_order_id, pago_em, criado_em')
            .eq('order_id', orderId)
            .order('criado_em', { ascending: false });
        if (error)
            throw error;
        return { pagamentos: data ?? [] };
    }
    async processarWebhook(evento) {
        const payload = evento?.data ?? evento;
        const pagbankOrderId = payload?.id ?? payload?.reference_id;
        const charges = payload?.charges ?? [];
        const payments = payload?.payments ?? [];
        const detalhe = charges[0] ?? payments[0];
        if (!detalhe)
            return { ignorado: true };
        const statusPagbank = detalhe?.status ?? payload?.status ?? '';
        const pago = STATUS_PAGOS.includes(statusPagbank);
        const { data: pagamento } = await this.supabase.client
            .from('pagamentos')
            .select('id, order_id, status')
            .eq('pagbank_order_id', pagbankOrderId)
            .maybeSingle();
        if (!pagamento)
            return { ignorado: true, motivo: 'pagamento não encontrado' };
        if (pagamento.status === 'paid')
            return { ignorado: true, motivo: 'já processado' };
        const novoStatus = pago ? 'paid' : statusPagbank === 'DECLINED' ? 'declined' : pagamento.status;
        await this.supabase.client
            .from('pagamentos')
            .update({
            status: novoStatus,
            pagbank_charge_id: detalhe?.id ?? null,
            pago_em: pago ? new Date().toISOString() : null,
            webhook_recebido_em: new Date().toISOString(),
            atualizado_em: new Date().toISOString(),
        })
            .eq('id', pagamento.id);
        if (pago) {
            await this.supabase.client
                .from('orders')
                .update({ status: 'confirmed', updated_at: new Date().toISOString() })
                .eq('id', pagamento.order_id);
        }
        return { processado: true, status: novoStatus, order_id: pagamento.order_id };
    }
};
exports.PagamentosService = PagamentosService;
exports.PagamentosService = PagamentosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        config_1.ConfigService])
], PagamentosService);
//# sourceMappingURL=pagamentos.service.js.map