import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
export declare class PagamentosService {
    private supabase;
    private config;
    constructor(supabase: SupabaseService, config: ConfigService);
    private buscarPedido;
    private getPagBankClient;
    private buildSplits;
    private limparCpf;
    criarPix(body: {
        order_id: number;
        customer: {
            name: string;
            email: string;
            tax_id: string;
        };
    }): Promise<{
        pagamento_id: any;
        pix_code: any;
        pix_qr_url: any;
        pagbank_order_id: any;
        split_ativo: boolean;
        expira_em: string;
    }>;
    criarCartao(body: {
        order_id: number;
        customer: {
            name: string;
            email: string;
            tax_id: string;
        };
        card_encrypted: string;
        parcelas?: number;
        tipo?: 'CREDIT_CARD' | 'DEBIT_CARD';
    }): Promise<{
        pagamento_id: any;
        status: string;
        pagbank_order_id: any;
        charge_id: any;
        split_ativo: boolean;
    }>;
    buscarPorPedido(orderId: number): Promise<{
        pagamentos: {
            id: any;
            tipo: any;
            status: any;
            valor: any;
            pix_code: any;
            pix_qr_url: any;
            pagbank_order_id: any;
            pago_em: any;
            criado_em: any;
        }[];
    }>;
    processarWebhook(evento: any): Promise<{
        ignorado: boolean;
        motivo?: undefined;
        processado?: undefined;
        status?: undefined;
        order_id?: undefined;
    } | {
        ignorado: boolean;
        motivo: string;
        processado?: undefined;
        status?: undefined;
        order_id?: undefined;
    } | {
        processado: boolean;
        status: any;
        order_id: any;
        ignorado?: undefined;
        motivo?: undefined;
    }>;
}
