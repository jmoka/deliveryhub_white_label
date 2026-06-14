import { SupabaseService } from '../supabase/supabase.service';
export declare class TagsService {
    private supabase;
    constructor(supabase: SupabaseService);
    listar(apenasAtivas?: boolean): Promise<{
        tags: any[];
    }>;
    criar(body: {
        name: string;
        slug: string;
        descricao?: string;
        is_auto?: boolean;
        ordem?: number;
    }): Promise<any>;
    atualizar(id: number, body: Partial<{
        name: string;
        descricao: string;
        ordem: number;
        ativo: boolean;
    }>): Promise<any>;
    remover(id: number): Promise<{
        ok: boolean;
    }>;
    getCarrosseis(restaurantId: number): Promise<{
        tag: any;
        produtos: any[];
    }[]>;
}
