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
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpService = void 0;
const common_1 = require("@nestjs/common");
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const supabase_service_1 = require("../supabase/supabase.service");
const empresas_tools_1 = require("./tools/empresas.tools");
const pedidos_tools_1 = require("./tools/pedidos.tools");
const produtos_tools_1 = require("./tools/produtos.tools");
const ALL_TOOLS = [
    ...empresas_tools_1.empresasToolDefinitions,
    ...pedidos_tools_1.pedidosToolDefinitions,
    ...produtos_tools_1.produtosToolDefinitions,
];
let McpService = class McpService {
    supabase;
    server;
    constructor(supabase) {
        this.supabase = supabase;
        this.server = new index_js_1.Server({ name: 'delivery-base-mcp', version: '1.0.0' }, { capabilities: { tools: {} } });
        this.registrarHandlers();
    }
    registrarHandlers() {
        this.server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({
            tools: ALL_TOOLS,
        }));
        this.server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            const toolArgs = (args ?? {});
            const db = this.supabase.client;
            try {
                const resultado = (await (0, empresas_tools_1.executarEmpresasTool)(name, toolArgs, db)) ??
                    (await (0, pedidos_tools_1.executarPedidosTool)(name, toolArgs, db)) ??
                    (await (0, produtos_tools_1.executarProdutosTool)(name, toolArgs, db));
                if (resultado === null) {
                    return {
                        content: [{ type: 'text', text: `Tool desconhecida: ${name}` }],
                        isError: true,
                    };
                }
                return {
                    content: [{ type: 'text', text: JSON.stringify(resultado, null, 2) }],
                };
            }
            catch (err) {
                return {
                    content: [{ type: 'text', text: `Erro: ${err?.message ?? String(err)}` }],
                    isError: true,
                };
            }
        });
    }
    async conectarStdio() {
        const transport = new stdio_js_1.StdioServerTransport();
        await this.server.connect(transport);
    }
};
exports.McpService = McpService;
exports.McpService = McpService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], McpService);
//# sourceMappingURL=mcp.service.js.map