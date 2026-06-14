import { MotoboyService } from './motoboy.service';
export declare class RestauranteMotoboysController {
    private service;
    constructor(service: MotoboyService);
    listar(req: any): Promise<{
        motoboys: {
            id: any;
            name: any;
            phone: any;
            access_token: any;
            is_active: any;
            created_at: any;
        }[];
    }>;
    criar(req: any, body: {
        name: string;
        phone?: string;
    }): Promise<any>;
    renovarToken(id: number, req: any): Promise<{
        id: any;
        name: any;
        phone: any;
        access_token: any;
        is_active: any;
    }>;
    toggle(id: number, body: {
        ativo: boolean;
    }, req: any): Promise<any>;
    atribuir(pedidoId: number, body: {
        motoboy_id: number;
    }, req: any): Promise<{
        ok: boolean;
        status: string;
    }>;
}
