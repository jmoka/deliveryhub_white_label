"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerfilService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let PerfilService = class PerfilService {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    async getMeuPerfil(userId) {
        const { data } = await this.supabase.client
            .from('customers')
            .select('id, name, email, phone_e164, address_json')
            .eq('user_id', userId)
            .maybeSingle();
        if (data)
            return data;
        const { data: up } = await this.supabase.client
            .from('user_profiles')
            .select('name, email')
            .eq('id', userId)
            .maybeSingle();
        const { data: novo } = await this.supabase.client
            .from('customers')
            .insert({ name: up?.name ?? 'Cliente', email: up?.email ?? null, user_id: userId })
            .select('id, name, email, phone_e164, address_json')
            .single();
        return novo;
    }
    async updateMeuPerfil(userId, body) {
        const { data: existing } = await this.supabase.client
            .from('customers')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();
        if (existing) {
            const { data } = await this.supabase.client
                .from('customers')
                .update({ ...body, updated_at: new Date().toISOString() })
                .eq('id', existing.id)
                .select('id, name, email, phone_e164, address_json')
                .single();
            return data;
        }
        const { data: up } = await this.supabase.client
            .from('user_profiles')
            .select('email')
            .eq('id', userId)
            .maybeSingle();
        const { data } = await this.supabase.client
            .from('customers')
            .insert({ ...body, email: up?.email ?? null, user_id: userId })
            .select('id, name, email, phone_e164, address_json')
            .single();
        return data;
    }
};
exports.PerfilService = PerfilService;
exports.PerfilService = PerfilService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], PerfilService);
//# sourceMappingURL=perfil.service.js.map