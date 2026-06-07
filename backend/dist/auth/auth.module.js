"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_guard_1 = require("./jwt.guard");
const admin_guard_1 = require("./admin.guard");
const restaurant_owner_guard_1 = require("./restaurant-owner.guard");
const motoboy_guard_1 = require("./motoboy.guard");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        providers: [jwt_guard_1.JwtGuard, admin_guard_1.AdminGuard, restaurant_owner_guard_1.RestaurantOwnerGuard, motoboy_guard_1.MotoboyGuard],
        exports: [jwt_guard_1.JwtGuard, admin_guard_1.AdminGuard, restaurant_owner_guard_1.RestaurantOwnerGuard, motoboy_guard_1.MotoboyGuard],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map