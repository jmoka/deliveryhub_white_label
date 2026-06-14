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
            frete_cobrado: any;
            status: any;
            payment_method: any;
            restaurant_id: any;
            customer_id: any;
            user_id: any;
            created_at: any;
        }[];
        total: number;
    }>;
    cancelarPedidoAdmin(restaurantId: number, pedidoId: number, motivo: string): Promise<{
        id: any;
        status: any;
        cancel_reason: any;
        total: any;
        updated_at: any;
    }>;
    atualizarStatusPedido(pedidoId: number, restaurantId: number, status: string): Promise<{
        id: any;
        status: any;
        total: any;
        restaurant_id: any;
        updated_at: any;
    }>;
    private catIdsDoRestaurante;
    private verificarProdutoDoRestaurante;
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
            restaurant_id: any;
            tags: any;
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
        tags?: string[];
        preco_promo?: number;
        destaque?: boolean;
    }): Promise<any>;
    editarProduto(produtoId: number, restaurantId: number, body: any): Promise<any>;
    deletarProduto(produtoId: number, restaurantId: number): Promise<{
        ok: boolean;
    }>;
    toggleProduto(produtoId: number, restaurantId: number, ativo: boolean): Promise<{
        id: any;
        name: any;
        is_active: any;
    }>;
    meusCombos(restaurantId: number): Promise<{
        combos: {
            id: any;
            name: any;
            description: any;
            price: any;
            preco_promo: any;
            image_url: any;
            is_active: any;
            destaque: any;
            created_at: any;
        }[];
    }>;
    getComboDetalhe(comboId: number, restaurantId: number): Promise<any>;
    criarCombo(restaurantId: number, body: {
        name: string;
        description?: string;
        price: number;
        preco_promo?: number;
        image_url?: string;
        destaque?: boolean;
        items?: {
            product_id: number;
            quantity: number;
        }[];
    }): Promise<any>;
    editarCombo(comboId: number, restaurantId: number, body: any): Promise<any>;
    deletarCombo(comboId: number, restaurantId: number): Promise<{
        ok: boolean;
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
    deletarCategoria(categoriaId: number, restaurantId: number): Promise<{
        mensagem: string;
    }>;
    listarClientes(restaurantId: number, filtros: {
        busca?: string;
        limite?: number;
    }): Promise<{
        clientes: {
            pedidos_count: number;
            total_gasto: number;
            ultimo_pedido: string | null;
            id: any;
            name: any;
            email: any;
            phone_e164: any;
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
        notes?: string;
    }): Promise<any>;
    atualizarCliente(clienteId: number, restaurantId: number, body: Partial<{
        name: string;
        email: string;
        phone_e164: string;
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
        taxa_pagbank_percent: any;
        chave_pix: any;
        frete_motoboy: number;
    }>;
    updateConfig(restaurantId: number, body: {
        pagbank_token?: string;
        pagbank_sandbox?: boolean;
        pagbank_webhook_url?: string;
        pagbank_seller_account_id?: string;
        taxa_pagbank_percent?: number | null;
        chave_pix?: string | null;
        frete_motoboy?: number;
    }): Promise<{
        pagbank_sandbox: any;
        pagbank_webhook_url: any;
        pagbank_token_masked: string | null;
        pagbank_seller_account_id: any;
        configurado: boolean;
        split_ativo: boolean;
        taxa_pagbank_percent: any;
        chave_pix: any;
        frete_motoboy: number;
    }>;
    toggleStatus(restaurantId: number, aberto: boolean): Promise<{
        aberto: boolean;
    }>;
    renovarTokenCozinha(restaurantId: number): Promise<{
        cozinha_token: `${string}-${string}-${string}-${string}-${string}`;
    }>;
    getCozinha(restaurantId: number): Promise<{
        pedidos: any[];
    }>;
    private readonly STATUS_ABERTOS;
    private calcularResumo;
    getCaixa(restaurantId: number): Promise<{
        status_restaurante: boolean;
        aberto: boolean;
        expirado: boolean;
        caixa_expirado: any;
        pedidos: never[];
        resumo: null;
        saldo_caixa: number;
        saldo_fechados_pendente: number;
        id?: undefined;
        nome_operador?: undefined;
        aberto_em?: undefined;
        valor_inicial?: undefined;
        saidas?: undefined;
        entradas?: undefined;
    } | {
        status_restaurante: boolean;
        aberto: boolean;
        expirado: boolean;
        id: any;
        nome_operador: any;
        aberto_em: any;
        valor_inicial: any;
        saidas: any[];
        entradas: any[];
        pedidos: {
            id: any;
            total: any;
            status: any;
            payment_method: any;
            created_at: any;
            updated_at: any;
            customer_id: any;
            motoboy_id: any;
            caixa_id: any;
            customers: {
                name: any;
                phone_e164: any;
            }[];
            motoboys: {
                name: any;
            }[];
        }[];
        resumo: {
            total_pedidos: number;
            entregues: number;
            em_andamento: number;
            cancelados: number;
            total_vendas: any;
            total_saidas: any;
            total_entradas: any;
            saldo: number;
            por_pagamento: Record<string, number>;
            especie_calculada: number;
            saidas_especie: any;
            entradas_especie: any;
        };
        saldo_caixa: number;
        saldo_fechados_pendente: number;
        caixa_expirado?: undefined;
    }>;
    abrirCaixa(restaurantId: number, body: {
        nome_operador: string;
        valor_inicial?: number;
    }): Promise<{
        status_restaurante: boolean;
        aberto: boolean;
        expirado: boolean;
        caixa_expirado: any;
        pedidos: never[];
        resumo: null;
        saldo_caixa: number;
        saldo_fechados_pendente: number;
        id?: undefined;
        nome_operador?: undefined;
        aberto_em?: undefined;
        valor_inicial?: undefined;
        saidas?: undefined;
        entradas?: undefined;
    } | {
        status_restaurante: boolean;
        aberto: boolean;
        expirado: boolean;
        id: any;
        nome_operador: any;
        aberto_em: any;
        valor_inicial: any;
        saidas: any[];
        entradas: any[];
        pedidos: {
            id: any;
            total: any;
            status: any;
            payment_method: any;
            created_at: any;
            updated_at: any;
            customer_id: any;
            motoboy_id: any;
            caixa_id: any;
            customers: {
                name: any;
                phone_e164: any;
            }[];
            motoboys: {
                name: any;
            }[];
        }[];
        resumo: {
            total_pedidos: number;
            entregues: number;
            em_andamento: number;
            cancelados: number;
            total_vendas: any;
            total_saidas: any;
            total_entradas: any;
            saldo: number;
            por_pagamento: Record<string, number>;
            especie_calculada: number;
            saidas_especie: any;
            entradas_especie: any;
        };
        saldo_caixa: number;
        saldo_fechados_pendente: number;
        caixa_expirado?: undefined;
    }>;
    fecharCaixa(restaurantId: number, body?: {
        dinheiro_contado?: number;
    }): Promise<{
        fechamento: {
            id: any;
            aberto_em: any;
            fechado_em: string;
            nome_operador: any;
            valor_inicial: any;
            saidas: any[];
            resumo: {
                total_pedidos: number;
                entregues: number;
                em_andamento: number;
                cancelados: number;
                total_vendas: any;
                total_saidas: any;
                total_entradas: any;
                saldo: number;
                por_pagamento: Record<string, number>;
                especie_calculada: number;
                saidas_especie: any;
                entradas_especie: any;
            };
            destinacao_fechamento: {
                dinheiro_contado: number;
                especie_calculada: number;
                diferenca: number;
                por_pagamento: Record<string, number>;
                conferencia_aprovada: boolean;
            };
        };
    }>;
    aprovarConferencia(restaurantId: number, caixaId: number): Promise<{
        aprovado: boolean;
    }>;
    fecharComTransferencia(restaurantId: number, body: {
        nome_operador: string;
        valor_inicial?: number;
    }): Promise<{
        fechamento: {
            id: any;
            aberto_em: any;
            fechado_em: string;
            nome_operador: any;
            resumo: {
                total_pedidos: number;
                entregues: number;
                em_andamento: number;
                cancelados: number;
                total_vendas: any;
                total_saidas: any;
                total_entradas: any;
                saldo: number;
                por_pagamento: Record<string, number>;
                especie_calculada: number;
                saidas_especie: any;
                entradas_especie: any;
            };
        };
        novo_caixa: any;
    }>;
    getCaixaHistorico(restaurantId: number): Promise<{
        historico: {
            id: any;
            nome_operador: any;
            valor_inicial: any;
            status: any;
            aberto_em: any;
            fechado_em: any;
            resumo: any;
            destinacao_fechamento: any;
        }[];
    }>;
    getCaixaDetalhe(restaurantId: number, caixaId: number): Promise<{
        caixa: any;
        pedidos: {
            id: any;
            total: any;
            status: any;
            payment_method: any;
            created_at: any;
            customers: {
                name: any;
            }[];
        }[];
    }>;
    adicionarSaida(restaurantId: number, body: {
        descricao: string;
        valor: number;
        meio?: string;
    }): Promise<any>;
    adicionarEntrada(restaurantId: number, body: {
        descricao: string;
        valor: number;
        meio?: string;
    }): Promise<any>;
    setFreteGratis(restaurantId: number, pedidoId: number): Promise<{
        id: any;
        total: any;
        frete_cobrado: any;
    } | {
        message: string;
        pedido: {
            id: any;
            total: any;
            frete_cobrado: any;
            status: any;
        };
    }>;
    setTrocoPara(restaurantId: number, pedidoId: number, trocoPara: number): Promise<{
        id: any;
        total: any;
        troco_para: any;
    }>;
    uploadImage(folder: string, file: Express.Multer.File): Promise<{
        url: string;
    }>;
    setupStorage(): Promise<{
        ok: boolean;
        bucket: string;
        criado: boolean;
    }>;
    getRelatorio(restaurantId: number, de: string, ate: string): Promise<{
        pedidos: any[];
        saidas: any[];
        resumo: {
            total_pedidos: number;
            entregues: number;
            cancelados: number;
            em_andamento: number;
            total_vendas: any;
            ticket_medio: number;
            por_pagamento: any;
            total_saidas: any;
            saldo_liquido: number;
        };
    }>;
    buscarPedidoDoRestaurante(restaurantId: number, pedidoId: number): Promise<{
        pedido: {
            id: any;
            total: any;
            troco_para: any;
            frete_cobrado: any;
            entrega_pagamento: any;
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
            cancel_reason: any;
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
        pagamento_pago: {
            id: any;
            valor: any;
            tipo: any;
            status: any;
        } | null;
    }>;
}
