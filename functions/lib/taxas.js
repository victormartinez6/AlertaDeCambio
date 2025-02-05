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
exports.atualizarTaxas = void 0;
const functions = __importStar(require("firebase-functions"));
const firebase_1 = require("./config/firebase");
exports.atualizarTaxas = functions.https.onRequest(async (request, response) => {
    try {
        // Verificar método
        if (request.method !== 'POST') {
            response.status(405).send('Método não permitido');
            return;
        }
        // Verificar autenticação
        const auth = request.headers.authorization;
        if (!auth || !auth.startsWith('Bearer ')) {
            response.status(401).send('Não autorizado');
            return;
        }
        // Validar dados
        const { USD, EUR, GBP } = request.body;
        if (typeof USD !== 'number' || typeof EUR !== 'number' || typeof GBP !== 'number') {
            response.status(400).send('Dados inválidos');
            return;
        }
        // Salvar no Firestore
        await firebase_1.db.doc('configuracoes/taxas_turismo').set({
            USD,
            EUR,
            GBP
        });
        response.status(200).json({ success: true });
    }
    catch (error) {
        console.error('Erro ao atualizar taxas:', error);
        response.status(500).send('Erro interno do servidor');
    }
});
//# sourceMappingURL=taxas.js.map