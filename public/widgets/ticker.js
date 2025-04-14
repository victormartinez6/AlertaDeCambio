/**
 * Widget de Cotações - Alerta de Câmbio
 * 
 * Este script cria um widget de cotações em tempo real que pode ser incorporado
 * em qualquer site. O widget exibe cotações de moedas e criptomoedas em um formato
 * de ticker horizontal.
 * 
 * Desenvolvido por: Alerta de Câmbio
 * Versão: 1.3.1
 */

(function() {
  'use strict';

  // Namespace global para o widget
  window.AlertaCambioWidget = window.AlertaCambioWidget || {};
  
  // Configurações padrão
  const defaultConfig = {
    container: 'alerta-cambio-widget',
    symbols: 'USD/BRL,EUR/BRL,GBP/BRL,JPY/BRL,CAD/BRL,AUD/BRL,CHF/BRL,CNY/BRL,ARS/BRL,BTC/USD,ETH/USD,LTC/USD,XRP/USD,DOGE/USD,BTC/BRL,ETH/BRL',
    theme: 'light',
    bgColor: '#FFFFFF',
    showLogos: true,
    showVariation: true,
    lang: 'pt-BR',
    width: '100%',
    refreshInterval: 10000, // 10 segundos
    carouselSpeed: 120, // Velocidade do carrossel em segundos (padrão: 120s)
    debug: false // Controla a exibição de logs
  };
  
  // Traduções disponíveis
  const translations = {
    'pt-BR': {
      loading: 'Carregando cotações...',
      error: 'Erro ao carregar cotações',
      updated: 'Atualizado'
    },
    'en-US': {
      loading: 'Loading quotes...',
      error: 'Error loading quotes',
      updated: 'Updated'
    }
  };
  
  // Mapeamento de moedas para códigos da API
  const symbolMapping = {
    'USD/BRL': 'USD-BRL',
    'EUR/BRL': 'EUR-BRL',
    'GBP/BRL': 'GBP-BRL',
    'JPY/BRL': 'JPY-BRL',
    'CAD/BRL': 'CAD-BRL',
    'AUD/BRL': 'AUD-BRL',
    'CHF/BRL': 'CHF-BRL',
    'CNY/BRL': 'CNY-BRL',
    'ARS/BRL': 'ARS-BRL',
    'BTC/USD': 'BTC-USD',
    'ETH/USD': 'ETH-USD',
    'LTC/USD': 'LTC-USD',
    'XRP/USD': 'XRP-USD',
    'DOGE/USD': 'DOGE-USD',
    'BTC/BRL': 'BTC-BRL',
    'ETH/BRL': 'ETH-BRL'
  };
  
  // Mapeamento de moedas para logos
  const logoMapping = {
    'USD/BRL': 'https://flagcdn.com/w80/us.png',
    'EUR/BRL': 'https://flagcdn.com/w80/eu.png',
    'GBP/BRL': 'https://flagcdn.com/w80/gb.png',
    'JPY/BRL': 'https://flagcdn.com/w80/jp.png',
    'CAD/BRL': 'https://flagcdn.com/w80/ca.png',
    'AUD/BRL': 'https://flagcdn.com/w80/au.png',
    'CHF/BRL': 'https://flagcdn.com/w80/ch.png',
    'CNY/BRL': 'https://flagcdn.com/w80/cn.png',
    'ARS/BRL': 'https://flagcdn.com/w80/ar.png',
    'BTC/USD': 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/btc.png',
    'ETH/USD': 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/eth.png',
    'LTC/USD': 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/ltc.png',
    'XRP/USD': 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/xrp.png',
    'BTC/BRL': 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/btc.png',
    'ETH/BRL': 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/eth.png'
  };
  
  // Mapeamento de moedas para logos secundários
  const logoSecundarioMapping = {
    'USD/BRL': 'https://flagcdn.com/w80/br.png',
    'EUR/BRL': 'https://flagcdn.com/w80/br.png',
    'GBP/BRL': 'https://flagcdn.com/w80/br.png',
    'JPY/BRL': 'https://flagcdn.com/w80/br.png',
    'CAD/BRL': 'https://flagcdn.com/w80/br.png',
    'AUD/BRL': 'https://flagcdn.com/w80/br.png',
    'CHF/BRL': 'https://flagcdn.com/w80/br.png',
    'CNY/BRL': 'https://flagcdn.com/w80/br.png',
    'ARS/BRL': 'https://flagcdn.com/w80/br.png',
    'BTC/USD': 'https://flagcdn.com/w80/us.png',
    'ETH/USD': 'https://flagcdn.com/w80/us.png',
    'LTC/USD': 'https://flagcdn.com/w80/us.png',
    'XRP/USD': 'https://flagcdn.com/w80/us.png',
    'BTC/BRL': 'https://flagcdn.com/w80/br.png',
    'ETH/BRL': 'https://flagcdn.com/w80/br.png'
  };

  // Obtém a configuração do script atual
  function getScriptConfig() {
    try {
      // Verifica se existe uma configuração global
      if (window.alertaCambioConfig) {
        return window.alertaCambioConfig;
      }
      
      // Encontra o script atual
      const scripts = document.getElementsByTagName('script');
      const currentScript = Array.from(scripts).find(script => script.src && script.src.includes('ticker.js'));
      
      if (!currentScript) {
        console.warn('Script ticker.js não encontrado');
        return null;
      }
      
      // Procura pelo script de inicialização que deve vir logo após
      let nextElement = currentScript.nextElementSibling;
      
      while (nextElement) {
        if (nextElement.tagName === 'SCRIPT' && 
            nextElement.textContent && 
            nextElement.textContent.includes('AlertaCambioWidget.init')) {
          
          // Extrai a configuração do script
          const configMatch = nextElement.textContent.match(/AlertaCambioWidget\.init\((.*?)\)/s);
          
          if (configMatch && configMatch[1]) {
            // Converte a string de configuração em um objeto
            // Substitui aspas simples por aspas duplas para o JSON.parse
            const configStr = configMatch[1]
              .replace(/'/g, '"')
              .replace(/([a-zA-Z0-9_]+):/g, '"$1":');
            
            try {
              return JSON.parse(configStr);
            } catch (e) {
              console.error('Erro ao fazer parse da configuração:', e);
            }
          }
        }
        
        nextElement = nextElement.nextElementSibling;
      }
      
      console.warn('Script de inicialização não encontrado');
      return null;
    } catch (e) {
      console.error('Erro ao obter configuração do script:', e);
      return null;
    }
  }

  // Inicializa o widget
  AlertaCambioWidget.init = function(userConfig) {
    try {
      // Mescla as configurações do usuário com as padrões
      const config = { ...defaultConfig, ...userConfig };
      
      // Obtém o elemento container
      let container;
      if (typeof config.container === 'string') {
        container = document.getElementById(config.container);
        if (!container) {
          container = document.createElement('div');
          container.id = config.container;
          document.body.appendChild(container);
        }
      } else if (config.container instanceof HTMLElement) {
        container = config.container;
      } else {
        throw new Error('Container inválido');
      }
      
      // Adiciona estilos CSS
      addSimpleStyles(config.carouselSpeed);
      
      // Converte a string de símbolos em um array
      let symbols = config.symbols;
      if (typeof symbols === 'string') {
        symbols = symbols.split(',').map(s => s.trim());
      }
      
      // Verificação adicional para garantir que symbols seja um array
      if (!Array.isArray(symbols)) {
        console.error('Erro: symbols deve ser um array ou uma string separada por vírgulas', symbols);
        // Tenta converter para array de qualquer forma
        try {
          if (symbols && typeof symbols === 'object') {
            symbols = Object.keys(symbols);
          } else {
            // Se não conseguir converter, usa um array vazio
            symbols = defaultConfig.symbols.split(',').map(s => s.trim());
          }
        } catch (e) {
          console.error('Não foi possível converter symbols para array:', e);
          symbols = defaultConfig.symbols.split(',').map(s => s.trim());
        }
      }
      
      if (config.debug) console.log('Símbolos para renderizar:', symbols);
      
      // Renderiza o ticker com dados de exemplo para exibição imediata
      renderPlaceholderTicker(symbols, config, container);
      
      // Busca cotações em segundo plano
      fetchQuotes(symbols, config, container);
      
      return {
        update: () => updateTickerValues(symbols, config, container)
      };
    } catch (error) {
      console.error('Erro ao inicializar widget:', error);
    }
  };

  // Função para inicializar automaticamente o widget
  function inicializarWidget() {
    try {
      // Obtém a configuração do script
      const scriptConfig = getScriptConfig();
      
      // Se encontrou configuração no script, inicializa o widget
      if (scriptConfig) {
        // Inicializa imediatamente
        AlertaCambioWidget.init(scriptConfig);
      } else {
        // Inicializa imediatamente com configurações padrão
        AlertaCambioWidget.init({});
      }
    } catch (e) {
      console.error('Erro ao inicializar widget automaticamente:', e);
    }
  }
  
  // Inicializa imediatamente, sem esperar pelo DOM
  inicializarWidget();
  
  // Adiciona um listener para receber mensagens do editor
  window.addEventListener('message', function(event) {
    try {
      // Verifica se a mensagem é para atualizar as cotações
      if (typeof event.data === 'object' && event.data.action === 'updateQuotes') {
        // Obtém o container do widget
        const container = document.getElementById('alerta-cambio-widget');
        if (!container) {
          console.error('Container do widget não encontrado');
          return;
        }
        
        // Obtém a configuração do script
        const scriptConfig = getScriptConfig();
        if (!scriptConfig) {
          console.error('Configuração do widget não encontrada');
          return;
        }
        
        // Usa os símbolos da mensagem, se disponíveis
        let symbols = event.data.symbols || scriptConfig.symbols || defaultConfig.symbols;
        
        // Garantir que symbols seja um array
        if (typeof symbols === 'string') {
          symbols = symbols.split(',').map(s => s.trim());
        }
        
        if (scriptConfig.debug) console.log('Atualizando cotações com símbolos:', symbols);
        
        // Atualiza apenas os valores, sem recriar o widget
        updateTickerValues(symbols, scriptConfig, container);
      } else if (event.data === 'updateQuotes') {
        // Compatibilidade com o formato antigo de mensagem
        // Obtém o container do widget
        const container = document.getElementById('alerta-cambio-widget');
        if (!container) {
          console.error('Container do widget não encontrado');
          return;
        }
        
        // Obtém a configuração do script
        const scriptConfig = getScriptConfig();
        if (!scriptConfig) {
          console.error('Configuração do widget não encontrada');
          return;
        }
        
        // Obtém os símbolos da configuração
        let symbols = scriptConfig.symbols || defaultConfig.symbols;
        
        // Garante que symbols seja um array
        if (typeof symbols === 'string') {
          symbols = symbols.split(',').map(s => s.trim());
        }
        
        if (scriptConfig.debug) console.log('Atualizando cotações com símbolos:', symbols);
        
        // Atualiza apenas os valores, sem recriar o widget
        updateTickerValues(symbols, scriptConfig, container);
      }
    } catch (e) {
      console.error('Erro ao processar mensagem:', e);
    }
  });
  
  // Função para gerar os estilos CSS
  function getStyles(speed) {
    return `
      /* Estilos para o widget de cotações */
      #alerta-cambio-widget {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        box-sizing: border-box;
        width: 100%;
        overflow: hidden;
        padding: 0;
        margin: 0;
      }
      
      #alerta-cambio-widget * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      
      /* Animação do carrossel */
      @keyframes ac-ticker-scroll {
        0% {
          transform: translateX(100%);
        }
        100% {
          transform: translateX(-100%);
        }
      }
    `;
  }
  
  // Adiciona estilos CSS básicos
  function addSimpleStyles(speed) {
    // Verifica se os estilos já foram adicionados
    if (document.getElementById('alerta-cambio-widget-styles')) {
      return;
    }
    
    // Cria o elemento de estilo
    const styleElement = document.createElement('style');
    styleElement.id = 'alerta-cambio-widget-styles';
    styleElement.textContent = getStyles(speed);
    
    // Adiciona ao head do documento
    document.head.appendChild(styleElement);
  }
  
  // Renderiza um ticker simples com dados fixos
  function renderSimpleTicker(container, config) {
    // Limpa o conteúdo atual do container
    container.innerHTML = '';
    
    // Cria o container do ticker
    const tickerContainer = document.createElement('div');
    tickerContainer.className = 'ticker-container';
    
    // Cria o conteúdo do ticker
    const tickerContent = document.createElement('div');
    tickerContent.className = 'ticker-content';
    
    // Dados fixos para exibição imediata
    const fixedData = [
      { symbol: 'USD/BRL', name: 'Dólar Americano', value: '5.1523', variation: '+0.25%', baseFlag: 'us', quoteFlag: 'br' },
      { symbol: 'EUR/BRL', name: 'Euro', value: '5.6789', variation: '-0.15%', baseFlag: 'eu', quoteFlag: 'br' },
      { symbol: 'GBP/BRL', name: 'Libra Esterlina', value: '6.7823', variation: '+0.10%', baseFlag: 'gb', quoteFlag: 'br' },
      { symbol: 'JPY/BRL', name: 'Iene Japonês', value: '0.034567', variation: '-0.20%', baseFlag: 'jp', quoteFlag: 'br' },
      { symbol: 'CAD/BRL', name: 'Dólar Canadense', value: '3.8547', variation: '+0.30%', baseFlag: 'ca', quoteFlag: 'br' },
      { symbol: 'BTC/USD', name: 'Bitcoin', value: '65,432.78', variation: '+1.20%', baseFlag: 'btc', quoteFlag: 'us' },
      { symbol: 'ETH/USD', name: 'Ethereum', value: '3,456.92', variation: '+0.80%', baseFlag: 'eth', quoteFlag: 'us' }
    ];
    
    // Cria os itens do ticker
    fixedData.forEach(item => {
      const tickerItem = document.createElement('div');
      tickerItem.className = `ticker-item ${config.theme === 'dark' ? 'dark' : 'light'}`;
      tickerItem.setAttribute('data-symbol', item.symbol);
      
      // Parte esquerda (logo, símbolo e nome)
      const leftPart = document.createElement('div');
      leftPart.className = 'ticker-left';
      
      // Adiciona logos se configurado
      if (config.showLogos) {
        const logoContainer = document.createElement('div');
        logoContainer.className = 'ticker-logo';
        
        // Logo principal
        const baseImg = document.createElement('img');
        baseImg.src = getLogoUrl(item.baseFlag);
        baseImg.alt = item.symbol.split('/')[0];
        logoContainer.appendChild(baseImg);
        
        // Logo secundário
        const quoteImg = document.createElement('img');
        quoteImg.className = 'secondary';
        quoteImg.src = getLogoUrl(item.quoteFlag);
        quoteImg.alt = item.symbol.split('/')[1];
        logoContainer.appendChild(quoteImg);
        
        leftPart.appendChild(logoContainer);
      }
      
      // Informações da moeda
      const infoContainer = document.createElement('div');
      infoContainer.className = 'ticker-info';
      
      const symbolElement = document.createElement('div');
      symbolElement.className = 'ticker-symbol';
      symbolElement.textContent = item.symbol;
      infoContainer.appendChild(symbolElement);
      
      const nameElement = document.createElement('div');
      nameElement.className = 'ticker-name';
      nameElement.textContent = item.name;
      infoContainer.appendChild(nameElement);
      
      leftPart.appendChild(infoContainer);
      tickerItem.appendChild(leftPart);
      
      // Parte direita (valor e variação)
      const rightPart = document.createElement('div');
      rightPart.className = 'ticker-right';
      
      const valueElement = document.createElement('div');
      valueElement.className = 'ticker-value';
      valueElement.textContent = item.value;
      rightPart.appendChild(valueElement);
      
      // Adiciona variação se configurado
      if (config.showVariation) {
        const variationElement = document.createElement('div');
        const isPositive = item.variation.startsWith('+');
        variationElement.className = `ticker-variation ${isPositive ? 'positive' : 'negative'}`;
        variationElement.textContent = item.variation;
        rightPart.appendChild(variationElement);
      }
      
      tickerItem.appendChild(rightPart);
      tickerContent.appendChild(tickerItem);
    });
    
    // Duplica os itens para criar efeito infinito
    tickerContent.innerHTML += tickerContent.innerHTML;
    
    // Monta a estrutura
    tickerContainer.appendChild(tickerContent);
    container.appendChild(tickerContainer);
    
    if (config.debug) console.log('Ticker simples renderizado com sucesso');
  }
  
  // Função auxiliar para obter URL do logo
  function getLogoUrl(code) {
    const cryptoLogos = {
      'btc': 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/btc.png',
      'eth': 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/eth.png'
    };
    
    if (cryptoLogos[code]) {
      return cryptoLogos[code];
    }
    
    return `https://flagcdn.com/w80/${code}.png`;
  }
  
  // Função para buscar cotações (mantida para compatibilidade)
  function fetchQuotes(symbols, config, container) {
    try {
      if (config.debug) console.log('Buscando cotações...');
      
      // Renderiza imediatamente com dados de exemplo
      renderPlaceholderTicker(symbols, config, container);
      
      // Atualiza com dados reais em segundo plano
      setTimeout(() => {
        updateTickerValues(symbols, config, container);
      }, 100);
      
      // Configura atualização periódica
      setInterval(() => {
        updateTickerValues(symbols, config, container);
      }, config.refreshInterval || 10000);
      
    } catch (error) {
      console.error('Erro ao buscar cotações:', error);
    }
  }
  
  // Função para atualizar os valores do ticker
  function updateTickerValues(symbols, config, container) {
    try {
      if (config.debug) console.log('Atualizando valores do ticker...', symbols);
      
      // Garantir que symbols seja um array
      if (typeof symbols === 'string') {
        symbols = symbols.split(',').map(s => s.trim());
      }
      
      // Verificação adicional para garantir que symbols seja um array
      if (!Array.isArray(symbols)) {
        console.error('Erro: symbols deve ser um array ou uma string separada por vírgulas', symbols);
        // Tenta converter para array de qualquer forma
        try {
          if (symbols && typeof symbols === 'object') {
            symbols = Object.keys(symbols);
          } else {
            // Se não conseguir converter, usa um array vazio
            symbols = defaultConfig.symbols.split(',').map(s => s.trim());
          }
        } catch (e) {
          console.error('Não foi possível converter symbols para array:', e);
          symbols = defaultConfig.symbols.split(',').map(s => s.trim());
        }
      }
      
      // Se não tiver símbolos, não faz nada
      if (symbols.length === 0) {
        console.warn('Nenhum símbolo para atualizar');
        return;
      }
      
      if (config.debug) console.log('Símbolos para atualizar:', symbols);
      
      // Monta a URL da API com os símbolos mapeados
      const apiSymbols = symbols.map(symbol => symbolMapping[symbol] || symbol).join(',');
      const apiUrl = `https://economia.awesomeapi.com.br/json/last/${apiSymbols}`;
      
      if (config.debug) console.log('URL da API:', apiUrl);
      
      // Faz a requisição para a API
      fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
          if (config.debug) console.log('Dados recebidos da API:', data);
          
          // Atualiza os valores no DOM
          symbols.forEach(symbol => {
            try {
              // Obtém o código da API para o símbolo
              const apiCode = symbolMapping[symbol] || symbol;
              const apiCodeFormatted = apiCode.replace('-', '');
              
              // Verifica se os dados existem
              if (data[apiCodeFormatted]) {
                const quote = data[apiCodeFormatted];
                
                // Encontra o elemento do ticker para este símbolo
                const tickerItem = container.querySelector(`.ac-ticker-item[data-symbol="${symbol}"]`);
                if (tickerItem) {
                  // Atualiza o valor
                  const valueElement = tickerItem.querySelector('.ac-ticker-value');
                  if (valueElement) {
                    const value = parseFloat(quote.bid);
                    valueElement.textContent = formatCurrencyValue(value, symbol);
                  }
                  
                  // Atualiza a variação, se existir
                  const variationElement = tickerItem.querySelector('.ac-ticker-variation');
                  if (variationElement && config.showVariation) {
                    const variation = parseFloat(quote.pctChange);
                    variationElement.textContent = variation >= 0 ? `+${variation.toFixed(2)}%` : `${variation.toFixed(2)}%`;
                    variationElement.style.color = variation >= 0 ? '#10B981' : '#EF4444';
                  }
                }
              }
            } catch (err) {
              console.error(`Erro ao atualizar ${symbol}:`, err);
            }
          });
        })
        .catch(error => {
          console.error('Erro ao buscar cotações:', error);
        });
    } catch (e) {
      console.error('Erro ao atualizar valores:', e);
    }
  }
  
  // Renderiza o ticker com dados de exemplo para exibição imediata
  function renderPlaceholderTicker(symbols, config, container) {
    try {
      if (config.debug) console.log('Renderizando ticker com dados de exemplo...', symbols);
      
      // Limpa o container
      container.innerHTML = '';
      
      // Cria o container do ticker
      const tickerContainer = document.createElement('div');
      tickerContainer.className = 'ac-ticker-container';
      tickerContainer.style.overflow = 'hidden';
      tickerContainer.style.width = '100%';
      tickerContainer.style.position = 'relative';
      tickerContainer.style.height = '64px';
      
      // Cria o conteúdo do ticker
      const tickerContent = document.createElement('div');
      tickerContent.className = 'ac-ticker-content';
      tickerContent.style.display = 'inline-flex';
      tickerContent.style.position = 'absolute';
      tickerContent.style.whiteSpace = 'nowrap';
      tickerContent.style.willChange = 'transform';
      tickerContent.style.animationName = 'ac-ticker-scroll';
      tickerContent.style.animationTimingFunction = 'linear';
      tickerContent.style.animationIterationCount = 'infinite';
      tickerContent.style.animationDuration = `${config.carouselSpeed}s`;
      tickerContent.style.gap = '8px';
      tickerContent.style.alignItems = 'center';
      
      // Garantir que symbols seja um array
      if (typeof symbols === 'string') {
        symbols = symbols.split(',').map(s => s.trim());
      }
      
      // Verificação adicional para garantir que symbols seja um array
      if (!Array.isArray(symbols)) {
        console.error('Erro: symbols deve ser um array ou uma string separada por vírgulas', symbols);
        // Tenta converter para array de qualquer forma
        try {
          if (symbols && typeof symbols === 'object') {
            symbols = Object.keys(symbols);
          } else {
            // Se não conseguir converter, usa um array vazio
            symbols = defaultConfig.symbols.split(',').map(s => s.trim());
          }
        } catch (e) {
          console.error('Não foi possível converter symbols para array:', e);
          symbols = defaultConfig.symbols.split(',').map(s => s.trim());
        }
      }
      
      if (config.debug) console.log('Símbolos para renderizar placeholders:', symbols);
      
      // Dados de exemplo para cada símbolo
      const exampleData = {
        'USD/BRL': { value: 5.25, variation: 0.75 },
        'EUR/BRL': { value: 5.65, variation: -0.32 },
        'GBP/BRL': { value: 6.78, variation: 0.12 },
        'JPY/BRL': { value: 0.035, variation: -0.15 },
        'CAD/BRL': { value: 3.85, variation: 0.28 },
        'AUD/BRL': { value: 3.45, variation: -0.10 },
        'CNY/BRL': { value: 0.75, variation: 0.05 },
        'ARS/BRL': { value: 0.012, variation: 0.50 },
        'CHF/BRL': { value: 5.20, variation: 0.10 },
        'BTC/USD': { value: 65000, variation: 1.20 },
        'ETH/USD': { value: 3400, variation: 0.80 },
        'XRP/USD': { value: 0.50, variation: -0.50 },
        'LTC/USD': { value: 80.50, variation: 0.35 },
        'BTC/BRL': { value: 320000, variation: 1.50 },
        'ETH/BRL': { value: 17500, variation: 0.95 }
      };
      
      // Cria um item para cada símbolo
      symbols.forEach(symbol => {
        const trimmedSymbol = symbol.trim();
        const defaultValue = exampleData[trimmedSymbol] || { value: 1.0000, variation: 0.00 };
        
        // Cria o item do ticker
        const tickerItem = document.createElement('div');
        tickerItem.className = 'ac-ticker-item';
        tickerItem.setAttribute('data-symbol', trimmedSymbol);
        tickerItem.style.display = 'flex';
        tickerItem.style.alignItems = 'center';
        tickerItem.style.justifyContent = 'space-between';
        tickerItem.style.padding = '8px 12px';
        tickerItem.style.marginRight = '8px';
        tickerItem.style.borderRadius = '8px';
        tickerItem.style.minWidth = '220px'; // Aumentado para garantir espaço suficiente
        tickerItem.style.width = 'auto';
        tickerItem.style.height = '48px';
        tickerItem.style.transition = 'all 0.2s ease';
        tickerItem.style.boxSizing = 'border-box';
        tickerItem.style.flexShrink = '0';
        
        // Aplica o tema
        if (config.theme === 'dark') {
          tickerItem.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          tickerItem.style.color = '#FFFFFF';
        } else {
          tickerItem.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
          tickerItem.style.color = '#333333';
        }
        
        // Parte esquerda (símbolo e nome)
        const leftPart = document.createElement('div');
        leftPart.className = 'ac-ticker-left';
        leftPart.style.display = 'flex';
        leftPart.style.alignItems = 'center';
        leftPart.style.width = '60%'; // Define uma largura fixa para a parte esquerda
        leftPart.style.maxWidth = '150px'; // Limita a largura máxima
        
        // Logos
        if (config.showLogos) {
          const logoContainer = document.createElement('div');
          logoContainer.className = 'ac-ticker-logo-container';
          logoContainer.style.position = 'relative';
          logoContainer.style.marginRight = '8px';
          logoContainer.style.width = '24px';
          logoContainer.style.height = '24px';
          
          // Logo principal
          const baseCurrency = trimmedSymbol.split('/')[0];
          const baseLogoUrl = getCurrencyLogoUrl(baseCurrency);
          if (baseLogoUrl) {
            const baseLogo = document.createElement('img');
            baseLogo.src = baseLogoUrl;
            baseLogo.alt = baseCurrency;
            baseLogo.style.width = '24px';
            baseLogo.style.height = '24px';
            baseLogo.style.borderRadius = '50%';
            baseLogo.style.border = '2px solid white';
            baseLogo.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            baseLogo.style.position = 'absolute';
            baseLogo.style.top = '0';
            baseLogo.style.left = '0';
            baseLogo.style.zIndex = '2';
            logoContainer.appendChild(baseLogo);
          }
          
          // Logo secundário
          const quoteCurrency = trimmedSymbol.split('/')[1];
          const quoteLogoUrl = getCurrencyLogoUrl(quoteCurrency);
          if (quoteLogoUrl) {
            const quoteLogo = document.createElement('img');
            quoteLogo.className = 'secondary';
            quoteLogo.src = quoteLogoUrl;
            quoteLogo.alt = quoteCurrency;
            quoteLogo.style.width = '16px';
            quoteLogo.style.height = '16px';
            quoteLogo.style.borderRadius = '50%';
            quoteLogo.style.border = '2px solid white';
            quoteLogo.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            quoteLogo.style.position = 'absolute';
            quoteLogo.style.bottom = '-5px';
            quoteLogo.style.right = '-5px';
            quoteLogo.style.zIndex = '1';
            logoContainer.appendChild(quoteLogo);
          }
          
          leftPart.appendChild(logoContainer);
        }
        
        // Símbolo e nome
        const symbolElement = document.createElement('div');
        symbolElement.className = 'ac-ticker-symbol';
        
        // Nome da moeda
        const currencyName = getCurrencyName(trimmedSymbol);
        symbolElement.innerHTML = `<div style="font-weight: bold; font-size: 16px;">${trimmedSymbol}</div><div style="font-size: 12px; opacity: 0.7;">${currencyName}</div>`;
        
        leftPart.appendChild(symbolElement);
        tickerItem.appendChild(leftPart);
        
        // Parte direita (valor e variação)
        const rightPart = document.createElement('div');
        rightPart.className = 'ac-ticker-right';
        rightPart.style.display = 'flex';
        rightPart.style.flexDirection = 'column';
        rightPart.style.alignItems = 'flex-end';
        rightPart.style.width = '40%'; // Define uma largura fixa para a parte direita
        rightPart.style.minWidth = '80px'; // Garante um espaço mínimo para os valores
        
        // Valor
        const valueElement = document.createElement('div');
        valueElement.className = 'ac-ticker-value';
        const value = defaultValue.value;
        
        // Formata o valor com base no símbolo
        valueElement.textContent = formatCurrencyValue(value, trimmedSymbol);
        valueElement.style.fontWeight = 'bold';
        valueElement.style.fontSize = '16px';
        rightPart.appendChild(valueElement);
        
        // Variação percentual
        if (config.showVariation) {
          const variationElement = document.createElement('div');
          variationElement.className = 'ac-ticker-variation';
          
          // Variação com sinal aleatório
          const variation = defaultValue.variation + (Math.random() * 0.2 - 0.1);
          
          // Formata a variação
          variationElement.textContent = variation >= 0 ? `+${variation.toFixed(2)}%` : `${variation.toFixed(2)}%`;
          variationElement.style.fontSize = '12px';
          variationElement.style.color = variation >= 0 ? '#10B981' : '#EF4444';
          
          rightPart.appendChild(variationElement);
        }
        
        tickerItem.appendChild(rightPart);
        tickerContent.appendChild(tickerItem);
      });
      
      // Duplica os itens várias vezes para garantir que o carrossel seja realmente infinito
      // Quanto mais duplicações, mais tempo o carrossel rodará sem mostrar o "fim"
      let clonedItems = tickerContent.innerHTML;
      // Duplica os itens 5 vezes para garantir que o carrossel seja realmente infinito
      tickerContent.innerHTML = clonedItems + clonedItems + clonedItems + clonedItems + clonedItems;
      
      // Monta a estrutura
      tickerContainer.appendChild(tickerContent);
      container.appendChild(tickerContainer);
      
      if (config.debug) console.log('Ticker com dados de exemplo renderizado com sucesso');
    } catch (e) {
      console.error('Erro ao renderizar ticker:', e);
    }
  }

  // Função auxiliar para obter o nome da moeda
  function getCurrencyName(symbol) {
    const names = {
      'USD/BRL': 'Dólar Americano',
      'EUR/BRL': 'Euro',
      'GBP/BRL': 'Libra Esterlina',
      'JPY/BRL': 'Iene Japonês',
      'CAD/BRL': 'Dólar Canadense',
      'AUD/BRL': 'Dólar Australiano',
      'CNY/BRL': 'Yuan Chinês',
      'ARS/BRL': 'Peso Argentino',
      'CHF/BRL': 'Franco Suíço',
      'BTC/USD': 'Bitcoin',
      'ETH/USD': 'Ethereum',
      'XRP/USD': 'Ripple',
      'LTC/USD': 'Litecoin',
      'DOGE/USD': 'Dogecoin',
      'BTC/BRL': 'Bitcoin',
      'ETH/BRL': 'Ethereum'
    };
    
    return names[symbol] || symbol;
  }
  
  // Função auxiliar para obter a URL do logo da moeda
  function getCurrencyLogoUrl(currency) {
    const cryptoLogos = {
      'BTC': 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/btc.png',
      'ETH': 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/eth.png',
      'XRP': 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/xrp.png',
      'LTC': 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/ltc.png',
      'DOGE': 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/doge.png'
    };
    
    // Se for uma criptomoeda
    if (cryptoLogos[currency]) {
      return cryptoLogos[currency];
    }
    
    // Se for uma moeda fiduciária (usando bandeiras de países)
    const countryFlags = {
      'USD': 'us',
      'EUR': 'eu',
      'GBP': 'gb',
      'JPY': 'jp',
      'CAD': 'ca',
      'AUD': 'au',
      'CNY': 'cn',
      'BRL': 'br',
      'ARS': 'ar',
      'CHF': 'ch'
    };
    
    if (countryFlags[currency]) {
      return `https://flagcdn.com/w80/${countryFlags[currency]}.png`;
    }
    
    return null;
  }
  
  // Função auxiliar para formatar o valor da moeda
  function formatCurrencyValue(value, symbol) {
    // Formata JPY com 6 casas decimais
    if (symbol.includes('JPY')) {
      return value.toFixed(6);
    }
    
    // Formata criptomoedas com 2 casas decimais
    if (symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('XRP') || 
        symbol.includes('LTC') || symbol.includes('DOGE')) {
      return value.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
    }
    
    // Formato padrão para outras moedas
    return value.toLocaleString('en-US', { 
      minimumFractionDigits: 4, 
      maximumFractionDigits: 4 
    });
  }
})();
