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
exports.CategoriasController = void 0;
const common_1 = require("@nestjs/common");
const categorias_service_1 = require("./categorias.service");
const admin_guard_1 = require("../auth/admin.guard");
let CategoriasController = class CategoriasController {
    service;
    constructor(service) {
        this.service = service;
    }
    listarGlobais() {
        return this.service.listarGlobais();
    }
    criarGlobal(body) {
        return this.service.criarGlobal(body);
    }
    atualizarGlobal(id, body) {
        return this.service.atualizarGlobal(id, body);
    }
    removerGlobal(id) {
        return this.service.remover(id);
    }
    listar(empresaId) {
        return this.service.listarPorEmpresa(empresaId);
    }
    criar(body) {
        return this.service.criar(body);
    }
    atualizar(id, body) {
        return this.service.atualizar(id, body);
    }
    remover(id) {
        return this.service.remover(id);
    }
};
exports.CategoriasController = CategoriasController;
__decorate([
    (0, common_1.Get)('categorias/globais'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CategoriasController.prototype, "listarGlobais", null);
__decorate([
    (0, common_1.Post)('categorias/globais'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CategoriasController.prototype, "criarGlobal", null);
__decorate([
    (0, common_1.Patch)('categorias/globais/:id'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], CategoriasController.prototype, "atualizarGlobal", null);
__decorate([
    (0, common_1.Delete)('categorias/globais/:id'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], CategoriasController.prototype, "removerGlobal", null);
__decorate([
    (0, common_1.Get)('empresas/:empresaId/categorias'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Param)('empresaId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], CategoriasController.prototype, "listar", null);
__decorate([
    (0, common_1.Post)('categorias'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CategoriasController.prototype, "criar", null);
__decorate([
    (0, common_1.Patch)('categorias/:id'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], CategoriasController.prototype, "atualizar", null);
__decorate([
    (0, common_1.Delete)('categorias/:id'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], CategoriasController.prototype, "remover", null);
exports.CategoriasController = CategoriasController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [categorias_service_1.CategoriasService])
], CategoriasController);
//# sourceMappingURL=categorias.controller.js.map