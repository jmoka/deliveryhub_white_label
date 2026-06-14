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
    renovarToken(id: number, restaurantId: number): Promise<{
        id: any;
        name: any;
        phone: any;
        access_token: any;
        is_active: any;
    }>;
    toggle(id: number, restaurantId: number, ativo: boolean): Promise<any>;
    atribuir(pedidoId: number, restaurantId: number, motoboyId: number): Promise<{
        ok: boolean;
        status: string;
    }>;
    meusPedidos(motoboyId: number): Promise<{
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
    atualizarLocalizacao(pedidoId: number, motoboyId: number, lat: number, lng: number): Promise<{
        ok: boolean;
    }>;
    confirmarEntrega(pedidoId: number, motoboyId: number, entregaPagamento?: {
        metodo: string;
        dinheiro?: number;
        pix?: number;
    }): Promise<{
        ok: boolean;
        pedido_id: number;
        status: string;
    }>;
    registrarOcorrencia(pedidoId: number, motoboyId: number, tipo: 'pendente' | 'cancelada', motivo: string): Promise<{
        ok: boolean;
        pedido_id: number;
        tipo: "pendente" | "cancelada";
        status: any;
    }>;
    pedidosDisponiveis(motoboyId: number): Promise<{
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
    pegarPedido(pedidoId: number, motoboyId: number): Promise<{
        ok: boolean;
        pedido_id: number;
        status: string;
    }>;
    reivindicarPedido(pedidoId: number, motoboyId: number): Promise<{
        ok: boolean;
        pedido_id: number;
        status: string;
    }>;
    confirmarColeta(pedidoId: number, motoboyId: number, barcode: string): Promise<{
        ok: boolean;
        pedido_id: number;
        status: string;
        troco: number;
    }>;
    uploadComprovante(pedidoId: number, motoboyId: number, base64: string): Promise<{
        url: string;
    }>;
    infoMotoboy(motoboyId: number): Promise<{
        restaurante_nome: any;
        restaurante_cidade: null;
        chave_pix: any;
        id: any;
        name: any;
        phone: any;
        restaurant_id: any;
    } | null>;
}
