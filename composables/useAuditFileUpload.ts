import ExcelJS from 'exceljs';

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export interface ParsedFileData {
  headers: string[];
  rows: unknown[][];
  rowCount: number;
}

export const useAuditFileUpload = () => {
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
  const MAX_ROWS = 2000;
  const ALLOWED_TYPES = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  /**
   * Validates file type and size
   */
  const validateFile = (file: File): FileValidationResult => {
    // Check file type
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const isValidType =
      ALLOWED_TYPES.includes(file.type) ||
      fileExtension === 'csv' ||
      fileExtension === 'xlsx';

    if (!isValidType) {
      return {
        valid: false,
        error: 'Invalid file type. Only CSV and XLSX files are accepted.',
      };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size exceeds limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
      };
    }

    return { valid: true };
  };

  /**
   * Parses CSV file content
   */
  const parseCSV = (content: string): ParsedFileData => {
    const lines = content.split(/\r?\n/).filter((line) => line.trim());

    if (lines.length === 0) {
      throw new Error('File is empty');
    }

    // Parse CSV with proper quote handling
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            // Escaped quote
            current += '"';
            i++;
          } else {
            // Toggle quote state
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          // End of field
          result.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current);
      return result;
    };

    const headers = parseCSVLine(lines[0]);
    const rows = lines.slice(1).map((line) => parseCSVLine(line));

    return {
      headers,
      rows,
      rowCount: rows.length,
    };
  };

  /**
   * Reads CSV file
   */
  const readCSV = (file: File): Promise<ParsedFileData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = parseCSV(content);

          if (data.rowCount > MAX_ROWS) {
            reject(
              new Error(
                `File has ${data.rowCount} rows, which exceeds the maximum of ${MAX_ROWS} rows.`,
              ),
            );
            return;
          }

          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsText(file);
    });
  };

  /**
   * Reads XLSX file using ExcelJS
   */
  const readXLSX = (file: File): Promise<ParsedFileData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(data.buffer);
          const worksheet = workbook.worksheets[0];

          if (!worksheet) {
            reject(new Error('No worksheet found in the Excel file'));
            return;
          }

          const headers: string[] = [];
          const rows: unknown[][] = [];

          // Extract headers from first row
          const headerRow = worksheet.getRow(1);
          headerRow.eachCell((cell, colNumber) => {
            headers[colNumber - 1] = cell.value?.toString() || '';
          });

          // Process data rows
          worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
              const rowData: unknown[] = [];
              row.eachCell((cell, colNumber) => {
                rowData[colNumber - 1] = cell.value;
              });
              // Ensure row has same length as headers
              if (rowData.length < headers.length) {
                rowData.push(
                  ...Array(headers.length - rowData.length).fill(''),
                );
              }
              rows.push(rowData);
            }
          });

          if (rows.length > MAX_ROWS) {
            reject(
              new Error(
                `File has ${rows.length} rows, which exceeds the maximum of ${MAX_ROWS} rows.`,
              ),
            );
            return;
          }

          resolve({
            headers,
            rows,
            rowCount: rows.length,
          });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  };

  /**
   * Parses uploaded file (auto-detects CSV or XLSX)
   */
  const parseFile = async (file: File): Promise<ParsedFileData> => {
    const validation = validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const fileExtension = file.name.toLowerCase().split('.').pop();

    if (fileExtension === 'csv') {
      return await readCSV(file);
    } else if (fileExtension === 'xlsx') {
      return await readXLSX(file);
    } else {
      throw new Error('Unsupported file format');
    }
  };

  return {
    validateFile,
    parseFile,
    MAX_ROWS,
    MAX_FILE_SIZE,
  };
};
