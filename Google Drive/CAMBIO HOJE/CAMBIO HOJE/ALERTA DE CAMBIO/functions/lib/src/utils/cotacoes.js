"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatarMoeda = exports.useCotacoesTempoReal = exports.buscarCotacoes = exports.buscarTaxas = void 0;
const vue_1 = require("vue");
const firestore_1 = require("firebase/firestore");
const firebase_1 = require("@/config/firebase");
const cambioStore_1 = require("@/stores/cambioStore");
// Valores iniciais
const TAXAS_INICIAIS = { USD: 0, EUR: 0, GBP: 0 };
const COTACOES_INICIAIS = { USD: 0, EUR: 0, GBP: 0 };
// Função para buscar taxas do Firestore
const buscarTaxas = async () => {
    try {
        const docRef = (0, firestore_1.doc)(firebase_1.db, 'configuracoes', 'taxas_turismo');
        const docSnap = await (0, firestore_1.getDoc)(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                USD: Number(data.USD || 0),
                EUR: Number(data.EUR || 0),
                GBP: Number(data.GBP || 0)
            };
        }
        return Object.assign({}, TAXAS_INICIAIS);
    }
    catch (error) {
        console.error('Erro ao buscar taxas:', error);
        return Object.assign({}, TAXAS_INICIAIS);
    }
};
exports.buscarTaxas = buscarTaxas;
// Função para buscar cotações da API
const buscarCotacoes = async () => {
    try {
        const moedas = ['USD', 'EUR', 'GBP'];
        const resultados = await Promise.all(moedas.map(async (moeda) => {
            var _a;
            const response = await fetch(`https://economia.awesomeapi.com.br/json/last/${moeda}-BRL`);
            if (!response.ok)
                throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            return ((_a = data[`${moeda}BRL`]) === null || _a === void 0 ? void 0 : _a.ask) || 0;
        }));
        return {
            USD: Number(resultados[0]),
            EUR: Number(resultados[1]),
            GBP: Number(resultados[2])
        };
    }
    catch (error) {
        console.error('Erro ao buscar cotações:', error);
        return Object.assign({}, COTACOES_INICIAIS);
    }
};
exports.buscarCotacoes = buscarCotacoes;
// Composable para cotações em tempo real
const useCotacoesTempoReal = () => {
    const cotacoes = (0, vue_1.ref)(Object.assign({}, COTACOES_INICIAIS));
    const taxas = (0, vue_1.ref)(Object.assign({}, TAXAS_INICIAIS));
    const taxasTemporarias = (0, vue_1.ref)(Object.assign({}, TAXAS_INICIAIS));
    const atualizando = (0, vue_1.ref)(false);
    const segundosParaAtualizar = (0, vue_1.ref)(60);
    let intervalo = null;
    let contadorIntervalo = null;
    let unsubscribe = null;
    const store = (0, cambioStore_1.useCambioStore)();
    // Atualizar dados
    const atualizarDados = async (apenasAPI = false) => {
        if (atualizando.value)
            return;
        atualizando.value = true;
        store.setLoadingTurismo(true);
        try {
            // Se apenasAPI for true, só atualiza as cotações da API
            if (apenasAPI) {
                const novasCotacoes = await (0, exports.buscarCotacoes)();
                cotacoes.value = novasCotacoes;
            }
            else {
                // Caso contrário, atualiza tudo
                const [novasCotacoes, novasTaxas] = await Promise.all([
                    (0, exports.buscarCotacoes)(),
                    (0, exports.buscarTaxas)()
                ]);
                cotacoes.value = novasCotacoes;
                taxas.value = novasTaxas;
                taxasTemporarias.value = Object.assign({}, novasTaxas);
            }
            // Reinicia o contador após atualização
            segundosParaAtualizar.value = 60;
        }
        catch (error) {
            console.error('Erro ao atualizar dados:', error);
        }
        finally {
            atualizando.value = false;
            store.setLoadingTurismo(false);
        }
    };
    // Calcular cotação final com base na taxa
    const calcularCotacaoFinal = (moeda) => {
        const cotacaoBase = cotacoes.value[moeda] || 0;
        const taxa = taxasTemporarias.value[moeda] || 0;
        return cotacaoBase * (1 + taxa / 100);
    };
    // Calcular cotação final com base na taxa e cotação base fornecida
    const calcularCotacaoFinalComBase = (moeda, cotacaoBase) => {
        const taxa = taxasTemporarias.value[moeda] || 0;
        return cotacaoBase * (1 + taxa / 100);
    };
    // Atualizar taxa temporária
    const atualizarTaxaTemporaria = (moeda, valor) => {
        taxasTemporarias.value[moeda] = valor;
    };
    // Salvar taxas
    const salvarTaxas = async (novasTaxas) => {
        try {
            await (0, firestore_1.setDoc)((0, firestore_1.doc)(firebase_1.db, 'configuracoes', 'taxas_turismo'), novasTaxas);
            taxas.value = Object.assign({}, novasTaxas);
            taxasTemporarias.value = Object.assign({}, novasTaxas);
            return true;
        }
        catch (error) {
            console.error('Erro ao salvar taxas:', error);
            return false;
        }
    };
    // Iniciar atualizações
    const iniciarAtualizacoes = () => {
        // Primeira atualização completa
        atualizarDados();
        // Configurar listener para taxas no Firestore
        unsubscribe = (0, firestore_1.onSnapshot)((0, firestore_1.doc)(firebase_1.db, 'configuracoes', 'taxas_turismo'), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                const novasTaxas = {
                    USD: Number(data.USD || 0),
                    EUR: Number(data.EUR || 0),
                    GBP: Number(data.GBP || 0)
                };
                taxas.value = novasTaxas;
                taxasTemporarias.value = Object.assign({}, novasTaxas);
            }
        });
        // Configurar intervalo para atualização automática
        intervalo = setInterval(() => {
            atualizarDados(true);
        }, 60000);
        // Configurar contador regressivo
        contadorIntervalo = setInterval(() => {
            if (segundosParaAtualizar.value > 0) {
                segundosParaAtualizar.value--;
            }
        }, 1000);
    };
    // Limpar recursos ao desmontar
    const pararAtualizacoes = () => {
        if (intervalo)
            clearInterval(intervalo);
        if (contadorIntervalo)
            clearInterval(contadorIntervalo);
        if (unsubscribe)
            unsubscribe();
    };
    // Iniciar ao montar o componente
    (0, vue_1.onMounted)(() => {
        iniciarAtualizacoes();
    });
    // Limpar ao desmontar o componente
    (0, vue_1.onUnmounted)(() => {
        pararAtualizacoes();
    });
    return {
        cotacoes,
        taxas: taxasTemporarias,
        atualizando,
        segundosParaAtualizar,
        calcularCotacaoFinal,
        calcularCotacaoFinalComBase,
        atualizarTaxaTemporaria,
        salvarTaxas,
        atualizarDados,
        buscarCotacoes: exports.buscarCotacoes
    };
};
exports.useCotacoesTempoReal = useCotacoesTempoReal;
// Formatar valor como moeda BRL
const formatarMoeda = (valor) => {
    if (!valor)
        return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
};
exports.formatarMoeda = formatarMoeda;
//# sourceMappingURL=cotacoes.js.map