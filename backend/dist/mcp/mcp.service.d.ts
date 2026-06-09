import { SupabaseService } from '../supabase/supabase.service';
export declare class McpService {
    private supabase;
    private server;
    constructor(supabase: SupabaseService);
    private registrarHandlers;
    conectarStdio(): Promise<void>;
}
