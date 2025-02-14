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
exports.limparAlertasExpirados = exports.verificarAlertas = void 0;
const functions = __importStar(require("firebase-functions"));
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const node_fetch_1 = __importDefault(require("node-fetch"));
const firebase_admin_1 = __importDefault(require("firebase-admin"));
// Inicializar Firebase Admin apenas se não estiver inicializado
if ((0, app_1.getApps)().length === 0) {
    console.log('Inicializando Firebase Admin...');
    (0, app_1.initializeApp)({
        credential: firebase_admin_1.default.credential.applicationDefault()
    });
    console.log('Firebase Admin inicializado com sucesso');
}
// Referência ao Firestore
const db = (0, firestore_1.getFirestore)();
const { collection, query, where, getDocs, updateDoc, deleteDoc, doc } = require('firebase-admin/firestore');
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
async function buscarCotacaoAtual(moeda, produto, operacao = 'venda') {
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
        // Se for remessas, retorna a cotação comercial diretamente
        if (produto === 'remessas') {
            const cotacaoComercial = operacao === 'compra' ? Number(cotacao.bid) : Number(cotacao.ask);
            console.log(`Cotação comercial (${operacao}) para ${moeda}: ${cotacaoComercial}`);
            return cotacaoComercial;
        }
        // Se for turismo, aplica a taxa
        const taxas = await buscarTaxas();
        const taxa = operacao === 'compra' ?
            taxas[`${moeda}_COMPRA`] || 0 :
            taxas[moeda] || 0;
        const cotacaoBase = operacao === 'compra' ? Number(cotacao.bid) : Number(cotacao.ask);
        const cotacaoFinal = operacao === 'compra' ?
            cotacaoBase * (1 - taxa / 100) : // Para compra, subtrai a taxa
            cotacaoBase * (1 + taxa / 100); // Para venda, soma a taxa
        console.log(`Cotação base para ${moeda} (${operacao}): ${cotacaoBase}`);
        console.log(`Taxa para ${moeda} (${operacao}): ${taxa}%`);
        console.log(`Cotação final calculada para ${moeda} (${operacao}): ${cotacaoFinal}`);
        return cotacaoFinal;
    }
    catch (error) {
        console.error('Erro ao buscar cotação:', error);
        return null;
    }
}
// Função para verificar se a data está expirada
function verificarDataExpirada(dataLimite) {
    if (!dataLimite)
        return false;
    const dataLimiteObj = new Date(dataLimite);
    const agora = new Date();
    // Compara apenas as datas, ignorando o horário
    const dataLimiteSemHora = new Date(dataLimiteObj.getFullYear(), dataLimiteObj.getMonth(), dataLimiteObj.getDate());
    const agoraSemHora = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    return agoraSemHora > dataLimiteSemHora;
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
            // Verifica se o alerta possui um webhook associado
            if (!alerta.webhookId) {
                console.log(`Alerta ${doc.id} não possui webhook configurado, continuando...`);
                return;
            }
            // Buscar webhook apenas se o alerta tiver um webhookId
            const webhookRef = db.collection('webhooks').doc(alerta.webhookId);
            const webhookDoc = await webhookRef.get();
            if (!webhookDoc.exists) {
                console.log(`Webhook ${alerta.webhookId} não encontrado para o alerta ${doc.id}`);
                return;
            }
            const webhook = webhookDoc.data();
            // Verifica se a data expirou
            if (alerta.dataLimite && verificarDataExpirada(alerta.dataLimite)) {
                console.log(`Data expirada para alerta ${doc.id}`);
                // Marca o alerta como inativo e registra a expiração
                await updateDoc(doc.ref, {
                    ativo: false,
                    dataExpirada: true,
                    horarioExpiracao: new Date().toISOString()
                });
                // Dispara webhook de expiração se configurado
                if (webhook) {
                    try {
                        const response = await (0, node_fetch_1.default)(webhook, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                alerta_id: doc.id,
                                tipo: 'data_expirada',
                                moeda: alerta.moeda,
                                data_limite: alerta.dataLimite,
                                horario_expiracao: new Date().toISOString()
                            })
                        });
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        console.log(`Webhook de expiração disparado com sucesso para ${doc.id}`);
                    }
                    catch (error) {
                        console.error(`Erro ao disparar webhook de expiração para ${doc.id}:`, error);
                    }
                    return;
                }
            }
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
                if (webhook) {
                    try {
                        const response = await (0, node_fetch_1.default)(webhook, {
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
// Função para limpar alertas expirados ou já disparados
exports.limparAlertasExpirados = functions.pubsub
    .schedule('every 1 hours')
    .onRun(async (context) => {
    try {
        const alertasRef = collection(db, 'alertas');
        const agora = new Date();
        // Busca todos os alertas
        const querySnapshot = await getDocs(alertasRef);
        const alertasParaExcluir = [];
        querySnapshot.forEach((doc) => {
            const alerta = doc.data();
            const dataLimite = new Date(alerta.dataLimite);
            const dataDisparo = alerta.horarioDisparo ? new Date(alerta.horarioDisparo) : null;
            // Caso 1: Data limite expirada há mais de 24 horas
            if (dataLimite) {
                const horasDesdeExpiracao = (agora.getTime() - dataLimite.getTime()) / (1000 * 60 * 60);
                if (horasDesdeExpiracao > 24) {
                    alertasParaExcluir.push(doc.id);
                    return;
                }
            }
            // Caso 2: Webhook disparado há mais de 24 horas
            if (dataDisparo) {
                const horasDesdeDisparo = (agora.getTime() - dataDisparo.getTime()) / (1000 * 60 * 60);
                if (horasDesdeDisparo > 24) {
                    alertasParaExcluir.push(doc.id);
                    return;
                }
            }
        });
        // Exclui os alertas em lote
        const operacoes = alertasParaExcluir.map(alertaId => deleteDoc(doc(db, 'alertas', alertaId)));
        await Promise.all(operacoes);
        console.log(`Limpeza automática: ${alertasParaExcluir.length} alertas excluídos`);
        return null;
    }
    catch (error) {
        console.error('Erro ao limpar alertas:', error);
        return null;
    }
});
//# sourceMappingURL=alertas.js.map