import { v4 as uuidv4 } from 'uuid';
import { Client, Book, Industry, UserColumnMapping, MappedTrainingTransaction, ExportedTrainingDataContainer, ColumnMappingTemplate, ClientConfigTemplate } from '../types';
import { INITIAL_CLIENTS, INITIAL_BOOKS, INITIAL_INDUSTRIES, STORAGE_KEYS } from '../constants';
import * as accountingRulesService from './accountingRulesService'; // Import the service

// Helper to get item from localStorage
const getItem = <T>(key: string): T | null => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (error) {
        console.error(`Error getting item ${key} from localStorage:`, error);
        return null;
    }
};

// Helper to set item in localStorage
const setItem = <T>(key: string, value: T): void => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error setting item ${key} in localStorage:`, error);
    }
};

// Initialize localStorage with initial data if empty
const initializeData = () => {
    if (!getItem(STORAGE_KEYS.CLIENTS)) {
        setItem(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
    }
    if (!getItem(STORAGE_KEYS.BOOKS)) {
        setItem(STORAGE_KEYS.BOOKS, INITIAL_BOOKS);
    }
    if (!getItem(STORAGE_KEYS.INDUSTRIES)) {
        setItem(STORAGE_KEYS.INDUSTRIES, INITIAL_INDUSTRIES);
    }
};

initializeData(); // Run on module load

// --- Client Functions ---
export const getClients = (): Client[] => getItem<Client[]>(STORAGE_KEYS.CLIENTS) || [];
export const addClient = (clientData: { name: string }): Client => {
    const clients = getClients();
    if (clients.some(c => c.name.toLowerCase() === clientData.name.toLowerCase())) {
        throw new Error(`Client with name "${clientData.name}" already exists.`);
    }
    const newClient: Client = { ...clientData, id: uuidv4() };
    setItem(STORAGE_KEYS.CLIENTS, [...clients, newClient]);
    return newClient;
};

// --- Book Functions ---
export const getBooks = (): Book[] => getItem<Book[]>(STORAGE_KEYS.BOOKS) || [];
export const getBooksByClientId = (clientId: string): Book[] => {
    return getBooks().filter(book => book.clientId === clientId);
};
export const addBook = (bookData: { name: string; clientId: string }): Book => {
    const books = getBooks();
     if (books.some(b => b.clientId === bookData.clientId && b.name.toLowerCase() === bookData.name.toLowerCase())) {
        throw new Error(`Book with name "${bookData.name}" already exists for this client.`);
    }
    const newBook: Book = { ...bookData, id: uuidv4() };
    setItem(STORAGE_KEYS.BOOKS, [...books, newBook]);
    return newBook;
};

// --- Industry Functions ---
export const getIndustries = (): Industry[] => getItem<Industry[]>(STORAGE_KEYS.INDUSTRIES) || [];
export const addIndustry = (industryData: { name: string }): Industry => {
    const industries = getIndustries();
    if (industries.some(i => i.name.toLowerCase() === industryData.name.toLowerCase())) {
        throw new Error(`Industry with name "${industryData.name}" already exists.`);
    }
    const newIndustry: Industry = { ...industryData, id: uuidv4() };
    setItem(STORAGE_KEYS.INDUSTRIES, [...industries, newIndustry]);
    return newIndustry;
};

// --- Column Mapping Functions ---
const getColumnMappingKey = (clientId: string, bookId: string) => `${STORAGE_KEYS.COLUMN_MAPPINGS_PREFIX}${clientId}_${bookId}`;
export const getColumnMapping = (clientId: string, bookId: string): UserColumnMapping | null => {
    return getItem<UserColumnMapping>(getColumnMappingKey(clientId, bookId));
};
export const saveColumnMapping = (clientId: string, bookId: string, mapping: UserColumnMapping): void => {
    setItem(getColumnMappingKey(clientId, bookId), mapping);
};

// --- Training Data Functions ---
const getTrainingDataKey = (clientId: string, bookId: string) => `${STORAGE_KEYS.TRAINING_DATA_PREFIX}${clientId}_${bookId}`;
export const getTrainingTransactions = (clientId: string, bookId: string): MappedTrainingTransaction[] => {
    return getItem<MappedTrainingTransaction[]>(getTrainingDataKey(clientId, bookId)) || [];
};
export const addTrainingTransactions = (clientId: string, bookId: string, transactions: MappedTrainingTransaction[]): void => {
    const existingTransactions = getTrainingTransactions(clientId, bookId);
    // Filter out duplicates based on id, if they exist
    const newTransactions = transactions.filter(nt => !existingTransactions.some(et => et.id === nt.id));
    setItem(getTrainingDataKey(clientId, bookId), [...existingTransactions, ...newTransactions]);
};


// --- Privacy Policy Functions ---
export const getPrivacyPolicyAccepted = (): boolean => {
    return getItem<boolean>(STORAGE_KEYS.PRIVACY_POLICY_ACCEPTED) || false;
};

export const savePrivacyPolicyAccepted = (): void => {
    setItem(STORAGE_KEYS.PRIVACY_POLICY_ACCEPTED, true);
};

// --- Utility for Development/Testing ---
export const clearAllData = (): void => {
    localStorage.removeItem(STORAGE_KEYS.CLIENTS);
    localStorage.removeItem(STORAGE_KEYS.BOOKS);
    localStorage.removeItem(STORAGE_KEYS.INDUSTRIES);
    localStorage.removeItem(STORAGE_KEYS.PRIVACY_POLICY_ACCEPTED);
    
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('bytsea_')) {
            localStorage.removeItem(key);
        }
    });
    console.log("All Bytsea Ledger data cleared from localStorage.");
    initializeData(); // Re-initialize with sample data
};

// --- Export/Import Training Data ---
export const exportAllTrainingData = (): ExportedTrainingDataContainer => {
    const clients = getClients();
    const books = getBooks();
    const industries = getIndustries();
    let allTrainingTransactions: MappedTrainingTransaction[] = [];

    clients.forEach(client => {
        const clientBooks = books.filter(b => b.clientId === client.id);
        clientBooks.forEach(book => {
            const transactions = getTrainingTransactions(client.id, book.id);
            allTrainingTransactions = allTrainingTransactions.concat(transactions);
        });
    });

    const currentRules = accountingRulesService.getRuleFiles(); // Get current rules (custom or default)

    return {
        clients,
        books,
        industries,
        trainingTransactions: allTrainingTransactions,
        customRules: currentRules // Include the active rule set
    };
};

export const importAllTrainingData = (data: ExportedTrainingDataContainer): { summary: string[], errors: string[] } => {
    const summary: string[] = [];
    const errors: string[] = [];
    let importedClientsCount = 0;
    let importedBooksCount = 0;
    let importedIndustriesCount = 0;
    let importedTransactionsCount = 0;

    // Import Custom Rules first
    if (data.customRules) {
        try {
            if (data.customRules.accountingRules) {
                 accountingRulesService.saveCustomRuleFile('accountingRules', data.customRules.accountingRules);
            }
            if (data.customRules.coaValidationRules) {
                accountingRulesService.saveCustomRuleFile('coaValidation', data.customRules.coaValidationRules);
            }
            if (data.customRules.coaAlternateNames) {
                 accountingRulesService.saveCustomRuleFile('coaAlternateNames', data.customRules.coaAlternateNames);
            }
            summary.push("Custom accounting rules imported/updated.");
        } catch (e) {
            errors.push(`Error importing custom rules: ${(e as Error).message}`);
        }
    }


    const existingClients = getClients();
    const existingBooks = getBooks();
    const existingIndustries = getIndustries();

    const importedClientIdToFinalId = new Map<string, string>();
    const importedBookIdToFinalId = new Map<string, string>();

    // Import Clients
    data.clients.forEach(importedClient => {
        let finalClientId = importedClient.id;
        const existingClientByName = existingClients.find(c => c.name.toLowerCase() === importedClient.name.toLowerCase());
        if (existingClientByName) {
            finalClientId = existingClientByName.id;
        } else {
            try {
                 const currentClientsBeforeAdd = getClients();
                 if (!currentClientsBeforeAdd.some(c => c.id === importedClient.id)) {
                    setItem(STORAGE_KEYS.CLIENTS, [...currentClientsBeforeAdd, importedClient]);
                    finalClientId = importedClient.id;
                    importedClientsCount++;
                 } else { 
                      const newClient = addClient({ name: importedClient.name }); 
                      finalClientId = newClient.id;
                      importedClientsCount++;
                 }
            } catch (e) {
                const reExistingClient = getClients().find(c => c.name.toLowerCase() === importedClient.name.toLowerCase());
                if(reExistingClient) finalClientId = reExistingClient.id;
                else errors.push(`Failed to add or map client ${importedClient.name}: ${(e as Error).message}`);
            }
        }
        importedClientIdToFinalId.set(importedClient.id, finalClientId);
    });
    if (importedClientsCount > 0) summary.push(`Imported ${importedClientsCount} new clients.`);


    // Import Industries
    data.industries.forEach(importedIndustry => {
        const existingIndustryByName = existingIndustries.find(i => i.name.toLowerCase() === importedIndustry.name.toLowerCase());
        if (!existingIndustryByName) {
            try {
                const currentIndustries = getIndustries();
                if(!currentIndustries.some(i => i.id === importedIndustry.id)) {
                    setItem(STORAGE_KEYS.INDUSTRIES, [...currentIndustries, importedIndustry]);
                    importedIndustriesCount++;
                } else {
                    addIndustry({ name: importedIndustry.name }); 
                    importedIndustriesCount++;
                }
            } catch {
                 // errors.push(`Failed to add industry ${importedIndustry.name}: ${(e as Error).message}`);
            }
        }
    });
    if (importedIndustriesCount > 0) summary.push(`Imported ${importedIndustriesCount} new industries.`);

    // Import Books
    data.books.forEach(importedBook => {
        const finalOwnerClientId = importedClientIdToFinalId.get(importedBook.clientId);
        if (!finalOwnerClientId) {
            errors.push(`Book "${importedBook.name}" skipped: Original client ID ${importedBook.clientId} not found or mapped.`);
            return;
        }

        let finalBookId = importedBook.id;
        const existingBookByNameAndClient = existingBooks.find(b => b.clientId === finalOwnerClientId && b.name.toLowerCase() === importedBook.name.toLowerCase());

        if (existingBookByNameAndClient) {
            finalBookId = existingBookByNameAndClient.id;
        } else {
            try {
                const currentBooksBeforeAdd = getBooks();
                if (!currentBooksBeforeAdd.some(b => b.id === importedBook.id)) {
                    setItem(STORAGE_KEYS.BOOKS, [...currentBooksBeforeAdd, { ...importedBook, clientId: finalOwnerClientId }]);
                    finalBookId = importedBook.id;
                    importedBooksCount++;
                } else {
                    const newBook = addBook({ name: importedBook.name, clientId: finalOwnerClientId });
                    finalBookId = newBook.id;
                    importedBooksCount++;
                }
            } catch (e) {
                const reExistingBook = getBooks().find(b => b.clientId === finalOwnerClientId && b.name.toLowerCase() === importedBook.name.toLowerCase());
                if(reExistingBook) finalBookId = reExistingBook.id;
                else errors.push(`Failed to add or map book ${importedBook.name}: ${(e as Error).message}`);
            }
        }
        importedBookIdToFinalId.set(importedBook.id, finalBookId);
    });
    if (importedBooksCount > 0) summary.push(`Imported ${importedBooksCount} new books.`);


    // Import Training Transactions
    const transactionsToImportByFinalBook = new Map<string, MappedTrainingTransaction[]>();

    data.trainingTransactions.forEach(tx => {
        const finalClientId = importedClientIdToFinalId.get(tx.clientId);
        const finalBookId = importedBookIdToFinalId.get(tx.bookId);

        if (finalClientId && finalBookId) {
            const updatedTx = { ...tx, clientId: finalClientId, bookId: finalBookId };
            const key = getTrainingDataKey(finalClientId, finalBookId); // Use final IDs for the key
            if (!transactionsToImportByFinalBook.has(key)) {
                transactionsToImportByFinalBook.set(key, []);
            }
            transactionsToImportByFinalBook.get(key)!.push(updatedTx);
        } else {
            errors.push(`Transaction ${tx.id} (Desc: ${tx.description.substring(0,20)}...) skipped: Client/Book ID mapping failed.`);
        }
    });

    transactionsToImportByFinalBook.forEach((txs, key) => {
        const parts = key.replace(STORAGE_KEYS.TRAINING_DATA_PREFIX, '').split('_');
        if (parts.length === 2) { // Ensure key format is correct (finalClientId_finalBookId)
            addTrainingTransactions(parts[0], parts[1], txs);
            importedTransactionsCount += txs.length;
        }
    });
    if (importedTransactionsCount > 0) summary.push(`Imported ${importedTransactionsCount} training transactions.`);
    
    if (summary.length === 0 && errors.length === 0) {
        summary.push("No new data to import or data already exists.");
    }

    return { summary, errors };
};

// --- Template Management Functions ---

// Column Mapping Templates
export const getColumnMappingTemplates = (): ColumnMappingTemplate[] => {
    return getItem<ColumnMappingTemplate[]>(STORAGE_KEYS.COLUMN_MAPPING_TEMPLATES) || [];
};

export const saveColumnMappingTemplate = (template: Omit<ColumnMappingTemplate, 'id' | 'createdAt' | 'usageCount'>): ColumnMappingTemplate => {
    const templates = getColumnMappingTemplates();
    const newTemplate: ColumnMappingTemplate = {
        ...template,
        id: uuidv4(),
        createdAt: new Date(),
        usageCount: 0
    };
    setItem(STORAGE_KEYS.COLUMN_MAPPING_TEMPLATES, [...templates, newTemplate]);
    return newTemplate;
};

export const updateColumnMappingTemplateUsage = (templateId: string): void => {
    const templates = getColumnMappingTemplates();
    const updatedTemplates = templates.map(template =>
        template.id === templateId
            ? { ...template, lastUsed: new Date(), usageCount: template.usageCount + 1 }
            : template
    );
    setItem(STORAGE_KEYS.COLUMN_MAPPING_TEMPLATES, updatedTemplates);
};

export const deleteColumnMappingTemplate = (templateId: string): void => {
    const templates = getColumnMappingTemplates();
    const filteredTemplates = templates.filter(template => template.id !== templateId);
    setItem(STORAGE_KEYS.COLUMN_MAPPING_TEMPLATES, filteredTemplates);
};

// Client Configuration Templates
export const getClientConfigTemplates = (): ClientConfigTemplate[] => {
    return getItem<ClientConfigTemplate[]>(STORAGE_KEYS.CLIENT_CONFIG_TEMPLATES) || [];
};

export const saveClientConfigTemplate = (template: Omit<ClientConfigTemplate, 'id' | 'createdAt' | 'usageCount'>): ClientConfigTemplate => {
    const templates = getClientConfigTemplates();
    const newTemplate: ClientConfigTemplate = {
        ...template,
        id: uuidv4(),
        createdAt: new Date(),
        usageCount: 0
    };
    setItem(STORAGE_KEYS.CLIENT_CONFIG_TEMPLATES, [...templates, newTemplate]);
    return newTemplate;
};

export const updateClientConfigTemplateUsage = (templateId: string): void => {
    const templates = getClientConfigTemplates();
    const updatedTemplates = templates.map(template =>
        template.id === templateId
            ? { ...template, lastUsed: new Date(), usageCount: template.usageCount + 1 }
            : template
    );
    setItem(STORAGE_KEYS.CLIENT_CONFIG_TEMPLATES, updatedTemplates);
};

export const deleteClientConfigTemplate = (templateId: string): void => {
    const templates = getClientConfigTemplates();
    const filteredTemplates = templates.filter(template => template.id !== templateId);
    setItem(STORAGE_KEYS.CLIENT_CONFIG_TEMPLATES, filteredTemplates);
};
