// Autocompleta endereço a partir do CEP — usado em todos os cadastros de endereço
// (registro de estabelecimento, config do estabelecimento, perfil do cliente).
export async function buscarCep(cepRaw) {
  const cep = (cepRaw ?? '').replace(/\D/g, '');
  if (cep.length !== 8) return null;

  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await res.json();
    if (!res.ok || data.erro) return null;

    return {
      logradouro: data.logradouro ?? '',
      bairro: data.bairro ?? '',
      cidade: data.localidade ?? '',
      estado: data.uf ?? '',
    };
  } catch {
    return null;
  }
}
