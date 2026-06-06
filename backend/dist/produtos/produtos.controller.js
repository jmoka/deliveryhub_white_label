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
exports.ProdutosController = void 0;
const common_1 = require("@nestjs/common");
const produtos_service_1 = require("./produtos.service");
const admin_guard_1 = require("../auth/admin.guard");
let ProdutosController = class ProdutosController {
    service;
    constructor(service) {
        this.service = service;
    }
    listar(empresaId, apenasAtivos) {
        return this.service.listarPorEmpresa(empresaId, apenasAtivos === 'true');
    }
    buscar(id) {
        return this.service.buscar(id);
    }
    criar(body) {
        return this.service.criar(body);
    }
    atualizar(id, body) {
        return this.service.atualizar(id, body);
    }
    toggle(id, body) {
        return this.service.toggleAtivo(id, body.ativo);
    }
    remover(id) {
        return this.service.remover(id);
    }
};
exports.ProdutosController = ProdutosController;
__decorate([
    (0, common_1.Get)('empresas/:empresaId/produtos'),
    __param(0, (0, common_1.Param)('empresaId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('apenas_ativos')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", void 0)
], ProdutosController.prototype, "listar", null);
__decorate([
    (0, common_1.Get)('produtos/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ProdutosController.prototype, "buscar", null);
__decorate([
    (0, common_1.Post)('produtos'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProdutosController.prototype, "criar", null);
__decorate([
    (0, common_1.Patch)('produtos/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], ProdutosController.prototype, "atualizar", null);
__decorate([
    (0, common_1.Patch)('produtos/:id/toggle'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], ProdutosController.prototype, "toggle", null);
__decorate([
    (0, common_1.Delete)('produtos/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ProdutosController.prototype, "remover", null);
exports.ProdutosController = ProdutosController = __decorate([
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __metadata("design:paramtypes", [produtos_service_1.ProdutosService])
], ProdutosController);
//# sourceMappingURL=produtos.controller.js.map