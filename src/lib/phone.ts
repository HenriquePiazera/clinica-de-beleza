/** Telefone só com dígitos — compara cadastro único na clínica. */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}
