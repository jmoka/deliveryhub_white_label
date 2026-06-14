import { MotoboyService } from './motoboy.service';
export declare class MotoboyPortalController {
    private service;
    constructor(service: MotoboyService);
    me(req: any): Promise<{
        restaurante_nome: any;
        restaurante_cidade: null;
        chave_pix: any;
        id: any;
        name: any;
        phone: any;
        restaurant_id: any;
    } | null>;
    disponiveis(req: any): Promise<{
        pedidos: {
            cliente: {
                name: any;
                phone_e164: any;
                address_json: any;
            } | null;
            itens: {
                id: any;
                quantity: any;
                unit_price: any;
                product_id: any;
            }[];
            id: any;
            total: any;
            status: any;
            payment_method: any;
            created_at: any;
            customer_id: any;
        }[];
    }>;
    pedidos(req: any): Promise<{
        pedidos: {
            cliente: {
                name: any;
                phone_e164: any;
                address_json: any;
            } | null;
            itens: {
                id: any;
                quantity: any;
                unit_price: any;
                product_id: any;
            }[];
            id: any;
            total: any;
            troco_para: any;
            status: any;
            payment_method: any;
            created_at: any;
            updated_at: any;
            motoboy_lat: any;
            motoboy_lng: any;
            customer_id: any;
            delivery_notes: any;
            delivery_occurrence: any;
        }[];
    }>;
    pegar(id: number, req: any): Promise<{
        ok: boolean;
        pedido_id: number;
        status: string;
    }>;
    reivindicar(id: number, req: any): Promise<{
        ok: boolean;
        pedido_id: number;
        status: string;
    }>;
    confirmarColeta(id: number, body: {
        barcode: string;
    }, req: any): Promise<{
        ok: boolean;
        pedido_id: number;
        status: string;
        troco: number;
    }>;
    localizacao(id: number, body: {
        lat: number;
        lng: number;
    }, req: any): Promise<{
        ok: boolean;
    }>;
    entregar(id: number, body: {
        entrega_pagamento?: {
            metodo: string;
            dinheiro?: number;
            pix?: number;
        };
    }, req: any): Promise<{
        ok: boolean;
        pedido_id: number;
        status: string;
    }>;
    comprovante(id: number, body: {
        base64: string;
    }, req: any): Promise<{
        url: string;
    }>;
    ocorrencia(id: number, body: {
        tipo: 'pendente' | 'cancelada';
        motivo: string;
    }, req: any): Promise<{
        ok: boolean;
        pedido_id: number;
        tipo: "pendente" | "cancelada";
        status: any;
    }>;
}
