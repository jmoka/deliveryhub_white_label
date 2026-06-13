import { PlataformaService } from './plataforma.service';
import { UpdateConfigDto } from './update-config.dto';
export declare class PlataformaController {
    private service;
    constructor(service: PlataformaService);
    getConfig(): Promise<{
        pagbank_platform_account_id: any;
        pagbank_sandbox: any;
        pagbank_platform_token_masked: string | null;
        configurado: boolean;
        cloudflare_domain: any;
        cloudflare_tunnel_token_masked: string | null;
        cloudflare_configurado: boolean;
    }>;
    updateConfig(body: UpdateConfigDto): Promise<{
        pagbank_platform_account_id: any;
        pagbank_sandbox: any;
        pagbank_platform_token_masked: string | null;
        configurado: boolean;
        cloudflare_domain: any;
        cloudflare_tunnel_token_masked: string | null;
        cloudflare_configurado: boolean;
    }>;
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
    comissoes(empresaId?: string, dataInicio?: string, dataFim?: string, limite?: string): Promise<{
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
    comissoesPorEmpresa(id: number): Promise<{
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
