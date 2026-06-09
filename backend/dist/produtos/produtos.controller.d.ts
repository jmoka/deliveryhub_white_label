import { ProdutosService } from './produtos.service';
export declare class ProdutosController {
    private service;
    constructor(service: ProdutosService);
    listar(empresaId: number, apenasAtivos?: string): Promise<{
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
    atualizar(id: number, body: any): Promise<any>;
    toggle(id: number, body: {
        ativo: boolean;
    }): Promise<{
        id: any;
        name: any;
        is_active: any;
    }>;
    remover(id: number): Promise<{
        mensagem: string;
    }>;
}
