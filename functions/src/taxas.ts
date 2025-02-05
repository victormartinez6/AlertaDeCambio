import * as functions from 'firebase-functions'
import { db } from './config/firebase'

export const atualizarTaxas = functions.https.onRequest(async (request, response) => {
  try {
    // Verificar método
    if (request.method !== 'POST') {
      response.status(405).send('Método não permitido')
      return
    }

    // Verificar autenticação
    const auth = request.headers.authorization
    if (!auth || !auth.startsWith('Bearer ')) {
      response.status(401).send('Não autorizado')
      return
    }

    // Validar dados
    const { USD, EUR, GBP } = request.body
    if (typeof USD !== 'number' || typeof EUR !== 'number' || typeof GBP !== 'number') {
      response.status(400).send('Dados inválidos')
      return
    }

    // Salvar no Firestore
    await db.doc('configuracoes/taxas_turismo').set({
      USD,
      EUR,
      GBP
    })

    response.status(200).json({ success: true })
  } catch (error) {
    console.error('Erro ao atualizar taxas:', error)
    response.status(500).send('Erro interno do servidor')
  }
})
