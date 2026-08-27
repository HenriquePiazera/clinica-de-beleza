export const ERROR_CODES = {
  UNAUTHORIZED: 'Sessão expirada. Faça login novamente.',
  FORBIDDEN: 'Você não tem permissão para acessar este recurso.',
  CLIENT_NOT_FOUND: 'Cliente não encontrado.',
  CLIENT_ALREADY_EXISTS:
    'Já existe um cliente com este telefone na clínica.',
  CLIENT_DELETE_FAILED:
    'Não foi possível excluir o cliente. Tente novamente.',
  APPOINTMENT_NOT_FOUND: 'Agendamento não encontrado.',
  APPOINTMENT_CONFLICT: 'Já existe um agendamento neste horário.',
  APPOINTMENT_BUFFER_CONFLICT:
    'Horário muito próximo de outro atendimento.',
  PLAN_LIMIT_CLIENTS: 'Limite de clientes do seu plano atingido.',
  PLAN_LIMIT_STORAGE: 'Limite de armazenamento do seu plano atingido.',
  PLAN_LIMIT_PROFESSIONALS:
    'Limite de profissionais do seu plano atingido.',
  PLAN_REQUIRED: 'Esta funcionalidade requer upgrade de plano.',
  TEAM_MEMBER_ALREADY_INVITED:
    'Este profissional já foi convidado para a equipe.',
  USER_NOT_FOUND_INVITE_PENDING_SIGNUP:
    'Convite registrado. O profissional precisa criar uma conta com este e-mail para ingressar na equipe.',
  INVALID_FILE: 'Tipo de arquivo não permitido.',
  FILE_TOO_LARGE: 'Arquivo excede o limite de 10 MB.',
  UPLOAD_ERROR:
    'Erro ao enviar arquivo. Em produção, configure Supabase Storage (SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY) ou use uma URL de foto.',
  INVALID_INPUT: 'Dados inválidos. Verifique os campos e tente novamente.',
  DATABASE_ERROR: 'Erro interno. Tente novamente em instantes.',
  INTERNAL_ERROR: 'Erro inesperado. Nossa equipe foi notificada.',
  INVALID_CREDENTIALS: 'E-mail ou senha incorretos.',
  EMAIL_ALREADY_EXISTS: 'Este e-mail já está cadastrado.',
  BETA_INVITE_ONLY:
    'Cadastro restrito. Peça um convite ao administrador.',
  DEMO_SESSION_EXPIRED:
    'Sessão de demonstração encerrada. Peça um link novo para continuar.',
  DEMO_LINK_REQUIRED:
    'Para acessar a demonstração, use o link recebido por e-mail ou mensagem.',
  PASSWORD_RESET_INVALID: 'Link de recuperação inválido ou expirado.',
  RECORD_NOT_FOUND: 'Registro de atendimento não encontrado.',
  PAYMENT_NOT_FOUND: 'Pagamento não encontrado.',
  RECEIPT_NOT_PAID: 'Só é possível emitir recibo de pagamentos com status pago.',
  APPOINTMENT_PAST_DATE:
    'Não é possível agendar em data ou horário passado.',
  APPOINTMENT_PAST_STATUS_INVALID:
    'Atendimentos com data passada só podem ficar como Realizado ou Cancelado (ou ser excluídos).',
  REVIEW_NOT_FOUND: 'Depoimento não encontrado.',
  REVIEW_RATE_LIMIT:
    'Muitos envios em pouco tempo. Aguarde um momento e tente de novo.',
} as const

export type ErrorCode = keyof typeof ERROR_CODES

export function getErrorMessage(code: ErrorCode): string {
  return ERROR_CODES[code]
}
