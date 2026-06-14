"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestauranteModule = void 0;
const common_1 = require("@nestjs/common");
const restaurante_controller_1 = require("./restaurante.controller");
const onboarding_controller_1 = require("./onboarding.controller");
const catalogo_controller_1 = require("./catalogo.controller");
const cozinha_portal_controller_1 = require("./cozinha-portal.controller");
const restaurante_service_1 = require("./restaurante.service");
const cozinha_guard_1 = require("../auth/cozinha.guard");
const auth_module_1 = require("../auth/auth.module");
const supabase_module_1 = require("../supabase/supabase.module");
const categorias_module_1 = require("../categorias/categorias.module");
const produtos_module_1 = require("../produtos/produtos.module");
const pedidos_module_1 = require("../pedidos/pedidos.module");
let RestauranteModule = class RestauranteModule {
};
exports.RestauranteModule = RestauranteModule;
exports.RestauranteModule = RestauranteModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, supabase_module_1.SupabaseModule, categorias_module_1.CategoriasModule, produtos_module_1.ProdutosModule, pedidos_module_1.PedidosModule],
        controllers: [restaurante_controller_1.RestauranteController, onboarding_controller_1.OnboardingController, catalogo_controller_1.CatalogoController, cozinha_portal_controller_1.CozinhaPortalController],
        providers: [restaurante_service_1.RestauranteService, cozinha_guard_1.CozinhaGuard],
    })
], RestauranteModule);
//# sourceMappingURL=restaurante.module.js.map