"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.produtosToolDefinitions = void 0;
exports.executarProdutosTool = executarProdutosTool;
exports.produtosToolDefinitions = [
    {
        name: 'listar_produtos',
        description: 'Lista produtos de uma empresa com opção de filtrar por categoria.',
        inputSchema: {
            type: 'object',
            properties: {
                empresa_id: { type: 'number' },
                categoria_id: { type: 'number' },
                apenas_ativos: { type: 'boolean' },
            },
            required: ['empresa_id'],
        },
    },
    {
        name: 'listar_categorias',
        description: 'Lista categorias de uma empresa com contagem de produtos.',
        inputSchema: {
            type: 'object',
            properties: {
                empresa_id: { type: 'number' },
            },
            required: ['empresa_id'],
        },
    },
];
async function executarProdutosTool(nome, args, supabase) {
    switch (nome) {
        case 'listar_produtos': return listarProdutos(args, supabase);
        case 'listar_categorias': return listarCategorias(args, supabase);
        default: return null;
    }
}
async function listarProdutos(args, supabase) {
    const { data: cats } = await supabase
        .from('categories')
        .select('id')
        .eq('restaurant_id', args.empresa_id);
    const catIds = (cats ?? []).map((c) => c.id);
    if (catIds.length === 0)
        return { produtos: [], total: 0 };
    let query = supabase
        .from('products')
        .select('id, name, description, price, is_active, category_id, image_url')
        .in('category_id', catIds)
        .order('name');
    if (args.categoria_id)
        query = query.eq('category_id', args.categoria_id);
    if (args.apenas_ativos)
        query = query.eq('is_active', true);
    const { data, error } = await query;
    if (error)
        throw error;
    return { produtos: data, total: data?.length ?? 0 };
}
async function listarCategorias(args, supabase) {
    const { data: cats, error } = await supabase
        .from('categories')
        .select('id, name, restaurant_id')
        .eq('restaurant_id', args.empresa_id)
        .order('name');
    if (error)
        throw error;
    const catIds = (cats ?? []).map((c) => c.id);
    let prodCountMap = {};
    if (catIds.length > 0) {
        const { data: prods } = await supabase
            .from('products')
            .select('category_id')
            .in('category_id', catIds);
        for (const p of prods ?? []) {
            prodCountMap[p.category_id] = (prodCountMap[p.category_id] ?? 0) + 1;
        }
    }
    return {
        categorias: (cats ?? []).map((c) => ({
            ...c,
            total_produtos: prodCountMap[c.id] ?? 0,
        })),
        total: cats?.length ?? 0,
    };
}
//# sourceMappingURL=produtos.tools.js.map