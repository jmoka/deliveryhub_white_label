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
exports.CozinhaPortalController = void 0;
const common_1 = require("@nestjs/common");
const cozinha_guard_1 = require("../auth/cozinha.guard");
const restaurante_service_1 = require("./restaurante.service");
let CozinhaPortalController = class CozinhaPortalController {
    service;
    constructor(service) {
        this.service = service;
    }
    me(req) {
        return { restaurante: { id: req.cozinhaRestaurantId, name: req.cozinhaRestaurantName } };
    }
    pedidos(req) {
        return this.service.getCozinha(req.cozinhaRestaurantId);
    }
    atualizarStatus(id, body, req) {
        return this.service.atualizarStatusPedido(id, req.cozinhaRestaurantId, body.status);
    }
};
exports.CozinhaPortalController = CozinhaPortalController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CozinhaPortalController.prototype, "me", null);
__decorate([
    (0, common_1.Get)('pedidos'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CozinhaPortalController.prototype, "pedidos", null);
__decorate([
    (0, common_1.Patch)('pedidos/:id/status'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], CozinhaPortalController.prototype, "atualizarStatus", null);
exports.CozinhaPortalController = CozinhaPortalController = __decorate([
    (0, common_1.Controller)('cozinha-portal'),
    (0, common_1.UseGuards)(cozinha_guard_1.CozinhaGuard),
    __metadata("design:paramtypes", [restaurante_service_1.RestauranteService])
], CozinhaPortalController);
//# sourceMappingURL=cozinha-portal.controller.js.map