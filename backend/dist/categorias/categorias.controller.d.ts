import { CategoriasService } from './categorias.service';
export declare class CategoriasController {
    private service;
    constructor(service: CategoriasService);
    listar(empresaId: number): Promise<{
        categorias: {
            total_produtos: number;
            id: any;
            name: any;
            restaurant_id: any;
            created_at: any;
        }[];
        total: number;
    }>;
    criar(body: {
        name: string;
        restaurant_id: number;
    }): Promise<any>;
    atualizar(id: number, body: {
        name: string;
    }): Promise<any>;
    remover(id: number): Promise<{
        mensagem: string;
    }>;
}
