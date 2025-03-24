interface MoedaConfig {
  nome: string
  codigo: string
}

export const MOEDAS: { [key: string]: MoedaConfig } = {
  'USD': {
    nome: 'Dólar Americano',
    codigo: 'USD'
  },
  'EUR': {
    nome: 'Euro',
    codigo: 'EUR'
  },
  'GBP': {
    nome: 'Libra Esterlina',
    codigo: 'GBP'
  }
}

export function getNomeMoeda(codigo: string): string {
  const moeda = MOEDAS[codigo]
  if (!moeda) return codigo
  return `${moeda.nome} (${moeda.codigo})`
}
