import { Body, Controller, Get, Param, ParseIntPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { PlataformaService } from './plataforma.service';
import { AdminGuard } from '../auth/admin.guard';

@Controller('plataforma')
@UseGuards(AdminGuard)
export class PlataformaController {
  constructor(private service: PlataformaService) {}

  @Get('config')
  getConfig() {
    return this.service.getConfig();
  }

  @Patch('config')
  updateConfig(
    @Body() body: {
      pagbank_platform_token?: string;
      pagbank_platform_account_id?: string;
      pagbank_sandbox?: boolean;
    },
  ) {
    return this.service.updateConfig(body);
  }

  @Get('metricas')
  metricas() {
    return this.service.metricas();
  }

  @Get('comissoes')
  comissoes(
    @Query('empresa_id') empresaId?: string,
    @Query('data_inicio') dataInicio?: string,
    @Query('data_fim') dataFim?: string,
    @Query('limite') limite?: string,
  ) {
    return this.service.comissoes({
      empresa_id: empresaId ? parseInt(empresaId) : undefined,
      data_inicio: dataInicio,
      data_fim: dataFim,
      limite: limite ? parseInt(limite) : undefined,
    });
  }

  @Get('comissoes/empresa/:id')
  comissoesPorEmpresa(@Param('id', ParseIntPipe) id: number) {
    return this.service.comissoesPorEmpresa(id);
  }
}
