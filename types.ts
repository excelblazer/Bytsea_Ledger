
export enum AccountingCategory {
    ASSETS = "Assets",
    LIABILITIES = "Liabilities",
    EQUITY = "Equity",
    INCOME = "Income",
    EXPENSES = "Expenses",
    UNKNOWN = "Unknown"
}

export enum PredictionSourceType {
    BOOK_HISTORY = "Book History",
    CLIENT_HISTORY = "Client History",
    INDUSTRY_RULE = "Industry Rule",
    GLOBAL_RULE = "Global Rule",
    AI_MODEL = "AI Model",
    UNKNOWN_SOURCE = "Unknown Source"
}

export interface Transaction {
    id: string;
    date: string;
    description: string; 
    amount: number;
    currency: string;
    specificCategory: string; // Detailed CoA name (e.g., "Service Fee Income")
    broadCategory: AccountingCategory; // Parent enum (e.g., AccountingCategory.INCOME)
    confidenceScore: number; 
    userOverrideCategory?: string; // User's final selected specific CoA name
    notes?: string;
    isFlagged?: boolean;
    aiTransactionType?: string; 
    aiVendorCustomerName?: string; 
    predictionSource?: PredictionSourceType; 
    suggestedSpecificCategory?: string; // AI's alternative specific CoA name
    suggestedBroadCategory?: AccountingCategory; // AI's alternative broad category
}

export interface Client {
    id: string;
    name: string;
}

export interface Book {
    id:string;
    name: string;
    clientId: string;
}

export interface Industry {
    id: string;
    name: string;
}

export enum JobStatus {
    IDLE = "Idle",
    QUEUED = "Queued",
    VALIDATING = "Validating",
    AWAITING_MAPPING = "Awaiting Mapping", 
    VALIDATION_WARNING = "Validation Warning", 
    PROCESSING = "Processing", 
    COMPLETED = "Completed",
    FAILED = "Failed",
    PENDING_REVIEW = "Pending Review" 
}

export interface DataValidationError {
    rowIndex: number; 
    message: string;
    rowDataPreview: string; 
}

export interface DataValidationReport {
    skippedRowCount: number;
    warningRowCount: number; 
    errors: DataValidationError[];
    summary: { [reason: string]: number }; 
}


export interface ProcessingJob {
    id: string;
    fileName: string;
    fileSize: number;
    totalRows: number; 
    validRows?: number; 
    processedRows: number; 
    client?: Client; 
    book?: Book;     
    industry?: Industry;
    isTrainingData: boolean;
    status: JobStatus;
    progress: number; 
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    transactions: Transaction[]; 
    rawFileContent?: string; 
    
    columnMapping?: UserColumnMapping; 
    standardProcessingMapping?: Record<keyof RawTransactionData, string>;
    parsedStandardRawData?: ValidatedParseResult<RawTransactionData>; 

    errorMessage?: string;
    validationReport?: DataValidationReport;
    
    csvHeadersForMapping?: string[];
    csvSampleDataForMapping?: string[][];
}

export interface CategorizationResult {
    specificCategory: string; // Detailed CoA name
    broadCategory: AccountingCategory; // Parent enum
    confidence: number;
    transactionType?: string;
    vendorCustomerName?: string;
    suggestedSpecificCategory?: string;
    suggestedBroadCategory?: AccountingCategory;
    predictionSource: PredictionSourceType;
}

export interface RawTransactionData {
    Date?: string;
    Description?: string;
    Amount?: string; 
    Currency?: string;
    TransactionType?: string; 
    ReferenceNumber?: string;
    VendorCustomerName?: string; 
    DebitAmount?: string; 
    CreditAmount?: string; 
    AccountNumber?: string; 
    ChartOfAccountNumber?: string; 
    [key: string]: string | undefined; 
}

export interface UserColumnMapping {
    date: string; 
    description: string; 
    amount?: string; 
    chartOfAccount: string; 
    vendorCustomerName: string; 
    transactionType: string; 
    referenceNumber?: string; 
    accountNumber?: string; 
    chartOfAccountNumber?: string; 
    debitAmount?: string; 
    creditAmount?: string; 
    Currency?: string;
}

export interface TargetFieldConfigItem {
    key: keyof RawTransactionData | keyof UserColumnMapping; 
    label: string; 
    mandatory: boolean;
    group?: string; 
    info?: string; 
}

export interface MappedTrainingTransaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    currency?: string; 
    category: string; 
    vendorCustomerName: string;
    transactionType: string;
    referenceNumber?: string;
    accountNumber?: string;
    chartOfAccountNumber?: string;
    clientId: string; // Original client ID from export
    bookId: string;   // Original book ID from export
}

export type EntityType = 'client' | 'book' | 'industry';

export interface CSVParseResult {
    headers: string[];
    sampleRows: string[][]; 
    fullData: RawTransactionData[]; 
}

export interface ValidatedParseResult<T> {
    data: T[];
    report: DataValidationReport;
}

// Represents the content of the three main rule files
export interface RuleFileContent {
  accountingRules: any; // Define more specific type if structure is fixed
  coaValidationRules: any; // Define more specific type
  coaAlternateNames: any; // Define more specific type
}

export type RuleFileType = 'accountingRules' | 'coaValidation' | 'coaAlternateNames';


export interface ExportedTrainingDataContainer {
  clients: Client[];
  books: Book[];
  industries: Industry[];
  trainingTransactions: MappedTrainingTransaction[];
  customRules?: RuleFileContent; // To store user-customized rules
}
