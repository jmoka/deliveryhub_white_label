import { Module } from '@nestjs/common';
import { RestauranteController } from './restaurante.controller';
import { RestauranteService } from './restaurante.service';
import { AuthModule } from '../auth/auth.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { CategoriasModule } from '../categorias/categorias.module';
import { ProdutosModule } from '../produtos/produtos.module';
import { PedidosModule } from '../pedidos/pedidos.module';

@Module({
  imports: [AuthModule, SupabaseModule, CategoriasModule, ProdutosModule, PedidosModule],
  controllers: [RestauranteController],
  providers: [RestauranteService],
})
export class RestauranteModule {}
