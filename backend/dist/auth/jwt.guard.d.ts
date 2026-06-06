import { CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class JwtGuard implements CanActivate {
    private config;
    private jwksClient;
    constructor(config: ConfigService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
