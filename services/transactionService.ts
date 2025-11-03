import { v4 as uuidv4 } from 'uuid';
import { categorizeTransactionWithGemini } from './geminiService';
import { getRuleFiles } from './accountingRulesService';
import { RuleBasedCategorizer } from './ruleBasedCategorizer';
import * as dataService from './dataService';
import { 
    Transaction, AccountingCategory, RawTransactionData, Industry, Client, Book,
    UserColumnMapping, MappedTrainingTransaction,
    ValidatedParseResult, DataValidationReport, TargetFieldConfigItem, CategorizationResult, PredictionSourceType,
    RuleFileContent 
} from '../types';
import { 
    findMatchInTrainingData, 
    findMatchViaIndustryRules, 
    findMatchViaGlobalRules 
} from './historicalDataMatcher';

// Parses CSV text to get headers and a few sample rows for preview.
export const parseCSVPreview = (csvText: string, rowCount: number = 5): {headers: string[], sampleRows: string[][]} => {
    const lines = csvText.trim().split(/\r\n|\n|\r/); // More robust line splitting
    if (lines.length === 0) return { headers: [], sampleRows: [] };

    const headerLine = lines[0].trim();
    // Regex to split CSV by comma, handling quotes (basic version)
    const splitCsvLine = (line: string): string[] => {
        return (line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || []).map(val => val.replace(/^"|"$/g, '').trim());
    };
    
    const headers = splitCsvLine(headerLine);
    
    const sampleDataLines = lines.slice(1, Math.min(lines.length, rowCount + 1));
    const sampleRows = sampleDataLines.map(line => splitCsvLine(line));

    return { headers, sampleRows };
};

// Parses amount string, allowing for various currency symbols and formats.
const parseAmount = (amountStr: string | undefined): number | null => {
    if (amountStr === undefined || amountStr === null || amountStr.trim() === '') return null;
    let cleanAmountStr = amountStr.replace(/[$,€£¥₹\s]/g, '');
    if (cleanAmountStr.startsWith('(') && cleanAmountStr.endsWith(')')) {
        cleanAmountStr = '-' + cleanAmountStr.substring(1, cleanAmountStr.length - 1);
    }
    const num = parseFloat(cleanAmountStr);
    return isNaN(num) ? null : num;
};

// New function for parsing with dynamic mapping (primarily for Standard Processing)
export const parseTransactionsWithDynamicMapping = (
    csvText: string,
    mapping: Record<string, string>, // User's mapping: { 'RawTransactionDataKey': 'CSV_Header_Name' }
    targetFieldsConfig: TargetFieldConfigItem[] // Configuration for target fields
): ValidatedParseResult<RawTransactionData> => {
    const lines = csvText.trim().split(/\r\n|\n|\r/);
    const report: DataValidationReport = { skippedRowCount: 0, warningRowCount: 0, errors: [], summary: {} };
    const parsedData: RawTransactionData[] = [];

    if (lines.length < 2) {
        report.errors.push({ rowIndex: 0, message: "File has no data rows.", rowDataPreview: "" });
        report.skippedRowCount = Math.max(0, lines.length - 1);
        report.summary["No Data Rows"] = report.skippedRowCount;
        return { data: [], report };
    }

    const fileHeaders = (lines[0].trim().match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || []).map(h => h.replace(/['"]+/g, '').trim());
    const dataRows = lines.slice(1);

    const headerIndexMap: { [csvHeaderName: string]: number } = {};
    fileHeaders.forEach((h, i) => { headerIndexMap[h] = i; });

    for (const targetKey in mapping) {
        const csvHeaderName = mapping[targetKey];
        if (csvHeaderName && headerIndexMap[csvHeaderName] === undefined) {
            const message = `Mapped header "${csvHeaderName}" for target field "${targetKey}" not found in CSV file.`;
            report.errors.push({ rowIndex: 0, message, rowDataPreview: lines[0] });
            report.skippedRowCount = dataRows.length; 
            report.summary["Missing Mapped Header"] = dataRows.length;
            return { data: [], report };
        }
    }
    
    const amountFieldKey = targetFieldsConfig.find(f => f.key === 'Amount')?.key as keyof RawTransactionData;
    const debitFieldKey = targetFieldsConfig.find(f => f.key === 'DebitAmount')?.key as keyof RawTransactionData;
    const creditFieldKey = targetFieldsConfig.find(f => f.key === 'CreditAmount')?.key as keyof RawTransactionData;

    dataRows.forEach((line, index) => {
        const originalRowIndex = index + 1; 
        const values = (line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || []).map(v => v.replace(/['"]+/g, '').trim());
        const rawTx: RawTransactionData = {};
        let skipReason = "";

        targetFieldsConfig.forEach(fieldConfig => {
            const targetKey = fieldConfig.key as keyof RawTransactionData;
            const csvHeaderName = mapping[targetKey];
            if (csvHeaderName && headerIndexMap[csvHeaderName] !== undefined) {
                rawTx[targetKey] = values[headerIndexMap[csvHeaderName]];
            }
        });

        targetFieldsConfig.forEach(fieldConfig => {
            if (skipReason) return; 
            const targetKey = fieldConfig.key as keyof RawTransactionData;
            if (fieldConfig.mandatory && fieldConfig.group !== 'amountHandling' && !rawTx[targetKey]) {
                skipReason = `Missing mandatory field: ${fieldConfig.label}`;
            }
        });
        
        if (!skipReason) {
            let finalAmount: number | null = null;
            const amountStr = rawTx[amountFieldKey];
            const debitStr = rawTx[debitFieldKey];
            const creditStr = rawTx[creditFieldKey];
            const isAmountMandatory = targetFieldsConfig.some(f => f.group === 'amountHandling' && f.mandatory);

            if (mapping[amountFieldKey]) { 
                finalAmount = parseAmount(amountStr);
                if (finalAmount === null && isAmountMandatory && amountStr) skipReason = `Invalid number format for Amount: ${amountStr}`;
                else if (finalAmount === null && isAmountMandatory && !amountStr) skipReason = `Missing mandatory field: Amount`;
            } else if (mapping[debitFieldKey] || mapping[creditFieldKey]) { 
                const debitVal = parseAmount(debitStr);
                const creditVal = parseAmount(creditStr);
                if (debitStr && debitVal === null) skipReason = `Invalid number format for Debit Amount: ${debitStr}`;
                if (!skipReason && creditStr && creditVal === null) skipReason = `Invalid number format for Credit Amount: ${creditStr}`;
                
                if (!skipReason) {
                    if (debitVal !== null && creditVal !== null) finalAmount = (creditVal || 0) - (debitVal || 0);
                    else if (debitVal !== null) finalAmount = -(debitVal);
                    else if (creditVal !== null) finalAmount = creditVal;
                    else if (isAmountMandatory) skipReason = "Missing mandatory Debit/Credit Amount data";
                }
            } else if (isAmountMandatory) { 
                skipReason = `Amount (single or Debit/Credit) must be mapped and provided.`;
            }
             if (!skipReason && finalAmount === null && isAmountMandatory) {
                skipReason = "Amount calculation failed or resulted in no value.";
             }
        }

        if (skipReason) {
            report.skippedRowCount++;
            report.errors.push({ rowIndex: originalRowIndex, message: skipReason, rowDataPreview: line.substring(0, 100) });
            report.summary[skipReason] = (report.summary[skipReason] || 0) + 1;
        } else {
            parsedData.push(rawTx);
        }
    });

    return { data: parsedData, report };
};

export const parseTrainingDataWithMapping = (
    csvText: string,
    mapping: UserColumnMapping,
    clientId: string,
    bookId: string,
    targetFieldsConfig: TargetFieldConfigItem[]
): ValidatedParseResult<MappedTrainingTransaction> => {
    const lines = csvText.trim().split(/\r\n|\n|\r/);
    const report: DataValidationReport = { skippedRowCount: 0, warningRowCount: 0, errors: [], summary: {} };
    const mappedTransactions: MappedTrainingTransaction[] = [];

    if (lines.length < 2) {
         report.errors.push({rowIndex: 0, message: "Training data file has no data rows.", rowDataPreview: ""});
         report.skippedRowCount = Math.max(0, lines.length - 1);
         report.summary["No Data Rows"] = report.skippedRowCount;
         return { data: [], report };
    }

    const fileHeaders = (lines[0].trim().match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || []).map(h => h.replace(/['"]+/g, '').trim());
    const dataRows = lines.slice(1);
    const headerIndexMap: { [csvHeaderName: string]: number } = {};
    fileHeaders.forEach((h, i) => { headerIndexMap[h] = i; });
    
    targetFieldsConfig.forEach(fieldConfig => {
        const targetKey = fieldConfig.key as keyof UserColumnMapping;
        const csvHeaderName = mapping[targetKey];
        if (csvHeaderName && headerIndexMap[csvHeaderName] === undefined) {
             const message = `Mapped header "${csvHeaderName}" for target field "${fieldConfig.label}" not found in CSV.`;
             report.errors.push({ rowIndex: 0, message, rowDataPreview: lines[0] });
             report.skippedRowCount = dataRows.length;
             report.summary["Missing Mapped Header"] = dataRows.length;
        }
    });
    if (report.skippedRowCount > 0) return { data: [], report };

    dataRows.forEach((line, index) => {
        const originalRowIndex = index + 1;
        const values = (line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || []).map(v => v.replace(/['"]+/g, '').trim());
        let skipReason = "";

        const getVal = (userMappingKey: keyof UserColumnMapping): string | undefined => {
            const csvHeader = mapping[userMappingKey];
            return csvHeader && headerIndexMap[csvHeader] !== undefined ? values[headerIndexMap[csvHeader]] : undefined;
        };

        const dateVal = getVal('date');
        const descriptionVal = getVal('description');
        const categoryVal = getVal('chartOfAccount');
        const vendorNameVal = getVal('vendorCustomerName');
        const transactionTypeVal = getVal('transactionType');

        if (!dateVal) skipReason = "Missing mapped Date";
        else if (!descriptionVal) skipReason = "Missing mapped Description";
        else if (!categoryVal) skipReason = "Missing mapped Chart of Account (Category)";
        else if (!vendorNameVal) skipReason = "Missing mapped Vendor/Customer Name";
        else if (!transactionTypeVal) skipReason = "Missing mapped Type of Transaction";
        
        let amount: number | null = null;
        if (!skipReason) {
            const amountStr = getVal('amount');
            const debitStr = getVal('debitAmount');
            const creditStr = getVal('creditAmount');

            if (mapping.amount) { 
                amount = parseAmount(amountStr);
                if (amount === null && amountStr) skipReason = `Invalid number format for Amount: ${amountStr}`;
                else if (amount === null && !amountStr) skipReason = `Missing mapped Amount data`;
            } else if (mapping.debitAmount || mapping.creditAmount) { 
                const debit = parseAmount(debitStr);
                const credit = parseAmount(creditStr);
                if (debitStr && debit === null) skipReason = `Invalid number format for Debit Amount: ${debitStr}`;
                if (!skipReason && creditStr && credit === null) skipReason = `Invalid number format for Credit Amount: ${creditStr}`;
                
                if (!skipReason) {
                    if (debit !== null && credit !== null) amount = (credit || 0) - (debit || 0);
                    else if (debit !== null) amount = -(debit);
                    else if (credit !== null) amount = credit;
                    else skipReason = "Missing mapped Debit/Credit Amount data";
                }
            } else { 
                skipReason = "Amount (single or Debit/Credit) is not mapped.";
            }
        }
        if (!skipReason && amount === null) skipReason = "Amount calculation failed or resulted in no value.";

        if (skipReason) {
            report.skippedRowCount++;
            report.errors.push({ rowIndex: originalRowIndex, message: skipReason, rowDataPreview: line.substring(0, 100) });
            report.summary[skipReason] = (report.summary[skipReason] || 0) + 1;
            return;
        }

        const transaction: MappedTrainingTransaction = {
            id: uuidv4(),
            date: dateVal!,
            description: descriptionVal!,
            amount: amount!,
            category: categoryVal!,
            vendorCustomerName: vendorNameVal!,
            transactionType: transactionTypeVal!,
            clientId,
            bookId,
            currency: getVal('Currency' as keyof UserColumnMapping), // Cast as Currency might not be a direct key in UserColumnMapping
            referenceNumber: getVal('referenceNumber'),
            accountNumber: getVal('accountNumber'),
            chartOfAccountNumber: getVal('chartOfAccountNumber'),
        };
        mappedTransactions.push(transaction);
    });

    return { data: mappedTransactions, report };
};

const getHierarchicalCategorization = async (
    rawTx: RawTransactionData,
    client: Client,
    book: Book,
    industry: Industry | undefined,
    ruleFileContent: RuleFileContent,
    useAI: boolean = false,
    apiKey?: string
): Promise<CategorizationResult> => {
    
    const bookTrainingData = dataService.getTrainingTransactions(client.id, book.id);
    let result = findMatchInTrainingData(rawTx, bookTrainingData, ruleFileContent, PredictionSourceType.BOOK_HISTORY);
    if (result) return result;

    const clientBooks = dataService.getBooksByClientId(client.id);
    for (const otherBook of clientBooks) {
        if (otherBook.id === book.id) continue; 
        const otherBookTrainingData = dataService.getTrainingTransactions(client.id, otherBook.id);
        result = findMatchInTrainingData(rawTx, otherBookTrainingData, ruleFileContent, PredictionSourceType.CLIENT_HISTORY);
        if (result) return result;
    }
    
    result = findMatchViaIndustryRules(rawTx, industry, ruleFileContent);
    if (result) return result;

    result = findMatchViaGlobalRules(rawTx, ruleFileContent);
    if (result) return result;

    // Try rule-based categorization as fallback before AI
    try {
      result = RuleBasedCategorizer.categorizeTransaction(rawTx, industry);
      if (result && result.confidence > 0.3) { // Only use if confidence is reasonable
        return result;
      }
    } catch (error) {
      console.warn('Rule-based categorization failed:', error);
    }

    const descriptionForAI = rawTx.Description || "";
    if (!descriptionForAI) { 
        return { 
            specificCategory: "Unknown", 
            broadCategory: AccountingCategory.UNKNOWN, 
            confidence: 0, 
            predictionSource: PredictionSourceType.UNKNOWN_SOURCE 
        };
    }

    // Try AI categorization only if user has opted in and has API key
    if (useAI && apiKey) {
      try {
        return await categorizeTransactionWithGemini(descriptionForAI, industry?.name);
      } catch (error) {
        console.warn('AI categorization failed, using rule-based fallback:', error);
        // Fall back to rule-based categorization
        try {
          result = RuleBasedCategorizer.categorizeTransaction(rawTx, industry);
          if (result && result.confidence > 0.3) {
            return result;
          }
        } catch (fallbackError) {
          console.warn('Rule-based fallback also failed:', fallbackError);
        }
      }
    }

    // Return rule-based result or unknown
    return result || {
      specificCategory: "Uncategorized",
      broadCategory: AccountingCategory.UNKNOWN,
      confidence: 0.1,
      predictionSource: PredictionSourceType.UNKNOWN_SOURCE,
      transactionType: "Expense"
    };
};


export const categorizeBatchTransactions = async (
    rawTransactions: RawTransactionData[],
    client: Client, 
    book: Book,     
    industry?: Industry,
    useAI: boolean = false,
    apiKey?: string,
    onProgress?: (progress: number, processedRows: number, totalRows: number) => void
): Promise<Transaction[]> => { 
    const categorizedTransactions: Transaction[] = [];
    const totalRowsToProcess = rawTransactions.length;
    if (totalRowsToProcess === 0) return [];

    const ruleFileContent = getRuleFiles(); 
    let processedRows = 0;

    for (const rawTx of rawTransactions) {
        const descriptionForProcessing = rawTx.Description || "";
        
        let amount: number;
        if (rawTx.Amount) {
            const parsed = parseAmount(rawTx.Amount);
            if (parsed === null) {
                console.warn(`Skipping transaction due to unparsable amount in Amount field: ${rawTx.Amount}`, rawTx);
                processedRows++; 
                if (onProgress) onProgress(Math.round((processedRows / totalRowsToProcess) * 100), processedRows, totalRowsToProcess);
                continue; 
            }
            amount = parsed;
        } else if (rawTx.DebitAmount || rawTx.CreditAmount) {
            const debit = parseAmount(rawTx.DebitAmount);
            const credit = parseAmount(rawTx.CreditAmount);
            if (debit === null && rawTx.DebitAmount) { console.warn(`Unparsable DebitAmount: ${rawTx.DebitAmount}`); processedRows++; if (onProgress) onProgress(Math.round((processedRows / totalRowsToProcess) * 100), processedRows, totalRowsToProcess); continue; }
            if (credit === null && rawTx.CreditAmount) { console.warn(`Unparsable CreditAmount: ${rawTx.CreditAmount}`); processedRows++; if (onProgress) onProgress(Math.round((processedRows / totalRowsToProcess) * 100), processedRows, totalRowsToProcess); continue; }
            amount = (credit || 0) - (debit || 0);
        } else {
             console.warn(`Skipping transaction due to missing amount fields`, rawTx);
             processedRows++;
             if (onProgress) onProgress(Math.round((processedRows / totalRowsToProcess) * 100), processedRows, totalRowsToProcess);
             continue;
        }

        if (!rawTx.Date || !descriptionForProcessing) {
            console.warn("Skipping transaction due to missing Date or Description after dynamic parsing.", rawTx);
            processedRows++;
            if (onProgress) onProgress(Math.round((processedRows / totalRowsToProcess) * 100), processedRows, totalRowsToProcess);
            continue;
        }
        
        const aiResult: CategorizationResult = await getHierarchicalCategorization(rawTx, client, book, industry, ruleFileContent, useAI, apiKey);
        
        categorizedTransactions.push({
            id: uuidv4(),
            date: rawTx.Date,
            description: descriptionForProcessing,
            amount: amount,
            currency: rawTx.Currency || 'USD', 
            specificCategory: aiResult.specificCategory,
            broadCategory: aiResult.broadCategory,
            confidenceScore: aiResult.confidence,
            aiTransactionType: aiResult.transactionType,
            aiVendorCustomerName: aiResult.vendorCustomerName, 
            suggestedSpecificCategory: aiResult.suggestedSpecificCategory,
            suggestedBroadCategory: aiResult.suggestedBroadCategory,
            predictionSource: aiResult.predictionSource,
        });
        processedRows++;
        if (onProgress) {
            onProgress(Math.round((processedRows / totalRowsToProcess) * 100), processedRows, totalRowsToProcess);
        }
    }
    return categorizedTransactions;
};
