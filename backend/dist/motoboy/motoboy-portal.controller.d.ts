import { MotoboyService } from './motoboy.service';
export declare class MotoboyPortalController {
    private service;
    constructor(service: MotoboyService);
    me(req: any): Promise<{
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
    }>;
    localizacao(id: number, body: {
        lat: number;
        lng: number;
    }, req: any): Promise<{
        ok: boolean;
    }>;
    entregar(id: number, req: any): Promise<{
        ok: boolean;
        pedido_id: number;
        status: string;
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
