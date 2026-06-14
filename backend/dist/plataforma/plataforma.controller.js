"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlataformaController = void 0;
const common_1 = require("@nestjs/common");
const os = __importStar(require("os"));
const plataforma_service_1 = require("./plataforma.service");
const admin_guard_1 = require("../auth/admin.guard");
const update_config_dto_1 = require("./update-config.dto");
let PlataformaController = class PlataformaController {
    service;
    constructor(service) {
        this.service = service;
    }
    getConfig() {
        return this.service.getConfig();
    }
    updateConfig(body) {
        return this.service.updateConfig(body);
    }
    getRede() {
        const nets = os.networkInterfaces();
        const todos = [];
        for (const iface of Object.values(nets)) {
            for (const net of iface ?? []) {
                if (net.family === 'IPv4' && !net.internal)
                    todos.push(net.address);
            }
        }
        const score = (ip) => {
            if (/^192\.168\./.test(ip))
                return 0;
            if (/^10\./.test(ip))
                return 1;
            if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip))
                return 99;
            return 2;
        };
        const ips = todos.sort((a, b) => score(a) - score(b));
        return { ips, porta: 4028 };
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
    (0, common_1.Get)('config'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PlataformaController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Patch)('config'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_config_dto_1.UpdateConfigDto]),
    __metadata("design:returntype", void 0)
], PlataformaController.prototype, "updateConfig", null);
__decorate([
    (0, common_1.Get)('rede'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PlataformaController.prototype, "getRede", null);
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