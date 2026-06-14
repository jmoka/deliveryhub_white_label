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
exports.MotoboyPortalController = void 0;
const common_1 = require("@nestjs/common");
const motoboy_guard_1 = require("../auth/motoboy.guard");
const motoboy_service_1 = require("./motoboy.service");
let MotoboyPortalController = class MotoboyPortalController {
    service;
    constructor(service) {
        this.service = service;
    }
    me(req) {
        return this.service.infoMotoboy(req.motoboyId);
    }
    disponiveis(req) {
        return this.service.pedidosDisponiveis(req.motoboyId);
    }
    pedidos(req) {
        return this.service.meusPedidos(req.motoboyId);
    }
    pegar(id, req) {
        return this.service.pegarPedido(id, req.motoboyId);
    }
    reivindicar(id, req) {
        return this.service.reivindicarPedido(id, req.motoboyId);
    }
    confirmarColeta(id, body, req) {
        return this.service.confirmarColeta(id, req.motoboyId, body.barcode);
    }
    localizacao(id, body, req) {
        return this.service.atualizarLocalizacao(id, req.motoboyId, body.lat, body.lng);
    }
    entregar(id, body, req) {
        return this.service.confirmarEntrega(id, req.motoboyId, body?.entrega_pagamento);
    }
    comprovante(id, body, req) {
        return this.service.uploadComprovante(id, req.motoboyId, body.base64);
    }
    ocorrencia(id, body, req) {
        return this.service.registrarOcorrencia(id, req.motoboyId, body.tipo, body.motivo);
    }
};
exports.MotoboyPortalController = MotoboyPortalController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MotoboyPortalController.prototype, "me", null);
__decorate([
    (0, common_1.Get)('pedidos/disponiveis'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MotoboyPortalController.prototype, "disponiveis", null);
__decorate([
    (0, common_1.Get)('pedidos'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MotoboyPortalController.prototype, "pedidos", null);
__decorate([
    (0, common_1.Post)('pedidos/:id/pegar'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], MotoboyPortalController.prototype, "pegar", null);
__decorate([
    (0, common_1.Post)('pedidos/:id/reivindicar'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], MotoboyPortalController.prototype, "reivindicar", null);
__decorate([
    (0, common_1.Post)('pedidos/:id/confirmar-coleta'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], MotoboyPortalController.prototype, "confirmarColeta", null);
__decorate([
    (0, common_1.Patch)('pedidos/:id/localizacao'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], MotoboyPortalController.prototype, "localizacao", null);
__decorate([
    (0, common_1.Post)('pedidos/:id/entregar'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], MotoboyPortalController.prototype, "entregar", null);
__decorate([
    (0, common_1.Post)('pedidos/:id/comprovante'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], MotoboyPortalController.prototype, "comprovante", null);
__decorate([
    (0, common_1.Post)('pedidos/:id/ocorrencia'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], MotoboyPortalController.prototype, "ocorrencia", null);
exports.MotoboyPortalController = MotoboyPortalController = __decorate([
    (0, common_1.Controller)('motoboy'),
    (0, common_1.UseGuards)(motoboy_guard_1.MotoboyGuard),
    __metadata("design:paramtypes", [motoboy_service_1.MotoboyService])
], MotoboyPortalController);
//# sourceMappingURL=motoboy-portal.controller.js.map