import { PerfilService } from './perfil.service';
export declare class PerfilController {
    private service;
    constructor(service: PerfilService);
    get(req: any): Promise<{
        id: any;
        name: any;
        email: any;
        phone_e164: any;
        address_json: any;
    } | null>;
    update(req: any, body: {
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
