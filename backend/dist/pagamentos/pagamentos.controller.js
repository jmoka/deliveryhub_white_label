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
exports.PagamentosController = void 0;
const common_1 = require("@nestjs/common");
const pagamentos_service_1 = require("./pagamentos.service");
const jwt_guard_1 = require("../auth/jwt.guard");
let PagamentosController = class PagamentosController {
    service;
    constructor(service) {
        this.service = service;
    }
    criarPix(body) {
        return this.service.criarPix(body);
    }
    criarCartao(body) {
        return this.service.criarCartao(body);
    }
    buscarPorPedido(id) {
        return this.service.buscarPorPedido(id);
    }
    webhook(body) {
        return this.service.processarWebhook(body);
    }
};
exports.PagamentosController = PagamentosController;
__decorate([
    (0, common_1.Post)('pix'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PagamentosController.prototype, "criarPix", null);
__decorate([
    (0, common_1.Post)('cartao'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PagamentosController.prototype, "criarCartao", null);
__decorate([
    (0, common_1.Get)('pedido/:id'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtGuard),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PagamentosController.prototype, "buscarPorPedido", null);
__decorate([
    (0, common_1.Post)('webhook'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PagamentosController.prototype, "webhook", null);
exports.PagamentosController = PagamentosController = __decorate([
    (0, common_1.Controller)('pagamentos'),
    __metadata("design:paramtypes", [pagamentos_service_1.PagamentosService])
], PagamentosController);
//# sourceMappingURL=pagamentos.controller.js.map