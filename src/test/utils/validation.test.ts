import { Validator, commonSchemas } from '../../utils/validation';

describe('Validator', () => {
  describe('validate', () => {
    it('should validate required fields', () => {
      const schema = {
        name: { required: true },
        email: { required: true }
      };

      const validData = { name: 'John', email: 'john@example.com' };
      const invalidData = { name: '', email: 'john@example.com' };

      const validResult = Validator.validate(validData, schema);
      const invalidResult = Validator.validate(invalidData, schema);

      expect(validResult.isValid).toBe(true);
      expect(Object.keys(validResult.errors)).toHaveLength(0);

      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.name).toBe('name é obrigatório');
    });

    it('should validate email format', () => {
      const schema = {
        email: commonSchemas.email
      };

      const validData = { email: 'test@example.com' };
      const invalidData = { email: 'invalid-email' };

      const validResult = Validator.validate(validData, schema);
      const invalidResult = Validator.validate(invalidData, schema);

      expect(validResult.isValid).toBe(true);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.email).toBe('Email deve ter um formato válido');
    });

    it('should validate currency values', () => {
      const schema = {
        amount: commonSchemas.currency
      };

      const validData = { amount: 100.50 };
      const invalidData = { amount: -50 };

      const validResult = Validator.validate(validData, schema);
      const invalidResult = Validator.validate(invalidData, schema);

      expect(validResult.isValid).toBe(true);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.amount).toBe('Valor deve ser positivo');
    });

    it('should validate string length', () => {
      const schema = {
        description: { minLength: 5, maxLength: 100 }
      };

      const validData = { description: 'Valid description' };
      const tooShortData = { description: 'Hi' };
      const tooLongData = { description: 'A'.repeat(101) };

      const validResult = Validator.validate(validData, schema);
      const tooShortResult = Validator.validate(tooShortData, schema);
      const tooLongResult = Validator.validate(tooLongData, schema);

      expect(validResult.isValid).toBe(true);
      expect(tooShortResult.isValid).toBe(false);
      expect(tooLongResult.isValid).toBe(false);
    });
  });
});