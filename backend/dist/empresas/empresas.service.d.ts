import { SupabaseService } from '../supabase/supabase.service';
export declare class EmpresasService {
    private supabase;
    constructor(supabase: SupabaseService);
    listar(apenasAtivo?: boolean): Promise<{
        empresas: {
            id: any;
            name: any;
            address: any;
            logo_url: any;
            comissao_pct: any;
            user_id: any;
            created_at: any;
        }[];
        total: number;
    }>;
    buscar(id: number): Promise<{
        empresa: {
            id: any;
            name: any;
            address: any;
            logo_url: any;
            business_hours: any;
            payment_config: any;
            comissao_pct: any;
            user_id: any;
            created_at: any;
        };
        metricas: {
            total_pedidos: number;
            pedidos_entregues: number;
            faturamento: any;
            comissao_acumulada: number;
        };
    }>;
    criar(body: {
        name: string;
        address?: string;
        logo_url?: string;
        comissao_pct?: number;
        user_id?: string;
    }): Promise<any>;
    atualizar(id: number, body: Partial<{
        name: string;
        address: string;
        logo_url: string;
        comissao_pct: number;
        business_hours: object;
        payment_config: object;
        user_id: string;
    }>): Promise<any>;
    remover(id: number): Promise<{
        mensagem: string;
    }>;
}
