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
    pedidos(req: any): Promise<{
        pedidos: ({
            id: any;
            total: any;
            status: any;
            payment_method: any;
            created_at: any;
            updated_at: any;
            motoboy_lat: any;
            motoboy_lng: any;
            customer_id: any;
        } | {
            cliente: {
                name: any;
                phone_e164: any;
                address_json: any;
            } | null;
            id: any;
            total: any;
            status: any;
            payment_method: any;
            created_at: any;
            updated_at: any;
            motoboy_lat: any;
            motoboy_lng: any;
            customer_id: any;
        })[];
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
}
