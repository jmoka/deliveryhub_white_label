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
exports.RestauranteController = void 0;
const common_1 = require("@nestjs/common");
const restaurante_service_1 = require("./restaurante.service");
const restaurant_owner_guard_1 = require("../auth/restaurant-owner.guard");
let RestauranteController = class RestauranteController {
    service;
    constructor(service) {
        this.service = service;
    }
    minhaEmpresa(req) {
        return this.service.minhaEmpresa(req.userId);
    }
    updateEmpresa(req, body) {
        return this.service.updateEmpresa(req.restaurantId, body);
    }
    meusPedidos(req, status, limite) {
        return this.service.meusPedidos(req.restaurantId, {
            status,
            limite: limite ? parseInt(limite) : undefined,
        });
    }
    atualizarStatus(id, body, req) {
        return this.service.atualizarStatusPedido(id, req.restaurantId, body.status);
    }
    meusProdutos(req) {
        return this.service.meusProdutos(req.restaurantId);
    }
    criarProduto(req, body) {
        return this.service.criarProduto(req.restaurantId, body);
    }
    toggleProduto(id, body, req) {
        return this.service.toggleProduto(id, req.restaurantId, body.ativo);
    }
    minhasCategorias(req) {
        return this.service.minhasCategorias(req.restaurantId);
    }
    criarCategoria(req, body) {
        return this.service.criarCategoria(req.restaurantId, body);
    }
    listarClientes(req, busca, limite) {
        return this.service.listarClientes(req.restaurantId, {
            busca,
            limite: limite ? parseInt(limite) : undefined,
        });
    }
    criarCliente(req, body) {
        return this.service.criarCliente(req.restaurantId, body);
    }
    atualizarCliente(id, body, req) {
        return this.service.atualizarCliente(id, req.restaurantId, body);
    }
    getAparencia(req) {
        return this.service.getAparencia(req.restaurantId);
    }
    updateAparencia(req, body) {
        return this.service.updateAparencia(req.restaurantId, body);
    }
    getConfig(req) {
        return this.service.getConfig(req.restaurantId);
    }
    updateConfig(req, body) {
        return this.service.updateConfig(req.restaurantId, body);
    }
    toggleStatus(req, body) {
        return this.service.toggleStatus(req.restaurantId, body.aberto);
    }
    getCaixa(req) {
        return this.service.getCaixa(req.restaurantId);
    }
    abrirCaixa(req, body) {
        return this.service.abrirCaixa(req.restaurantId, body.valor_inicial ?? 0);
    }
    fecharCaixa(req) {
        return this.service.fecharCaixa(req.restaurantId);
    }
    adicionarSaida(req, body) {
        return this.service.adicionarSaida(req.restaurantId, body);
    }
    buscarPedidoDetalhe(id, req) {
        return this.service.buscarPedidoDoRestaurante(req.restaurantId, id);
    }
};
exports.RestauranteController = RestauranteController;
__decorate([
    (0, common_1.Get)('minha-empresa'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "minhaEmpresa", null);
__decorate([
    (0, common_1.Patch)('minha-empresa'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "updateEmpresa", null);
__decorate([
    (0, common_1.Get)('pedidos'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('limite')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "meusPedidos", null);
__decorate([
    (0, common_1.Patch)('pedidos/:id/status'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "atualizarStatus", null);
__decorate([
    (0, common_1.Get)('produtos'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "meusProdutos", null);
__decorate([
    (0, common_1.Post)('produtos'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "criarProduto", null);
__decorate([
    (0, common_1.Patch)('produtos/:id/toggle'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "toggleProduto", null);
__decorate([
    (0, common_1.Get)('categorias'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "minhasCategorias", null);
__decorate([
    (0, common_1.Post)('categorias'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "criarCategoria", null);
__decorate([
    (0, common_1.Get)('clientes'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('busca')),
    __param(2, (0, common_1.Query)('limite')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "listarClientes", null);
__decorate([
    (0, common_1.Post)('clientes'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "criarCliente", null);
__decorate([
    (0, common_1.Patch)('clientes/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "atualizarCliente", null);
__decorate([
    (0, common_1.Get)('aparencia'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "getAparencia", null);
__decorate([
    (0, common_1.Patch)('aparencia'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "updateAparencia", null);
__decorate([
    (0, common_1.Get)('config'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Patch)('config'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "updateConfig", null);
__decorate([
    (0, common_1.Patch)('status'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "toggleStatus", null);
__decorate([
    (0, common_1.Get)('caixa'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "getCaixa", null);
__decorate([
    (0, common_1.Post)('caixa/abrir'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "abrirCaixa", null);
__decorate([
    (0, common_1.Post)('caixa/fechar'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "fecharCaixa", null);
__decorate([
    (0, common_1.Post)('caixa/saida'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "adicionarSaida", null);
__decorate([
    (0, common_1.Get)('pedidos/:id/detalhe'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "buscarPedidoDetalhe", null);
exports.RestauranteController = RestauranteController = __decorate([
    (0, common_1.Controller)('restaurante'),
    (0, common_1.UseGuards)(restaurant_owner_guard_1.RestaurantOwnerGuard),
    __metadata("design:paramtypes", [restaurante_service_1.RestauranteService])
], RestauranteController);
//# sourceMappingURL=restaurante.controller.js.map