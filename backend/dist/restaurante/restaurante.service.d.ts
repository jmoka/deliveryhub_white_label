import { SupabaseService } from '../supabase/supabase.service';
import { CategoriasService } from '../categorias/categorias.service';
import { ProdutosService } from '../produtos/produtos.service';
import { PedidosService } from '../pedidos/pedidos.service';
export declare class RestauranteService {
    private supabase;
    private categorias;
    private produtos;
    private pedidos;
    constructor(supabase: SupabaseService, categorias: CategoriasService, produtos: ProdutosService, pedidos: PedidosService);
    minhaEmpresa(userId: string): Promise<{
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
    meusPedidos(restaurantId: number, filtros: {
        status?: string;
        limite?: number;
    }): Promise<{
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
    atualizarStatusPedido(pedidoId: number, restaurantId: number, status: string): Promise<{
        id: any;
        status: any;
        total: any;
        restaurant_id: any;
        updated_at: any;
    }>;
    meusProdutos(restaurantId: number): Promise<{
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
    criarProduto(restaurantId: number, body: {
        name: string;
        description?: string;
        price: number;
        image_url?: string;
        category_id: number;
        tipo?: string;
        preco_promo?: number;
        destaque?: boolean;
    }): Promise<any>;
    toggleProduto(produtoId: number, restaurantId: number, ativo: boolean): Promise<{
        id: any;
        name: any;
        is_active: any;
    }>;
    minhasCategorias(restaurantId: number): Promise<{
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
    criarCategoria(restaurantId: number, body: {
        name: string;
    }): Promise<any>;
    listarClientes(restaurantId: number, filtros: {
        busca?: string;
        limite?: number;
    }): Promise<{
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
    criarCliente(restaurantId: number, body: {
        name: string;
        email?: string;
        phone_e164?: string;
        address_json?: object;
        notes?: string;
    }): Promise<any>;
    atualizarCliente(clienteId: number, restaurantId: number, body: Partial<{
        name: string;
        email: string;
        phone_e164: string;
        address_json: object;
        notes: string;
    }>): Promise<any>;
    updateEmpresa(restaurantId: number, body: {
        name?: string;
        address?: string;
        logo_url?: string;
    }): Promise<{
        id: any;
        name: any;
        address: any;
        logo_url: any;
        slug: any;
    } | null>;
    getAparencia(restaurantId: number): Promise<Record<string, any>>;
    updateAparencia(restaurantId: number, body: Record<string, any>): Promise<any>;
    getConfig(restaurantId: number): Promise<{
        pagbank_sandbox: any;
        pagbank_webhook_url: any;
        pagbank_token_masked: string | null;
        pagbank_seller_account_id: any;
        configurado: boolean;
        split_ativo: boolean;
    }>;
    updateConfig(restaurantId: number, body: {
        pagbank_token?: string;
        pagbank_sandbox?: boolean;
        pagbank_webhook_url?: string;
        pagbank_seller_account_id?: string;
    }): Promise<{
        pagbank_sandbox: any;
        pagbank_webhook_url: any;
        pagbank_token_masked: string | null;
        pagbank_seller_account_id: any;
        configurado: boolean;
        split_ativo: boolean;
    }>;
    toggleStatus(restaurantId: number, aberto: boolean): Promise<{
        aberto: boolean;
    }>;
    getCaixa(restaurantId: number): Promise<{
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
    abrirCaixa(restaurantId: number, valor_inicial: number): Promise<{
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
    fecharCaixa(restaurantId: number): Promise<{
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
    adicionarSaida(restaurantId: number, body: {
        descricao: string;
        valor: number;
    }): Promise<{
        descricao: string;
        valor: number;
        criado_em: string;
    }>;
    buscarPedidoDoRestaurante(restaurantId: number, pedidoId: number): Promise<{
        pedido: {
            id: any;
            total: any;
            status: any;
            payment_method: any;
            restaurant_id: any;
            customer_id: any;
            user_id: any;
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
        } | null;
    }>;
}
