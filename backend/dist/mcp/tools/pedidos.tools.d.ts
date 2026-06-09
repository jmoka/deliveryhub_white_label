import { SupabaseClient } from '@supabase/supabase-js';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
export declare const pedidosToolDefinitions: Tool[];
export declare function executarPedidosTool(nome: string, args: Record<string, any>, supabase: SupabaseClient): Promise<{
    pedidos: {
        id: any;
        total: any;
        status: any;
        payment_method: any;
        created_at: any;
        customer_id: any;
    }[];
    total: number;
} | {
    erro: string;
    pedido?: undefined;
    itens?: undefined;
    cliente?: undefined;
} | {
    pedido: {
        id: any;
        total: any;
        status: any;
        payment_method: any;
        created_at: any;
        restaurant_id: any;
        customer_id: any;
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
    } | null;
    erro?: undefined;
} | {
    total_pedidos: number;
    entregues: number;
    cancelados: number;
    faturamento: any;
    ticket_medio: number;
} | null>;
