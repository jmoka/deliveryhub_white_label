import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('r')
export class CatalogoController {
  constructor(private supabase: SupabaseService) {}

  @Get()
  async listarRestaurantes() {
    const { data, error } = await this.supabase.client
      .from('restaurants')
      .select('id, name, address, logo_url, slug')
      .not('slug', 'is', null)
      .order('name');

    if (error) throw error;
    return { restaurantes: data ?? [] };
  }

  @Get(':slug')
  async cardapio(@Param('slug') slug: string) {
    const { data: restaurante } = await this.supabase.client
      .from('restaurants')
      .select('id, name, address, logo_url, business_hours, slug, aparencia')
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
      .select('id, name, description, price, preco_promo, image_url, category_id, tipo, destaque')
      .eq('is_active', true)
      .in('category_id', (categorias ?? []).map((c) => c.id))
      .order('destaque', { ascending: false })
      .order('name');

    const cardapio = (categorias ?? []).map((cat) => ({
      ...cat,
      produtos: (produtos ?? []).filter((p) => p.category_id === cat.id && p.tipo === 'normal'),
    })).filter((cat) => cat.produtos.length > 0);

    const destaques = (produtos ?? []).filter((p) => p.destaque);
    const promos = (produtos ?? []).filter((p) => p.tipo === 'promo');
    const combos = (produtos ?? []).filter((p) => p.tipo === 'combo');

    return { restaurante, cardapio, destaques, promos, combos };
  }
}
