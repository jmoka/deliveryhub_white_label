"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const mcp_service_1 = require("./mcp/mcp.service");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const isMcpMode = process.env.MCP_MODE === 'stdio';
    if (isMcpMode) {
        const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
        const mcp = app.get(mcp_service_1.McpService);
        await mcp.conectarStdio();
        return;
    }
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors();
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }));
    await app.listen(process.env.PORT ?? 3002);
    console.log(`Delivery Backend rodando na porta ${process.env.PORT ?? 3002}`);
}
bootstrap();
//# sourceMappingURL=main.js.map