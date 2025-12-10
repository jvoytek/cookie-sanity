import { describe, it, expect } from 'vitest';
import { useAuditFileUpload } from './useAuditFileUpload';

describe('useAuditFileUpload', () => {
  const { validateFile, parseFile } = useAuditFileUpload();

  describe('validateFile', () => {
    it('should accept CSV files', () => {
      const file = new File(['test'], 'test.csv', { type: 'text/csv' });
      const result = validateFile(file);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept XLSX files', () => {
      const file = new File(['test'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const result = validateFile(file);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject files that are too large', () => {
      const largeContent = new Array(6 * 1024 * 1024).fill('a').join('');
      const file = new File([largeContent], 'large.csv', { type: 'text/csv' });
      const result = validateFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('File size exceeds limit');
    });

    it('should reject invalid file types', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const result = validateFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file type');
    });

    it('should accept CSV file by extension even if MIME type is generic', () => {
      const file = new File(['test'], 'test.csv', {
        type: 'application/octet-stream',
      });
      const result = validateFile(file);

      expect(result.valid).toBe(true);
    });

    it('should accept XLSX file by extension even if MIME type is generic', () => {
      const file = new File(['test'], 'test.xlsx', {
        type: 'application/octet-stream',
      });
      const result = validateFile(file);

      expect(result.valid).toBe(true);
    });
  });

  describe('parseFile - CSV', () => {
    it('should parse simple CSV file', async () => {
      const csvContent = 'Header1,Header2,Header3\nValue1,Value2,Value3';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const result = await parseFile(file);

      expect(result.headers).toEqual(['Header1', 'Header2', 'Header3']);
      expect(result.rows).toEqual([['Value1', 'Value2', 'Value3']]);
      expect(result.rowCount).toBe(1);
    });

    it('should parse CSV with multiple rows', async () => {
      const csvContent =
        'Name,Age,City\nJohn,25,NYC\nJane,30,LA\nBob,35,Chicago';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const result = await parseFile(file);

      expect(result.headers).toEqual(['Name', 'Age', 'City']);
      expect(result.rows).toHaveLength(3);
      expect(result.rowCount).toBe(3);
    });

    it('should handle CSV with quoted values', async () => {
      const csvContent = 'Name,Description\n"John Doe","Has a, comma"\n';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const result = await parseFile(file);

      expect(result.headers).toEqual(['Name', 'Description']);
      expect(result.rows[0]).toEqual(['John Doe', 'Has a, comma']);
    });

    it('should handle CSV with escaped quotes', async () => {
      const csvContent = 'Name,Quote\n"John","He said ""hello"""\n';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const result = await parseFile(file);

      expect(result.rows[0]).toEqual(['John', 'He said "hello"']);
    });

    it('should reject CSV with more than 2000 rows', async () => {
      const headers = 'Col1,Col2,Col3\n';
      const rows = Array(2001)
        .fill('val1,val2,val3')
        .join('\n');
      const csvContent = headers + rows;
      const file = new File([csvContent], 'large.csv', { type: 'text/csv' });

      await expect(parseFile(file)).rejects.toThrow('exceeds the maximum');
    });

    it('should reject empty CSV file', async () => {
      const file = new File([''], 'empty.csv', { type: 'text/csv' });

      await expect(parseFile(file)).rejects.toThrow('File is empty');
    });

    it('should handle CSV with empty lines', async () => {
      const csvContent = 'Header1,Header2\nValue1,Value2\n\nValue3,Value4\n';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const result = await parseFile(file);

      expect(result.rowCount).toBe(2);
      expect(result.rows).toEqual([
        ['Value1', 'Value2'],
        ['Value3', 'Value4'],
      ]);
    });
  });

  describe('parseFile - validation', () => {
    it('should reject file with invalid type before parsing', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      await expect(parseFile(file)).rejects.toThrow('Invalid file type');
    });

    it('should reject file that is too large before parsing', async () => {
      const largeContent = new Array(6 * 1024 * 1024).fill('a').join('');
      const file = new File([largeContent], 'large.csv', { type: 'text/csv' });

      await expect(parseFile(file)).rejects.toThrow('File size exceeds limit');
    });
  });
});
