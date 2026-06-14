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
exports.CozinhaGuard = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let CozinhaGuard = class CozinhaGuard {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const token = request.headers['x-cozinha-token'];
        if (!token)
            throw new common_1.UnauthorizedException('Token de cozinha necessário');
        const { data } = await this.supabase.client
            .from('restaurants')
            .select('id, name')
            .eq('cozinha_token', token)
            .maybeSingle();
        if (!data)
            throw new common_1.UnauthorizedException('Token inválido');
        request.cozinhaRestaurantId = data.id;
        request.cozinhaRestaurantName = data.name;
        return true;
    }
};
exports.CozinhaGuard = CozinhaGuard;
exports.CozinhaGuard = CozinhaGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], CozinhaGuard);
//# sourceMappingURL=cozinha.guard.js.map