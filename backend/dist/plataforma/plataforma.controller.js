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
exports.PlataformaController = void 0;
const common_1 = require("@nestjs/common");
const plataforma_service_1 = require("./plataforma.service");
const admin_guard_1 = require("../auth/admin.guard");
let PlataformaController = class PlataformaController {
    service;
    constructor(service) {
        this.service = service;
    }
    metricas() {
        return this.service.metricas();
    }
    comissoes(empresaId, dataInicio, dataFim, limite) {
        return this.service.comissoes({
            empresa_id: empresaId ? parseInt(empresaId) : undefined,
            data_inicio: dataInicio,
            data_fim: dataFim,
            limite: limite ? parseInt(limite) : undefined,
        });
    }
    comissoesPorEmpresa(id) {
        return this.service.comissoesPorEmpresa(id);
    }
};
exports.PlataformaController = PlataformaController;
__decorate([
    (0, common_1.Get)('metricas'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PlataformaController.prototype, "metricas", null);
__decorate([
    (0, common_1.Get)('comissoes'),
    __param(0, (0, common_1.Query)('empresa_id')),
    __param(1, (0, common_1.Query)('data_inicio')),
    __param(2, (0, common_1.Query)('data_fim')),
    __param(3, (0, common_1.Query)('limite')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], PlataformaController.prototype, "comissoes", null);
__decorate([
    (0, common_1.Get)('comissoes/empresa/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PlataformaController.prototype, "comissoesPorEmpresa", null);
exports.PlataformaController = PlataformaController = __decorate([
    (0, common_1.Controller)('plataforma'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __metadata("design:paramtypes", [plataforma_service_1.PlataformaService])
], PlataformaController);
//# sourceMappingURL=plataforma.controller.js.map