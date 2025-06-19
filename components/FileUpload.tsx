import React, { useState, useCallback, useEffect, useRef } from 'react';
import { UploadIcon, CheckCircleIcon, XCircleIcon } from './icons';
import * as XLSX from 'xlsx';

interface FileUploadProps {
  onFileUploaded: (file: File, fileContent: string, fileType: 'csv' | 'excel') => void;
  disabled?: boolean;
  resetSignal?: number; // To trigger internal reset
}

const MAX_PREVIEW_ROWS = 20;

const FileUpload: React.FC<FileUploadProps> = ({ onFileUploaded, disabled, resetSignal }) => {
  const [selectedRawFile, setSelectedRawFile] = useState<File | null>(null);
  const [rawFileContentForProcessing, setRawFileContentForProcessing] = useState<string | ArrayBuffer | null>(null);
  const [rawFileType, setRawFileType] = useState<'csv' | 'excel' | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [rawRowsPreview, setRawRowsPreview] = useState<string[][]>([]);
  const [headerRowNumberInput, setHeaderRowNumberInput] = useState<string>("1");
  const [isStartRowConfirmed, setIsStartRowConfirmed] = useState<boolean>(false);
  const [confirmedFileName, setConfirmedFileName] = useState<string | null>(null);
  const [confirmedFileSize, setConfirmedFileSize] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetInternalState = useCallback(() => {
    setSelectedRawFile(null);
    setRawFileContentForProcessing(null);
    setRawFileType(null);
    setError(null);
    setRawRowsPreview([]);
    setHeaderRowNumberInput("1");
    setIsStartRowConfirmed(false);
    setConfirmedFileName(null);
    setConfirmedFileSize(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset file input
    }
  }, []);

  useEffect(() => {
    if (resetSignal && resetSignal > 0) {
      resetInternalState();
    }
  }, [resetSignal, resetInternalState]);


  const parseFileForPreviewAndStore = (file: File) => {
    resetInternalState(); 
    setError(null);
    setSelectedRawFile(file);

    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    let detectedFileType: 'csv' | 'excel' | null = null;

    const validCsvTypes = ['text/csv', 'application/csv', 'text/plain', 'application/vnd.ms-excel'];
    const validExcelTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    
    if (validCsvTypes.includes(file.type) || fileExtension === '.csv') {
        detectedFileType = 'csv';
    } else if (validExcelTypes.includes(file.type) || fileExtension === '.xls' || fileExtension === '.xlsx') {
        detectedFileType = 'excel';
    }

    if (!detectedFileType) {
      setError(`Unsupported file type: ${file.name}. Please upload a CSV, XLS, or XLSX file.`);
      return;
    }
    setRawFileType(detectedFileType);

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('File is too large. Maximum size is 10MB.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (!result) {
        setError("Could not read file content.");
        return;
      }
      setRawFileContentForProcessing(result);

      let previewRows: string[][] = [];
      try {
        if (detectedFileType === 'csv' && typeof result === 'string') {
          const lines = result.trim().split('\n').slice(0, MAX_PREVIEW_ROWS);
          previewRows = lines.map(line => (line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || []).map(v => v.replace(/^"|"$/g, '').trim()));
        } else if (detectedFileType === 'excel' && result instanceof ArrayBuffer) {
          const workbook = XLSX.read(result, { type: 'array', cellDates: true, dateNF: 'yyyy-mm-dd' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1, defval: '', rawNumbers: false });
          previewRows = jsonData.slice(0, MAX_PREVIEW_ROWS).map(row => row.map(cell => String(cell === null || cell === undefined ? '' : cell)));
        }
        setRawRowsPreview(previewRows);
        setIsStartRowConfirmed(false); 
      } catch (previewError) {
        console.error("Error generating file preview:", previewError);
        setError("Could not generate file preview. The file might be corrupted or in an unexpected format.");
        setRawRowsPreview([]);
      }
    };
    reader.onerror = () => {
        setError(`Failed to read file: ${file.name}.`);
    };

    if (detectedFileType === 'csv') {
        reader.readAsText(file);
    } else { 
        reader.readAsArrayBuffer(file);
    }
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      parseFileForPreviewAndStore(file);
    }
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      parseFileForPreviewAndStore(event.dataTransfer.files[0]);
      event.dataTransfer.clearData();
    }
  }, [disabled]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleConfirmStartRow = () => {
    if (!selectedRawFile || !rawFileContentForProcessing || !rawFileType) {
      setError("No file content to process. Please re-upload.");
      return;
    }
    const startRow = parseInt(headerRowNumberInput, 10);
    if (isNaN(startRow) || startRow < 1) {
      setError("Please enter a valid positive number for the header row.");
      return;
    }

    setError(null);
    let finalCsvContent = "";

    try {
        if (rawFileType === 'csv' && typeof rawFileContentForProcessing === 'string') {
            const lines = rawFileContentForProcessing.trim().split('\n');
            if (startRow > lines.length && lines.length > 0) {
                setError(`Start row (${startRow}) is greater than total lines (${lines.length}) in CSV.`);
                return;
            }
            finalCsvContent = lines.slice(startRow - 1).join('\n');
        } else if (rawFileType === 'excel' && rawFileContentForProcessing instanceof ArrayBuffer) {
            const workbook = XLSX.read(rawFileContentForProcessing, { type: 'array', cellDates: true, dateNF: 'yyyy-mm-dd' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            const allRowsJson = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1, defval: '', rawNumbers: false });
             if (startRow > allRowsJson.length && allRowsJson.length > 0) {
                setError(`Start row (${startRow}) is greater than total rows (${allRowsJson.length}) in Excel sheet.`);
                return;
            }
            const slicedRows = allRowsJson.slice(startRow - 1);

            if (slicedRows.length > 0) {
                const newSheet = XLSX.utils.aoa_to_sheet(slicedRows.map(row => row.map(cell => String(cell === null || cell === undefined ? '' : cell))));
                finalCsvContent = XLSX.utils.sheet_to_csv(newSheet, { strip: true, skipHidden: true });
            } else {
                finalCsvContent = "";
            }
        }

        setIsStartRowConfirmed(true);
        setConfirmedFileName(selectedRawFile.name);
        setConfirmedFileSize(selectedRawFile.size);
        onFileUploaded(selectedRawFile, finalCsvContent, rawFileType);

    } catch (processingError) {
        console.error("Error processing file with start row:", processingError);
        setError("Failed to process file with the specified start row. It might be corrupted or an issue with the start row selection.");
        setIsStartRowConfirmed(false);
    }
  };

  const acceptedFileTypes = ['.csv', '.xls', '.xlsx'].join(',');

  return (
    <div className={`p-6 border-2 ${isDragging ? 'border-primary' : 'border-dashed border-borderNeutral'} rounded-lg transition-colors duration-200 ease-in-out ${disabled ? 'bg-slate-700 opacity-60 cursor-not-allowed' : 'bg-surface'}`}>
      {!isStartRowConfirmed && (
        <div
          className="flex flex-col items-center justify-center space-y-4 py-6"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <UploadIcon className={`w-12 h-12 ${isDragging ? 'text-primary' : 'text-textSecondary opacity-70'}`} />
          <p className="text-sm text-textSecondary text-center">
            Drag & drop your CSV or Excel file here, or{' '}
            <label htmlFor="file-upload-input" className={`font-medium ${disabled ? 'text-textSecondary' : 'text-primary-light hover:text-primary cursor-pointer'}`}>
              click to browse
            </label>
          </p>
          <input id="file-upload-input" ref={fileInputRef} name="file-upload-input" type="file" className="sr-only" onChange={handleFileChange} accept={acceptedFileTypes} disabled={disabled} />
          <p className="text-xs text-textSecondary opacity-70">CSV, XLS, XLSX files only, up to 10MB.</p>
        </div>
      )}

      {selectedRawFile && !isStartRowConfirmed && rawRowsPreview.length > 0 && (
        <div className="mt-4 space-y-4">
          <p className="text-sm font-medium text-textPrimary">File: <span className="font-normal text-textSecondary">{selectedRawFile.name}</span></p>
          <div>
            <label htmlFor="header-row-number" className="block text-sm font-medium text-textSecondary">
              Actual Header Row Number in File:
            </label>
            <input
              type="number"
              id="header-row-number"
              value={headerRowNumberInput}
              onChange={(e) => setHeaderRowNumberInput(e.target.value)}
              min="1"
              className="mt-1 block w-full sm:w-1/2 md:w-1/3 px-3 py-2 bg-slate-700 border border-borderNeutral rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-textPrimary sm:text-sm placeholder-placeholderText"
            />
             <p className="text-xs text-textSecondary opacity-70 mt-1">Enter the row number where your actual data table headers begin (e.g., if headers are on the 5th row of your Excel, enter 5).</p>
          </div>
          <h4 className="text-sm font-semibold text-textPrimary">Raw File Preview (first {MAX_PREVIEW_ROWS} rows):</h4>
          <div className="overflow-x-auto border border-borderNeutral rounded-md max-h-60 bg-slate-900 text-xs shadow-inner">
            <table className="min-w-full">
              <tbody className="divide-y divide-borderNeutral">
                {rawRowsPreview.map((row, rowIndex) => (
                  <tr key={rowIndex} className={`${rowIndex + 1 === parseInt(headerRowNumberInput,10) ? 'bg-primary bg-opacity-20' : ''} hover:bg-slate-700 transition-colors`}>
                    <td className="px-3 py-2 text-slate-500 w-12 text-right">{rowIndex + 1}</td>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-3 py-2 border-l border-borderNeutral whitespace-nowrap truncate max-w-[150px] text-textSecondary" title={cell}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={handleConfirmStartRow}
            className="w-full sm:w-auto px-6 py-2.5 bg-secondary hover:bg-secondary-dark text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-colors duration-150 ease-in-out"
            disabled={disabled}
          >
            Apply Start Row & Continue
          </button>
        </div>
      )}

      {isStartRowConfirmed && confirmedFileName && (
        <div className="mt-3 p-4 bg-green-800 bg-opacity-30 border border-green-600 rounded-lg text-sm text-green-200 flex items-center justify-between">
            <div className="flex items-center">
                <CheckCircleIcon className="w-5 h-5 mr-3 text-green-400 flex-shrink-0" />
                <div>
                    File ready: <span className="font-semibold">{confirmedFileName}</span>
                    {confirmedFileSize && ` (${(confirmedFileSize / 1024).toFixed(1)} KB)`}
                    <span className="block text-xs text-green-300">Data will be processed from row {headerRowNumberInput} of the original file.</span>
                </div>
            </div>
            <button 
                onClick={resetInternalState} 
                className="ml-2 text-xs text-blue-400 hover:text-blue-300 underline"
                title="Upload a different file"
            >
                Change file
            </button>
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-3 bg-red-800 bg-opacity-30 border border-red-600 rounded-lg text-sm text-red-200 flex items-center">
          <XCircleIcon className="w-5 h-5 mr-2 text-red-400" />
          {error}
        </div>
      )}
    </div>
  );
};

export default FileUpload;