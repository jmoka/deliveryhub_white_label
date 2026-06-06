"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const path_1 = require("path");
const supabase_module_1 = require("./supabase/supabase.module");
const auth_module_1 = require("./auth/auth.module");
const mcp_module_1 = require("./mcp/mcp.module");
const empresas_module_1 = require("./empresas/empresas.module");
const categorias_module_1 = require("./categorias/categorias.module");
const produtos_module_1 = require("./produtos/produtos.module");
const pedidos_module_1 = require("./pedidos/pedidos.module");
const plataforma_module_1 = require("./plataforma/plataforma.module");
const pagamentos_module_1 = require("./pagamentos/pagamentos.module");
const restaurante_module_1 = require("./restaurante/restaurante.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: [
                    (0, path_1.join)(__dirname, '..', '.env'),
                    (0, path_1.join)(__dirname, '..', '..', '.env'),
                    '.env',
                ],
            }),
            supabase_module_1.SupabaseModule,
            auth_module_1.AuthModule,
            mcp_module_1.McpModule,
            empresas_module_1.EmpresasModule,
            categorias_module_1.CategoriasModule,
            produtos_module_1.ProdutosModule,
            pedidos_module_1.PedidosModule,
            plataforma_module_1.PlataformaModule,
            pagamentos_module_1.PagamentosModule,
            restaurante_module_1.RestauranteModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map