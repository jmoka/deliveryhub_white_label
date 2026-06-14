import { PedidosService } from './pedidos.service';
export declare class PedidosController {
    private service;
    constructor(service: PedidosService);
    listar(empresaId?: string, status?: string, dataInicio?: string, dataFim?: string, limite?: string): Promise<{
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
    meusPedidos(req: any, limite?: string): Promise<{
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
    buscar(id: number): Promise<{
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
    criar(body: {
        restaurant_id: number;
        customer_id?: number;
        payment_method: string;
        troco_para?: number;
        itens: {
            product_id: number;
            quantity: number;
        }[];
    }, req: any): Promise<{
        pedido: any;
        itens: {
            order_id: any;
            product_id: number;
            quantity: number;
            unit_price: any;
        }[];
    }>;
    atualizarStatus(id: number, body: {
        status: string;
    }): Promise<{
        id: any;
        status: any;
        total: any;
        restaurant_id: any;
        updated_at: any;
    }>;
    cancelarCliente(id: number, body: {
        motivo: string;
    }, req: any): Promise<{
        pedido: {
            id: any;
            status: any;
            cancel_reason: any;
            total: any;
            updated_at: any;
        };
        valor_devolver: any;
        precisa_estorno: boolean;
    }>;
    cancelar(id: number): Promise<{
        id: any;
        status: any;
        total: any;
        restaurant_id: any;
        updated_at: any;
    }>;
}
