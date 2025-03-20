"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificarAlertas = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const node_fetch_1 = __importDefault(require("node-fetch"));
// Inicializa o admin do Firebase
if (!admin.apps.length) {
    admin.initializeApp();
}
// Função para buscar cotações da API
async function buscarCotacoes() {
    try {
        const response = await (0, node_fetch_1.default)('https://economia.awesomeapi.com.br/json/all');
        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error('Erro ao buscar cotações:', error);
        throw error;
    }
}
// Função para calcular cotação final com base no produto
function calcularCotacaoFinal(moeda, cotacaoBase, produto) {
    // Taxas por moeda (mover para configuração no Firestore depois)
    const taxas = {
        'USD': 1,
        'EUR': 2,
        'GBP': 3
    };
    const taxa = taxas[moeda] || 1;
    return cotacaoBase * (1 + taxa / 100);
}
// Cloud Function que verifica os alertas a cada minuto
exports.verificarAlertas = functions.pubsub
    .schedule('every 1 minutes')
    .onRun(async (context) => {
    console.log('Iniciando verificação de alertas...');
    try {
        // Busca cotações atualizadas
        const cotacoes = await buscarCotacoes();
        // Busca todos os alertas ativos que ainda não foram disparados
        const alertasSnapshot = await admin.firestore()
            .collection('alertas')
            .where('ativo', '==', true)
            .where('webhookDisparado', '==', false)
            .get();
        console.log(`Encontrados ${alertasSnapshot.size} alertas para verificar`);
        // Para cada alerta
        for (const doc of alertasSnapshot.docs) {
            const alerta = Object.assign({ id: doc.id }, doc.data());
            console.log('Verificando alerta:', alerta.id);
            // Pega a cotação base da API
            const cotacaoInfo = cotacoes[alerta.moeda];
            if (!cotacaoInfo) {
                console.log(`Cotação não encontrada para ${alerta.moeda}`);
                continue;
            }
            // Calcula cotação final
            const cotacaoBase = parseFloat(cotacaoInfo.bid);
            const cotacaoFinal = calcularCotacaoFinal(alerta.moeda, cotacaoBase, alerta.produto);
            const cotacaoAlvo = Number(alerta.cotacaoAlvo);
            console.log(`Cotação final para ${alerta.moeda}: ${cotacaoFinal} (alvo: ${cotacaoAlvo})`);
            // Se atingiu o alvo
            if (cotacaoFinal <= cotacaoAlvo) {
                console.log('Cotação atingiu o alvo! Buscando webhooks...');
                // Busca webhooks do usuário
                const webhooksSnapshot = await admin.firestore()
                    .collection('webhooks')
                    .where('userId', '==', alerta.userId)
                    .where('events', 'array-contains', 'alert.triggered')
                    .get();
                // Prepara o payload
                const webhookPayload = {
                    event: 'alert.triggered',
                    data: Object.assign(Object.assign({}, alerta), { cotacaoAtual: cotacaoFinal, horario: new Date().toISOString(), mensagem: `A cotação atual (${cotacaoFinal}) atingiu ou ficou abaixo da cotação alvo (${cotacaoAlvo})!` }),
                    timestamp: new Date().toISOString()
                };
                // Dispara para cada webhook configurado
                const promises = webhooksSnapshot.docs.map(async (webhookDoc) => {
                    const webhook = webhookDoc.data();
                    console.log(`Disparando webhook ${webhookDoc.id} para URL ${webhook.url}`);
                    try {
                        const response = await (0, node_fetch_1.default)(webhook.url, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-Webhook-Event': 'alert.triggered'
                            },
                            body: JSON.stringify(webhookPayload)
                        });
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        console.log(`Webhook ${webhookDoc.id} disparado com sucesso`);
                    }
                    catch (error) {
                        console.error(`Erro ao disparar webhook ${webhookDoc.id}:`, error);
                    }
                });
                // Aguarda todos os webhooks serem disparados
                await Promise.all(promises);
                // Marca o alerta como disparado
                await doc.ref.update({
                    webhookDisparado: true,
                    horarioDisparo: new Date().toISOString(),
                    cotacaoDisparo: cotacaoFinal
                });
                console.log(`Alerta ${alerta.id} marcado como disparado`);
            }
        }
        console.log('Verificação de alertas concluída');
        return null;
    }
    catch (error) {
        console.error('Erro ao verificar alertas:', error);
        return null;
    }
});
//# sourceMappingURL=alertas.js.map