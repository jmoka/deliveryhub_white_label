import { TagsService } from './tags.service';
export declare class TagsPublicoController {
    private service;
    constructor(service: TagsService);
    listar(): Promise<{
        tags: any[];
    }>;
    carrosseis(restaurantId: number): Promise<{
        tag: any;
        produtos: any[];
    }[]>;
}
export declare class TagsAdminController {
    private service;
    constructor(service: TagsService);
    listarTodas(): Promise<{
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
}
