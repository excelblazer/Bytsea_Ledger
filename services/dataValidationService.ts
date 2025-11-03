import { RawTransactionData, DataValidationReport } from '../types';
import { ValidationIssue, ValidationSuggestion } from '../types';

export interface DataQualityMetrics {
  totalRows: number;
  validRows: number;
  duplicateRows: number;
  missingDataRows: number;
  invalidFormatRows: number;
  outlierRows: number;
  qualityScore: number; // 0-100
}

export interface ValidationResult {
  metrics: DataQualityMetrics;
  issues: ValidationIssue[];
  suggestions: ValidationSuggestion[];
  report: DataValidationReport;
}

/**
 * Enhanced data validation service with real-time quality checks
 * and actionable suggestions for data cleaning and improvement.
 */
export class DataValidationService {
  private static instance: DataValidationService;

  public static getInstance(): DataValidationService {
    if (!DataValidationService.instance) {
      DataValidationService.instance = new DataValidationService();
    }
    return DataValidationService.instance;
  }

  /**
   * Perform comprehensive data quality validation
   */
  public validateDataQuality(
    rawData: RawTransactionData[],
    existingReport?: DataValidationReport
  ): ValidationResult {
    const issues: ValidationIssue[] = [];
    const suggestions: ValidationSuggestion[] = [];

    // Run all validation checks
    const duplicateIssues = this.detectDuplicates(rawData);
    const missingDataIssues = this.detectMissingData(rawData);
    const formatIssues = this.validateFormats(rawData);
    const outlierIssues = this.detectOutliers(rawData);
    const consistencyIssues = this.checkConsistency(rawData);
    const qualityIssues = this.assessDataQuality(rawData);

    issues.push(...duplicateIssues, ...missingDataIssues, ...formatIssues, ...outlierIssues, ...consistencyIssues, ...qualityIssues);

    // Generate suggestions based on issues
    suggestions.push(...this.generateSuggestions(issues));

    // Calculate metrics
    const metrics = this.calculateQualityMetrics(rawData, issues);

    // Merge with existing report if provided
    const report = this.mergeReports(existingReport, issues);

    return {
      metrics,
      issues,
      suggestions,
      report
    };
  }

  /**
   * Detect duplicate transactions based on key fields
   */
  private detectDuplicates(data: RawTransactionData[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const seen = new Map<string, number[]>();

    data.forEach((row, index) => {
      // Create a composite key from date, description, and amount
      const key = `${row.date || ''}|${row.description || ''}|${row.amount || row.debitAmount || row.creditAmount || ''}`.toLowerCase().trim();

      if (key && key !== '||') {
        if (!seen.has(key)) {
          seen.set(key, [index]);
        } else {
          seen.get(key)!.push(index);
        }
      }
    });

    seen.forEach((indices) => {
      if (indices.length > 1) {
        indices.forEach(rowIndex => {
          issues.push({
            type: 'warning',
            severity: 'medium',
            category: 'duplicates',
            rowIndex,
            message: `Potential duplicate transaction (appears ${indices.length} times)`,
            suggestion: 'Review and remove duplicate entries',
            canAutoFix: false
          });
        });
      }
    });

    return issues;
  }

  /**
   * Detect missing or incomplete data
   */
  private detectMissingData(data: RawTransactionData[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const criticalFields = ['date', 'description'];

    data.forEach((row, index) => {
      // Check critical fields
      criticalFields.forEach(field => {
        if (!row[field as keyof RawTransactionData]) {
          issues.push({
            type: 'error',
            severity: 'high',
            category: 'missing_data',
            rowIndex: index,
            field,
            message: `Missing ${field} (required for processing)`,
            suggestion: 'Fill in the missing data or skip this row',
            canAutoFix: false
          });
        }
      });

      // Check amount fields
      const hasAmount = row.amount || (row.debitAmount || row.creditAmount);
      if (!hasAmount) {
        issues.push({
          type: 'error',
          severity: 'high',
          category: 'missing_data',
            rowIndex: index,
            field: 'amount',
            message: 'Missing amount information',
            suggestion: 'Provide amount data in Amount, Debit, or Credit columns',
            canAutoFix: false
        });
      }

      // Check for mostly empty rows
      const filledFields = Object.values(row).filter(val => val && val.toString().trim() !== '');
      if (filledFields.length < 2) {
        issues.push({
          type: 'warning',
          severity: 'medium',
          category: 'missing_data',
          rowIndex: index,
          message: 'Row appears mostly empty',
          suggestion: 'Review and remove empty rows',
          canAutoFix: true
        });
      }
    });

    return issues;
  }

  /**
   * Validate data formats (dates, amounts, etc.)
   */
  private validateFormats(data: RawTransactionData[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    data.forEach((row, index) => {
      // Date validation
      if (row.date) {
        const dateStr = row.date.toString();
        const parsedDate = this.parseDate(dateStr);
        if (!parsedDate) {
          issues.push({
            type: 'error',
            severity: 'high',
            category: 'format',
            rowIndex: index,
            field: 'date',
            message: `Invalid date format: "${dateStr}"`,
            suggestion: 'Use YYYY-MM-DD, MM/DD/YYYY, or DD/MM/YYYY format',
            canAutoFix: true
          });
        }
      }

      // Amount validation
      ['amount', 'debitAmount', 'creditAmount'].forEach(field => {
        const value = row[field as keyof RawTransactionData];
        if (value) {
          const numValue = parseFloat(value.toString().replace(/[$,\s]/g, ''));
          if (isNaN(numValue)) {
            issues.push({
              type: 'error',
              severity: 'high',
              category: 'format',
              rowIndex: index,
              field,
              message: `Invalid number format: "${value}"`,
              suggestion: 'Use standard number format (e.g., 123.45 or $123.45)',
              canAutoFix: true
            });
          }
        }
      });

      // Description quality
      if (row.description) {
        const desc = row.description.toString().trim();
        if (desc.length < 3) {
          issues.push({
            type: 'warning',
            severity: 'low',
            category: 'quality',
            rowIndex: index,
            field: 'description',
            message: 'Description is very short',
            suggestion: 'Add more descriptive transaction details',
            canAutoFix: false
          });
        }
      }
    });

    return issues;
  }

  /**
   * Detect outlier amounts that might be errors
   */
  private detectOutliers(data: RawTransactionData[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const amounts: number[] = [];

    // Collect all valid amounts
    data.forEach(row => {
      let amount: number | null = null;
      if (row.amount) {
        amount = parseFloat(row.amount.toString().replace(/[$,\s]/g, ''));
      } else if (row.debitAmount || row.creditAmount) {
        const debit = row.debitAmount ? parseFloat(row.debitAmount.toString().replace(/[$,\s]/g, '')) : 0;
        const credit = row.creditAmount ? parseFloat(row.creditAmount.toString().replace(/[$,\s]/g, '')) : 0;
        amount = credit - debit;
      }

      if (amount && !isNaN(amount) && Math.abs(amount) > 0) {
        amounts.push(Math.abs(amount));
      }
    });

    if (amounts.length === 0) return issues;

    // Calculate statistics
    amounts.sort((a, b) => a - b);
    const q1 = amounts[Math.floor(amounts.length * 0.25)];
    const q3 = amounts[Math.floor(amounts.length * 0.75)];
    const iqr = q3 - q1;
    const upperFence = q3 + (iqr * 1.5);

    // Find outliers
    data.forEach((row, index) => {
      let amount: number | null = null;
      if (row.amount) {
        amount = Math.abs(parseFloat(row.amount.toString().replace(/[$,\s]/g, '')));
      } else if (row.debitAmount || row.creditAmount) {
        const debit = row.debitAmount ? parseFloat(row.debitAmount.toString().replace(/[$,\s]/g, '')) : 0;
        const credit = row.creditAmount ? parseFloat(row.creditAmount.toString().replace(/[$,\s]/g, '')) : 0;
        amount = Math.abs(credit - debit);
      }

      if (amount && amount > upperFence) {
        issues.push({
          type: 'warning',
          severity: 'medium',
          category: 'outliers',
          rowIndex: index,
          field: 'amount',
          message: `Unusually large amount: ${amount.toLocaleString()}`,
          suggestion: 'Verify this amount is correct',
          canAutoFix: false
        });
      }
    });

    return issues;
  }

  /**
   * Check data consistency (currency, date formats, etc.)
   */
  private checkConsistency(data: RawTransactionData[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const currencies = new Set<string>();
    const dateFormats = new Set<string>();

    data.forEach(row => {
      // Currency consistency
      if (row.currency) {
        currencies.add(row.currency.toString().toUpperCase());
      }

      // Date format consistency
      if (row.date) {
        const format = this.detectDateFormat(row.date.toString());
        if (format) {
          dateFormats.add(format);
        }
      }
    });

    // Check for mixed currencies
    if (currencies.size > 1) {
      issues.push({
        type: 'warning',
        severity: 'medium',
        category: 'consistency',
        message: `Mixed currencies detected: ${Array.from(currencies).join(', ')}`,
        suggestion: 'Ensure all transactions use the same currency',
        canAutoFix: false
      });
    }

    // Check for mixed date formats
    if (dateFormats.size > 1) {
      issues.push({
        type: 'info',
        severity: 'low',
        category: 'consistency',
        message: `Mixed date formats detected: ${Array.from(dateFormats).join(', ')}`,
        suggestion: 'Standardize to YYYY-MM-DD format for consistency',
        canAutoFix: true
      });
    }

    return issues;
  }

  /**
   * Assess overall data quality
   */
  private assessDataQuality(data: RawTransactionData[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (data.length === 0) return issues;

    // Check for data completeness
    const completeness = this.calculateCompleteness(data);
    if (completeness < 0.7) {
      issues.push({
        type: 'warning',
        severity: 'high',
        category: 'quality',
        message: `Low data completeness: ${(completeness * 100).toFixed(1)}%`,
        suggestion: 'Review and complete missing data fields',
        canAutoFix: false
      });
    }

    // Check for description quality
    const avgDescLength = data
      .map(row => row.description?.toString().length || 0)
      .reduce((sum, len) => sum + len, 0) / data.length;

    if (avgDescLength < 10) {
      issues.push({
        type: 'info',
        severity: 'low',
        category: 'quality',
        message: `Short average description length: ${avgDescLength.toFixed(1)} characters`,
        suggestion: 'Add more detailed transaction descriptions for better categorization',
        canAutoFix: false
      });
    }

    return issues;
  }

  /**
   * Generate actionable suggestions based on validation issues
   */
  private generateSuggestions(issues: ValidationIssue[]): ValidationSuggestion[] {
    const suggestions: ValidationSuggestion[] = [];
    const issueCounts = new Map<string, number>();

    // Count issues by category
    issues.forEach(issue => {
      issueCounts.set(issue.category, (issueCounts.get(issue.category) || 0) + 1);
    });

    // Generate suggestions based on issue patterns
    if (issueCounts.get('duplicates') && issueCounts.get('duplicates')! > 0) {
      suggestions.push({
        id: 'remove-duplicates',
        title: 'Remove Duplicate Transactions',
        description: `Found ${issueCounts.get('duplicates')} potential duplicate transactions. Removing duplicates will improve data accuracy.`,
        impact: 'high',
        effort: 'review',
        action: () => {
          // This would be implemented in the UI component
          console.log('Remove duplicates action triggered');
        }
      });
    }

    if (issueCounts.get('format') && issueCounts.get('format')! > 0) {
      suggestions.push({
        id: 'standardize-formats',
        title: 'Standardize Data Formats',
        description: `Fix ${issueCounts.get('format')} formatting issues automatically (dates, amounts, etc.)`,
        impact: 'high',
        effort: 'auto',
        action: () => {
          // Auto-fix formatting issues
          console.log('Standardize formats action triggered');
        }
      });
    }

    if (issueCounts.get('missing_data') && issueCounts.get('missing_data')! > 0) {
      suggestions.push({
        id: 'fill-missing-data',
        title: 'Review Missing Data',
        description: `${issueCounts.get('missing_data')} rows have missing required information. Complete these fields for proper processing.`,
        impact: 'high',
        effort: 'manual',
        action: () => {
          // Show missing data editor
          console.log('Fill missing data action triggered');
        }
      });
    }

    // Always suggest data quality improvements
    suggestions.push({
      id: 'improve-descriptions',
      title: 'Enhance Transaction Descriptions',
      description: 'Add more detailed descriptions to improve AI categorization accuracy.',
      impact: 'medium',
      effort: 'manual',
      action: () => {
        console.log('Improve descriptions action triggered');
      }
    });

    return suggestions;
  }

  /**
   * Calculate data quality metrics
   */
  private calculateQualityMetrics(data: RawTransactionData[], issues: ValidationIssue[]): DataQualityMetrics {
    const totalRows = data.length;
    const errorCount = issues.filter(i => i.type === 'error').length;
    const warningCount = issues.filter(i => i.type === 'warning').length;

    // Calculate valid rows (no errors)
    const errorRows = new Set(issues.filter(i => i.type === 'error' && i.rowIndex !== undefined).map(i => i.rowIndex));
    const validRows = totalRows - errorRows.size;

    // Count issues by category
    const duplicateRows = issues.filter(i => i.category === 'duplicates').length;
    const missingDataRows = issues.filter(i => i.category === 'missing_data').length;
    const invalidFormatRows = issues.filter(i => i.category === 'format').length;
    const outlierRows = issues.filter(i => i.category === 'outliers').length;

    // Calculate quality score (0-100)
    const errorPenalty = (errorCount / totalRows) * 50; // Max 50 points for errors
    const warningPenalty = (warningCount / totalRows) * 30; // Max 30 points for warnings
    const completenessBonus = this.calculateCompleteness(data) * 20; // Max 20 points for completeness

    const qualityScore = Math.max(0, Math.min(100, 100 - errorPenalty - warningPenalty + completenessBonus));

    return {
      totalRows,
      validRows,
      duplicateRows,
      missingDataRows,
      invalidFormatRows,
      outlierRows,
      qualityScore: Math.round(qualityScore)
    };
  }

  /**
   * Calculate data completeness percentage
   */
  private calculateCompleteness(data: RawTransactionData[]): number {
    if (data.length === 0) return 0;

    const requiredFields = ['date', 'description'];
    const amountFields = ['amount', 'debitAmount', 'creditAmount'];

    let totalFields = 0;
    let filledFields = 0;

    data.forEach(row => {
      requiredFields.forEach(field => {
        totalFields++;
        if (row[field as keyof RawTransactionData]) filledFields++;
      });

      // Count amount fields (at least one should be filled)
      totalFields++;
      const hasAmount = amountFields.some(field => row[field as keyof RawTransactionData]);
      if (hasAmount) filledFields++;
    });

    return filledFields / totalFields;
  }

  /**
   * Parse date string with multiple format support
   */
  private parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    // Try different date formats
    const formats = [
      /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
      /^(\d{2})\/(\d{2})\/(\d{4})$/, // MM/DD/YYYY
      /^(\d{2})\/(\d{2})\/(\d{2})$/, // MM/DD/YY
      /^(\d{2})-(\d{2})-(\d{4})$/, // MM-DD-YYYY
      /^(\d{4})\/(\d{2})\/(\d{2})$/, // YYYY/MM/DD
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        const [, year, month, day] = match;
        const fullYear = year.length === 2 ? `20${year}` : year;
        const date = new Date(`${fullYear}-${month}-${day}`);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }

    return null;
  }

  /**
   * Detect date format pattern
   */
  private detectDateFormat(dateStr: string): string | null {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return 'YYYY-MM-DD';
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return 'MM/DD/YYYY';
    if (/^\d{2}\/\d{2}\/\d{2}$/.test(dateStr)) return 'MM/DD/YY';
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return 'MM-DD-YYYY';
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(dateStr)) return 'YYYY/MM/DD';
    return null;
  }

  /**
   * Merge validation results with existing report
   */
  private mergeReports(existingReport: DataValidationReport | undefined, issues: ValidationIssue[]): DataValidationReport {
    const report: DataValidationReport = existingReport ? { ...existingReport } : {
      skippedRowCount: 0,
      warningRowCount: 0,
      errors: [],
      summary: {}
    };

    // Add validation issues to report
    issues.forEach(issue => {
      if (issue.type === 'error') {
        report.errors.push({
          rowIndex: issue.rowIndex || 0,
          message: issue.message,
          rowDataPreview: issue.field || ''
        });
      }
    });

    report.warningRowCount = issues.filter(i => i.type === 'warning').length;

    return report;
  }
}

// Export singleton instance
export const dataValidationService = DataValidationService.getInstance();