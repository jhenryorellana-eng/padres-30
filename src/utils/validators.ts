// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation (min 8 chars, 1 uppercase, 1 number, 1 special char)
export const isValidPassword = (password: string): boolean => {
  const minLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);
  return minLength && hasUppercase && hasNumber && hasSpecial;
};

// Parent code validation (P-XXXXXXXX format)
export const isValidParentCode = (code: string): boolean => {
  // Formato: P-XXXXXXXX (P + guion + 8 digitos)
  const codeRegex = /^P-\d{8}$/;
  return codeRegex.test(code.toUpperCase());
};

// Format parent code with dashes
export const formatParentCode = (code: string): string => {
  // Formato: P-XXXXXXXX
  const cleaned = code.toUpperCase().replace(/[^P0-9]/g, '');

  if (cleaned.length === 0) return '';

  // Si empieza con P, formatear como P-XXXXXXXX
  if (cleaned.startsWith('P')) {
    const digits = cleaned.slice(1);
    if (digits.length === 0) return 'P';
    return `P-${digits.slice(0, 8)}`;
  }

  // Si solo son digitos, agregar P-
  return `P-${cleaned.slice(0, 8)}`;
};

// Password strength checker
export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
}

export const checkPasswordStrength = (password: string): PasswordStrength => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score++;
  } else {
    feedback.push('Usa al menos 8 caracteres');
  }

  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push('Incluye una letra mayuscula');
  }

  if (/[0-9]/.test(password)) {
    score++;
  } else {
    feedback.push('Incluye un numero');
  }

  if (/[!@#$%^&*]/.test(password)) {
    score++;
  } else {
    feedback.push('Incluye un caracter especial (!@#$%^&*)');
  }

  return { score, feedback };
};
