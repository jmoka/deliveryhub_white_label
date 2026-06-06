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
exports.RestaurantOwnerGuard = void 0;
const common_1 = require("@nestjs/common");
const jwt_guard_1 = require("./jwt.guard");
const supabase_service_1 = require("../supabase/supabase.service");
let RestaurantOwnerGuard = class RestaurantOwnerGuard {
    jwtGuard;
    supabase;
    constructor(jwtGuard, supabase) {
        this.jwtGuard = jwtGuard;
        this.supabase = supabase;
    }
    async canActivate(context) {
        await this.jwtGuard.canActivate(context);
        const request = context.switchToHttp().getRequest();
        const userId = request.userId;
        const { data } = await this.supabase.client
            .from('restaurants')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();
        if (!data) {
            throw new common_1.ForbiddenException('Nenhum restaurante vinculado a este usuário');
        }
        request.restaurantId = data.id;
        return true;
    }
};
exports.RestaurantOwnerGuard = RestaurantOwnerGuard;
exports.RestaurantOwnerGuard = RestaurantOwnerGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_guard_1.JwtGuard,
        supabase_service_1.SupabaseService])
], RestaurantOwnerGuard);
//# sourceMappingURL=restaurant-owner.guard.js.map