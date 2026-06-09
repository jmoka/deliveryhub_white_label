import { SupabaseService } from '../supabase/supabase.service';
export declare class OnboardingController {
    private supabase;
    constructor(supabase: SupabaseService);
    registrar(req: any, body: {
        name: string;
        address?: string;
        business_hours?: object;
    }): Promise<{
        restaurant: {
            id: any;
            name: any;
        };
        already_registered: boolean;
    } | {
        restaurant: any;
        already_registered?: undefined;
    }>;
}
