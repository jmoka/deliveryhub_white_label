import {
  Body, Controller, Get, Param, ParseIntPipe,
  Patch, Post, Query, Req, UseGuards,
} from '@nestjs/common';
import { RestauranteService } from './restaurante.service';
import { RestaurantOwnerGuard } from '../auth/restaurant-owner.guard';

@Controller('restaurante')
@UseGuards(RestaurantOwnerGuard)
export class RestauranteController {
  constructor(private service: RestauranteService) {}

  @Get('minha-empresa')
  minhaEmpresa(@Req() req: any) {
    return this.service.minhaEmpresa(req.userId);
  }

  @Get('pedidos')
  meusPedidos(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('limite') limite?: string,
  ) {
    return this.service.meusPedidos(req.restaurantId, {
      status,
      limite: limite ? parseInt(limite) : undefined,
    });
  }

  @Patch('pedidos/:id/status')
  atualizarStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: string },
    @Req() req: any,
  ) {
    return this.service.atualizarStatusPedido(id, req.restaurantId, body.status);
  }

  @Get('produtos')
  meusProdutos(@Req() req: any) {
    return this.service.meusProdutos(req.restaurantId);
  }

  @Post('produtos')
  criarProduto(@Req() req: any, @Body() body: any) {
    return this.service.criarProduto(req.restaurantId, body);
  }

  @Patch('produtos/:id/toggle')
  toggleProduto(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { ativo: boolean },
    @Req() req: any,
  ) {
    return this.service.toggleProduto(id, req.restaurantId, body.ativo);
  }

  @Get('categorias')
  minhasCategorias(@Req() req: any) {
    return this.service.minhasCategorias(req.restaurantId);
  }

  @Post('categorias')
  criarCategoria(@Req() req: any, @Body() body: { name: string }) {
    return this.service.criarCategoria(req.restaurantId, body);
  }
}
