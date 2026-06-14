"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestauranteService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const categorias_service_1 = require("../categorias/categorias.service");
const produtos_service_1 = require("../produtos/produtos.service");
const pedidos_service_1 = require("../pedidos/pedidos.service");
let RestauranteService = class RestauranteService {
    supabase;
    categorias;
    produtos;
    pedidos;
    constructor(supabase, categorias, produtos, pedidos) {
        this.supabase = supabase;
        this.categorias = categorias;
        this.produtos = produtos;
        this.pedidos = pedidos;
    }
    async minhaEmpresa(userId) {
        const { data, error } = await this.supabase.client
            .from('restaurants')
            .select('id, name, address, logo_url, slug, business_hours, payment_config, comissao_pct, created_at')
            .eq('user_id', userId)
            .maybeSingle();
        if (error)
            throw error;
        if (!data)
            throw new common_1.NotFoundException('Nenhum restaurante vinculado');
        const { data: pedidosData } = await this.supabase.client
            .from('orders')
            .select('id, total, status')
            .eq('restaurant_id', data.id);
        const entregues = (pedidosData ?? []).filter((p) => p.status === 'delivered');
        const pendentes = (pedidosData ?? []).filter((p) => ['pending', 'confirmed', 'ready', 'out_for_delivery'].includes(p.status));
        const faturamento = entregues.reduce((acc, p) => acc + (p.total ?? 0), 0);
        return {
            empresa: data,
            metricas: {
                total_pedidos: pedidosData?.length ?? 0,
                pedidos_pendentes: pendentes.length,
                pedidos_entregues: entregues.length,
                faturamento,
            },
        };
    }
    async meusPedidos(restaurantId, filtros) {
        return this.pedidos.listar({
            empresa_id: restaurantId,
            status: filtros.status,
            limite: filtros.limite ?? 50,
        });
    }
    async atualizarStatusPedido(pedidoId, restaurantId, status) {
        const { data: pedido } = await this.supabase.client
            .from('orders')
            .select('id')
            .eq('id', pedidoId)
            .eq('restaurant_id', restaurantId)
            .maybeSingle();
        if (!pedido)
            throw new common_1.NotFoundException('Pedido não encontrado neste restaurante');
        return this.pedidos.atualizarStatus(pedidoId, status);
    }
    async catIdsDoRestaurante(restaurantId) {
        const { data } = await this.supabase.client
            .from('categories')
            .select('id')
            .or(`restaurant_id.eq.${restaurantId},restaurant_id.is.null`);
        return (data ?? []).map((c) => c.id);
    }
    async verificarProdutoDoRestaurante(produtoId, restaurantId) {
        const { data: prod } = await this.supabase.client
            .from('products').select('id, category_id, restaurant_id').eq('id', produtoId).maybeSingle();
        if (!prod)
            throw new common_1.NotFoundException('Produto não encontrado');
        if (prod.restaurant_id !== restaurantId)
            throw new common_1.NotFoundException('Produto não pertence a este restaurante');
        return prod;
    }
    async meusProdutos(restaurantId) {
        const { data, error } = await this.supabase.client
            .from('products')
            .select('id, name, description, price, preco_promo, image_url, is_active, category_id, restaurant_id, tags, destaque, created_at')
            .eq('restaurant_id', restaurantId)
            .order('destaque', { ascending: false })
            .order('name');
        if (error)
            throw error;
        return { produtos: data ?? [] };
    }
    async criarProduto(restaurantId, body) {
        const { data: cat } = await this.supabase.client
            .from('categories').select('id, restaurant_id').eq('id', body.category_id).maybeSingle();
        if (!cat)
            throw new common_1.NotFoundException('Categoria não encontrada');
        if (cat.restaurant_id !== null && cat.restaurant_id !== restaurantId)
            throw new common_1.NotFoundException('Categoria não pertence a este restaurante');
        const { data, error } = await this.supabase.client
            .from('products')
            .insert({
            name: body.name,
            description: body.description ?? null,
            price: body.price,
            preco_promo: body.preco_promo ?? null,
            image_url: body.image_url ?? null,
            category_id: body.category_id,
            restaurant_id: restaurantId,
            tags: body.tags ?? [],
            destaque: body.destaque ?? false,
            is_active: true,
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async editarProduto(produtoId, restaurantId, body) {
        await this.verificarProdutoDoRestaurante(produtoId, restaurantId);
        const update = {};
        if (body.name !== undefined)
            update.name = body.name;
        if (body.description !== undefined)
            update.description = body.description ?? null;
        if (body.price !== undefined)
            update.price = body.price;
        if (body.preco_promo !== undefined)
            update.preco_promo = body.preco_promo ?? null;
        if (body.image_url !== undefined)
            update.image_url = body.image_url ?? null;
        if (body.tags !== undefined)
            update.tags = body.tags;
        if (body.destaque !== undefined)
            update.destaque = body.destaque;
        if (body.category_id !== undefined) {
            const { data: cat } = await this.supabase.client
                .from('categories').select('id, restaurant_id').eq('id', body.category_id).maybeSingle();
            if (!cat)
                throw new common_1.NotFoundException('Categoria não encontrada');
            if (cat.restaurant_id !== null && cat.restaurant_id !== restaurantId)
                throw new common_1.NotFoundException('Categoria não pertence a este restaurante');
            update.category_id = body.category_id;
        }
        const { data, error } = await this.supabase.client
            .from('products').update(update).eq('id', produtoId).select().single();
        if (error)
            throw error;
        return data;
    }
    async deletarProduto(produtoId, restaurantId) {
        await this.verificarProdutoDoRestaurante(produtoId, restaurantId);
        const { error } = await this.supabase.client.from('products').delete().eq('id', produtoId);
        if (error)
            throw error;
        return { ok: true };
    }
    async toggleProduto(produtoId, restaurantId, ativo) {
        await this.verificarProdutoDoRestaurante(produtoId, restaurantId);
        return this.produtos.toggleAtivo(produtoId, ativo);
    }
    async meusCombos(restaurantId) {
        const { data, error } = await this.supabase.client
            .from('combos')
            .select('id, name, description, price, preco_promo, image_url, is_active, destaque, created_at')
            .eq('restaurant_id', restaurantId)
            .order('destaque', { ascending: false })
            .order('name');
        if (error)
            throw error;
        return { combos: data ?? [] };
    }
    async getComboDetalhe(comboId, restaurantId) {
        const { data: combo } = await this.supabase.client
            .from('combos').select('*').eq('id', comboId).eq('restaurant_id', restaurantId).maybeSingle();
        if (!combo)
            throw new common_1.NotFoundException('Combo não encontrado');
        const { data: items } = await this.supabase.client
            .from('combo_items')
            .select('id, quantity, product_id, products(id, name, price, image_url)')
            .eq('combo_id', comboId);
        return { ...combo, items: items ?? [] };
    }
    async criarCombo(restaurantId, body) {
        const { data: combo, error } = await this.supabase.client
            .from('combos')
            .insert({
            restaurant_id: restaurantId,
            name: body.name,
            description: body.description ?? null,
            price: body.price,
            preco_promo: body.preco_promo ?? null,
            image_url: body.image_url ?? null,
            destaque: body.destaque ?? false,
            is_active: true,
        })
            .select()
            .single();
        if (error)
            throw error;
        if (body.items?.length) {
            await this.supabase.client.from('combo_items').insert(body.items.map((i) => ({ combo_id: combo.id, product_id: i.product_id, quantity: i.quantity })));
        }
        return this.getComboDetalhe(combo.id, restaurantId);
    }
    async editarCombo(comboId, restaurantId, body) {
        const { data: existing } = await this.supabase.client
            .from('combos').select('id').eq('id', comboId).eq('restaurant_id', restaurantId).maybeSingle();
        if (!existing)
            throw new common_1.NotFoundException('Combo não encontrado');
        const update = {};
        if (body.name !== undefined)
            update.name = body.name;
        if (body.description !== undefined)
            update.description = body.description ?? null;
        if (body.price !== undefined)
            update.price = body.price;
        if (body.preco_promo !== undefined)
            update.preco_promo = body.preco_promo ?? null;
        if (body.image_url !== undefined)
            update.image_url = body.image_url ?? null;
        if (body.destaque !== undefined)
            update.destaque = body.destaque;
        if (body.is_active !== undefined)
            update.is_active = body.is_active;
        if (Object.keys(update).length > 0) {
            const { error } = await this.supabase.client.from('combos').update(update).eq('id', comboId);
            if (error)
                throw error;
        }
        if (Array.isArray(body.items)) {
            await this.supabase.client.from('combo_items').delete().eq('combo_id', comboId);
            if (body.items.length > 0) {
                await this.supabase.client.from('combo_items').insert(body.items.map((i) => ({ combo_id: comboId, product_id: i.product_id, quantity: i.quantity })));
            }
        }
        return this.getComboDetalhe(comboId, restaurantId);
    }
    async deletarCombo(comboId, restaurantId) {
        const { data: existing } = await this.supabase.client
            .from('combos').select('id').eq('id', comboId).eq('restaurant_id', restaurantId).maybeSingle();
        if (!existing)
            throw new common_1.NotFoundException('Combo não encontrado');
        const { error } = await this.supabase.client.from('combos').delete().eq('id', comboId);
        if (error)
            throw error;
        return { ok: true };
    }
    async minhasCategorias(restaurantId) {
        return this.categorias.listarPorEmpresa(restaurantId);
    }
    async criarCategoria(restaurantId, body) {
        return this.categorias.criar({ name: body.name, restaurant_id: restaurantId });
    }
    async deletarCategoria(categoriaId, restaurantId) {
        const { data } = await this.supabase.client
            .from('categories').select('id').eq('id', categoriaId).eq('restaurant_id', restaurantId).maybeSingle();
        if (!data)
            throw new common_1.NotFoundException('Categoria não encontrada neste restaurante');
        return this.categorias.remover(categoriaId);
    }
    async listarClientes(restaurantId, filtros) {
        const { data: crRows, error: crErr } = await this.supabase.client
            .from('customer_restaurants')
            .select('customer_id')
            .eq('restaurant_id', restaurantId);
        if (crErr)
            throw crErr;
        const customerIds = (crRows ?? []).map((r) => r.customer_id);
        if (customerIds.length === 0)
            return { clientes: [], total: 0 };
        let q = this.supabase.client
            .from('customers')
            .select('id, name, email, phone_e164, notes, user_id, created_at')
            .in('id', customerIds)
            .order('name');
        if (filtros.busca) {
            q = q.or(`name.ilike.%${filtros.busca}%,email.ilike.%${filtros.busca}%,phone_e164.ilike.%${filtros.busca}%`);
        }
        if (filtros.limite)
            q = q.limit(filtros.limite);
        const { data: clientes, error: cErr } = await q;
        if (cErr)
            throw cErr;
        if (!clientes?.length)
            return { clientes: [], total: 0 };
        const ids = clientes.map((c) => c.id);
        const { data: pedidos } = await this.supabase.client
            .from('orders')
            .select('customer_id, total, created_at')
            .eq('restaurant_id', restaurantId)
            .in('customer_id', ids)
            .neq('status', 'canceled');
        const statsMap = {};
        for (const p of pedidos ?? []) {
            if (!statsMap[p.customer_id])
                statsMap[p.customer_id] = { count: 0, total: 0, ultimo: null };
            statsMap[p.customer_id].count++;
            statsMap[p.customer_id].total += parseFloat(p.total);
            if (!statsMap[p.customer_id].ultimo || p.created_at > statsMap[p.customer_id].ultimo) {
                statsMap[p.customer_id].ultimo = p.created_at;
            }
        }
        const result = clientes.map((c) => ({
            ...c,
            pedidos_count: statsMap[c.id]?.count ?? 0,
            total_gasto: statsMap[c.id]?.total ?? 0,
            ultimo_pedido: statsMap[c.id]?.ultimo ?? null,
        }));
        return { clientes: result, total: result.length };
    }
    async criarCliente(restaurantId, body) {
        const { data, error } = await this.supabase.client
            .from('customers')
            .insert({
            name: body.name,
            email: body.email ?? null,
            phone_e164: body.phone_e164 ?? null,
            notes: body.notes ?? null,
        })
            .select()
            .single();
        if (error)
            throw error;
        await this.supabase.client
            .from('customer_restaurants')
            .insert({ customer_id: data.id, restaurant_id: restaurantId })
            .throwOnError();
        return data;
    }
    async atualizarCliente(clienteId, restaurantId, body) {
        const { data: cr } = await this.supabase.client
            .from('customer_restaurants')
            .select('customer_id')
            .eq('customer_id', clienteId)
            .eq('restaurant_id', restaurantId)
            .maybeSingle();
        if (!cr)
            throw new common_1.NotFoundException('Cliente não encontrado neste restaurante');
        const { data, error } = await this.supabase.client
            .from('customers')
            .update({ ...body, updated_at: new Date().toISOString() })
            .eq('id', clienteId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async updateEmpresa(restaurantId, body) {
        const campos = { updated_at: new Date().toISOString() };
        if (body.name !== undefined)
            campos.name = body.name;
        if (body.address !== undefined)
            campos.address = body.address;
        if (body.logo_url !== undefined)
            campos.logo_url = body.logo_url;
        const { data, error } = await this.supabase.client
            .from('restaurants')
            .update(campos)
            .eq('id', restaurantId)
            .select('id, name, address, logo_url, slug')
            .maybeSingle();
        if (error)
            throw error;
        return data;
    }
    async getAparencia(restaurantId) {
        const { data } = await this.supabase.client
            .from('restaurants')
            .select('aparencia')
            .eq('id', restaurantId)
            .maybeSingle();
        return (data?.aparencia ?? {});
    }
    async updateAparencia(restaurantId, body) {
        const { data: atual } = await this.supabase.client
            .from('restaurants')
            .select('aparencia')
            .eq('id', restaurantId)
            .maybeSingle();
        const nova = { ...(atual?.aparencia ?? {}), ...body };
        const { error } = await this.supabase.client
            .from('restaurants')
            .update({ aparencia: nova, updated_at: new Date().toISOString() })
            .eq('id', restaurantId);
        if (error)
            throw error;
        return nova;
    }
    async getConfig(restaurantId) {
        const { data } = await this.supabase.client
            .from('restaurants')
            .select('payment_config, frete_motoboy')
            .eq('id', restaurantId)
            .maybeSingle();
        const cfg = (data?.payment_config ?? {});
        return {
            pagbank_sandbox: cfg.pagbank_sandbox ?? true,
            pagbank_webhook_url: cfg.pagbank_webhook_url ?? '',
            pagbank_token_masked: cfg.pagbank_token
                ? `${'•'.repeat(8)}${String(cfg.pagbank_token).slice(-4)}`
                : null,
            pagbank_seller_account_id: cfg.pagbank_seller_account_id ?? '',
            configurado: !!cfg.pagbank_token,
            split_ativo: !!(cfg.pagbank_seller_account_id),
            taxa_pagbank_percent: cfg.taxa_pagbank_percent ?? null,
            chave_pix: cfg.chave_pix ?? null,
            frete_motoboy: parseFloat(data?.frete_motoboy ?? 0),
        };
    }
    async updateConfig(restaurantId, body) {
        const { data: atual } = await this.supabase.client
            .from('restaurants')
            .select('payment_config')
            .eq('id', restaurantId)
            .maybeSingle();
        const cfg = (atual?.payment_config ?? {});
        const novo = { ...cfg };
        if (body.pagbank_token !== undefined && body.pagbank_token !== '') {
            novo.pagbank_token = body.pagbank_token;
        }
        if (body.pagbank_sandbox !== undefined)
            novo.pagbank_sandbox = body.pagbank_sandbox;
        if (body.pagbank_webhook_url !== undefined)
            novo.pagbank_webhook_url = body.pagbank_webhook_url;
        if (body.pagbank_seller_account_id !== undefined)
            novo.pagbank_seller_account_id = body.pagbank_seller_account_id;
        if (body.taxa_pagbank_percent !== undefined)
            novo.taxa_pagbank_percent = body.taxa_pagbank_percent;
        if (body.chave_pix !== undefined)
            novo.chave_pix = body.chave_pix;
        const update = { payment_config: novo, updated_at: new Date().toISOString() };
        if (body.frete_motoboy !== undefined)
            update.frete_motoboy = body.frete_motoboy;
        const { error } = await this.supabase.client
            .from('restaurants')
            .update(update)
            .eq('id', restaurantId);
        if (error)
            throw error;
        return this.getConfig(restaurantId);
    }
    async toggleStatus(restaurantId, aberto) {
        if (aberto) {
            const { data: caixaAberto } = await this.supabase.client
                .from('caixas').select('id').eq('restaurant_id', restaurantId).eq('status', 'aberto').maybeSingle();
            if (!caixaAberto) {
                throw new common_1.BadRequestException('Abra o caixa antes de abrir o restaurante');
            }
        }
        await this.updateAparencia(restaurantId, { aberto });
        return { aberto };
    }
    async renovarTokenCozinha(restaurantId) {
        const novoToken = crypto.randomUUID();
        const { error } = await this.supabase.client
            .from('restaurants')
            .update({ cozinha_token: novoToken })
            .eq('id', restaurantId);
        if (error)
            throw error;
        return { cozinha_token: novoToken };
    }
    async getCozinha(restaurantId) {
        const { data, error } = await this.supabase.client
            .from('orders')
            .select('id, total, status, payment_method, created_at, customer_id, customers(name, phone_e164)')
            .eq('restaurant_id', restaurantId)
            .in('status', ['confirmed', 'preparing'])
            .order('created_at', { ascending: true });
        if (error)
            throw error;
        const pedidos = await Promise.all((data ?? []).map(async (o) => {
            const { data: itensRaw } = await this.supabase.client
                .from('order_items')
                .select('id, quantity, unit_price, product_id')
                .eq('order_id', o.id);
            let itens = itensRaw ?? [];
            if (itens.length > 0) {
                const prodIds = itens.map((i) => i.product_id);
                const { data: prods } = await this.supabase.client
                    .from('products').select('id, name').in('id', prodIds);
                const prodMap = Object.fromEntries((prods ?? []).map((p) => [p.id, p.name]));
                itens = itens.map((i) => ({ ...i, product_name: prodMap[i.product_id] ?? `Produto #${i.product_id}` }));
            }
            return { ...o, itens };
        }));
        return { pedidos };
    }
    STATUS_ABERTOS = ['pending', 'confirmed', 'preparing', 'ready', 'motoboy_collecting', 'out_for_delivery'];
    calcularResumo(pedidos, saidas, valor_inicial, entradas = []) {
        const entregues = pedidos.filter((p) => p.status === 'delivered');
        const total_vendas = entregues.reduce((s, p) => s + (p.total ?? 0), 0);
        const total_saidas = saidas.reduce((s, e) => s + (e.valor ?? 0), 0);
        const total_entradas = entradas.reduce((s, e) => s + (e.valor ?? 0), 0);
        const por_pagamento = {};
        for (const p of entregues) {
            const m = p.payment_method ?? 'outro';
            por_pagamento[m] = (por_pagamento[m] ?? 0) + (p.total ?? 0);
        }
        const vendas_dinheiro = por_pagamento['cash'] ?? 0;
        const saidas_especie = saidas
            .filter((s) => !s.meio || s.meio === 'dinheiro')
            .reduce((s, e) => s + (e.valor ?? 0), 0);
        const entradas_especie = entradas
            .filter((e) => !e.meio || e.meio === 'dinheiro')
            .reduce((s, e) => s + (e.valor ?? 0), 0);
        const especie_calculada = valor_inicial + vendas_dinheiro + entradas_especie - saidas_especie;
        return {
            total_pedidos: pedidos.length,
            entregues: entregues.length,
            em_andamento: pedidos.filter((p) => this.STATUS_ABERTOS.includes(p.status)).length,
            cancelados: pedidos.filter((p) => p.status === 'canceled').length,
            total_vendas,
            total_saidas,
            total_entradas,
            saldo: valor_inicial + total_vendas + total_entradas - total_saidas,
            por_pagamento,
            especie_calculada,
            saidas_especie,
            entradas_especie,
        };
    }
    async getCaixa(restaurantId) {
        const { data: restaurantData } = await this.supabase.client
            .from('restaurants')
            .select('aparencia, saldo_caixa')
            .eq('id', restaurantId)
            .maybeSingle();
        const status_restaurante = (restaurantData?.aparencia?.aberto) === true;
        const saldo_caixa = restaurantData?.saldo_caixa ?? 0;
        const { data: caixasSemDestinacao } = await this.supabase.client
            .from('caixas')
            .select('resumo, destinacao_fechamento')
            .eq('restaurant_id', restaurantId)
            .eq('status', 'fechado')
            .is('destinacao_fechamento', null);
        const saldo_fechados_pendente = (caixasSemDestinacao ?? []).reduce((sum, c) => {
            return sum + (c.resumo?.saldo ?? 0);
        }, 0);
        const { data: caixa } = await this.supabase.client
            .from('caixas')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .eq('status', 'aberto')
            .maybeSingle();
        if (!caixa) {
            const { data: expirado } = await this.supabase.client
                .from('caixas').select('*').eq('restaurant_id', restaurantId).eq('status', 'expirado').maybeSingle();
            return { status_restaurante, aberto: false, expirado: !!expirado, caixa_expirado: expirado ?? null, pedidos: [], resumo: null, saldo_caixa, saldo_fechados_pendente };
        }
        const aberto_em = new Date(caixa.aberto_em);
        const oitoHoras = 8 * 60 * 60 * 1000;
        if (Date.now() - aberto_em.getTime() > oitoHoras) {
            await this.supabase.client.from('caixas').update({ status: 'expirado' }).eq('id', caixa.id);
            return { status_restaurante, aberto: false, expirado: true, caixa_expirado: { ...caixa, status: 'expirado' }, pedidos: [], resumo: null, saldo_caixa, saldo_fechados_pendente };
        }
        const { data: ordersData } = await this.supabase.client
            .from('orders')
            .select('id, total, status, payment_method, created_at, updated_at, customer_id, motoboy_id, caixa_id, customers(name, phone_e164), motoboys(name)')
            .eq('restaurant_id', restaurantId)
            .or(`caixa_id.eq.${caixa.id},and(caixa_id.is.null,created_at.gte.${caixa.aberto_em})`)
            .order('created_at', { ascending: false });
        const pedidos = ordersData ?? [];
        const saidas = (caixa.saidas ?? []);
        const entradas = (caixa.entradas ?? []);
        const resumo = this.calcularResumo(pedidos, saidas, caixa.valor_inicial, entradas);
        return {
            status_restaurante,
            aberto: true,
            expirado: false,
            id: caixa.id,
            nome_operador: caixa.nome_operador,
            aberto_em: caixa.aberto_em,
            valor_inicial: caixa.valor_inicial,
            saidas,
            entradas,
            pedidos,
            resumo,
            saldo_caixa,
            saldo_fechados_pendente,
        };
    }
    async abrirCaixa(restaurantId, body) {
        if (!body.nome_operador?.trim())
            throw new common_1.BadRequestException('Nome do operador é obrigatório');
        const { data: existente } = await this.supabase.client
            .from('caixas').select('id, status').eq('restaurant_id', restaurantId)
            .in('status', ['aberto', 'expirado']).maybeSingle();
        if (existente?.status === 'aberto')
            throw new common_1.ConflictException('Já existe um caixa aberto');
        if (existente?.status === 'expirado')
            throw new common_1.ConflictException('Existe um caixa expirado. Feche-o antes de abrir outro');
        const { data: restaurant } = await this.supabase.client
            .from('restaurants').select('saldo_caixa').eq('id', restaurantId).maybeSingle();
        const saldoCaixaAtual = restaurant?.saldo_caixa ?? 0;
        const valorInicial = body.valor_inicial !== undefined ? body.valor_inicial : saldoCaixaAtual;
        const { data: novo, error } = await this.supabase.client
            .from('caixas')
            .insert({ restaurant_id: restaurantId, nome_operador: body.nome_operador.trim(), valor_inicial: valorInicial })
            .select('*')
            .single();
        if (error)
            throw error;
        await this.supabase.client.from('restaurants')
            .update({ saldo_caixa: 0 }).eq('id', restaurantId);
        return this.getCaixa(restaurantId);
    }
    async fecharCaixa(restaurantId, body) {
        const { data: caixa } = await this.supabase.client
            .from('caixas').select('*').eq('restaurant_id', restaurantId)
            .in('status', ['aberto', 'expirado']).maybeSingle();
        if (!caixa)
            throw new common_1.NotFoundException('Nenhum caixa aberto');
        const { data: pedidosAbertos } = await this.supabase.client
            .from('orders').select('id, status, total')
            .eq('caixa_id', caixa.id)
            .in('status', this.STATUS_ABERTOS);
        if ((pedidosAbertos ?? []).length > 0) {
            throw new common_1.ConflictException({
                message: 'Existem pedidos em aberto neste caixa',
                pedidos_abertos: pedidosAbertos.length,
                pedidos: pedidosAbertos,
            });
        }
        const { data: todosPedidos } = await this.supabase.client
            .from('orders').select('id, total, status, payment_method, created_at')
            .or(`caixa_id.eq.${caixa.id},and(caixa_id.is.null,created_at.gte.${caixa.aberto_em})`);
        const saidas = (caixa.saidas ?? []);
        const entradas = (caixa.entradas ?? []);
        const resumo = this.calcularResumo(todosPedidos ?? [], saidas, caixa.valor_inicial, entradas);
        const fechado_em = new Date().toISOString();
        const dinheiro_contado = body?.dinheiro_contado ?? (resumo.especie_calculada ?? 0);
        const diferenca = dinheiro_contado - (resumo.especie_calculada ?? 0);
        const destinacao_fechamento = {
            dinheiro_contado,
            especie_calculada: resumo.especie_calculada,
            diferenca,
            por_pagamento: resumo.por_pagamento,
            conferencia_aprovada: false,
        };
        await this.supabase.client.from('caixas')
            .update({ status: 'fechado', fechado_em, resumo, destinacao_fechamento })
            .eq('id', caixa.id);
        await this.supabase.client.from('restaurants')
            .update({ saldo_caixa: Math.max(0, dinheiro_contado) }).eq('id', restaurantId);
        return { fechamento: { id: caixa.id, aberto_em: caixa.aberto_em, fechado_em, nome_operador: caixa.nome_operador, valor_inicial: caixa.valor_inicial, saidas, resumo, destinacao_fechamento } };
    }
    async aprovarConferencia(restaurantId, caixaId) {
        const { data: caixa } = await this.supabase.client
            .from('caixas').select('id, destinacao_fechamento')
            .eq('id', caixaId).eq('restaurant_id', restaurantId).maybeSingle();
        if (!caixa)
            throw new common_1.NotFoundException('Caixa não encontrado');
        const dest = { ...(caixa.destinacao_fechamento ?? {}), conferencia_aprovada: true, aprovado_em: new Date().toISOString() };
        const { error } = await this.supabase.client.from('caixas').update({ destinacao_fechamento: dest }).eq('id', caixaId);
        if (error)
            throw error;
        return { aprovado: true };
    }
    async fecharComTransferencia(restaurantId, body) {
        if (!body.nome_operador?.trim())
            throw new common_1.BadRequestException('Nome do operador do novo caixa é obrigatório');
        const { data: caixa } = await this.supabase.client
            .from('caixas').select('*').eq('restaurant_id', restaurantId)
            .in('status', ['aberto', 'expirado']).maybeSingle();
        if (!caixa)
            throw new common_1.NotFoundException('Nenhum caixa aberto para fechar');
        const { data: todosPedidos } = await this.supabase.client
            .from('orders').select('id, total, status, payment_method, created_at')
            .or(`caixa_id.eq.${caixa.id},and(caixa_id.is.null,created_at.gte.${caixa.aberto_em})`);
        const saidas = (caixa.saidas ?? []);
        const resumo = this.calcularResumo(todosPedidos ?? [], saidas, caixa.valor_inicial);
        const fechado_em = new Date().toISOString();
        await this.supabase.client.from('caixas')
            .update({ status: 'fechado', fechado_em, resumo }).eq('id', caixa.id);
        const { data: novoCaixa, error } = await this.supabase.client
            .from('caixas')
            .insert({ restaurant_id: restaurantId, nome_operador: body.nome_operador.trim(), valor_inicial: body.valor_inicial ?? 0 })
            .select('*').single();
        if (error)
            throw error;
        await this.supabase.client.from('restaurants').update({ saldo_caixa: 0 }).eq('id', restaurantId);
        await this.supabase.client
            .from('orders')
            .update({ caixa_id: novoCaixa.id })
            .eq('restaurant_id', restaurantId)
            .in('status', this.STATUS_ABERTOS)
            .eq('caixa_id', caixa.id);
        return {
            fechamento: { id: caixa.id, aberto_em: caixa.aberto_em, fechado_em, nome_operador: caixa.nome_operador, resumo },
            novo_caixa: novoCaixa,
        };
    }
    async getCaixaHistorico(restaurantId) {
        const { data, error } = await this.supabase.client
            .from('caixas')
            .select('id, nome_operador, valor_inicial, status, aberto_em, fechado_em, resumo, destinacao_fechamento')
            .eq('restaurant_id', restaurantId)
            .order('created_at', { ascending: false })
            .limit(50);
        if (error)
            throw error;
        return { historico: data ?? [] };
    }
    async getCaixaDetalhe(restaurantId, caixaId) {
        const { data: caixa, error } = await this.supabase.client
            .from('caixas').select('*').eq('id', caixaId).eq('restaurant_id', restaurantId).maybeSingle();
        if (error)
            throw error;
        if (!caixa)
            throw new common_1.NotFoundException('Caixa não encontrado');
        const { data: pedidos } = await this.supabase.client
            .from('orders')
            .select('id, total, status, payment_method, created_at, customers(name)')
            .or(`caixa_id.eq.${caixa.id},and(caixa_id.is.null,created_at.gte.${caixa.aberto_em})`)
            .order('created_at', { ascending: false });
        return { caixa, pedidos: pedidos ?? [] };
    }
    async adicionarSaida(restaurantId, body) {
        if (!body.valor || body.valor <= 0)
            throw new common_1.BadRequestException('Valor da saída deve ser maior que zero');
        if (!body.descricao?.trim())
            throw new common_1.BadRequestException('Descrição da saída é obrigatória');
        const { data: caixa } = await this.supabase.client
            .from('caixas').select('id, saidas').eq('restaurant_id', restaurantId).eq('status', 'aberto').maybeSingle();
        if (!caixa)
            throw new common_1.NotFoundException('Nenhum caixa aberto');
        const saidas = (caixa.saidas ?? []);
        const nova = { descricao: body.descricao.trim(), valor: Number(body.valor), criado_em: new Date().toISOString() };
        if (body.meio)
            nova.meio = body.meio;
        const { error } = await this.supabase.client.from('caixas').update({ saidas: [...saidas, nova] }).eq('id', caixa.id);
        if (error)
            throw error;
        return nova;
    }
    async adicionarEntrada(restaurantId, body) {
        if (!body.valor || body.valor <= 0)
            throw new common_1.BadRequestException('Valor da entrada deve ser maior que zero');
        if (!body.descricao?.trim())
            throw new common_1.BadRequestException('Descrição da entrada é obrigatória');
        const { data: caixa } = await this.supabase.client
            .from('caixas').select('id, entradas').eq('restaurant_id', restaurantId).eq('status', 'aberto').maybeSingle();
        if (!caixa)
            throw new common_1.NotFoundException('Nenhum caixa aberto');
        const entradas = (caixa.entradas ?? []);
        const nova = { descricao: body.descricao.trim(), valor: Number(body.valor), criado_em: new Date().toISOString() };
        if (body.meio)
            nova.meio = body.meio;
        const { error } = await this.supabase.client.from('caixas').update({ entradas: [...entradas, nova] }).eq('id', caixa.id);
        if (error)
            throw error;
        return nova;
    }
    async setFreteGratis(restaurantId, pedidoId) {
        const { data: pedido, error: errGet } = await this.supabase.client
            .from('orders')
            .select('id, total, frete_cobrado, status')
            .eq('id', pedidoId)
            .eq('restaurant_id', restaurantId)
            .maybeSingle();
        if (errGet)
            throw errGet;
        if (!pedido)
            throw new common_1.NotFoundException('Pedido não encontrado');
        if (['delivered', 'canceled'].includes(pedido.status)) {
            throw new common_1.BadRequestException('Não é possível alterar pedido finalizado');
        }
        const frete = parseFloat(pedido.frete_cobrado ?? 0);
        if (frete === 0)
            return { message: 'Frete já é zero', pedido };
        const novoTotal = parseFloat((Number(pedido.total) - frete).toFixed(2));
        const { data, error } = await this.supabase.client
            .from('orders')
            .update({ frete_cobrado: 0, total: novoTotal })
            .eq('id', pedidoId)
            .eq('restaurant_id', restaurantId)
            .select('id, total, frete_cobrado')
            .single();
        if (error)
            throw error;
        return data;
    }
    async setTrocoPara(restaurantId, pedidoId, trocoPara) {
        if (!trocoPara || trocoPara <= 0)
            throw new common_1.BadRequestException('Valor inválido');
        const { data, error } = await this.supabase.client
            .from('orders')
            .update({ troco_para: trocoPara })
            .eq('id', pedidoId)
            .eq('restaurant_id', restaurantId)
            .select('id, total, troco_para');
        if (error)
            throw error;
        if (!data?.length)
            throw new common_1.NotFoundException('Pedido não encontrado');
        return data[0];
    }
    async uploadImage(folder, file) {
        const BUCKET = 'restaurante-imagens';
        await this.setupStorage();
        const ext = (file.originalname.split('.').pop() ?? 'jpg').toLowerCase();
        const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await this.supabase.client.storage
            .from(BUCKET)
            .upload(path, file.buffer, { cacheControl: '3600', upsert: false, contentType: file.mimetype });
        if (error)
            throw error;
        const { data } = this.supabase.client.storage.from(BUCKET).getPublicUrl(path);
        return { url: data.publicUrl };
    }
    async setupStorage() {
        const BUCKET = 'restaurante-imagens';
        const { data: buckets } = await this.supabase.client.storage.listBuckets();
        const exists = (buckets ?? []).some((b) => b.id === BUCKET);
        if (!exists) {
            const { error } = await this.supabase.client.storage.createBucket(BUCKET, {
                public: true,
                fileSizeLimit: 5 * 1024 * 1024,
                allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
            });
            if (error)
                throw error;
        }
        return { ok: true, bucket: BUCKET, criado: !exists };
    }
    async getRelatorio(restaurantId, de, ate) {
        const { data: orders, error } = await this.supabase.client
            .from('orders')
            .select('id, total, status, payment_method, created_at, customer_id, customers(name)')
            .eq('restaurant_id', restaurantId)
            .gte('created_at', de)
            .lte('created_at', ate)
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        const orderIds = (orders ?? []).map((o) => o.id);
        if (orderIds.length === 0) {
            const { data: caixasVazio } = await this.supabase.client
                .from('caixas').select('id, saidas').eq('restaurant_id', restaurantId)
                .lte('aberto_em', ate).or(`fechado_em.is.null,fechado_em.gte.${de}`);
            const deD = new Date(de);
            const ateD = new Date(ate);
            const saidasVazio = [];
            for (const c of (caixasVazio ?? [])) {
                for (const s of (c.saidas ?? [])) {
                    const d = new Date(s.criado_em);
                    if (d >= deD && d <= ateD)
                        saidasVazio.push(s);
                }
            }
            const totalSaidasVazio = saidasVazio.reduce((sum, s) => sum + (s.valor ?? 0), 0);
            return {
                pedidos: [],
                saidas: saidasVazio,
                resumo: { total_pedidos: 0, entregues: 0, cancelados: 0, em_andamento: 0, total_vendas: 0, ticket_medio: 0, por_pagamento: {}, total_saidas: totalSaidasVazio, saldo_liquido: -totalSaidasVazio },
            };
        }
        const { data: allItems } = await this.supabase.client
            .from('order_items')
            .select('id, order_id, product_id, quantity, unit_price')
            .in('order_id', orderIds);
        const productIds = [...new Set((allItems ?? []).map((i) => i.product_id))];
        const { data: allProds } = productIds.length > 0
            ? await this.supabase.client.from('products').select('id, name').in('id', productIds)
            : { data: [] };
        const prodMap = Object.fromEntries((allProds ?? []).map((p) => [p.id, p.name]));
        const itemsByOrder = (allItems ?? []).reduce((acc, item) => {
            if (!acc[item.order_id])
                acc[item.order_id] = [];
            acc[item.order_id].push({ ...item, product_name: prodMap[item.product_id] ?? `#${item.product_id}` });
            return acc;
        }, {});
        const pedidos = (orders ?? []).map((o) => ({ ...o, itens: itemsByOrder[o.id] ?? [] }));
        const entregues = pedidos.filter((p) => p.status === 'delivered');
        const cancelados = pedidos.filter((p) => p.status === 'canceled');
        const em_andamento = pedidos.filter((p) => !['canceled', 'delivered'].includes(p.status));
        const nao_cancelados = pedidos.filter((p) => p.status !== 'canceled');
        const total_vendas = entregues.reduce((s, p) => s + (p.total ?? 0), 0);
        const por_pagamento = nao_cancelados.reduce((acc, p) => {
            const m = p.payment_method ?? 'unknown';
            if (!acc[m])
                acc[m] = { count: 0, total: 0 };
            acc[m].count++;
            acc[m].total += p.total ?? 0;
            return acc;
        }, {});
        const { data: caixasPeriodo } = await this.supabase.client
            .from('caixas')
            .select('id, saidas')
            .eq('restaurant_id', restaurantId)
            .lte('aberto_em', ate)
            .or(`fechado_em.is.null,fechado_em.gte.${de}`);
        const deDate = new Date(de);
        const ateDate = new Date(ate);
        const saidas = [];
        for (const c of (caixasPeriodo ?? [])) {
            for (const s of (c.saidas ?? [])) {
                const d = new Date(s.criado_em);
                if (d >= deDate && d <= ateDate)
                    saidas.push(s);
            }
        }
        const total_saidas = saidas.reduce((sum, s) => sum + (s.valor ?? 0), 0);
        return {
            pedidos,
            saidas,
            resumo: {
                total_pedidos: pedidos.length,
                entregues: entregues.length,
                cancelados: cancelados.length,
                em_andamento: em_andamento.length,
                total_vendas,
                ticket_medio: entregues.length > 0 ? total_vendas / entregues.length : 0,
                por_pagamento,
                total_saidas,
                saldo_liquido: total_vendas - total_saidas,
            },
        };
    }
    async buscarPedidoDoRestaurante(restaurantId, pedidoId) {
        const resultado = await this.pedidos.buscar(pedidoId);
        if (resultado.pedido.restaurant_id !== restaurantId) {
            throw new common_1.NotFoundException('Pedido não encontrado neste restaurante');
        }
        if (resultado.itens.length > 0) {
            const prodIds = resultado.itens.map((i) => i.product_id);
            const { data: produtos } = await this.supabase.client
                .from('products')
                .select('id, name')
                .in('id', prodIds);
            const prodMap = Object.fromEntries((produtos ?? []).map((p) => [p.id, p.name]));
            resultado.itens = resultado.itens.map((i) => ({
                ...i,
                product_name: prodMap[i.product_id] ?? `Produto #${i.product_id}`,
            }));
        }
        return resultado;
    }
};
exports.RestauranteService = RestauranteService;
exports.RestauranteService = RestauranteService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        categorias_service_1.CategoriasService,
        produtos_service_1.ProdutosService,
        pedidos_service_1.PedidosService])
], RestauranteService);
//# sourceMappingURL=restaurante.service.js.map