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
            image_url: any;
            is_active: any;
            category_id: any;
            created_at: any;
        }[];
        total: number;
    }>;
    criarProduto(restaurantId: number, body: {
        name: string;
        description?: string;
        price: number;
        image_url?: string;
        category_id: number;
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
            restaurant_id: any;
            created_at: any;
        }[];
        total: number;
    }>;
    criarCategoria(restaurantId: number, body: {
        name: string;
    }): Promise<any>;
}
