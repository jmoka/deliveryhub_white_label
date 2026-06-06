import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class CategoriasService {
  constructor(private supabase: SupabaseService) {}

  async listarPorEmpresa(empresaId: number) {
    const { data, error } = await this.supabase.client
      .from('categories')
      .select('id, name, restaurant_id, created_at')
      .eq('restaurant_id', empresaId)
      .order('name');

    if (error) throw error;

    // Conta produtos por categoria
    const catIds = (data ?? []).map((c) => c.id);
    let prodCount: Record<number, number> = {};

    if (catIds.length > 0) {
      const { data: prods } = await this.supabase.client
        .from('products')
        .select('category_id')
        .in('category_id', catIds);

      for (const p of prods ?? []) {
        prodCount[p.category_id] = (prodCount[p.category_id] ?? 0) + 1;
      }
    }

    return {
      categorias: (data ?? []).map((c) => ({ ...c, total_produtos: prodCount[c.id] ?? 0 })),
      total: data?.length ?? 0,
    };
  }

  async criar(body: { name: string; restaurant_id: number }) {
    const { data, error } = await this.supabase.client
      .from('categories')
      .insert({ name: body.name, restaurant_id: body.restaurant_id })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async atualizar(id: number, body: { name: string }) {
    const { data, error } = await this.supabase.client
      .from('categories')
      .update({ name: body.name, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundException(`Categoria ${id} não encontrada`);
    return data;
  }

  async remover(id: number) {
    const { error } = await this.supabase.client
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { mensagem: `Categoria ${id} removida` };
  }
}
