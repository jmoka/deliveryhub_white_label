import { RestauranteService } from './restaurante.service';
export declare class CozinhaPortalController {
    private service;
    constructor(service: RestauranteService);
    me(req: any): {
        restaurante: {
            id: any;
            name: any;
        };
    };
    pedidos(req: any): Promise<{
        pedidos: any[];
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
}
