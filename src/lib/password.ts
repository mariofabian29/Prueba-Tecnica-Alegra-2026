/** Reglas mínimas de contraseña, compartidas por el cliente y el servidor. */
export const PASSWORD_MIN_LENGTH = 8;

export type PasswordCheck = { label: string; met: boolean };

export function checkPassword(value: string): PasswordCheck[] {
  return [
    { label: `Al menos ${PASSWORD_MIN_LENGTH} caracteres`, met: value.length >= PASSWORD_MIN_LENGTH },
    { label: "Una letra", met: /[a-zA-Z]/.test(value) },
    { label: "Un número", met: /\d/.test(value) },
  ];
}

/** 0 = vacía, 1 = débil, 2 = aceptable, 3 = sólida */
export function passwordStrength(value: string): 0 | 1 | 2 | 3 {
  if (!value) return 0;
  const met = checkPassword(value).filter((c) => c.met).length;
  return met === 3 ? 3 : met === 2 ? 2 : 1;
}
