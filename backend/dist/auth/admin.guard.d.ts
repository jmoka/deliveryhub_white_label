import { CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtGuard } from './jwt.guard';
import { SupabaseService } from '../supabase/supabase.service';
export declare class AdminGuard implements CanActivate {
    private jwtGuard;
    private supabase;
    constructor(jwtGuard: JwtGuard, supabase: SupabaseService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
