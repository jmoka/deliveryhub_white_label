import { EmpresasService } from './empresas.service';
export declare class EmpresasController {
    private service;
    constructor(service: EmpresasService);
    listar(): Promise<{
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
    atualizar(id: number, body: any): Promise<any>;
    remover(id: number): Promise<{
        mensagem: string;
    }>;
}
