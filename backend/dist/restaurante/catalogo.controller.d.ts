import { SupabaseService } from '../supabase/supabase.service';
export declare class CatalogoController {
    private supabase;
    constructor(supabase: SupabaseService);
    listarRestaurantes(): Promise<{
        restaurantes: {
            id: any;
            name: any;
            address: any;
            logo_url: any;
            slug: any;
        }[];
    }>;
    todosOsProdutos(): Promise<{
        produtos: {
            restaurante: any;
            id: any;
            name: any;
            description: any;
            price: any;
            preco_promo: any;
            image_url: any;
            category_id: any;
            tipo: any;
            destaque: any;
        }[];
    }>;
    cardapio(slug: string): Promise<{
        restaurante: {
            id: any;
            name: any;
            address: any;
            logo_url: any;
            business_hours: any;
            slug: any;
            aparencia: any;
        };
        cardapio: {
            produtos: {
                id: any;
                name: any;
                description: any;
                price: any;
                preco_promo: any;
                image_url: any;
                category_id: any;
                tipo: any;
                destaque: any;
            }[];
            id: any;
            name: any;
        }[];
        destaques: {
            id: any;
            name: any;
            description: any;
            price: any;
            preco_promo: any;
            image_url: any;
            category_id: any;
            tipo: any;
            destaque: any;
        }[];
        promos: {
            id: any;
            name: any;
            description: any;
            price: any;
            preco_promo: any;
            image_url: any;
            category_id: any;
            tipo: any;
            destaque: any;
        }[];
        combos: {
            id: any;
            name: any;
            description: any;
            price: any;
            preco_promo: any;
            image_url: any;
            category_id: any;
            tipo: any;
            destaque: any;
        }[];
    }>;
}
