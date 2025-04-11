/**
 * Widget de Cotações - Alerta de Câmbio
 * 
 * Este script cria um widget de cotações em tempo real que pode ser incorporado
 * em qualquer site. O widget exibe cotações de moedas e criptomoedas em um formato
 * de ticker horizontal.
 * 
 * Desenvolvido por: Alerta de Câmbio
 * Versão: 1.3.0
 */

(function() {
  'use strict';

  // Namespace global para o widget
  window.AlertaCambioWidget = window.AlertaCambioWidget || {};
  
  // Configurações padrão
  const defaultConfig = {
    container: 'alerta-cambio-widget',
    symbols: 'USD/BRL,EUR/BRL',
    theme: 'light',
    bgColor: '#FFFFFF',
    showLogos: true,
    showVariation: true,
    lang: 'pt-BR',
    width: '100%',
    refreshInterval: 60000 // 1 minuto
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
      // Obtém o script atual
      const scripts = document.getElementsByTagName('script');
      let currentScript = null;
      
      // Procura pelo script atual
      for (let i = 0; i < scripts.length; i++) {
        if (scripts[i].src && scripts[i].src.includes('ticker.js')) {
          currentScript = scripts[i];
          break;
        }
      }
      
      if (!currentScript) {
        console.error('Script ticker.js não encontrado');
        return null;
      }
      
      // Obtém o conteúdo do script (configuração JSON)
      const scriptContent = currentScript.innerHTML.trim();
      if (!scriptContent) {
        console.error('Conteúdo do script vazio');
        return null;
      }
      
      try {
        // Tenta avaliar o conteúdo como objeto JavaScript
        // Usando Function para evitar problemas de segurança com eval
        const configObj = new Function('return ' + scriptContent)();
        console.log('Configuração detectada:', configObj);
        return configObj;
      } catch (e) {
        console.error('Erro ao analisar configuração do widget:', e);
        return null;
      }
    } catch (e) {
      console.error('Erro ao obter configuração do script:', e);
      return null;
    }
  }

  // Inicializa automaticamente o widget quando o DOM estiver pronto
  function inicializarWidget() {
    try {
      console.log('Inicializando widget...');
      
      // Obtém a configuração do script
      const scriptConfig = getScriptConfig();
      
      // Se encontrou configuração no script, inicializa o widget
      if (scriptConfig) {
        console.log('Configuração encontrada, inicializando widget com:', scriptConfig);
        AlertaCambioWidget.init(scriptConfig);
      } else {
        console.log('Nenhuma configuração encontrada, inicializando com padrões');
        AlertaCambioWidget.init({});
      }
    } catch (e) {
      console.error('Erro ao inicializar widget automaticamente:', e);
    }
  }
  
  // Aguarda o carregamento do DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarWidget);
  } else {
    // O DOM já está carregado
    inicializarWidget();
  }
  
  // Inicializa o widget
  AlertaCambioWidget.init = function(userConfig) {
    try {
      console.log('AlertaCambioWidget.init chamado com:', userConfig);
      
      // Mescla as configurações padrão com as do usuário
      const config = { ...defaultConfig, ...userConfig };
      console.log('Configuração final:', config);
      
      // Obtém o elemento container
      const container = document.getElementById(config.container);
      if (!container) {
        console.error(`Container #${config.container} não encontrado.`);
        return;
      }
      
      // Define a largura do container
      container.style.width = config.width;
      
      // Adiciona classe de tema
      container.className = `ac-widget ac-widget-${config.theme}`;
      
      // Define cor de fundo
      if (config.bgColor !== 'transparent') {
        container.style.backgroundColor = config.bgColor;
      } else {
        container.style.backgroundColor = 'transparent';
      }
      
      // Adiciona mensagem de carregamento
      const lang = config.lang in translations ? config.lang : 'pt-BR';
      container.innerHTML = `<div class="ac-loading">${translations[lang].loading}</div>`;
      
      // Busca cotações
      const symbolsArray = typeof config.symbols === 'string' 
        ? config.symbols.split(',') 
        : config.symbols;
      
      fetchQuotes(symbolsArray, config, container);
      
      // Configura atualização periódica
      setInterval(() => {
        fetchQuotes(symbolsArray, config, container);
      }, config.refreshInterval);
    } catch (error) {
      console.error('Erro ao inicializar widget:', error);
      const container = document.getElementById(userConfig.container || defaultConfig.container);
      if (container) {
        container.innerHTML = '<div class="ac-error">Erro ao carregar o widget de cotações.</div>';
      }
    }
  };
  
  // Função para buscar cotações
  function fetchQuotes(symbols, config, container) {
    try {
      console.log('Buscando cotações para:', symbols);
      
      // Mapeia os símbolos para o formato da API
      const apiSymbols = symbols.map(symbol => {
        const trimmedSymbol = symbol.trim();
        return symbolMapping[trimmedSymbol] || trimmedSymbol;
      }).join(',');
      
      console.log('Símbolos da API:', apiSymbols);
      
      // URL da API
      const apiUrl = `https://economia.awesomeapi.com.br/json/last/${apiSymbols}`;
      console.log('URL da API:', apiUrl);
      
      // Faz a requisição
      fetch(apiUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          console.log('Dados recebidos da API:', data);
          renderTicker(data, symbols, config, container);
        })
        .catch(error => {
          console.error('Erro ao buscar cotações:', error);
          container.innerHTML = `<div class="ac-error">${translations[config.lang].error}</div>`;
        });
    } catch (error) {
      console.error('Erro ao processar requisição:', error);
      container.innerHTML = `<div class="ac-error">${translations[config.lang].error}</div>`;
    }
  }
  
  // Renderiza o ticker com as cotações
  function renderTicker(data, symbols, config, container) {
    // Limpa o container
    container.innerHTML = '';
    
    // Cria o container do ticker
    const tickerContainer = document.createElement('div');
    tickerContainer.className = 'ac-ticker-container';
    
    // Cria o conteúdo do ticker
    const tickerContent = document.createElement('div');
    tickerContent.className = 'ac-ticker-content';
    tickerContent.style.whiteSpace = 'nowrap';
    tickerContent.style.willChange = 'transform';
    tickerContent.style.animation = 'ac-ticker-scroll 40s linear infinite';
    
    // Adiciona cada cotação ao ticker
    let itemsAdded = 0;
    
    symbols.forEach(symbol => {
      const trimmedSymbol = symbol.trim();
      const apiSymbol = symbolMapping[trimmedSymbol] || trimmedSymbol;
      const apiKey = apiSymbol.replace('-', '');
      
      console.log(`Processando símbolo: ${trimmedSymbol}, apiKey: ${apiKey}`);
      
      const quote = data[apiKey];
      
      if (quote) {
        console.log(`Dados para ${trimmedSymbol}:`, quote);
        
        const tickerItem = document.createElement('div');
        tickerItem.className = 'ac-ticker-item';
        
        // Parte esquerda com logo e símbolo
        const leftPart = document.createElement('div');
        leftPart.style.display = 'flex';
        leftPart.style.alignItems = 'center';
        
        // Adiciona o logo se configurado
        if (config.showLogos && logoMapping[trimmedSymbol]) {
          const logoContainer = document.createElement('div');
          logoContainer.style.position = 'relative';
          logoContainer.style.marginRight = '10px';
          logoContainer.style.width = '24px';
          logoContainer.style.height = '24px';
          
          // Logo principal (primeira moeda)
          const logoImg = document.createElement('img');
          logoImg.src = logoMapping[trimmedSymbol];
          logoImg.alt = trimmedSymbol.split('/')[0];
          logoImg.style.width = '24px';
          logoImg.style.height = '24px';
          logoImg.style.borderRadius = '50%';
          logoImg.style.border = config.theme === 'dark' ? '2px solid rgba(255, 255, 255, 0.2)' : '2px solid rgba(255, 255, 255, 1)';
          logoImg.style.position = 'absolute';
          logoImg.style.top = '0';
          logoImg.style.left = '0';
          logoImg.style.zIndex = '2';
          logoImg.style.objectFit = 'cover';
          logoImg.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
          logoContainer.appendChild(logoImg);
          
          // Logo secundário (segunda moeda)
          if (logoSecundarioMapping[trimmedSymbol]) {
            const logoSecundarioImg = document.createElement('img');
            logoSecundarioImg.src = logoSecundarioMapping[trimmedSymbol];
            logoSecundarioImg.alt = trimmedSymbol.split('/')[1];
            logoSecundarioImg.style.width = '20px';
            logoSecundarioImg.style.height = '20px';
            logoSecundarioImg.style.borderRadius = '50%';
            logoSecundarioImg.style.border = config.theme === 'dark' ? '2px solid rgba(255, 255, 255, 0.2)' : '2px solid rgba(255, 255, 255, 1)';
            logoSecundarioImg.style.position = 'absolute';
            logoSecundarioImg.style.bottom = '-10px';
            logoSecundarioImg.style.right = '-10px';
            logoSecundarioImg.style.zIndex = '1';
            logoSecundarioImg.style.objectFit = 'cover';
            logoSecundarioImg.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
            logoContainer.appendChild(logoSecundarioImg);
          }
          
          leftPart.appendChild(logoContainer);
        }
        
        // Container para o símbolo e nome
        const symbolContainer = document.createElement('div');
        symbolContainer.style.display = 'flex';
        symbolContainer.style.flexDirection = 'column';
        
        // Adiciona o símbolo
        const symbolElement = document.createElement('span');
        symbolElement.textContent = trimmedSymbol;
        symbolElement.style.fontWeight = 'bold';
        symbolElement.style.fontSize = '14px';
        symbolContainer.appendChild(symbolElement);
        
        // Adiciona o nome completo
        const nameElement = document.createElement('span');
        nameElement.textContent = quote.name || trimmedSymbol;
        nameElement.style.fontSize = '12px';
        nameElement.style.opacity = '0.7';
        symbolContainer.appendChild(nameElement);
        
        leftPart.appendChild(symbolContainer);
        tickerItem.appendChild(leftPart);
        
        // Parte direita com valor e variação
        const rightPart = document.createElement('div');
        rightPart.style.display = 'flex';
        rightPart.style.flexDirection = 'column';
        rightPart.style.alignItems = 'flex-end';
        rightPart.style.marginLeft = '12px';
        
        // Adiciona o valor com 4 casas decimais
        const valueElement = document.createElement('span');
        valueElement.textContent = parseFloat(quote.bid).toLocaleString(config.lang, {
          minimumFractionDigits: 4,
          maximumFractionDigits: 4
        });
        valueElement.style.fontWeight = 'bold';
        valueElement.style.fontSize = '16px';
        rightPart.appendChild(valueElement);
        
        // Adiciona a variação se configurado
        if (config.showVariation) {
          const variationElement = document.createElement('span');
          const pctChange = parseFloat(quote.pctChange);
          variationElement.textContent = `${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(2)}%`;
          variationElement.style.fontSize = '12px';
          variationElement.style.color = pctChange >= 0 ? '#4CAF50' : '#F44336';
          rightPart.appendChild(variationElement);
        }
        
        tickerItem.appendChild(rightPart);
        tickerContent.appendChild(tickerItem);
        
        itemsAdded++;
      } else {
        console.warn(`Nenhum dado encontrado para o símbolo: ${trimmedSymbol}`);
      }
    });
    
    if (itemsAdded === 0) {
      container.innerHTML = `<div class="ac-error">Nenhuma cotação disponível</div>`;
      return;
    }
    
    // Adiciona informação de última atualização
    const updateInfo = document.createElement('div');
    updateInfo.style.marginLeft = '16px';
    updateInfo.style.opacity = '0.7';
    updateInfo.style.fontSize = '0.9em';
    
    const updateText = document.createElement('span');
    updateText.textContent = `${translations[config.lang].updated}: ${new Date().toLocaleTimeString(config.lang)}`;
    updateInfo.appendChild(updateText);
    
    tickerContent.appendChild(updateInfo);
    
    // Duplica os itens para criar um efeito de loop contínuo
    const originalItems = Array.from(tickerContent.children);
    
    // Adiciona cópias suficientes para garantir que o ticker nunca fique vazio
    originalItems.forEach(item => {
      const clone = item.cloneNode(true);
      tickerContent.appendChild(clone);
    });
    
    // Ajusta a velocidade da animação com base no número de itens
    const itemCount = tickerContent.querySelectorAll('.ac-ticker-item').length;
    const animationDuration = Math.max(40, Math.min(80, 30 + itemCount * 3));
    tickerContent.style.animationDuration = `${animationDuration}s`;
    
    tickerContainer.appendChild(tickerContent);
    container.appendChild(tickerContainer);
    
    // Adiciona o copyright
    const copyright = document.querySelector('.alerta-cambio-widget-copyright');
    if (copyright) {
      copyright.style.fontSize = '10px';
      copyright.style.textAlign = 'right';
      copyright.style.marginTop = '4px';
      copyright.style.opacity = '0.6';
    }
  }
  
  // Estilos CSS do widget
  const styles = `
    .alerta-cambio-widget-container {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-sizing: border-box;
    }
    
    .ac-widget {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      border-radius: 8px;
      padding: 16px;
      overflow: hidden;
      box-sizing: border-box;
      position: relative;
    }
    
    .ac-widget-light {
      color: #333;
      border: 1px solid rgba(0, 0, 0, 0.1);
    }
    
    .ac-widget-dark {
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .ac-loading, .ac-error {
      padding: 20px;
      text-align: center;
      font-size: 14px;
    }
    
    .ac-error {
      color: #e53e3e;
    }
    
    .ac-ticker-container {
      position: relative;
      overflow: hidden;
      height: 80px;
      display: flex;
      align-items: center;
    }
    
    .ac-ticker-content {
      display: inline-flex;
      position: absolute;
      white-space: nowrap;
      will-change: transform;
      animation: ac-ticker-scroll 40s linear infinite;
      gap: 12px;
    }
    
    @keyframes ac-ticker-scroll {
      0% {
        transform: translateX(100%);
      }
      100% {
        transform: translateX(-100%);
      }
    }
    
    .ac-ticker-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      margin-right: 12px;
      border-radius: 8px;
      min-width: 250px;
      width: 250px;
      transition: all 0.2s ease;
    }
    
    .ac-widget-light .ac-ticker-item {
      background-color: rgba(0, 0, 0, 0.05);
    }
    
    .ac-widget-dark .ac-ticker-item {
      background-color: rgba(255, 255, 255, 0.1);
    }
    
    .ac-ticker-item:hover {
      transform: translateY(-2px);
    }
    
    .alerta-cambio-widget-copyright a {
      color: #6B7280;
      text-decoration: none;
      font-size: 10px;
    }
    
    .alerta-cambio-widget-copyright a:hover {
      text-decoration: underline;
    }
  `;
  
  // Adiciona estilos ao documento
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
  
  // Destrói o widget e limpa os intervalos
  AlertaCambioWidget.destroy = function() {
    // Implementação futura
  };
})();
