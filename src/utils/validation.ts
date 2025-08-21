export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export interface ValidationResult {
  isValid: boolean;
  errors: { [key: string]: string };
}

export class Validator {
  static validate(data: any, schema: ValidationSchema): ValidationResult {
    const errors: { [key: string]: string } = {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      const error = this.validateField(value, rules, field);
      
      if (error) {
        errors[field] = error;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  private static validateField(value: any, rules: ValidationRule, fieldName: string): string | null {
    // Required validation
    if (rules.required && (value === undefined || value === null || value === '')) {
      return `${fieldName} é obrigatório`;
    }

    // Skip other validations if value is empty and not required
    if (!rules.required && (value === undefined || value === null || value === '')) {
      return null;
    }

    // Min/Max for numbers
    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        return `${fieldName} deve ser maior ou igual a ${rules.min}`;
      }
      if (rules.max !== undefined && value > rules.max) {
        return `${fieldName} deve ser menor ou igual a ${rules.max}`;
      }
    }

    // MinLength/MaxLength for strings
    if (typeof value === 'string') {
      if (rules.minLength !== undefined && value.length < rules.minLength) {
        return `${fieldName} deve ter pelo menos ${rules.minLength} caracteres`;
      }
      if (rules.maxLength !== undefined && value.length > rules.maxLength) {
        return `${fieldName} deve ter no máximo ${rules.maxLength} caracteres`;
      }
    }

    // Pattern validation
    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
      return `${fieldName} tem formato inválido`;
    }

    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) {
        return customError;
      }
    }

    return null;
  }
}

// Common validation schemas
export const commonSchemas = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value: string) => {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Email deve ter um formato válido';
      }
      return null;
    }
  },

  password: {
    minLength: 6,
    custom: (value: string) => {
      if (value && value.length < 6) {
        return 'Senha deve ter pelo menos 6 caracteres';
      }
      if (value && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
        return 'Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número';
      }
      return null;
    }
  },

  currency: {
    min: 0,
    custom: (value: number) => {
      if (value !== undefined && value < 0) {
        return 'Valor deve ser positivo';
      }
      return null;
    }
  },

  date: {
    custom: (value: string) => {
      if (value && isNaN(Date.parse(value))) {
        return 'Data deve ter um formato válido';
      }
      return null;
    }
  },

  cpf: {
    pattern: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
    custom: (value: string) => {
      if (value && !isValidCPF(value)) {
        return 'CPF inválido';
      }
      return null;
    }
  }
};

// CPF validation helper
function isValidCPF(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]/g, '');
  
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  
  return remainder === parseInt(cpf.charAt(10));
}

// Form validation hook
export const useFormValidation = (schema: ValidationSchema) => {
  const [errors, setErrors] = React.useState<{ [key: string]: string }>({});

  const validateField = (name: string, value: any) => {
    const rule = schema[name];
    if (!rule) return;

    const error = Validator.validateField(value, rule, name);
    setErrors(prev => ({
      ...prev,
      [name]: error || ''
    }));
  };

  const validateForm = (data: any) => {
    const result = Validator.validate(data, schema);
    setErrors(result.errors);
    return result.isValid;
  };

  const clearErrors = () => {
    setErrors({});
  };

  return {
    errors,
    validateField,
    validateForm,
    clearErrors
  };
};