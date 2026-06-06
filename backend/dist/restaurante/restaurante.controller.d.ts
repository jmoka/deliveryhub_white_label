import { RestauranteService } from './restaurante.service';
export declare class RestauranteController {
    private service;
    constructor(service: RestauranteService);
    minhaEmpresa(req: any): Promise<{
        empresa: {
            id: any;
            name: any;
            address: any;
            logo_url: any;
            business_hours: any;
            payment_config: any;
            comissao_pct: any;
            created_at: any;
        };
        metricas: {
            total_pedidos: number;
            pedidos_pendentes: number;
            pedidos_entregues: number;
            faturamento: any;
        };
    }>;
    meusPedidos(req: any, status?: string, limite?: string): Promise<{
        pedidos: {
            id: any;
            total: any;
            status: any;
            payment_method: any;
            restaurant_id: any;
            customer_id: any;
            user_id: any;
            created_at: any;
        }[];
        total: number;
    }>;
    atualizarStatus(id: number, body: {
        status: string;
    }, req: any): Promise<{
        id: any;
        status: any;
        total: any;
        restaurant_id: any;
        updated_at: any;
    }>;
    meusProdutos(req: any): Promise<{
        produtos: {
            id: any;
            name: any;
            description: any;
            price: any;
            image_url: any;
            is_active: any;
            category_id: any;
            created_at: any;
        }[];
        total: number;
    }>;
    criarProduto(req: any, body: any): Promise<any>;
    toggleProduto(id: number, body: {
        ativo: boolean;
    }, req: any): Promise<{
        id: any;
        name: any;
        is_active: any;
    }>;
    minhasCategorias(req: any): Promise<{
        categorias: {
            total_produtos: number;
            id: any;
            name: any;
            restaurant_id: any;
            created_at: any;
        }[];
        total: number;
    }>;
    criarCategoria(req: any, body: {
        name: string;
    }): Promise<any>;
}
