"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PagBankClient = void 0;
class PagBankClient {
    baseUrl;
    token;
    constructor(token, sandbox) {
        this.token = token.trim();
        this.baseUrl = sandbox
            ? 'https://sandbox.api.pagseguro.com'
            : 'https://api.pagseguro.com';
    }
    headers() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/json',
            'x-api-version': '4.0',
        };
    }
    async request(method, path, body) {
        const res = await fetch(`${this.baseUrl}${path}`, {
            method,
            headers: this.headers(),
            body: body ? JSON.stringify(body) : undefined,
        });
        const json = await res.json();
        if (!res.ok) {
            const msg = json?.error_messages?.[0]?.description ?? json?.message ?? `HTTP ${res.status}`;
            throw new Error(`PagBank: ${msg}`);
        }
        return json;
    }
    async criarOrdemPix(params) {
        const expiracao = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const payload = {
            reference_id: params.reference_id,
            customer: params.customer,
            items: params.itens,
            qr_codes: [{ amount: { value: params.valor_centavos }, expiration_date: expiracao }],
            notification_urls: [params.webhook_url],
        };
        if (params.splits?.length) {
            payload.splits = params.splits;
        }
        return this.request('POST', '/orders', payload);
    }
    async criarOrdemCartao(params) {
        const payload = {
            reference_id: params.reference_id,
            customer: params.customer,
            items: params.itens,
            notification_urls: [params.webhook_url],
            charges: [{
                    reference_id: `CHG_${params.reference_id}`,
                    description: 'Pedido delivery',
                    amount: { value: params.valor_centavos, currency: 'BRL' },
                    payment_method: {
                        type: params.tipo,
                        installments: params.parcelas,
                        capture: true,
                        card: { encrypted: params.card_encrypted },
                    },
                }],
        };
        if (params.splits?.length) {
            payload.splits = params.splits;
        }
        return this.request('POST', '/orders', payload);
    }
    async buscarOrdem(pagbankOrderId) {
        return this.request('GET', `/orders/${pagbankOrderId}`);
    }
}
exports.PagBankClient = PagBankClient;
//# sourceMappingURL=pagbank.client.js.map