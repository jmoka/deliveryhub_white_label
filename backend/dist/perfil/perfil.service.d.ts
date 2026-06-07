import { SupabaseService } from '../supabase/supabase.service';
export declare class PerfilService {
    private supabase;
    constructor(supabase: SupabaseService);
    getMeuPerfil(userId: string): Promise<{
        id: any;
        name: any;
        email: any;
        phone_e164: any;
        address_json: any;
    } | null>;
    updateMeuPerfil(userId: string, body: {
        name?: string;
        phone_e164?: string;
        address_json?: Record<string, any>;
    }): Promise<{
        id: any;
        name: any;
        email: any;
        phone_e164: any;
        address_json: any;
    } | null>;
}
