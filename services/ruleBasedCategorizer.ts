import { RawTransactionData, AccountingCategory, CategorizationResult, PredictionSourceType, Industry } from '../types';

/**
 * Enhanced rule-based categorization system that provides comprehensive
 * transaction categorization without requiring AI services.
 */
export class RuleBasedCategorizer {

  /**
   * Main categorization method that uses comprehensive rule-based logic
   */
  public static categorizeTransaction(
    rawTx: RawTransactionData,
    industry?: Industry
  ): CategorizationResult {
    const description = (rawTx.Description || '').toLowerCase().trim();
    const vendorName = (rawTx.VendorCustomerName || '').toLowerCase().trim();

    // High-confidence matches based on vendor names
    const vendorMatch = this.categorizeByVendor(vendorName, description);
    if (vendorMatch) {
      return vendorMatch;
    }

    // Medium-confidence matches based on description keywords
    const keywordMatch = this.categorizeByKeywords(description, vendorName);
    if (keywordMatch) {
      return keywordMatch;
    }

    // Industry-specific categorization
    if (industry) {
      const industryMatch = this.categorizeByIndustry(description, vendorName, industry);
      if (industryMatch) {
        return industryMatch;
      }
    }

    // Amount-based categorization (for large amounts)
    const amount = this.extractAmount(rawTx);
    if (amount && Math.abs(amount) > 1000) {
      const amountMatch = this.categorizeByAmount(amount);
      if (amountMatch) {
        return amountMatch;
      }
    }

    // Default categorization based on transaction patterns
    return this.getDefaultCategorization(description, vendorName);
  }

  /**
   * Categorize based on known vendor names and patterns
   */
  private static categorizeByVendor(vendorName: string, description: string): CategorizationResult | null {
    const vendorRules = [
      // Banking and Financial Services
      { vendors: ['bank', 'credit union', 'wells fargo', 'chase', 'bank of america', 'citi', 'td bank'], category: 'Interest Income', broad: AccountingCategory.INCOME, confidence: 0.9 },
      { vendors: ['paypal', 'stripe', 'square', 'venmo'], category: 'Payment Processing Fees', broad: AccountingCategory.EXPENSES, confidence: 0.85 },

      // Utilities
      { vendors: ['electric', 'power company', 'pge', 'sce', 'con edison'], category: 'Utilities - Electric', broad: AccountingCategory.EXPENSES, confidence: 0.9 },
      { vendors: ['water', 'aqueduct', 'water company'], category: 'Utilities - Water', broad: AccountingCategory.EXPENSES, confidence: 0.9 },
      { vendors: ['gas', 'pacific gas', 'so cal gas', 'national grid'], category: 'Utilities - Gas', broad: AccountingCategory.EXPENSES, confidence: 0.9 },
      { vendors: ['internet', 'comcast', 'verizon', 'at&t', 'cox', 'spectrum'], category: 'Utilities - Internet', broad: AccountingCategory.EXPENSES, confidence: 0.85 },
      { vendors: ['phone', 'cell phone', 'mobile', 'tmobile', 'att', 'verizon wireless'], category: 'Utilities - Telephone', broad: AccountingCategory.EXPENSES, confidence: 0.85 },

      // Insurance
      { vendors: ['insurance', 'geico', 'progressive', 'state farm', 'allstate', 'farmers'], category: 'Insurance Expense', broad: AccountingCategory.EXPENSES, confidence: 0.9 },

      // Office Supplies and Software
      { vendors: ['office depot', 'staples', 'amazon business', 'adobe', 'microsoft', 'google workspace'], category: 'Office Supplies', broad: AccountingCategory.EXPENSES, confidence: 0.8 },
      { vendors: ['quickbooks', 'xero', 'freshbooks', 'wave'], category: 'Accounting Software', broad: AccountingCategory.EXPENSES, confidence: 0.9 },

      // Professional Services
      { vendors: ['legal', 'lawyer', 'attorney', 'law firm'], category: 'Legal Fees', broad: AccountingCategory.EXPENSES, confidence: 0.85 },
      { vendors: ['accounting', 'cpa', 'tax service', 'h&r block'], category: 'Accounting Fees', broad: AccountingCategory.EXPENSES, confidence: 0.85 },
      { vendors: ['consulting', 'consultant'], category: 'Professional Services', broad: AccountingCategory.EXPENSES, confidence: 0.8 },

      // Travel and Transportation
      { vendors: ['uber', 'lyft', 'taxi', 'ride share'], category: 'Travel - Transportation', broad: AccountingCategory.EXPENSES, confidence: 0.9 },
      { vendors: ['airline', 'delta', 'united', 'american airlines', 'southwest'], category: 'Travel - Airfare', broad: AccountingCategory.EXPENSES, confidence: 0.85 },
      { vendors: ['hotel', 'marriott', 'hilton', 'hyatt', 'airbnb'], category: 'Travel - Lodging', broad: AccountingCategory.EXPENSES, confidence: 0.85 },

      // Government and Taxes
      { vendors: ['irs', 'internal revenue', 'tax payment', 'tax refund'], category: 'Income Taxes Payable', broad: AccountingCategory.EXPENSES, confidence: 0.95 },
      { vendors: ['dmv', 'department of motor', 'license plate'], category: 'Vehicle Registration', broad: AccountingCategory.EXPENSES, confidence: 0.9 },
    ];

    for (const rule of vendorRules) {
      if (rule.vendors.some(vendor => vendorName.includes(vendor) || description.includes(vendor))) {
        return {
          specificCategory: rule.category,
          broadCategory: rule.broad,
          confidence: rule.confidence,
          predictionSource: PredictionSourceType.GLOBAL_RULE,
          transactionType: this.inferTransactionType(description, rule.category),
          vendorCustomerName: vendorName || undefined
        };
      }
    }

    return null;
  }

  /**
   * Categorize based on description keywords
   */
  private static categorizeByKeywords(description: string, vendorName: string): CategorizationResult | null {
    const keywordRules = [
      // Income
      { keywords: ['salary', 'payroll', 'wage', 'compensation'], category: 'Salary Income', broad: AccountingCategory.INCOME, confidence: 0.8 },
      { keywords: ['interest', 'dividend', 'investment income'], category: 'Investment Income', broad: AccountingCategory.INCOME, confidence: 0.85 },
      { keywords: ['refund', 'rebate', 'return'], category: 'Refunds & Returns', broad: AccountingCategory.INCOME, confidence: 0.75 },
      { keywords: ['sale', 'revenue', 'income'], category: 'Sales Revenue', broad: AccountingCategory.INCOME, confidence: 0.7 },

      // Expenses - Operating
      { keywords: ['rent', 'lease', 'mortgage'], category: 'Rent Expense', broad: AccountingCategory.EXPENSES, confidence: 0.9 },
      { keywords: ['supplies', 'office supplies', 'stationery'], category: 'Office Supplies', broad: AccountingCategory.EXPENSES, confidence: 0.8 },
      { keywords: ['marketing', 'advertising', 'promo'], category: 'Marketing Expense', broad: AccountingCategory.EXPENSES, confidence: 0.8 },
      { keywords: ['maintenance', 'repair'], category: 'Maintenance & Repairs', broad: AccountingCategory.EXPENSES, confidence: 0.8 },
      { keywords: ['subscription', 'membership', 'software'], category: 'Software Subscriptions', broad: AccountingCategory.EXPENSES, confidence: 0.8 },

      // Expenses - Professional Services
      { keywords: ['legal', 'attorney', 'lawyer'], category: 'Legal Fees', broad: AccountingCategory.EXPENSES, confidence: 0.85 },
      { keywords: ['accounting', 'cpa', 'tax prep'], category: 'Accounting Fees', broad: AccountingCategory.EXPENSES, confidence: 0.85 },
      { keywords: ['consulting', 'consultant'], category: 'Consulting Fees', broad: AccountingCategory.EXPENSES, confidence: 0.8 },

      // Expenses - Travel
      { keywords: ['travel', 'mileage', 'per diem'], category: 'Travel Expenses', broad: AccountingCategory.EXPENSES, confidence: 0.8 },
      { keywords: ['meal', 'restaurant', 'food', 'lunch', 'dinner'], category: 'Meals & Entertainment', broad: AccountingCategory.EXPENSES, confidence: 0.75 },

      // Assets and Liabilities
      { keywords: ['equipment', 'computer', 'furniture'], category: 'Equipment', broad: AccountingCategory.ASSETS, confidence: 0.8 },
      { keywords: ['loan', 'payment', 'principal'], category: 'Loan Payments', broad: AccountingCategory.EXPENSES, confidence: 0.8 },

      // Banking
      { keywords: ['fee', 'charge', 'service charge'], category: 'Bank Fees', broad: AccountingCategory.EXPENSES, confidence: 0.8 },
      { keywords: ['transfer', 'wire', 'ach'], category: 'Bank Transfers', broad: AccountingCategory.ASSETS, confidence: 0.7 },
    ];

    for (const rule of keywordRules) {
      if (rule.keywords.some(keyword => description.includes(keyword))) {
        return {
          specificCategory: rule.category,
          broadCategory: rule.broad,
          confidence: rule.confidence,
          predictionSource: PredictionSourceType.GLOBAL_RULE,
          transactionType: this.inferTransactionType(description, rule.category),
          vendorCustomerName: vendorName || undefined
        };
      }
    }

    return null;
  }

  /**
   * Industry-specific categorization
   */
  private static categorizeByIndustry(description: string, vendorName: string, industry: Industry): CategorizationResult | null {
    const industryRules: { [key: string]: Array<{ keywords: string[], category: string, broad: AccountingCategory, confidence: number }> } = {
      'Technology': [
        { keywords: ['software', 'license', 'cloud'], category: 'Software Licenses', broad: AccountingCategory.EXPENSES, confidence: 0.8 },
        { keywords: ['hosting', 'server', 'domain'], category: 'Web Hosting', broad: AccountingCategory.EXPENSES, confidence: 0.85 },
        { keywords: ['development', 'coding', 'programming'], category: 'Development Services', broad: AccountingCategory.EXPENSES, confidence: 0.8 },
      ],
      'Healthcare': [
        { keywords: ['medical', 'health', 'patient'], category: 'Medical Expenses', broad: AccountingCategory.EXPENSES, confidence: 0.85 },
        { keywords: ['insurance', 'premium'], category: 'Health Insurance', broad: AccountingCategory.EXPENSES, confidence: 0.9 },
        { keywords: ['pharmacy', 'drug'], category: 'Pharmaceuticals', broad: AccountingCategory.EXPENSES, confidence: 0.8 },
      ],
      'Retail': [
        { keywords: ['inventory', 'stock', 'merchandise'], category: 'Cost of Goods Sold', broad: AccountingCategory.EXPENSES, confidence: 0.85 },
        { keywords: ['pos', 'point of sale'], category: 'Point of Sale Systems', broad: AccountingCategory.EXPENSES, confidence: 0.8 },
        { keywords: ['fixture', 'shelving'], category: 'Store Fixtures', broad: AccountingCategory.ASSETS, confidence: 0.8 },
      ],
      'Construction': [
        { keywords: ['material', 'lumber', 'concrete'], category: 'Construction Materials', broad: AccountingCategory.EXPENSES, confidence: 0.85 },
        { keywords: ['equipment', 'machinery'], category: 'Equipment Rental', broad: AccountingCategory.EXPENSES, confidence: 0.8 },
        { keywords: ['permit', 'license'], category: 'Construction Permits', broad: AccountingCategory.EXPENSES, confidence: 0.8 },
      ],
      'Professional Services': [
        { keywords: ['client', 'project'], category: 'Professional Services Revenue', broad: AccountingCategory.INCOME, confidence: 0.8 },
        { keywords: ['contractor', 'freelance'], category: 'Contractor Payments', broad: AccountingCategory.EXPENSES, confidence: 0.8 },
        { keywords: ['training', 'certification'], category: 'Professional Development', broad: AccountingCategory.EXPENSES, confidence: 0.8 },
      ],
    };

    const industryName = industry.name.toLowerCase();
    const rules = industryRules[industryName] || industryRules['Professional Services'] || [];

    for (const rule of rules) {
      if (rule.keywords.some(keyword => description.includes(keyword))) {
        return {
          specificCategory: rule.category,
          broadCategory: rule.broad,
          confidence: rule.confidence,
          predictionSource: PredictionSourceType.INDUSTRY_RULE,
          transactionType: this.inferTransactionType(description, rule.category),
          vendorCustomerName: vendorName || undefined
        };
      }
    }

    return null;
  }

  /**
   * Categorize based on transaction amount patterns
   */
  private static categorizeByAmount(amount: number): CategorizationResult | null {
    const absAmount = Math.abs(amount);

    // Large amounts (> $10,000) - likely significant business transactions
    if (absAmount > 10000) {
      if (amount > 0) {
        return {
          specificCategory: 'Large Revenue',
          broadCategory: AccountingCategory.INCOME,
          confidence: 0.6,
          predictionSource: PredictionSourceType.GLOBAL_RULE,
          transactionType: 'Income',
          vendorCustomerName: undefined
        };
      } else {
        return {
          specificCategory: 'Large Expense',
          broadCategory: AccountingCategory.EXPENSES,
          confidence: 0.6,
          predictionSource: PredictionSourceType.GLOBAL_RULE,
          transactionType: 'Expense',
          vendorCustomerName: undefined
        };
      }
    }

    // Very small amounts (< $1) - likely fees or minor adjustments
    if (absAmount < 1) {
      return {
        specificCategory: 'Minor Fees & Adjustments',
        broadCategory: AccountingCategory.EXPENSES,
        confidence: 0.7,
        predictionSource: PredictionSourceType.GLOBAL_RULE,
        transactionType: amount > 0 ? 'Income' : 'Expense',
        vendorCustomerName: undefined
      };
    }

    return null;
  }

  /**
   * Default categorization when no specific rules match
   */
  private static getDefaultCategorization(description: string, vendorName: string): CategorizationResult {
    // Analyze description for common patterns
    if (description.includes('payment') || description.includes('received') || description.includes('deposit')) {
      return {
        specificCategory: 'General Income',
        broadCategory: AccountingCategory.INCOME,
        confidence: 0.5,
        predictionSource: PredictionSourceType.GLOBAL_RULE,
        transactionType: 'Income',
        vendorCustomerName: vendorName || undefined
      };
    }

    if (description.includes('withdrawal') || description.includes('debit') || description.includes('charge')) {
      return {
        specificCategory: 'General Expenses',
        broadCategory: AccountingCategory.EXPENSES,
        confidence: 0.5,
        predictionSource: PredictionSourceType.GLOBAL_RULE,
        transactionType: 'Expense',
        vendorCustomerName: vendorName || undefined
      };
    }

    // Default to expenses for most transactions
    return {
      specificCategory: 'Uncategorized Expense',
      broadCategory: AccountingCategory.EXPENSES,
      confidence: 0.3,
      predictionSource: PredictionSourceType.UNKNOWN_SOURCE,
      transactionType: 'Expense',
      vendorCustomerName: vendorName || undefined
    };
  }

  /**
   * Infer transaction type from description and category
   */
  private static inferTransactionType(description: string, category: string): string {
    // Income indicators
    if (category.includes('Income') || category.includes('Revenue') || category.includes('Refund')) {
      return 'Income';
    }

    // Expense indicators
    if (category.includes('Expense') || category.includes('Fee') || category.includes('Cost')) {
      return 'Expense';
    }

    // Check description for clues
    if (description.includes('payment received') || description.includes('deposit') || description.includes('credit')) {
      return 'Income';
    }

    if (description.includes('payment sent') || description.includes('debit') || description.includes('charge')) {
      return 'Expense';
    }

    return 'Expense'; // Default assumption
  }

  /**
   * Extract amount from raw transaction data
   */
  private static extractAmount(rawTx: RawTransactionData): number | null {
    if (rawTx.Amount) {
      return parseFloat(rawTx.Amount.toString().replace(/[$,\s]/g, '')) || null;
    }
    if (rawTx.DebitAmount || rawTx.CreditAmount) {
      const debit = rawTx.DebitAmount ? parseFloat(rawTx.DebitAmount.toString().replace(/[$,\s]/g, '')) || 0 : 0;
      const credit = rawTx.CreditAmount ? parseFloat(rawTx.CreditAmount.toString().replace(/[$,\s]/g, '')) || 0 : 0;
      return credit - debit;
    }
    return null;
  }
}