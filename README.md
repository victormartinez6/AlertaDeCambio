# Alerta de Câmbio

Sistema de alertas para cotações de moedas estrangeiras, com suporte para câmbio turismo e remessas internacionais.

## Funcionalidades

- Monitoramento de cotações em tempo real
- Alertas para Dólar (USD), Euro (EUR) e Libra (GBP)
- Suporte para câmbio turismo e remessas internacionais
- Notificações via e-mail e WhatsApp
- Webhooks para integração com outros sistemas

## Tecnologias

- Vue.js 3 com TypeScript
- Firebase (Authentication, Firestore, Cloud Functions)
- Tailwind CSS para estilização
- API de cotações AwesomeAPI

## Configuração do Projeto

### Pré-requisitos

- Node.js (v14 ou superior)
- npm ou yarn
- Firebase CLI

### Instalação

1. Clone o repositório
```bash
git clone [URL_DO_REPOSITORIO]
cd alerta-de-cambio
```

2. Instale as dependências
```bash
npm install
```

3. Configure as variáveis de ambiente
```bash
cp .env.example .env.local
# Edite .env.local com suas configurações
```

4. Execute o projeto localmente
```bash
npm run dev
```

### Deploy

1. Faça login no Firebase
```bash
firebase login
```

2. Selecione seu projeto
```bash
firebase use seu-projeto-id
```

3. Deploy das Cloud Functions
```bash
cd functions
npm run deploy
```

## Estrutura do Projeto

- `/src` - Código fonte do frontend
  - `/views` - Componentes de página
  - `/components` - Componentes reutilizáveis
  - `/stores` - Gerenciamento de estado com Pinia
  - `/utils` - Funções utilitárias
- `/functions` - Cloud Functions do Firebase
  - `/src` - Código fonte das funções
    - `alertas.ts` - Lógica de verificação de alertas
    - `webhooks.ts` - Handlers de webhook

## Licença

Este projeto está licenciado sob a licença MIT.
