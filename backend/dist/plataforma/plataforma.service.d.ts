import { SupabaseService } from '../supabase/supabase.service';
export declare class PlataformaService {
    private supabase;
    constructor(supabase: SupabaseService);
    metricas(): Promise<{
        resumo: {
            total_empresas: number;
            total_pedidos: number;
            pedidos_entregues: number;
            pedidos_cancelados: number;
            faturamento_total: number;
            comissao_total: number;
            ticket_medio: number;
        };
        top_empresas: {
            nome: string;
            faturamento: number;
            comissao: number;
            empresa_id: number;
        }[];
    }>;
    comissoes(filtros: {
        empresa_id?: number;
        data_inicio?: string;
        data_fim?: string;
        limite?: number;
    }): Promise<{
        comissoes: {
            id: any;
            empresa_id: any;
            pedido_id: any;
            valor_venda: any;
            comissao_pct: any;
            comissao_valor: any;
            criado_em: any;
        }[];
        total_registros: number;
        total_comissao: number;
    }>;
    getConfig(): Promise<{
        pagbank_platform_account_id: any;
        pagbank_sandbox: any;
        pagbank_platform_token_masked: string | null;
        configurado: boolean;
        cloudflare_domain: any;
        cloudflare_tunnel_token_masked: string | null;
        cloudflare_configurado: boolean;
    }>;
    updateConfig(body: {
        pagbank_platform_token?: string;
        pagbank_platform_account_id?: string;
        pagbank_sandbox?: boolean;
        cloudflare_tunnel_token?: string;
        cloudflare_domain?: string;
    }): Promise<{
        pagbank_platform_account_id: any;
        pagbank_sandbox: any;
        pagbank_platform_token_masked: string | null;
        configurado: boolean;
        cloudflare_domain: any;
        cloudflare_tunnel_token_masked: string | null;
        cloudflare_configurado: boolean;
    }>;
    comissoesPorEmpresa(empresaId: number): Promise<{
        empresa: {
            id: any;
            name: any;
            comissao_pct: any;
        } | null;
        metricas: {
            total_pedidos: number;
            pedidos_entregues: number;
            faturamento: number;
            comissao_total: number;
        };
        comissoes: {
            id: any;
            pedido_id: any;
            valor_venda: any;
            comissao_pct: any;
            comissao_valor: any;
            criado_em: any;
        }[];
    }>;
}
