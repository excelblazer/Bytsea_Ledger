import React, { useState, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import FileUpload from './components/FileUpload';
import ContextSelector from './components/ContextSelector';
import TransactionTable from './components/TransactionTable';
import JobProgress from './components/JobProgress';
import LoadingSpinner from './components/LoadingSpinner';
import AddEntityModal from './components/AddEntityModal';
import ColumnMappingModal from './components/ColumnMappingModal';
import ApiKeySetup from './components/ApiKeySetup'; 
import SettingsModal from './components/SettingsModal';
import SettingsMenu from './components/SettingsMenu';
import {
    Client, Book, Industry, ProcessingJob, Transaction, JobStatus,
    EntityType, UserColumnMapping, RawTransactionData, ExportedTrainingDataContainer, RuleFileType
} from './types';
import {
    parseCSVPreview,
    parseTrainingDataWithMapping,
    parseTransactionsWithDynamicMapping,
    categorizeBatchTransactions
} from './services/transactionService';
import * as dataService from './services/dataService';
import * as geminiService from './services/geminiService'; 
import * as accountingRulesService from './services/accountingRulesService'; // Import accountingRulesService
import { APP_TITLE, TARGET_TRAINING_FIELDS, TARGET_STANDARD_PROCESSING_FIELDS } from './constants';
import { TrashIcon, CogIcon, UploadIcon, XCircleIcon, CheckCircleIcon, ArrowPathIcon as ResetIcon } from './components/icons'; 

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isApiKeyNeeded, setIsApiKeyNeeded] = useState<boolean>(true);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [apiKeyLoading, setApiKeyLoading] = useState<boolean>(false);

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);
  const [isTrainingData, setIsTrainingData] = useState<boolean>(false);

  const [currentJob, setCurrentJob] = useState<ProcessingJob | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const [isAddEntityModalOpen, setIsAddEntityModalOpen] = useState(false);
  const [entityTypeToAdd, setEntityTypeToAdd] = useState<EntityType | null>(null);

  const [isColumnMappingModalOpen, setIsColumnMappingModalOpen] = useState(false);
  const [fileUploadResetKey, setFileUploadResetKey] = useState<number>(0);

  const [importExportFeedback, setImportExportFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [ruleCustomizationFeedback, setRuleCustomizationFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const ruleFileInputRefs = {
    accountingRules: useRef<HTMLInputElement>(null),
    coaValidation: useRef<HTMLInputElement>(null),
    coaAlternateNames: useRef<HTMLInputElement>(null),
  };

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsView, setSettingsView] = useState<'export' | 'customize' | null>(null);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const settingsMenuRef = useRef<HTMLDivElement>(null);

  const isProcessingBlocked = currentJob?.status === JobStatus.PROCESSING ||
                              currentJob?.status === JobStatus.VALIDATING || apiKeyLoading;

  const canInitiateJobFlow = selectedClient && selectedBook;

  useEffect(() => {
    loadInitialData();
    const savedApiKey = localStorage.getItem('geminiApiKey');
    if (savedApiKey) {
      handleSaveApiKey(savedApiKey, true); 
    } else {
      setIsApiKeyNeeded(true);
      setApiKeyLoading(false);
    }
  }, []);

  const loadInitialData = () => {
    setClients(dataService.getClients());
    setBooks(dataService.getBooks());
    setIndustries(dataService.getIndustries());
    // Refresh rule status on load
    updateRuleStatuses();
  };

  const [ruleStatuses, setRuleStatuses] = useState({
    accountingRules: false,
    coaValidation: false,
    coaAlternateNames: false,
  });

  const updateRuleStatuses = () => {
    setRuleStatuses({
      accountingRules: !!accountingRulesService.getCustomRuleFile('accountingRules'),
      coaValidation: !!accountingRulesService.getCustomRuleFile('coaValidation'),
      coaAlternateNames: !!accountingRulesService.getCustomRuleFile('coaAlternateNames'),
    });
  };

  const handleSaveApiKey = async (newKey: string, isAutoInit: boolean = false) => {
    setApiKeyLoading(true);
    setApiKeyError(null);
    await new Promise(resolve => setTimeout(resolve, 500)); 
    const success = geminiService.initializeAiClient(newKey);
    if (success) {
      localStorage.setItem('geminiApiKey', newKey);
      setApiKey(newKey);
      setIsApiKeyNeeded(false);
    } else {
      setApiKeyError("Failed to initialize Gemini client. Please check your API key.");
      setIsApiKeyNeeded(true);
      localStorage.removeItem('geminiApiKey'); 
      setApiKey(null);
    }
    setApiKeyLoading(false);
  };

  const handleClearApiKey = () => {
    localStorage.removeItem('geminiApiKey');
    setApiKey(null);
    geminiService.initializeAiClient(''); 
    setIsApiKeyNeeded(true);
    setApiKeyError(null);
    if (currentJob && currentJob.status !== JobStatus.IDLE && currentJob.status !== JobStatus.COMPLETED && currentJob.status !== JobStatus.FAILED) {
        handleResetJob();
    }
  };


  useEffect(() => {
    if (!isApiKeyNeeded && currentJob &&
        (currentJob.client?.id !== selectedClient?.id || currentJob.book?.id !== selectedBook?.id || currentJob.isTrainingData !== isTrainingData)) {
      if (currentJob.status !== JobStatus.COMPLETED && currentJob.status !== JobStatus.FAILED) {
         setCurrentJob(prev => prev ? {
            ...prev,
            client: selectedClient || undefined,
            book: selectedBook || undefined,
            industry: selectedIndustry || undefined,
            isTrainingData: isTrainingData,
            status: prev.rawFileContent ? JobStatus.AWAITING_MAPPING : JobStatus.IDLE,
            transactions: [],
            columnMapping: undefined,
            standardProcessingMapping: undefined,
            parsedStandardRawData: undefined,
            validationReport: undefined,
            progress: 0,
            processedRows: 0,
         } : null);
         if (currentJob.rawFileContent) {
            setIsColumnMappingModalOpen(false);
         }
      }
    }
  }, [selectedClient, selectedBook, selectedIndustry, isTrainingData, currentJob, isApiKeyNeeded]);


  const handleFileUploaded = (file: File, contentWithStartRowApplied: string, fileType: 'csv' | 'excel') => {
    setUploadedFile(file);
    setGlobalError(null);
    setImportExportFeedback(null);
    setRuleCustomizationFeedback(null);

    const initialRowCount = contentWithStartRowApplied.split(/\r\n|\n|\r/).filter(Boolean).length;
    const dataRowCount = initialRowCount > 0 ? initialRowCount -1 : 0;

    if (dataRowCount <=0 && contentWithStartRowApplied.trim() !== "") {
        setGlobalError("The file seems to have no data rows after header adjustment. Please check the 'Actual Header Row Number'.");
        setFileUploadResetKey(prev => prev + 1);
        setUploadedFile(null);
        setCurrentJob(null);
        return;
     }
      if (dataRowCount <=0 && contentWithStartRowApplied.trim() === "") {
        setGlobalError("The file is effectively empty after header adjustment.");
        setFileUploadResetKey(prev => prev + 1);
        setUploadedFile(null);
        setCurrentJob(null);
        return;
     }

    const { headers, sampleRows } = parseCSVPreview(contentWithStartRowApplied);
    if (headers.length === 0 && contentWithStartRowApplied.trim() !== "") {
         setGlobalError("Uploaded file seems to have no headers or is empty after start row adjustment. Check 'Actual Header Row Number'.");
         setFileUploadResetKey(prev => prev + 1);
         setUploadedFile(null);
         setCurrentJob(null);
         return;
    }

    setCurrentJob({
        id: uuidv4(),
        fileName: file.name,
        fileSize: file.size,
        client: selectedClient || undefined,
        book: selectedBook || undefined,
        industry: selectedIndustry || undefined,
        isTrainingData: isTrainingData,
        status: JobStatus.AWAITING_MAPPING,
        progress: 0,
        processedRows: 0,
        totalRows: dataRowCount,
        createdAt: new Date(),
        transactions: [],
        rawFileContent: contentWithStartRowApplied,
        csvHeadersForMapping: headers,
        csvSampleDataForMapping: sampleRows,
    });
    setIsColumnMappingModalOpen(false);
  };

  const handleOpenMappingModal = () => {
    if (!currentJob || !currentJob.rawFileContent || !currentJob.csvHeadersForMapping || !currentJob.csvSampleDataForMapping) {
        setGlobalError("File data is not ready for mapping. Please re-upload.");
        return;
    }
    if (!selectedClient || !selectedBook) {
        setGlobalError("Please select a Client and Book before mapping columns.");
        return;
    }
    setCurrentJob(prev => prev ? ({
        ...prev,
        client: selectedClient,
        book: selectedBook,
        industry: selectedIndustry || undefined,
        isTrainingData: isTrainingData,
    }) : null );
    setIsColumnMappingModalOpen(true);
  }

  const handleSaveTrainingDataMapping = (mapping: Record<string, string>) => {
    setIsColumnMappingModalOpen(false);
    if (!currentJob || !currentJob.rawFileContent || !currentJob.client || !currentJob.book || !currentJob.isTrainingData) {
        setGlobalError("Job context or file content is missing for training data processing.");
        setCurrentJob(prev => prev ? {...prev, status: JobStatus.FAILED, errorMessage: "Context missing for training."} : null);
        return;
    }

    const userMapping = mapping as unknown as UserColumnMapping;

    setCurrentJob(prev => prev ? {...prev, columnMapping: userMapping, status: JobStatus.VALIDATING, progress: 10 } : null);

    try {
        const result = parseTrainingDataWithMapping(
            currentJob.rawFileContent,
            userMapping,
            currentJob.client.id,
            currentJob.book.id,
            TARGET_TRAINING_FIELDS
        );

        const originalTotalRows = currentJob.totalRows;

        if (result.report.skippedRowCount > 0 && result.data.length === 0) {
             setCurrentJob(prev => prev ? {
                ...prev,
                status: JobStatus.FAILED,
                errorMessage: `All ${originalTotalRows} rows failed validation during training data parsing. Please check mapping and file format.`,
                progress: 100,
                processedRows: 0,
                validRows: 0,
                completedAt: new Date(),
                validationReport: result.report,
                rawFileContent: undefined,
            } : null);
            return;
        }

        if(result.data.length > 0) {
            dataService.saveColumnMapping(currentJob.client.id, currentJob.book.id, userMapping);
            dataService.addTrainingTransactions(currentJob.client.id, currentJob.book.id, result.data);
        }

        setCurrentJob(prev => prev ? {
            ...prev,
            status: JobStatus.COMPLETED,
            progress: 100,
            processedRows: result.data.length,
            validRows: result.data.length,
            totalRows: originalTotalRows,
            completedAt: new Date(),
            validationReport: result.report,
            rawFileContent: undefined,
        } : null);

    } catch (error) {
        console.error("Training data processing error:", error);
        const errorMessage = error instanceof Error ? error.message : "Error processing mapped training data.";
        setGlobalError(errorMessage);
        setCurrentJob(prev => prev ? { ...prev, status: JobStatus.FAILED, errorMessage, completedAt: new Date() } : null);
    }
  };

  const handleSaveStandardProcessingMapping = (mapping: Record<string, string>) => {
    setIsColumnMappingModalOpen(false);
    if (!currentJob || !currentJob.rawFileContent || currentJob.isTrainingData) {
        setGlobalError("Job context or file content is missing/invalid for standard processing mapping.");
        setCurrentJob(prev => prev ? {...prev, status: JobStatus.FAILED, errorMessage: "Context error for standard mapping."} : null);
        return;
    }

    setCurrentJob(prev => prev ? {
        ...prev,
        standardProcessingMapping: mapping  as Record<keyof RawTransactionData, string>,
        status: JobStatus.VALIDATING,
        progress: 10
    } : null);

    try {
        const result = parseTransactionsWithDynamicMapping(
            currentJob.rawFileContent,
            mapping,
            TARGET_STANDARD_PROCESSING_FIELDS
        );

        const originalTotalRows = currentJob.totalRows;

        setCurrentJob(prev => prev ? {
            ...prev,
            parsedStandardRawData: result,
            validationReport: result.report,
            validRows: result.data.length,
            totalRows: originalTotalRows,
        } : null);

        if (result.report.skippedRowCount > 0 && result.data.length === 0) {
             setCurrentJob(prev => prev ? {
                ...prev,
                status: JobStatus.FAILED,
                errorMessage: `All ${originalTotalRows} data rows failed validation after mapping. Please check mapping and file format.`,
                progress: 100,
             } : null);
        } else if (result.report.skippedRowCount > 0 && result.data.length > 0) {
            setCurrentJob(prev => prev ? {...prev, status: JobStatus.VALIDATION_WARNING, progress: 50 } : null);
        } else if (result.data.length > 0) {
            initiateGeminiCategorization(result.data);
        } else {
             setCurrentJob(prev => prev ? {
                ...prev,
                status: JobStatus.FAILED,
                errorMessage: "No data found to process after applying column mapping.",
                progress: 100,
             } : null);
        }

    } catch (error) {
        console.error("Standard data parsing error post-mapping:", error);
        const errorMessage = error instanceof Error ? error.message : "Error parsing data with custom mapping.";
        setGlobalError(errorMessage);
        setCurrentJob(prev => prev ? { ...prev, status: JobStatus.FAILED, errorMessage, completedAt: new Date() } : null);
    }
  };

  const initiateGeminiCategorization = async (validRawData: RawTransactionData[]) => {
    if (!currentJob || !currentJob.client || !currentJob.book || currentJob.isTrainingData) {
        setGlobalError("Cannot start AI categorization: Job context is missing or invalid.");
        setCurrentJob(prev => prev ? {...prev, status: JobStatus.FAILED, errorMessage: "Context error for AI."} : null);
        return;
    }
    if (validRawData.length === 0) {
        setCurrentJob(prev => prev ? { ...prev, status: JobStatus.COMPLETED, processedRows: 0, validRows:0, progress: 100, completedAt: new Date(), errorMessage: "No valid transactions to categorize." } : null);
        return;
    }
    if (!geminiService.isAiClientReady()) {
        setGlobalError("Gemini API key is not set or client not initialized. Please set your API key.");
        setIsApiKeyNeeded(true); 
        setCurrentJob(prev => prev ? {...prev, status: JobStatus.FAILED, errorMessage: "API Key not ready."} : null);
        return;
    }

    setCurrentJob(prev => prev ? { ...prev, status: JobStatus.PROCESSING, progress: prev.progress || 60, validRows: validRawData.length } : null);

    try {
        const categorizedTxs = await categorizeBatchTransactions(
            validRawData,
            currentJob.client,
            currentJob.book,
            currentJob.industry,
            (progress, processedRows) => { 
                 setCurrentJob(prev => prev ? {
                    ...prev,
                    // Progress: 0-50% for validation, 50-100% for categorization
                    progress: 50 + (progress * 0.5),
                    processedRows,
                } : null);
            }
        );

        setCurrentJob(prev => prev ? {
            ...prev,
            transactions: categorizedTxs,
            status: JobStatus.COMPLETED,
            progress: 100,
            processedRows: categorizedTxs.length,
            completedAt: new Date(),
            rawFileContent: undefined,
            parsedStandardRawData: undefined,
        } : null);

    } catch (error) {
        console.error("Gemini categorization error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during AI categorization.";
        setGlobalError(errorMessage);
        setCurrentJob(prev => prev ? { ...prev, status: JobStatus.FAILED, errorMessage: errorMessage, completedAt: new Date() } : null);
    }
  };


  const handleConfirmProceedWithSkippedRows = async () => {
    if (!currentJob || currentJob.isTrainingData || !currentJob.parsedStandardRawData) {
        setGlobalError("Cannot proceed: Job context is invalid for this action.");
        setCurrentJob(prev => prev ? {...prev, status: JobStatus.FAILED, errorMessage: "Context error on proceed."} : null);
        return;
    }

    if (currentJob.parsedStandardRawData.data.length > 0) {
        initiateGeminiCategorization(currentJob.parsedStandardRawData.data);
    } else {
        setGlobalError("No valid transactions found to proceed with after validation. Please review the report and file.");
         setCurrentJob(prev => prev ? {
            ...prev,
            status: JobStatus.FAILED,
            errorMessage: "No valid transactions to finalize after validation warning.",
            completedAt: new Date(),
         }: null);
    }
  };

  const handleUpdateTransaction = (transactionId: string, updates: Partial<Transaction>) => {
    setCurrentJob(prevJob => {
      if (!prevJob) return null;
      return {
        ...prevJob,
        transactions: prevJob.transactions.map(tx =>
          tx.id === transactionId ? { ...tx, ...updates } : tx
        ),
      };
    });
  };

  const handleResetJob = () => {
    setUploadedFile(null);
    setCurrentJob(null);
    setGlobalError(null);
    setFileUploadResetKey(prev => prev + 1);
    setIsColumnMappingModalOpen(false);
    setImportExportFeedback(null);
    setRuleCustomizationFeedback(null);
  };

  const handleOpenAddEntityModal = (type: EntityType) => {
    setEntityTypeToAdd(type);
    setIsAddEntityModalOpen(true);
  };

  const handleSaveEntity = (name: string) => {
    if (!entityTypeToAdd) return;
    try {
        switch (entityTypeToAdd) {
            case 'client':
                const newClient = dataService.addClient({ name });
                setClients(prev => [...prev, newClient]);
                setSelectedClient(newClient);
                break;
            case 'book':
                if (selectedClient) {
                    const newBook = dataService.addBook({ name, clientId: selectedClient.id });
                    setBooks(prev => [...prev, newBook]);
                    setSelectedBook(newBook);
                } else {
                    setGlobalError("Please select a client before adding a book.");
                }
                break;
            case 'industry':
                const newIndustry = dataService.addIndustry({ name });
                setIndustries(prev => [...prev, newIndustry]);
                setSelectedIndustry(newIndustry);
                break;
        }
        setIsAddEntityModalOpen(false);
        setEntityTypeToAdd(null);
    } catch (error) {
        if (error instanceof Error) setGlobalError(error.message);
        else setGlobalError("Failed to save entity.");
    }
  };

  const getActionButtonText = () => {
    if (!selectedClient || !selectedBook) return "Select Client & Book";
    if (!uploadedFile) return "Upload File";
    if (currentJob?.status === JobStatus.AWAITING_MAPPING) return "Proceed to Map Columns";
    if (currentJob?.status === JobStatus.VALIDATING) return "Validating...";
    if (currentJob?.status === JobStatus.PROCESSING) return "Processing...";
    if (currentJob?.status === JobStatus.VALIDATION_WARNING) return "Review Validation Issues";
    return isTrainingData ? "Start New Training Data Job" : "Start New Processing Job";
  };

  const handleExportTrainingData = () => {
    setImportExportFeedback(null);
    setRuleCustomizationFeedback(null);
    try {
        const exportedData = dataService.exportAllTrainingData();
        const jsonString = JSON.stringify(exportedData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const href = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = href;
        link.download = `bytsea_ledger_training_data_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(href);
        setImportExportFeedback({ type: 'success', message: 'Training data (including custom rules if any) exported successfully.' });
    } catch (error) {
        console.error("Error exporting training data:", error);
        setImportExportFeedback({ type: 'error', message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  };

  const handleImportTrainingData = (event: React.ChangeEvent<HTMLInputElement>) => {
    setImportExportFeedback(null);
    setRuleCustomizationFeedback(null);
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target?.result as string;
            const importedData = JSON.parse(text) as ExportedTrainingDataContainer;
            
            if (!importedData || !importedData.clients || !importedData.books || !importedData.industries || !importedData.trainingTransactions) {
                throw new Error("Invalid file format. Does not match expected training data structure.");
            }

            const result = dataService.importAllTrainingData(importedData);
            
            let feedbackMessage = result.summary.join(' ');
            if (result.errors.length > 0) {
                feedbackMessage += ` Errors: ${result.errors.join(', ')}`;
                 setImportExportFeedback({ type: 'error', message: `Import completed with issues: ${feedbackMessage}` });
            } else {
                 setImportExportFeedback({ type: 'success', message: `Import successful: ${feedbackMessage}` });
            }
            loadInitialData(); 
            if (currentJob) handleResetJob(); 

        } catch (error) {
            console.error("Error importing training data:", error);
            setImportExportFeedback({ type: 'error', message: `Import failed: ${error instanceof Error ? error.message : 'Could not parse JSON file.'}` });
        } finally {
            if (importFileInputRef.current) {
                importFileInputRef.current.value = ''; 
            }
        }
    };
    reader.onerror = () => {
        setImportExportFeedback({ type: 'error', message: 'Failed to read the import file.' });
        if (importFileInputRef.current) {
            importFileInputRef.current.value = '';
        }
    };
    reader.readAsText(file);
  };

  const handleCustomRuleUpload = (ruleType: RuleFileType, event: React.ChangeEvent<HTMLInputElement>) => {
    setRuleCustomizationFeedback(null);
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target?.result as string;
            const parsedJson = JSON.parse(text);
            accountingRulesService.saveCustomRuleFile(ruleType, parsedJson);
            setRuleCustomizationFeedback({ type: 'success', message: `${ruleType} rules updated successfully.` });
            updateRuleStatuses();
        } catch (error) {
            setRuleCustomizationFeedback({ type: 'error', message: `Failed to upload ${ruleType} rules: ${error instanceof Error ? error.message : 'Invalid JSON format.'}` });
        } finally {
           const ref = ruleFileInputRefs[ruleType === 'coaValidation' ? 'coaValidation' : ruleType === 'coaAlternateNames' ? 'coaAlternateNames' : 'accountingRules'];
           if(ref.current) ref.current.value = '';
        }
    };
    reader.onerror = () => {
        setRuleCustomizationFeedback({ type: 'error', message: `Failed to read ${ruleType} file.` });
    };
    reader.readAsText(file);
  };

  const handleResetSingleRule = (ruleType: RuleFileType) => {
    accountingRulesService.resetCustomRule(ruleType);
    setRuleCustomizationFeedback({ type: 'success', message: `${ruleType} rules reset to default.` });
    updateRuleStatuses();
  };
  
  const handleResetAllRules = () => {
    accountingRulesService.resetAllCustomRules();
    setRuleCustomizationFeedback({ type: 'success', message: 'All accounting rules reset to application defaults.' });
    updateRuleStatuses();
  };

  const ruleConfigDisplay: {key: RuleFileType, label: string}[] = [
    { key: 'accountingRules', label: 'General Accounting Rules' },
    { key: 'coaValidation', label: 'CoA Validation Rules' },
    { key: 'coaAlternateNames', label: 'CoA Alternate Names' },
  ];


  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-surface shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <h1 className="text-3xl font-bold">
                <span className="bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text">
                    {APP_TITLE}
                </span>
            </h1>
            <div className="flex items-center space-x-3 relative">
              <button
                onClick={() => setIsSettingsMenuOpen((v) => !v)}
                title="Settings"
                className="p-2 text-textSecondary hover:text-primary rounded-full transition-colors"
              >
                <CogIcon className="w-6 h-6" />
              </button>
              {isSettingsMenuOpen && (
                <div ref={settingsMenuRef}>
                  <SettingsMenu
                    onSelect={(option) => {
                      setIsSettingsMenuOpen(false);
                      if (option) {
                        setSettingsView(option);
                        setIsSettingsModalOpen(true);
                      }
                    }}
                  />
                </div>
              )}
              {!isApiKeyNeeded && (
                <button
                  onClick={handleResetJob}
                  title="Reset Current Job & Upload"
                  className="p-2 text-textSecondary hover:text-primary rounded-full transition-colors disabled:opacity-50"
                  disabled={isProcessingBlocked}
                >
                  <TrashIcon className="w-6 h-6" />
                </button>
              )}
              {apiKey && !isApiKeyNeeded && (
                <button
                  onClick={handleClearApiKey}
                  title="Change API Key"
                  className="p-2 text-xs text-textSecondary hover:text-primary rounded-md border border-borderNeutral hover:border-primary transition-colors"
                >
                  Change API Key
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isApiKeyNeeded ? (
          <ApiKeySetup
            onSaveKey={handleSaveApiKey}
            currentError={apiKeyError}
            hasExistingKey={!!apiKey}
            onClearKey={apiKey ? handleClearApiKey : undefined}
            isLoading={apiKeyLoading}
          />
        ) : (
          <>
          {importExportFeedback && (
            <div className={`my-4 p-4 rounded-lg text-sm border ${importExportFeedback.type === 'success' ? 'bg-green-700 bg-opacity-30 border-green-500 text-green-100' : 'bg-red-700 bg-opacity-30 border-red-500 text-red-100'}`}>
              {importExportFeedback.message}
              <button onClick={() => setImportExportFeedback(null)} className="ml-4 text-lg font-bold float-right leading-none">&times;</button>
            </div>
          )}
           {ruleCustomizationFeedback && (
            <div className={`my-4 p-4 rounded-lg text-sm border ${ruleCustomizationFeedback.type === 'success' ? 'bg-green-700 bg-opacity-30 border-green-500 text-green-100' : 'bg-red-700 bg-opacity-30 border-red-500 text-red-100'}`}>
              {ruleCustomizationFeedback.message}
              <button onClick={() => setRuleCustomizationFeedback(null)} className="ml-4 text-lg font-bold float-right leading-none">&times;</button>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Column 1: Controls */}
            <div className="lg:col-span-1 space-y-8">
              <section aria-labelledby="context-selection-heading" className="bg-surface shadow-xl rounded-xl p-6">
                <h2 id="context-selection-heading" className="text-xl font-semibold text-textPrimary mb-4">1. Define Context & Data Type</h2>
                <ContextSelector
                  clients={clients} books={books} industries={industries}
                  selectedClient={selectedClient} setSelectedClient={setSelectedClient}
                  selectedBook={selectedBook} setSelectedBook={setSelectedBook}
                  selectedIndustry={selectedIndustry} setSelectedIndustry={setSelectedIndustry}
                  isTrainingData={isTrainingData} setIsTrainingData={setIsTrainingData}
                  onAddNew={handleOpenAddEntityModal}
                  disabled={isProcessingBlocked}
                />
              </section>
              <section aria-labelledby="file-upload-heading" className="bg-surface shadow-xl rounded-xl p-6">
                <h2 id="file-upload-heading" className="text-xl font-semibold text-textPrimary mb-4">2. Upload File</h2>
                <FileUpload
                  onFileUploaded={handleFileUploaded}
                  disabled={isProcessingBlocked || !canInitiateJobFlow}
                  resetSignal={fileUploadResetKey}
                />
              </section>
              <button
                  onClick={handleOpenMappingModal}
                  disabled={!uploadedFile || !canInitiateJobFlow || currentJob?.status !== JobStatus.AWAITING_MAPPING || isProcessingBlocked }
                  className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out disabled:bg-neutral-dark disabled:text-textSecondary disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-base"
                >
                  { currentJob?.status === JobStatus.VALIDATING ? <LoadingSpinner size="sm" color="text-white" /> :
                    currentJob?.status === JobStatus.PROCESSING ? <LoadingSpinner size="sm" color="text-white" /> :
                    <CogIcon className="w-5 h-5"/>
                  }
                  <span>{getActionButtonText()}</span>
              </button>
               {globalError && (
                  <div className="mt-4 p-4 bg-red-700 bg-opacity-30 border border-red-500 rounded-lg text-sm text-red-100">
                      {globalError}
                      <button onClick={() => setGlobalError(null)} className="ml-4 text-lg font-bold float-right leading-none">&times;</button>
                  </div>
              )}
            </div>
            {/* Column 2: Job Status & Results */}
            <div className="lg:col-span-2 space-y-8">
              <section aria-labelledby="job-status-heading" className="bg-surface shadow-xl rounded-xl p-6">
                  <h2 id="job-status-heading" className="text-xl font-semibold text-textPrimary mb-4">3. Job Status</h2>
                  <JobProgress
                      job={currentJob}
                      onConfirmProceed={!currentJob?.isTrainingData ? handleConfirmProceedWithSkippedRows : undefined}
                      onCancel={handleResetJob}
                  />
              </section>
              {currentJob && (currentJob.status === JobStatus.COMPLETED || currentJob.status === JobStatus.PENDING_REVIEW || (currentJob.status === JobStatus.VALIDATION_WARNING && !currentJob.isTrainingData) ) && !currentJob.isTrainingData && currentJob.transactions.length > 0 && (
                <section aria-labelledby="transaction-review-heading" className="bg-surface shadow-xl rounded-xl p-0 sm:p-2 md:p-6 overflow-hidden">
                  <h2 id="transaction-review-heading" className="text-xl font-semibold text-textPrimary mb-4 px-6 pt-6 sm:px-4 sm:pt-4 md:px-0 md:pt-0">4. Review Transactions</h2>
                  <TransactionTable
                      transactions={currentJob.transactions}
                      onUpdateTransaction={handleUpdateTransaction}
                      isLoading={false}
                      jobFileName={currentJob.fileName}
                  />
                </section>
              )}
              {currentJob && currentJob.status === JobStatus.COMPLETED && currentJob.isTrainingData && (
                   <div className={`mt-4 p-4 rounded-lg text-sm ${currentJob.validationReport && (currentJob.validationReport.skippedRowCount > 0 || currentJob.validationReport.warningRowCount > 0) ? 'bg-yellow-700 bg-opacity-30 border-yellow-500 text-yellow-100' : 'bg-green-700 bg-opacity-30 border-green-500 text-green-100'}`}>
                      Training data processing complete. {currentJob.processedRows} of {currentJob.totalRows} initial data rows saved as training.
                      {currentJob.validationReport && (currentJob.validationReport.skippedRowCount > 0 || currentJob.validationReport.warningRowCount > 0) &&
                          ` ${currentJob.validationReport.skippedRowCount > 0 ? `${currentJob.validationReport.skippedRowCount} rows were skipped. ` : ''}${currentJob.validationReport.warningRowCount > 0 ? `${currentJob.validationReport.warningRowCount} rows had warnings. ` : ''}`
                      }
                  </div>
              )}
            </div>
          </div>
          </>
        )}
      </main>

      <footer className="bg-surface text-textSecondary text-center py-6 mt-12 border-t border-borderNeutral">
        <p>&copy; {new Date().getFullYear()} {APP_TITLE}. All rights reserved.</p>
        <p className="text-xs mt-1">Modern Ledger Solutions by Bytsea</p>
      </footer>

      {isAddEntityModalOpen && entityTypeToAdd && (
        <AddEntityModal
          entityType={entityTypeToAdd}
          isOpen={isAddEntityModalOpen}
          onClose={() => setIsAddEntityModalOpen(false)}
          onSave={handleSaveEntity}
          existingNames={entityTypeToAdd === 'client' ? clients.map(c=>c.name) : entityTypeToAdd === 'book' ? books.filter(b => b.clientId === selectedClient?.id).map(b => b.name) : industries.map(i => i.name)}
        />
      )}
      {isColumnMappingModalOpen && currentJob && currentJob.rawFileContent && currentJob.csvHeadersForMapping && currentJob.csvSampleDataForMapping && (
        <ColumnMappingModal
            isOpen={isColumnMappingModalOpen}
            onClose={() => {
                setIsColumnMappingModalOpen(false);
            }}
            csvHeaders={currentJob.csvHeadersForMapping}
            sampleData={currentJob.csvSampleDataForMapping}
            onSaveMapping={currentJob.isTrainingData ? handleSaveTrainingDataMapping : handleSaveStandardProcessingMapping}
            fileName={currentJob.fileName}
            clientName={currentJob.client?.name}
            bookName={currentJob.book?.name}
            targetFields={currentJob.isTrainingData ? TARGET_TRAINING_FIELDS : TARGET_STANDARD_PROCESSING_FIELDS}
            modalTitle={currentJob.isTrainingData ? "Map Columns for Training Data" : "Map Columns for Standard Processing"}
        />
      )}
      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)}>
              {settingsView === 'export' && (
                <section>
                  <h2 className="text-xl font-semibold mb-4">Export Training Data & Rules</h2>
                  <p className="text-sm text-textSecondary opacity-80 mb-3">
                    Download clients, books, industries, training transactions, and any custom accounting rules as a JSON file.
                  </p>
                  <button
                    onClick={handleExportTrainingData}
                    disabled={isProcessingBlocked}
                    className="w-full px-5 py-2.5 bg-secondary hover:bg-secondary-dark text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-colors duration-150 ease-in-out text-sm disabled:opacity-50"
                  >
                    Export All Data
                  </button>
                  <div className="mt-8">
                    <h3 className="text-lg font-medium text-textSecondary mb-2">Import Training Data & Rules</h3>
                    <input
                      type="file"
                      accept=".json"
                      ref={importFileInputRef}
                      onChange={handleImportTrainingData}
                      className="block w-full text-sm text-textSecondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark disabled:opacity-50"
                      disabled={isProcessingBlocked}
                    />
                    <p className="text-xs text-textSecondary opacity-70 mt-1">Ensure the file is a previously exported JSON from this application.</p>
                  </div>
                </section>
              )}
              {settingsView === 'customize' && (
                <section>
                  <h2 className="text-xl font-semibold mb-4">Customize Accounting Rules</h2>
                  <p className="text-sm text-textSecondary opacity-80 mb-4">
                    Upload your own JSON files to override the default accounting logic. Changes are stored locally in your browser.
                    These custom rules will also be included in the "Export All Data" file.
                  </p>
                  <div className="space-y-6">
                    {ruleConfigDisplay.map(rule => (
                      <div key={rule.key} className="p-4 border border-borderNeutral rounded-lg bg-slate-800">
                        <h4 className="text-md font-medium text-textPrimary mb-1">{rule.label}</h4>
                        <p className={`text-xs mb-3 ${ruleStatuses[rule.key] ? 'text-green-400' : 'text-yellow-400'}`}>
                          Current: {ruleStatuses[rule.key] ? 'Custom Version Active' : 'Application Default Active'}
                        </p>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0">
                          <input
                            type="file"
                            accept=".json"
                            ref={ruleFileInputRefs[rule.key]}
                            onChange={(e) => handleCustomRuleUpload(rule.key, e)}
                            className="block w-full sm:w-auto text-sm text-textSecondary file:mr-2 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark disabled:opacity-50"
                            disabled={isProcessingBlocked}
                          />
                          {ruleStatuses[rule.key] && (
                            <button
                              onClick={() => handleResetSingleRule(rule.key)}
                              disabled={isProcessingBlocked}
                              className="px-3 py-2 text-xs text-textSecondary hover:text-primary rounded-md border border-borderNeutral hover:border-primary transition-colors disabled:opacity-50 flex items-center justify-center sm:w-auto w-full"
                              title={`Reset ${rule.label} to default`}
                            >
                              <ResetIcon className="w-4 h-4 mr-1.5"/> Reset to Default
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 pt-6 border-t border-borderNeutral">
                    <button
                      onClick={handleResetAllRules}
                      disabled={isProcessingBlocked}
                      className="w-full sm:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-colors duration-150 ease-in-out text-sm disabled:opacity-50 flex items-center justify-center"
                    >
                      <ResetIcon className="w-4 h-4 mr-2"/> Reset All Rules to Application Defaults
                    </button>
                  </div>
                </section>
              )}
            </SettingsModal>
    </div>
  );
};

export default App;
