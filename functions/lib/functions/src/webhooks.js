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
Object.defineProperty(exports, "__esModule", { value: true });
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const cotacoes_1 = require("../../src/utils/cotacoes");
// Horários de disparo (UTC)
const DISPATCH_TIMES = [
    { hour: 12, minute: 0 },
    { hour: 17, minute: 0 },
    { hour: 20, minute: 0 }, // 4:00 PM EDT (UTC-4)
];
// Função para verificar alertas e enviar notificações
async function checkAlertsAndNotify() {
    var _a, _b, _c, _d, _e, _f;
    try {
        const db = admin.firestore();
        const alertasRef = db.collection('alertas');
        const alertas = await alertasRef.where('ativo', '==', true).get();
        const { calcularCotacaoFinalComBase, buscarCotacoes, taxas } = (0, cotacoes_1.useCotacoesTempoReal)();
        await buscarCotacoes();
        for (const doc of alertas.docs) {
            const alerta = doc.data();
            // Buscar cotação atual
            let cotacaoBase;
            if (alerta.produto === 'turismo') {
                cotacaoBase = (_c = (_b = (_a = taxas.value) === null || _a === void 0 ? void 0 : _a.cotacoesTurismo) === null || _b === void 0 ? void 0 : _b[alerta.moeda]) === null || _c === void 0 ? void 0 : _c.venda;
            }
            else {
                cotacaoBase = (_f = (_e = (_d = taxas.value) === null || _d === void 0 ? void 0 : _d.cotacoesComercial) === null || _e === void 0 ? void 0 : _e[alerta.moeda]) === null || _f === void 0 ? void 0 : _f.ask;
            }
            if (cotacaoBase) {
                const cotacaoAtual = calcularCotacaoFinalComBase(alerta.moeda, cotacaoBase);
                // Verificar se atingiu a cotação alvo
                const atingiuAlvo = alerta.tipoAlerta === 'acima'
                    ? cotacaoAtual >= alerta.cotacaoAlvo
                    : cotacaoAtual <= alerta.cotacaoAlvo;
                if (atingiuAlvo) {
                    // Preparar dados para o webhook
                    const webhookData = {
                        id: doc.id,
                        nome: alerta.nome,
                        produto: alerta.produto,
                        moeda: alerta.moeda,
                        cotacaoAlvo: alerta.cotacaoAlvo,
                        cotacaoAtual: cotacaoAtual,
                        tipoAlerta: alerta.tipoAlerta,
                        email: alerta.email,
                        whatsapp: alerta.whatsapp ? `+${alerta.ddi}${alerta.whatsapp}` : null,
                        dataDisparo: new Date().toISOString()
                    };
                    // Enviar notificações
                    if (alerta.notificarEmail && alerta.email) {
                        await enviarEmail(webhookData);
                    }
                    if (alerta.notificarWhatsapp && alerta.whatsapp) {
                        await enviarWhatsapp(webhookData);
                    }
                    // Registrar disparo no histórico
                    await db.collection('historicoDisparos').add(Object.assign({ alertaId: doc.id }, webhookData));
                }
            }
        }
    }
    catch (error) {
        console.error('Erro ao verificar alertas:', error);
    }
}
// Funções de envio de notificações
async function enviarEmail(data) {
    // Implementar lógica de envio de email
    console.log('Enviando email:', data);
}
async function enviarWhatsapp(data) {
    // Implementar lógica de envio de whatsapp
    console.log('Enviando whatsapp:', data);
}
// Criar funções agendadas para cada horário
DISPATCH_TIMES.forEach(({ hour, minute }) => {
    exports[`checkAlertsSchedule_${hour}_${minute}`] = functions.pubsub
        .schedule(`${minute} ${hour} * * *`)
        .timeZone('America/New_York')
        .onRun(async (context) => {
        await checkAlertsAndNotify();
        return null;
    });
});
// Função para teste manual dos webhooks
exports.checkAlertsManual = functions.https.onRequest(async (req, res) => {
    await checkAlertsAndNotify();
    res.status(200).send('Verificação de alertas executada manualmente');
});
//# sourceMappingURL=webhooks.js.map