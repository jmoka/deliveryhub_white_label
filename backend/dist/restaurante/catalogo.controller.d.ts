import { SupabaseService } from '../supabase/supabase.service';
export declare class CatalogoController {
    private supabase;
    constructor(supabase: SupabaseService);
    getAcesso(): Promise<{
        lan_ips: string[];
        porta: number;
        cloudflare_domain: any;
    }>;
    listarRestaurantes(): Promise<{
        restaurantes: {
            id: any;
            name: any;
            address: any;
            logo_url: any;
            slug: any;
            aparencia: any;
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
            restaurant_id: any;
            tags: any;
            destaque: any;
            is_active: any;
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
            frete_motoboy: any;
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
                restaurant_id: any;
                tags: any;
                destaque: any;
                is_active: any;
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
            restaurant_id: any;
            tags: any;
            destaque: any;
            is_active: any;
        }[];
        promos: {
            id: any;
            name: any;
            description: any;
            price: any;
            preco_promo: any;
            image_url: any;
            category_id: any;
            restaurant_id: any;
            tags: any;
            destaque: any;
            is_active: any;
        }[];
        combos: any[];
    }>;
}
