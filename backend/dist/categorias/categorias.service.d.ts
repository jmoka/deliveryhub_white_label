import { SupabaseService } from '../supabase/supabase.service';
export declare class CategoriasService {
    private supabase;
    constructor(supabase: SupabaseService);
    listarGlobais(): Promise<{
        categorias: {
            total_produtos: number;
            id: any;
            name: any;
            icon_name: any;
            color_primary: any;
            color_secondary: any;
            created_at: any;
        }[];
        total: number;
    }>;
    listarPorEmpresa(empresaId: number): Promise<{
        categorias: {
            total_produtos: number;
            id: any;
            name: any;
            icon_name: any;
            color_primary: any;
            color_secondary: any;
            restaurant_id: any;
            created_at: any;
        }[];
        total: number;
    }>;
    criarGlobal(body: {
        name: string;
        icon_name: string;
        color_primary: string;
        color_secondary: string;
    }): Promise<any>;
    criar(body: {
        name: string;
        restaurant_id: number;
    }): Promise<any>;
    atualizarGlobal(id: number, body: {
        name?: string;
        icon_name?: string;
        color_primary?: string;
        color_secondary?: string;
    }): Promise<any>;
    atualizar(id: number, body: {
        name: string;
    }): Promise<any>;
    remover(id: number): Promise<{
        mensagem: string;
    }>;
}
