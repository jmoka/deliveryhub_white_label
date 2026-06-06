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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingController = void 0;
const common_1 = require("@nestjs/common");
const jwt_guard_1 = require("../auth/jwt.guard");
const supabase_service_1 = require("../supabase/supabase.service");
let OnboardingController = class OnboardingController {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    async registrar(req, body) {
        const userId = req.userId;
        const { data: existing } = await this.supabase.client
            .from('restaurants')
            .select('id, name')
            .eq('user_id', userId)
            .maybeSingle();
        if (existing)
            return { restaurant: existing, already_registered: true };
        const { data: restaurant, error } = await this.supabase.client
            .from('restaurants')
            .insert({
            name: body.name,
            address: body.address ?? null,
            business_hours: body.business_hours ?? {},
            user_id: userId,
            comissao_pct: 5.0,
        })
            .select()
            .single();
        if (error)
            throw error;
        await this.supabase.client
            .from('user_profiles')
            .update({ role: 'restaurant_owner', updated_at: new Date().toISOString() })
            .eq('id', userId);
        return { restaurant };
    }
};
exports.OnboardingController = OnboardingController;
__decorate([
    (0, common_1.Post)('registrar'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OnboardingController.prototype, "registrar", null);
exports.OnboardingController = OnboardingController = __decorate([
    (0, common_1.Controller)('restaurante'),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], OnboardingController);
//# sourceMappingURL=onboarding.controller.js.map