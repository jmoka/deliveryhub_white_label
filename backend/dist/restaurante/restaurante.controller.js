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
const platform_express_1 = require("@nestjs/platform-express");
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
    cancelarPedido(id, body, req) {
        return this.service.cancelarPedidoAdmin(req.restaurantId, id, body.motivo);
    }
    setFreteGratis(id, req) {
        return this.service.setFreteGratis(req.restaurantId, id);
    }
    setTrocoPara(id, body, req) {
        return this.service.setTrocoPara(req.restaurantId, id, body.troco_para);
    }
    meusProdutos(req) {
        return this.service.meusProdutos(req.restaurantId);
    }
    criarProduto(req, body) {
        return this.service.criarProduto(req.restaurantId, body);
    }
    editarProduto(id, body, req) {
        return this.service.editarProduto(id, req.restaurantId, body);
    }
    deletarProduto(id, req) {
        return this.service.deletarProduto(id, req.restaurantId);
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
    deletarCategoria(id, req) {
        return this.service.deletarCategoria(id, req.restaurantId);
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
        return this.service.abrirCaixa(req.restaurantId, body);
    }
    fecharCaixa(req, body) {
        return this.service.fecharCaixa(req.restaurantId, body);
    }
    aprovarConferencia(id, req) {
        return this.service.aprovarConferencia(req.restaurantId, id);
    }
    fecharComTransferencia(req, body) {
        return this.service.fecharComTransferencia(req.restaurantId, body);
    }
    getCaixaHistorico(req) {
        return this.service.getCaixaHistorico(req.restaurantId);
    }
    getCaixaDetalhe(id, req) {
        return this.service.getCaixaDetalhe(req.restaurantId, id);
    }
    adicionarSaida(req, body) {
        return this.service.adicionarSaida(req.restaurantId, body);
    }
    adicionarEntrada(req, body) {
        return this.service.adicionarEntrada(req.restaurantId, body);
    }
    buscarPedidoDetalhe(id, req) {
        return this.service.buscarPedidoDoRestaurante(req.restaurantId, id);
    }
    cozinha(req) {
        return this.service.getCozinha(req.restaurantId);
    }
    renovarTokenCozinha(req) {
        return this.service.renovarTokenCozinha(req.restaurantId);
    }
    setupStorage() {
        return this.service.setupStorage();
    }
    uploadImage(file, folder = 'geral') {
        return this.service.uploadImage(folder, file);
    }
    relatorio(req, de, ate) {
        return this.service.getRelatorio(req.restaurantId, de, ate);
    }
    meusCombos(req) {
        return this.service.meusCombos(req.restaurantId);
    }
    getComboDetalhe(id, req) {
        return this.service.getComboDetalhe(id, req.restaurantId);
    }
    criarCombo(req, body) {
        return this.service.criarCombo(req.restaurantId, body);
    }
    editarCombo(id, req, body) {
        return this.service.editarCombo(id, req.restaurantId, body);
    }
    deletarCombo(id, req) {
        return this.service.deletarCombo(id, req.restaurantId);
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
    (0, common_1.Patch)('pedidos/:id/cancelar'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "cancelarPedido", null);
__decorate([
    (0, common_1.Patch)('pedidos/:id/frete-gratis'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "setFreteGratis", null);
__decorate([
    (0, common_1.Patch)('pedidos/:id/troco'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "setTrocoPara", null);
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
    (0, common_1.Patch)('produtos/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "editarProduto", null);
__decorate([
    (0, common_1.Delete)('produtos/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "deletarProduto", null);
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
    (0, common_1.Delete)('categorias/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "deletarCategoria", null);
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
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "fecharCaixa", null);
__decorate([
    (0, common_1.Post)('caixa/:id/conferencia'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "aprovarConferencia", null);
__decorate([
    (0, common_1.Post)('caixa/fechar-e-transferir'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "fecharComTransferencia", null);
__decorate([
    (0, common_1.Get)('caixa/historico'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "getCaixaHistorico", null);
__decorate([
    (0, common_1.Get)('caixa/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "getCaixaDetalhe", null);
__decorate([
    (0, common_1.Post)('caixa/saida'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "adicionarSaida", null);
__decorate([
    (0, common_1.Post)('caixa/entrada'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "adicionarEntrada", null);
__decorate([
    (0, common_1.Get)('pedidos/:id/detalhe'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "buscarPedidoDetalhe", null);
__decorate([
    (0, common_1.Get)('cozinha'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "cozinha", null);
__decorate([
    (0, common_1.Patch)('renovar-token-cozinha'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "renovarTokenCozinha", null);
__decorate([
    (0, common_1.Post)('storage/setup'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "setupStorage", null);
__decorate([
    (0, common_1.Post)('storage/upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { limits: { fileSize: 5 * 1024 * 1024 } })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Query)('folder')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "uploadImage", null);
__decorate([
    (0, common_1.Get)('relatorio'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('de')),
    __param(2, (0, common_1.Query)('ate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "relatorio", null);
__decorate([
    (0, common_1.Get)('combos'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "meusCombos", null);
__decorate([
    (0, common_1.Get)('combos/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "getComboDetalhe", null);
__decorate([
    (0, common_1.Post)('combos'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "criarCombo", null);
__decorate([
    (0, common_1.Patch)('combos/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "editarCombo", null);
__decorate([
    (0, common_1.Delete)('combos/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "deletarCombo", null);
exports.RestauranteController = RestauranteController = __decorate([
    (0, common_1.Controller)('restaurante'),
    (0, common_1.UseGuards)(restaurant_owner_guard_1.RestaurantOwnerGuard),
    __metadata("design:paramtypes", [restaurante_service_1.RestauranteService])
], RestauranteController);
//# sourceMappingURL=restaurante.controller.js.map