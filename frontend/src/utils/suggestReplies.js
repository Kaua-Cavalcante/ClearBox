export function suggestReplyProductive(text) {
  if (/acesso|login|senha|reset/i.test(text)) {
    return "Olá! Recebemos sua solicitação de acesso. Confirme usuário e sistema para agilizar.";
  }
  if (/status|andamento/i.test(text)) {
    return "Olá! Seu pedido está em análise. Retornaremos com atualização até o fim do dia útil.";
  }
  if (/anexo|arquivo|attachment|pdf/i.test(text)) {
    return "Olá! Recebemos o arquivo. Vamos validar e retornamos com os próximos passos.";
  }
  return "Olá! Registramos sua solicitação e encaminhamos à equipe responsável.";
}

export function suggestReplyUnproductive(text) {
  if (/(feliz natal|parabéns|boas festas)/i.test(text)) {
    return "Muito obrigado pelos votos! Desejamos o mesmo para você. 😉";
  }
  return "Obrigado pela mensagem! Estamos à disposição.";
}
