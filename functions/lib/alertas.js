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
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const node_fetch_1 = __importDefault(require("node-fetch"));
// Inicializar Firebase Admin apenas se não estiver inicializado
if ((0, app_1.getApps)().length === 0) {
    (0, app_1.initializeApp)();
}
// Referência ao Firestore
const db = (0, firestore_1.getFirestore)();
const { collection, query, where, getDocs, updateDoc } = require('firebase-admin/firestore');
// Função para buscar taxas do Firestore
async function buscarTaxas() {
    try {
        const docRef = db.collection('configuracoes').doc('taxas_turismo');
        const docSnap = await docRef.get();
        if (docSnap.exists) {
            return docSnap.data();
        }
        return {
            'USD': 3,
            'EUR': 3,
            'GBP': 3
        };
    }
    catch (error) {
        console.error('Erro ao buscar taxas:', error);
        return {
            'USD': 3,
            'EUR': 3,
            'GBP': 3
        };
    }
}
// Função para buscar cotação atual
async function buscarCotacaoAtual(moeda, produto) {
    try {
        const response = await (0, node_fetch_1.default)(`https://economia.awesomeapi.com.br/json/last/${moeda}-BRL`);
        if (!response.ok) {
            console.error(`Erro ao buscar cotação para ${moeda}:`, response.statusText);
            return null;
        }
        const data = await response.json();
        const cotacao = data[`${moeda}BRL`];
        if (!cotacao) {
            console.error(`Cotação não encontrada para ${moeda}`);
            return null;
        }
        // Se for remessas, retorna a cotação comercial de venda diretamente
        if (produto === 'remessas') {
            const cotacaoComercial = Number(cotacao.ask);
            console.log(`Cotação comercial (ask) para ${moeda}: ${cotacaoComercial}`);
            return cotacaoComercial;
        }
        // Se for turismo, aplica a taxa
        const taxas = await buscarTaxas();
        const taxa = taxas[moeda] || 0;
        const cotacaoBase = Number(cotacao.ask);
        const cotacaoFinal = cotacaoBase * (1 + taxa / 100);
        console.log(`Cotação base para ${moeda}: ${cotacaoBase}`);
        console.log(`Taxa para ${moeda}: ${taxa}%`);
        console.log(`Cotação final calculada para ${moeda}: ${cotacaoFinal}`);
        return cotacaoFinal;
    }
    catch (error) {
        console.error('Erro ao buscar cotação:', error);
        return null;
    }
}
// Função principal para verificar alertas
exports.verificarAlertas = functions.pubsub
    .schedule('every 1 minutes')
    .onRun(async (context) => {
    console.log('Iniciando verificação de alertas...');
    try {
        const alertasRef = collection(db, 'alertas');
        const q = query(alertasRef, where('ativo', '==', true));
        const querySnapshot = await getDocs(q);
        const promises = querySnapshot.docs.map(async (doc) => {
            const alerta = doc.data();
            console.log(`Verificando alerta ${doc.id} para ${alerta.moeda} (${alerta.produto})`);
            // Busca cotação atual baseada no produto
            const cotacaoAtual = await buscarCotacaoAtual(alerta.moeda, alerta.produto);
            if (!cotacaoAtual) {
                console.error(`Não foi possível obter cotação para ${alerta.moeda}`);
                return;
            }
            console.log(`Cotação alvo para ${alerta.moeda}: ${alerta.cotacaoAlvo}`);
            console.log(`Comparação: ${cotacaoAtual} <= ${alerta.cotacaoAlvo} = ${cotacaoAtual <= alerta.cotacaoAlvo}`);
            // Verifica se a cotação atual atingiu o alvo
            if (cotacaoAtual <= alerta.cotacaoAlvo) {
                console.log(`Cotação atingiu o alvo para ${alerta.moeda}!`);
                // Marca o alerta como inativo e registra o momento do disparo
                await updateDoc(doc.ref, {
                    ativo: false,
                    webhookDisparado: true,
                    horarioDisparo: new Date().toISOString(),
                    cotacaoDisparo: cotacaoAtual
                });
                // Dispara webhooks se configurados
                if (alerta.webhook) {
                    try {
                        const response = await (0, node_fetch_1.default)(alerta.webhook, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                alerta_id: doc.id,
                                moeda: alerta.moeda,
                                cotacao_alvo: alerta.cotacaoAlvo,
                                cotacao_disparo: cotacaoAtual,
                                horario_disparo: new Date().toISOString()
                            })
                        });
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        console.log(`Webhook disparado com sucesso para ${doc.id}`);
                    }
                    catch (error) {
                        console.error(`Erro ao disparar webhook para ${doc.id}:`, error);
                    }
                }
            }
            else {
                console.log('Cotação ainda não atingiu o alvo');
            }
        });
        await Promise.all(promises);
        console.log('Verificação de alertas concluída');
    }
    catch (error) {
        console.error('Erro ao verificar alertas:', error);
        throw error;
    }
});
//# sourceMappingURL=alertas.js.map