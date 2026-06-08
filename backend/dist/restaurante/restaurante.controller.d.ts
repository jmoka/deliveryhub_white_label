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
            slug: any;
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
    updateEmpresa(req: any, body: any): Promise<{
        id: any;
        name: any;
        address: any;
        logo_url: any;
        slug: any;
    } | null>;
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
            preco_promo: any;
            image_url: any;
            is_active: any;
            category_id: any;
            tipo: any;
            destaque: any;
            created_at: any;
        }[];
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
            icon_name: any;
            color_primary: any;
            color_secondary: any;
            restaurant_id: any;
            created_at: any;
        }[];
        total: number;
    }>;
    criarCategoria(req: any, body: {
        name: string;
    }): Promise<any>;
    listarClientes(req: any, busca?: string, limite?: string): Promise<{
        clientes: {
            id: any;
            name: any;
            email: any;
            phone_e164: any;
            address_json: any;
            notes: any;
            user_id: any;
            created_at: any;
        }[];
        total: number;
    }>;
    criarCliente(req: any, body: any): Promise<any>;
    atualizarCliente(id: number, body: any, req: any): Promise<any>;
    getAparencia(req: any): Promise<Record<string, any>>;
    updateAparencia(req: any, body: any): Promise<any>;
    getConfig(req: any): Promise<{
        pagbank_sandbox: any;
        pagbank_webhook_url: any;
        pagbank_token_masked: string | null;
        pagbank_seller_account_id: any;
        configurado: boolean;
        split_ativo: boolean;
    }>;
    updateConfig(req: any, body: any): Promise<{
        pagbank_sandbox: any;
        pagbank_webhook_url: any;
        pagbank_token_masked: string | null;
        pagbank_seller_account_id: any;
        configurado: boolean;
        split_ativo: boolean;
    }>;
    toggleStatus(req: any, body: {
        aberto: boolean;
    }): Promise<{
        aberto: boolean;
    }>;
    getCaixa(req: any): Promise<{
        status_restaurante: boolean;
        aberto: boolean;
        aberto_em: null;
        valor_inicial: number;
        saidas: {
            descricao: string;
            valor: number;
            criado_em: string;
        }[];
        pedidos: never[];
        resumo: null;
    } | {
        status_restaurante: boolean;
        aberto: boolean;
        aberto_em: string;
        valor_inicial: number;
        saidas: {
            descricao: string;
            valor: number;
            criado_em: string;
        }[];
        pedidos: {
            id: any;
            total: any;
            status: any;
            payment_method: any;
            created_at: any;
            customer_id: any;
            motoboy_id: any;
            customers: {
                name: any;
                phone_e164: any;
            }[];
        }[];
        resumo: {
            total_pedidos: number;
            entregues: number;
            em_andamento: number;
            cancelados: number;
            total_vendas: any;
            total_saidas: number;
            saldo: number;
        };
    }>;
    abrirCaixa(req: any, body: {
        valor_inicial?: number;
    }): Promise<{
        status_restaurante: boolean;
        aberto: boolean;
        aberto_em: null;
        valor_inicial: number;
        saidas: {
            descricao: string;
            valor: number;
            criado_em: string;
        }[];
        pedidos: never[];
        resumo: null;
    } | {
        status_restaurante: boolean;
        aberto: boolean;
        aberto_em: string;
        valor_inicial: number;
        saidas: {
            descricao: string;
            valor: number;
            criado_em: string;
        }[];
        pedidos: {
            id: any;
            total: any;
            status: any;
            payment_method: any;
            created_at: any;
            customer_id: any;
            motoboy_id: any;
            customers: {
                name: any;
                phone_e164: any;
            }[];
        }[];
        resumo: {
            total_pedidos: number;
            entregues: number;
            em_andamento: number;
            cancelados: number;
            total_vendas: any;
            total_saidas: number;
            saldo: number;
        };
    }>;
    fecharCaixa(req: any): Promise<{
        pedidos: any[];
        fechado_em: string;
        aberto_em: string | null;
        valor_inicial: any;
        saidas: {
            descricao: string;
            valor: number;
            criado_em: string;
        }[];
        resumo: Record<string, any> | null;
    }>;
    adicionarSaida(req: any, body: {
        descricao: string;
        valor: number;
    }): Promise<{
        descricao: string;
        valor: number;
        criado_em: string;
    }>;
    buscarPedidoDetalhe(id: number, req: any): Promise<{
        pedido: {
            id: any;
            total: any;
            status: any;
            payment_method: any;
            restaurant_id: any;
            customer_id: any;
            user_id: any;
            motoboy_id: any;
            motoboy_lat: any;
            motoboy_lng: any;
            motoboy_location_at: any;
            delivery_notes: any;
            delivery_occurrence: any;
            created_at: any;
            updated_at: any;
        };
        itens: {
            id: any;
            quantity: any;
            unit_price: any;
            product_id: any;
        }[];
        cliente: {
            id: any;
            name: any;
            email: any;
            phone_e164: any;
            address_json: any;
        } | null;
        empresa: {
            id: any;
            name: any;
            comissao_pct: any;
            address: any;
        } | null;
        motoboy: {
            id: any;
            name: any;
            phone: any;
            access_token: any;
        } | null;
    }>;
    cozinha(req: any): Promise<{
        pedidos: any[];
    }>;
    setupStorage(): Promise<{
        ok: boolean;
        bucket: string;
        criado: boolean;
    }>;
    relatorio(req: any, de: string, ate: string): Promise<{
        pedidos: any[];
        resumo: {
            total_pedidos: number;
            entregues: number;
            cancelados: number;
            em_andamento: number;
            total_vendas: any;
            ticket_medio: number;
            por_pagamento: any;
        };
    }>;
}
