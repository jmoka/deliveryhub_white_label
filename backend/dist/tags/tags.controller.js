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
exports.TagsAdminController = exports.TagsPublicoController = void 0;
const common_1 = require("@nestjs/common");
const tags_service_1 = require("./tags.service");
const admin_guard_1 = require("../auth/admin.guard");
let TagsPublicoController = class TagsPublicoController {
    service;
    constructor(service) {
        this.service = service;
    }
    listar() {
        return this.service.listar(true);
    }
    carrosseis(restaurantId) {
        return this.service.getCarrosseis(restaurantId);
    }
};
exports.TagsPublicoController = TagsPublicoController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TagsPublicoController.prototype, "listar", null);
__decorate([
    (0, common_1.Get)('carrosseis/:restaurantId'),
    __param(0, (0, common_1.Param)('restaurantId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], TagsPublicoController.prototype, "carrosseis", null);
exports.TagsPublicoController = TagsPublicoController = __decorate([
    (0, common_1.Controller)('tags'),
    __metadata("design:paramtypes", [tags_service_1.TagsService])
], TagsPublicoController);
let TagsAdminController = class TagsAdminController {
    service;
    constructor(service) {
        this.service = service;
    }
    listarTodas() {
        return this.service.listar(false);
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
exports.TagsAdminController = TagsAdminController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TagsAdminController.prototype, "listarTodas", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TagsAdminController.prototype, "criar", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], TagsAdminController.prototype, "atualizar", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], TagsAdminController.prototype, "remover", null);
exports.TagsAdminController = TagsAdminController = __decorate([
    (0, common_1.Controller)('admin/tags'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __metadata("design:paramtypes", [tags_service_1.TagsService])
], TagsAdminController);
//# sourceMappingURL=tags.controller.js.map