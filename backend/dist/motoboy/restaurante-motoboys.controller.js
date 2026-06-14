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
exports.RestauranteMotoboysController = void 0;
const common_1 = require("@nestjs/common");
const restaurant_owner_guard_1 = require("../auth/restaurant-owner.guard");
const motoboy_service_1 = require("./motoboy.service");
let RestauranteMotoboysController = class RestauranteMotoboysController {
    service;
    constructor(service) {
        this.service = service;
    }
    listar(req) {
        return this.service.listar(req.restaurantId);
    }
    criar(req, body) {
        return this.service.criar(req.restaurantId, body);
    }
    renovarToken(id, req) {
        return this.service.renovarToken(id, req.restaurantId);
    }
    toggle(id, body, req) {
        return this.service.toggle(id, req.restaurantId, body.ativo);
    }
    atribuir(pedidoId, body, req) {
        return this.service.atribuir(pedidoId, req.restaurantId, body.motoboy_id);
    }
};
exports.RestauranteMotoboysController = RestauranteMotoboysController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RestauranteMotoboysController.prototype, "listar", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RestauranteMotoboysController.prototype, "criar", null);
__decorate([
    (0, common_1.Patch)(':id/renovar-token'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], RestauranteMotoboysController.prototype, "renovarToken", null);
__decorate([
    (0, common_1.Patch)(':id/toggle'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], RestauranteMotoboysController.prototype, "toggle", null);
__decorate([
    (0, common_1.Patch)(':pedidoId/atribuir'),
    __param(0, (0, common_1.Param)('pedidoId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], RestauranteMotoboysController.prototype, "atribuir", null);
exports.RestauranteMotoboysController = RestauranteMotoboysController = __decorate([
    (0, common_1.Controller)('restaurante/motoboys'),
    (0, common_1.UseGuards)(restaurant_owner_guard_1.RestaurantOwnerGuard),
    __metadata("design:paramtypes", [motoboy_service_1.MotoboyService])
], RestauranteMotoboysController);
//# sourceMappingURL=restaurante-motoboys.controller.js.map