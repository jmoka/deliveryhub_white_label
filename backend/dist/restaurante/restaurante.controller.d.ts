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
            tags: any;
            destaque: any;
            created_at: any;
        }[];
    }>;
    criarProduto(req: any, body: any): Promise<any>;
    editarProduto(id: number, body: any, req: any): Promise<any>;
    deletarProduto(id: number, req: any): Promise<{
        ok: boolean;
    }>;
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
    } | {
        status_restaurante: boolean;
        aberto: boolean;
        expirado: boolean;
        id: any;
        nome_operador: any;
        aberto_em: any;
        valor_inicial: any;
        saidas: any[];
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
            saldo: number;
        };
        saldo_caixa: number;
        saldo_fechados_pendente: number;
        caixa_expirado?: undefined;
    }>;
    abrirCaixa(req: any, body: {
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
    } | {
        status_restaurante: boolean;
        aberto: boolean;
        expirado: boolean;
        id: any;
        nome_operador: any;
        aberto_em: any;
        valor_inicial: any;
        saidas: any[];
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
            saldo: number;
        };
        saldo_caixa: number;
        saldo_fechados_pendente: number;
        caixa_expirado?: undefined;
    }>;
    fecharCaixa(req: any, body: {
        banco?: number;
        retirada?: number;
        permanece?: number;
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
                saldo: number;
            };
            destinacao_fechamento: {
                banco: number;
                retirada: number;
                permanece: number;
                saldo: number;
            };
        };
    }>;
    fecharComTransferencia(req: any, body: {
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
                saldo: number;
            };
        };
        novo_caixa: any;
    }>;
    getCaixaHistorico(req: any): Promise<{
        historico: {
            id: any;
            nome_operador: any;
            valor_inicial: any;
            status: any;
            aberto_em: any;
            fechado_em: any;
            resumo: any;
        }[];
    }>;
    getCaixaDetalhe(id: number, req: any): Promise<{
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
    adicionarSaida(req: any, body: {
        descricao: string;
        valor: number;
        meio?: string;
    }): Promise<any>;
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
    uploadImage(file: Express.Multer.File, folder?: string): Promise<{
        url: string;
    }>;
    relatorio(req: any, de: string, ate: string): Promise<{
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
    meusCombos(req: any): Promise<{
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
    getComboDetalhe(id: number, req: any): Promise<any>;
    criarCombo(req: any, body: any): Promise<any>;
    editarCombo(id: number, req: any, body: any): Promise<any>;
    deletarCombo(id: number, req: any): Promise<{
        ok: boolean;
    }>;
}
