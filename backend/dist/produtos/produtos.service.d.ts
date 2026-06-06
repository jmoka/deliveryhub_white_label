import { SupabaseService } from '../supabase/supabase.service';
export declare class ProdutosService {
    private supabase;
    constructor(supabase: SupabaseService);
    listarPorEmpresa(empresaId: number, apenasAtivos?: boolean): Promise<{
        produtos: {
            id: any;
            name: any;
            description: any;
            price: any;
            image_url: any;
            is_active: any;
            category_id: any;
            created_at: any;
        }[];
        total: number;
    }>;
    buscar(id: number): Promise<{
        id: any;
        name: any;
        description: any;
        price: any;
        image_url: any;
        is_active: any;
        category_id: any;
        created_at: any;
    }>;
    criar(body: {
        name: string;
        description?: string;
        price: number;
        image_url?: string;
        category_id: number;
    }): Promise<any>;
    atualizar(id: number, body: Partial<{
        name: string;
        description: string;
        price: number;
        image_url: string;
        category_id: number;
    }>): Promise<any>;
    toggleAtivo(id: number, ativo: boolean): Promise<{
        id: any;
        name: any;
        is_active: any;
    }>;
    remover(id: number): Promise<{
        mensagem: string;
    }>;
}
