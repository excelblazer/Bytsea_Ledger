import { Client, Book, Industry, AccountingCategory, TargetFieldConfigItem } from './types';

export const APP_TITLE = "Bytsea Ledger";

// These will be used by dataService to initialize localStorage if empty
export const INITIAL_CLIENTS: Client[] = [
    { id: 'client1', name: 'Innovatech Solutions (Sample)' },
    { id: 'client2', name: 'GreenLeaf Organics (Sample)' },
    { id: 'client3', name: 'Apex Construction (Sample)' },
];

export const INITIAL_BOOKS: Book[] = [
    { id: 'book1a', name: 'Innovatech - 2023 Ops (Sample)', clientId: 'client1' },
    { id: 'book1b', name: 'Innovatech - R&D (Sample)', clientId: 'client1' },
    { id: 'book2a', name: 'GreenLeaf - Farm Exp (Sample)', clientId: 'client2' },
    { id: 'book3a', name: 'Apex - Proj Alpha (Sample)', clientId: 'client3' },
];

export const INITIAL_INDUSTRIES: Industry[] = [
    { id: 'ind1', name: 'Software Development (Sample)' },
    { id: 'ind2', name: 'Agriculture (Sample)' },
    { id: 'ind3', name: 'Construction (Sample)' },
    { id: 'ind4', name: 'Retail (Sample)' },
];

export const ALL_ACCOUNTING_CATEGORIES: AccountingCategory[] = Object.values(AccountingCategory);

// localStorage keys
export const STORAGE_KEYS = {
    CLIENTS: 'bytsea_clients',
    BOOKS: 'bytsea_books',
    INDUSTRIES: 'bytsea_industries',
    COLUMN_MAPPINGS_PREFIX: 'bytsea_column_mapping_', // Append client_book_id
    TRAINING_DATA_PREFIX: 'bytsea_training_data_', // Append client_book_id
    CUSTOM_ACCOUNTING_RULES: 'bytsea_custom_accounting_rules',
    CUSTOM_COA_VALIDATION_RULES: 'bytsea_custom_coa_validation_rules',
    CUSTOM_COA_ALTERNATE_NAMES: 'bytsea_custom_coa_alternate_names',
    PRIVACY_POLICY_ACCEPTED: 'bytsea_privacy_policy_accepted',
    COLUMN_MAPPING_TEMPLATES: 'bytsea_column_mapping_templates',
    CLIENT_CONFIG_TEMPLATES: 'bytsea_client_config_templates',
};

// For column mapping UI (Training Data) - Updated as per user request
export const TARGET_TRAINING_FIELDS: TargetFieldConfigItem[] = [
    { key: 'date', label: 'Transaction Date', mandatory: true, info: "e.g., YYYY-MM-DD or MM/DD/YYYY" },
    { key: 'description', label: 'Memo/Description', mandatory: true, info: "Details of the transaction." },
    { key: 'chartOfAccount', label: 'Chart of Account (Target Category)', mandatory: true, info: "The accounting category name for training." },
    { key: 'vendorCustomerName', label: 'Vendor/Customer Name', mandatory: true, info: "Name of the vendor or customer." },
    { key: 'transactionType', label: 'Type of Transaction', mandatory: true, info: "e.g., ACH, Wire, Check, Sale, Purchase." },
    { key: 'amount', label: 'Amount (Single Column)', mandatory: false, group: 'amountHandling', info: "Net amount. For expenses/debits, use negative numbers or ensure your Debit/Credit columns are used." },
    { key: 'debitAmount', label: 'Debit Amount (Optional)', mandatory: false, group: 'amountHandling', info: "Use if your file has separate columns for debits." },
    { key: 'creditAmount', label: 'Credit Amount (Optional)', mandatory: false, group: 'amountHandling', info: "Use if your file has separate columns for credits." },
    { key: 'referenceNumber', label: 'Reference Number (Optional)', mandatory: false, info: "Check number, invoice ID, etc." },
    { key: 'accountNumber', label: 'Account Number (Optional)', mandatory: false, info: "Bank or internal account number related to the transaction." },
    { key: 'chartOfAccountNumber', label: 'Chart of Account Number (Optional)', mandatory: false, info: "Account number corresponding to the Chart of Account." },
    { key: 'Currency', label: 'Currency Code (e.g., USD)', mandatory: false, info: "ISO currency code. Defaults to USD if not provided." },
];

// For column mapping UI (Standard Processing Data) - Updated as per user request
export const TARGET_STANDARD_PROCESSING_FIELDS: TargetFieldConfigItem[] = [
    { key: 'Date', label: 'Transaction Date', mandatory: true, info: "e.g., YYYY-MM-DD or MM/DD/YYYY" },
    { key: 'Description', label: 'Memo/Description', mandatory: true, info: "Details of the transaction." },
    // Amount group is mandatory overall, one must be chosen.
    { key: 'Amount', label: 'Amount (Single Column)', mandatory: true, group: 'amountHandling', info: "Net amount. For expenses/debits, use negative numbers if not using separate Debit/Credit columns. For income/credits, use positive." },
    { key: 'DebitAmount', label: 'Debit Amount (Optional)', mandatory: false, group: 'amountHandling', info: "Use if your file has separate columns. Typically represents expenses or outflows." },
    { key: 'CreditAmount', label: 'Credit Amount (Optional)', mandatory: false, group: 'amountHandling', info: "Use if your file has separate columns. Typically represents income or inflows." },
    { key: 'Currency', label: 'Currency Code (e.g., USD)', mandatory: false, info: "ISO currency code. Defaults to USD if not provided." },
    { key: 'TransactionType', label: 'Transaction Type (Optional)', mandatory: false, info: "e.g., ACH, Wire, Check, Sale" },
    { key: 'ReferenceNumber', label: 'Reference Number (Optional)', mandatory: false, info: "Check number, invoice ID, etc." },
    { key: 'AccountNumber', label: 'Account Number (Optional)', mandatory: false, info: "Bank or internal account number related to the transaction." },
    { key: 'VendorCustomerName', label: 'Vendor/Customer Name (Optional)', mandatory: false, info: "Name of the vendor or customer involved." },
];
