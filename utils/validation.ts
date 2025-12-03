import { z } from 'zod';

export interface ValidationResult {
  isValid: boolean;
  errors: { [key: string]: string };
}

interface PersonalInfoField {
  id: string;
  key: string;
  label: string;
  required: boolean;
  type: 'text' | 'email' | 'phone' | 'multiline' | 'yesno' | 'scroll';
}

interface RatingCategory {
  id: string;
  key: string;
  title: string;
}

interface FormData {
  simulatorId?: string; // Assuming simulatorId might be present
  personalInfo: { [key: string]: string };
  ratings: { [key: string]: number };
}

// Basic Zod schemas for common types
const emailSchema = z.string().email("Invalid email address");
const phoneSchema = z.string().min(10, "Phone number too short").regex(/^[0-9+\-\s()]*$/, "Invalid phone characters");

export function validateReviewForm(
  formData: FormData,
  personalInfoFields: PersonalInfoField[],
  ratingCategories: RatingCategory[]
): ValidationResult {
  const errors: { [key: string]: string } = {};

  // 1. Validate Simulator Selection
  if (!formData.simulatorId) {
    errors['simulator'] = "Please select a simulator.";
  }

  // 2. Validate Personal Info Fields (Dynamic)
  personalInfoFields.forEach(field => {
    const value = formData.personalInfo[field.key];
    
    // Check Required
    if (field.required && (!value || value.trim() === '')) {
      errors[field.key] = `${field.label} is required.`;
      return;
    }

    // Check Types (only if value exists)
    if (value && value.trim() !== '') {
      if (field.type === 'email') {
        const result = emailSchema.safeParse(value);
        if (!result.success) {
          errors[field.key] = result.error.issues[0].message;
        }
      }
      if (field.type === 'phone') {
        const result = phoneSchema.safeParse(value);
        if (!result.success) {
          errors[field.key] = result.error.issues[0].message;
        }
      }
    }
  });

  // 3. Validate Ratings
  // Ensure all categories have a rating > 0
  let missingRatings = false;
  ratingCategories.forEach(cat => {
    if (!formData.ratings[cat.key] || formData.ratings[cat.key] === 0) {
      missingRatings = true;
    }
  });

  if (missingRatings) {
    errors['ratings'] = "Please rate all categories.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};