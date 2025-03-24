export const formatarDataHora = (data: Date): string => {
  return data.toLocaleString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}
