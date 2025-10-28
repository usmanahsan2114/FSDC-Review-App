export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
  email?: boolean;
  phone?: boolean;
  numeric?: boolean;
  min?: number;
  max?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface FieldValidation {
  [fieldName: string]: ValidationRule;
}

export class FormValidator {
  private rules: FieldValidation;

  constructor(rules: FieldValidation) {
    this.rules = rules;
  }

  validateField(fieldName: string, value: any): ValidationResult {
    const rule = this.rules[fieldName];
    if (!rule) {
      return { isValid: true, errors: [] };
    }

    const errors: string[] = [];

    // Required validation
    if (rule.required && this.isEmpty(value)) {
      errors.push(`${this.formatFieldName(fieldName)} is required`);
      return { isValid: false, errors };
    }

    // Skip other validations if field is empty and not required
    if (this.isEmpty(value)) {
      return { isValid: true, errors: [] };
    }

    // String validations
    if (typeof value === 'string') {
      // Min length validation
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(`${this.formatFieldName(fieldName)} must be at least ${rule.minLength} characters`);
      }

      // Max length validation
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(`${this.formatFieldName(fieldName)} must not exceed ${rule.maxLength} characters`);
      }

      // Pattern validation
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(`${this.formatFieldName(fieldName)} format is invalid`);
      }

      // Email validation
      if (rule.email && !this.isValidEmail(value)) {
        errors.push(`${this.formatFieldName(fieldName)} must be a valid email address`);
      }

      // Phone validation
      if (rule.phone && !this.isValidPhone(value)) {
        errors.push(`${this.formatFieldName(fieldName)} must be a valid phone number`);
      }
    }

    // Numeric validations
    if (rule.numeric || typeof value === 'number') {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      
      if (rule.numeric && (isNaN(numValue) || !isFinite(numValue))) {
        errors.push(`${this.formatFieldName(fieldName)} must be a valid number`);
      } else {
        // Min value validation
        if (rule.min !== undefined && numValue < rule.min) {
          errors.push(`${this.formatFieldName(fieldName)} must be at least ${rule.min}`);
        }

        // Max value validation
        if (rule.max !== undefined && numValue > rule.max) {
          errors.push(`${this.formatFieldName(fieldName)} must not exceed ${rule.max}`);
        }
      }
    }

    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value);
      if (customError) {
        errors.push(customError);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateForm(formData: { [key: string]: any }): ValidationResult {
    const allErrors: string[] = [];
    let isValid = true;

    for (const fieldName in this.rules) {
      const fieldResult = this.validateField(fieldName, formData[fieldName]);
      if (!fieldResult.isValid) {
        isValid = false;
        allErrors.push(...fieldResult.errors);
      }
    }

    return {
      isValid,
      errors: allErrors
    };
  }

  validateFormWithFieldErrors(formData: { [key: string]: any }): {
    isValid: boolean;
    fieldErrors: { [key: string]: string[] };
    allErrors: string[];
  } {
    const fieldErrors: { [key: string]: string[] } = {};
    const allErrors: string[] = [];
    let isValid = true;

    for (const fieldName in this.rules) {
      const fieldResult = this.validateField(fieldName, formData[fieldName]);
      fieldErrors[fieldName] = fieldResult.errors;
      
      if (!fieldResult.isValid) {
        isValid = false;
        allErrors.push(...fieldResult.errors);
      }
    }

    return {
      isValid,
      fieldErrors,
      allErrors
    };
  }

  private isEmpty(value: any): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }

  private formatFieldName(fieldName: string): string {
    // Convert camelCase to Title Case
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    // Basic phone validation - accepts various formats
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
    return phoneRegex.test(cleanPhone) && cleanPhone.length >= 7;
  }
}

// Predefined validation rules for common use cases
export const commonValidationRules = {
  required: { required: true },
  email: { required: true, email: true },
  phone: { required: true, phone: true },
  name: { required: true, minLength: 2, maxLength: 50 },
  rating: { required: true, numeric: true, min: 1, max: 5 },
  comment: { maxLength: 1000 },
  longComment: { maxLength: 2000 },
};

// Utility functions for quick validation
export const validateEmail = (email: string): boolean => {
  const validator = new FormValidator({ email: commonValidationRules.email });
  return validator.validateField('email', email).isValid;
};

export const validateRequired = (value: any): boolean => {
  const validator = new FormValidator({ field: commonValidationRules.required });
  return validator.validateField('field', value).isValid;
};

export const validateRating = (rating: number): boolean => {
  const validator = new FormValidator({ rating: commonValidationRules.rating });
  return validator.validateField('rating', rating).isValid;
};