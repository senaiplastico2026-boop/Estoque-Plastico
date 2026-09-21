// Novas operações têm resolução de 1 g; campos legados continuam em kg/T.
export function converterParaGramas(valor, unidade = 'kg', permitirZero = false) {
    if (!['g', 'kg'].includes(unidade)) throw new Error('Unidade inválida. Use g ou kg.');
    const texto = String(valor ?? '').trim().replace(',', '.');
    if (!/^\d+(?:\.\d+)?$/.test(texto)) throw new Error('Informe uma quantidade válida.');
    const [inteira, fracao = ''] = texto.split('.');
    const casas = unidade === 'kg' ? 3 : 0;
    if (/[1-9]/.test(fracao.slice(casas))) throw new Error('A menor quantidade permitida é 1 g.');
    const g = Number(BigInt(inteira) * (unidade === 'kg' ? 1000n : 1n) + BigInt(fracao.slice(0, casas).padEnd(casas, '0') || '0'));
    if (!Number.isSafeInteger(g) || g < 0 || (!permitirZero && g === 0)) throw new Error('Informe uma quantidade maior que zero e dentro do limite.');
    return g;
}

export function obterQuantidadeEmGramas(material, minimo = false) {
    const canonico = minimo ? material?.estoqueMinimoGramas : material?.quantidadeGramas;
    if (canonico != null) {
        if (!Number.isFinite(canonico) || canonico < 0) throw new Error('Saldo inválido no cadastro.');
        return canonico;
    }
    const legado = minimo ? material?.estoqueMinimo : material?.quantidade;
    const valor = Number(String(legado ?? 0).replace(',', '.')) * 1000;
    if (!Number.isFinite(valor) || valor < 0) throw new Error('Saldo legado inválido.');
    // Remove apenas ruído binário; fração real legada é preservada na leitura.
    return Math.round(valor * 1e6) / 1e6;
}

export function formatarQuantidade(gramas) {
    if (!Number.isFinite(gramas)) return 'Não informado';
    const kg = Math.abs(gramas) >= 1000;
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 6 }).format(kg ? gramas / 1000 : gramas) + (kg ? ' kg' : ' g');
}

export function estoqueBaixo(material) {
    return obterQuantidadeEmGramas(material) <= obterQuantidadeEmGramas(material, true);
}

export function pesoMoinhoEmGramas(item) {
    const g = item?.pesoGramas ?? Number(item?.peso || 0) * 1000000;
    if (!Number.isFinite(g) || g < 0) throw new Error('Peso inválido no moinho.');
    return Math.round(g * 1e6) / 1e6;
}

export function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
