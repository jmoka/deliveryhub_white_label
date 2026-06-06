import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('r')
export class CatalogoController {
  constructor(private supabase: SupabaseService) {}

  @Get(':slug')
  async cardapio(@Param('slug') slug: string) {
    const { data: restaurante } = await this.supabase.client
      .from('restaurants')
      .select('id, name, address, logo_url, business_hours, slug')
      .eq('slug', slug)
      .maybeSingle();

    if (!restaurante) throw new NotFoundException('Restaurante não encontrado');

    const { data: categorias } = await this.supabase.client
      .from('categories')
      .select('id, name')
      .eq('restaurant_id', restaurante.id)
      .order('name');

    const { data: produtos } = await this.supabase.client
      .from('products')
      .select('id, name, description, price, image_url, category_id')
      .eq('is_active', true)
      .in(
        'category_id',
        (categorias ?? []).map((c) => c.id),
      )
      .order('name');

    const cardapio = (categorias ?? []).map((cat) => ({
      ...cat,
      produtos: (produtos ?? []).filter((p) => p.category_id === cat.id),
    })).filter((cat) => cat.produtos.length > 0);

    return { restaurante, cardapio };
  }
}
