export function buildReminderMessage({
  clientName,
  date,
  time,
}: {
  clientName: string
  date: string
  time: string
}): string {
  return `Olá ${clientName}, tudo bem?
Passando para lembrar do seu atendimento amanhã,
${date} às ${time}.
Confirme respondendo SIM ou entre em contato para reagendar.`
}
