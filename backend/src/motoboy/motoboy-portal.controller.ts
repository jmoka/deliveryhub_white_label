import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { MotoboyGuard } from '../auth/motoboy.guard';
import { MotoboyService } from './motoboy.service';

@Controller('motoboy')
@UseGuards(MotoboyGuard)
export class MotoboyPortalController {
  constructor(private service: MotoboyService) {}

  @Get('me')
  me(@Req() req: any) {
    return this.service.infoMotoboy(req.motoboyId);
  }

  @Get('pedidos')
  pedidos(@Req() req: any) {
    return this.service.meusPedidos(req.motoboyId);
  }

  @Patch('pedidos/:id/localizacao')
  localizacao(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { lat: number; lng: number },
    @Req() req: any,
  ) {
    return this.service.atualizarLocalizacao(id, req.motoboyId, body.lat, body.lng);
  }

  @Post('pedidos/:id/entregar')
  entregar(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.confirmarEntrega(id, req.motoboyId);
  }
}
