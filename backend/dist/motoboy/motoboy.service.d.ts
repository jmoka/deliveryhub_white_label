import { SupabaseService } from '../supabase/supabase.service';
export declare class MotoboyService {
    private supabase;
    constructor(supabase: SupabaseService);
    listar(restaurantId: number): Promise<{
        motoboys: {
            id: any;
            name: any;
            phone: any;
            access_token: any;
            is_active: any;
            created_at: any;
        }[];
    }>;
    criar(restaurantId: number, body: {
        name: string;
        phone?: string;
    }): Promise<any>;
    toggle(id: number, restaurantId: number, ativo: boolean): Promise<any>;
    atribuir(pedidoId: number, restaurantId: number, motoboyId: number): Promise<{
        ok: boolean;
        status: string;
    }>;
    meusPedidos(motoboyId: number): Promise<{
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
    atualizarLocalizacao(pedidoId: number, motoboyId: number, lat: number, lng: number): Promise<{
        ok: boolean;
    }>;
    confirmarEntrega(pedidoId: number, motoboyId: number): Promise<{
        ok: boolean;
        pedido_id: number;
        status: string;
    }>;
    infoMotoboy(motoboyId: number): Promise<{
        id: any;
        name: any;
        phone: any;
        restaurant_id: any;
    } | null>;
}
