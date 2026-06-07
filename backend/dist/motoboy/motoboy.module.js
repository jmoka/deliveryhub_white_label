"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MotoboyModule = void 0;
const common_1 = require("@nestjs/common");
const motoboy_service_1 = require("./motoboy.service");
const restaurante_motoboys_controller_1 = require("./restaurante-motoboys.controller");
const motoboy_portal_controller_1 = require("./motoboy-portal.controller");
const auth_module_1 = require("../auth/auth.module");
const supabase_module_1 = require("../supabase/supabase.module");
let MotoboyModule = class MotoboyModule {
};
exports.MotoboyModule = MotoboyModule;
exports.MotoboyModule = MotoboyModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, supabase_module_1.SupabaseModule],
        controllers: [restaurante_motoboys_controller_1.RestauranteMotoboysController, motoboy_portal_controller_1.MotoboyPortalController],
        providers: [motoboy_service_1.MotoboyService],
        exports: [motoboy_service_1.MotoboyService],
    })
], MotoboyModule);
//# sourceMappingURL=motoboy.module.js.map