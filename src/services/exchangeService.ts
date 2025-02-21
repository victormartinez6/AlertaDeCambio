interface ExchangeRate {
  code: string;
  codein: string;
  name: string;
  high: string;
  low: string;
  varBid: string;
  pctChange: string;
  bid: string;
  ask: string;
  timestamp: string;
  create_date: string;
}

interface HistoricalRate {
  timestamp: string;
  bid: string;
  ask: string;
  high: string;
  low: string;
  pctChange: string;
  varBid: string;
}

interface ExchangeResponse {
  [key: string]: ExchangeRate;
}

export async function getCurrentExchangeRate(currency: string): Promise<ExchangeRate> {
  const response = await fetch(`https://economia.awesomeapi.com.br/last/${currency}-BRL`);
  const data: ExchangeResponse = await response.json();
  return data[`${currency}BRL`];
}

export async function getHistoricalRates(currency: string, days: number = 7): Promise<HistoricalRate[]> {
  try {
    const response = await fetch(`https://economia.awesomeapi.com.br/json/daily/${currency}-BRL/${days}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.sort((a: HistoricalRate, b: HistoricalRate) => 
      parseInt(a.timestamp) - parseInt(b.timestamp)
    );
  } catch (error) {
    console.error(`Error fetching historical rates for ${currency}:`, error);
    return [];
  }
}

export function formatDate(timestamp: string): string {
  const date = new Date(parseInt(timestamp) * 1000);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit'
  });
}
