import { SupabaseClient } from '@supabase/supabase-js';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
export declare const empresasToolDefinitions: Tool[];
export declare function executarEmpresasTool(nome: string, args: Record<string, any>, supabase: SupabaseClient): Promise<{
    empresas: {
        id: any;
        name: any;
        address: any;
        created_at: any;
    }[];
    total: number;
} | {
    erro: string;
    empresa?: undefined;
    metricas?: undefined;
} | {
    empresa: {
        id: any;
        name: any;
        address: any;
        business_hours: any;
        payment_config: any;
        created_at: any;
    };
    metricas: {
        total_pedidos: number;
        total_vendas: any;
        pedidos_pendentes: number;
    };
    erro?: undefined;
} | {
    comissoes: {
        id: any;
        empresa_id: any;
        pedido_id: any;
        valor_venda: any;
        comissao_pct: any;
        comissao_valor: any;
        criado_em: any;
    }[];
    total_comissao: any;
    total_registros: number;
} | null>;
