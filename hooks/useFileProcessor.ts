import { useState } from 'react';
import { ProcessingJob, Client, Book, Industry, RawTransactionData, ValidationResult } from '../types';
import { parseCSVPreview } from '../services/transactionService';
import { dataValidationService } from '../services/dataValidationService';

/**
 * Custom hook for managing file upload and processing workflow
 */
export const useFileProcessor = (
  selectedClient: Client | null,
  selectedBook: Book | null,
  selectedIndustry: Industry | null,
  isTrainingData: boolean,
  createJob: (fileName: string, fileSize: number, client?: Client, book?: Book, industry?: Industry, isTrainingData?: boolean) => ProcessingJob,
  setCurrentJob: (job: ProcessingJob | null) => void
) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showValidationPanel, setShowValidationPanel] = useState(false);

  const processFileUpload = async (
    file: File,
    contentWithStartRowApplied: string
  ) => {
    setUploadedFile(file);

    // Validate file has content
    const initialRowCount = contentWithStartRowApplied.split(/\r\n|\n|\r/).filter(Boolean).length;
    const dataRowCount = initialRowCount > 0 ? initialRowCount - 1 : 0;

    if (dataRowCount <= 0 && contentWithStartRowApplied.trim() !== "") {
      throw new Error("The file seems to have no data rows after header adjustment. Please check the 'Actual Header Row Number'.");
    }

    if (dataRowCount <= 0 && contentWithStartRowApplied.trim() === "") {
      throw new Error("The file is effectively empty after header adjustment.");
    }

    // Parse data for validation
    const { headers, sampleRows } = parseCSVPreview(contentWithStartRowApplied);
    if (headers.length === 0 && contentWithStartRowApplied.trim() !== "") {
      throw new Error("Uploaded file seems to have no headers or is empty after start row adjustment. Check 'Actual Header Row Number'.");
    }

    // Parse full data for validation
    const lines = contentWithStartRowApplied.trim().split(/\r\n|\n|\r/);
    const dataRows = lines.slice(1);
    const rawData: RawTransactionData[] = [];

    dataRows.forEach((line) => {
      const values = (line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || []).map(v => v.replace(/^"|"$/g, '').trim());
      const rawTx: RawTransactionData = {};
      headers.forEach((header, index) => {
        rawTx[header as keyof RawTransactionData] = values[index] || '';
      });
      rawData.push(rawTx);
    });

    // Run data validation
    const validation = dataValidationService.validateDataQuality(rawData);
    setValidationResult(validation);
    setShowValidationPanel(true);

    // Create job
    const job = createJob(
      file.name,
      file.size,
      selectedClient || undefined,
      selectedBook || undefined,
      selectedIndustry || undefined,
      isTrainingData
    );

    // Update job with parsed data
    const updatedJob = {
      ...job,
      totalRows: dataRowCount,
      rawFileContent: contentWithStartRowApplied,
      csvHeadersForMapping: headers,
      csvSampleDataForMapping: sampleRows,
      validationReport: validation.report,
    };

    setCurrentJob(updatedJob);
    return updatedJob;
  };

  const resetFileUpload = () => {
    setUploadedFile(null);
    setValidationResult(null);
    setShowValidationPanel(false);
  };

  return {
    uploadedFile,
    validationResult,
    showValidationPanel,
    setShowValidationPanel,
    processFileUpload,
    resetFileUpload
  };
};