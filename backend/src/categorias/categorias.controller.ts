import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { CategoriasService } from './categorias.service';
import { AdminGuard } from '../auth/admin.guard';

@Controller()
@UseGuards(AdminGuard)
export class CategoriasController {
  constructor(private service: CategoriasService) {}

  @Get('empresas/:empresaId/categorias')
  listar(@Param('empresaId', ParseIntPipe) empresaId: number) {
    return this.service.listarPorEmpresa(empresaId);
  }

  @Post('categorias')
  criar(@Body() body: { name: string; restaurant_id: number }) {
    return this.service.criar(body);
  }

  @Patch('categorias/:id')
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { name: string },
  ) {
    return this.service.atualizar(id, body);
  }

  @Delete('categorias/:id')
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.service.remover(id);
  }
}
