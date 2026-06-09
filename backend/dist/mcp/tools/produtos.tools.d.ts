import { SupabaseClient } from '@supabase/supabase-js';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
export declare const produtosToolDefinitions: Tool[];
export declare function executarProdutosTool(nome: string, args: Record<string, any>, supabase: SupabaseClient): Promise<{
    produtos: {
        id: any;
        name: any;
        description: any;
        price: any;
        is_active: any;
        category_id: any;
        image_url: any;
    }[];
    total: number;
} | {
    categorias: any[];
    total: number;
} | null>;
