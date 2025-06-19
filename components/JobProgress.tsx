import React from 'react';
import { ProcessingJob, JobStatus, DataValidationError } from '../types';
import StatusBadge from './StatusBadge';
import LoadingSpinner from './LoadingSpinner';
import { CheckCircleIcon, XCircleIcon, CogIcon, ArrowPathIcon, ExclamationTriangleIcon } from './icons';

interface JobProgressProps {
  job: ProcessingJob | null;
  onCancel?: () => void;
  onConfirmProceed?: () => void;
}

const JobProgress: React.FC<JobProgressProps> = ({ job, onCancel, onConfirmProceed }) => {
  if (!job) {
    return (
        <div className="p-6 text-center text-textSecondary opacity-75">
            No active processing job. Upload a file and select context to begin.
        </div>
    );
  }

  const getStatusIcon = () => {
    switch(job.status) {
        case JobStatus.QUEUED:
            return <ArrowPathIcon className="w-6 h-6 text-yellow-400" />;
        case JobStatus.VALIDATING:
        case JobStatus.PROCESSING:
            return <CogIcon className="w-6 h-6 text-blue-400 animate-spin" />;
        case JobStatus.COMPLETED:
            return <CheckCircleIcon className="w-6 h-6 text-green-400" />;
        case JobStatus.FAILED:
            return <XCircleIcon className="w-6 h-6 text-red-400" />;
        case JobStatus.VALIDATION_WARNING:
            return <ExclamationTriangleIcon className="w-6 h-6 text-orange-400" />;
        case JobStatus.PENDING_REVIEW:
            return <ArrowPathIcon className="w-6 h-6 text-orange-400" />;
        default:
            return <CogIcon className="w-6 h-6 text-textSecondary opacity-50" />;
    }
  }

  const renderValidationReport = (report: typeof job.validationReport) => {
    if (!report || report.skippedRowCount === 0 && report.warningRowCount === 0) return null;
    
    return (
        <div className="mt-4 p-4 bg-orange-800 bg-opacity-30 border border-orange-600 rounded-lg text-sm text-orange-200">
            <div className="flex items-start">
                <ExclamationTriangleIcon className="w-5 h-5 mr-3 text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="font-semibold text-orange-100">Data Validation Issues Found:</p>
                    <p>
                        {report.skippedRowCount > 0 && `${report.skippedRowCount} row(s) will be skipped. `}
                        {report.warningRowCount > 0 && `${report.warningRowCount} row(s) have warnings. `}
                        (Total rows in file: {job.totalRows})
                    </p>
                    {Object.keys(report.summary).length > 0 && (
                        <ul className="list-disc list-inside mt-2 text-xs text-orange-300">
                            {Object.entries(report.summary).map(([reason, count]) => (
                                <li key={reason}>{reason}: {count} row(s)</li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
             {job.status === JobStatus.VALIDATION_WARNING && onConfirmProceed && onCancel && (
                <div className="mt-4 flex justify-end space-x-3">
                    <button 
                        onClick={onCancel}
                        className="px-4 py-2 text-xs font-medium text-textPrimary bg-neutral-dark hover:bg-slate-600 rounded-md shadow-sm transition-colors"
                    >
                        Cancel & Correct File
                    </button>
                    <button 
                        onClick={onConfirmProceed}
                        className="px-4 py-2 text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-md shadow-sm transition-colors"
                    >
                        Proceed (Skip Problematic Rows)
                    </button>
                </div>
            )}
        </div>
    );
  };


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-textPrimary truncate" title={job.fileName}>Job: {job.fileName.length > 30 ? job.fileName.substring(0,27) + '...' : job.fileName}</h3>
        <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <StatusBadge status={job.status} type="job" />
        </div>
      </div>

      <div className="space-y-2 text-sm text-textSecondary mb-6">
        <p><strong>File Size:</strong> {(job.fileSize / 1024).toFixed(1)} KB</p>
        {job.client && <p><strong>Client:</strong> {job.client.name}</p>}
        {job.book && <p><strong>Book:</strong> {job.book.name}</p>}
        {job.industry && <p><strong>Industry:</strong> {job.industry.name}</p>}
        <p><strong>Training Data:</strong> {job.isTrainingData ? 'Yes' : 'No'}</p>
      </div>

      {(job.status === JobStatus.PROCESSING || job.status === JobStatus.VALIDATING || job.progress > 0 && job.status !== JobStatus.VALIDATION_WARNING) && (
        <div className="mt-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-primary-light">Progress</span>
            <span className="text-sm font-medium text-primary-light">{job.progress.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
            <div className="bg-gradient-to-r from-primary-light to-primary h-3 rounded-full transition-all duration-300 ease-out" style={{ width: `${job.progress}%` }}></div>
          </div>
           {job.status === JobStatus.PROCESSING && job.validRows !== undefined && job.validRows > 0 && (
             <p className="text-xs text-textSecondary opacity-75 mt-1 text-right">
              {job.processedRows} / {job.validRows} valid transactions processed
            </p>
           )}
           {job.status !== JobStatus.PROCESSING && job.totalRows > 0 && (job.status === JobStatus.VALIDATING || job.status === JobStatus.QUEUED) && (
             <p className="text-xs text-textSecondary opacity-75 mt-1 text-right">
               Est. {job.totalRows} transactions.
             </p>
           )}
        </div>
      )}
      
      {job.status === JobStatus.PROCESSING && <LoadingSpinner text="Categorizing transactions..." size="sm" color="text-primary-light mt-4" />}
      
      {job.validationReport && renderValidationReport(job.validationReport)}

      {job.status === JobStatus.FAILED && job.errorMessage && !job.validationReport && (
        <div className="mt-4 p-3 bg-red-800 bg-opacity-30 border border-red-600 rounded-lg text-sm text-red-200">
          <strong>Error:</strong> {job.errorMessage}
        </div>
      )}

      {job.status === JobStatus.COMPLETED && (
        <div className="mt-4 p-4 bg-green-800 bg-opacity-30 border border-green-600 rounded-lg text-sm text-green-200 flex items-center">
            <CheckCircleIcon className="w-5 h-5 mr-3 text-green-400 flex-shrink-0" />
            Processing complete! {job.processedRows} transactions {job.isTrainingData ? 'saved for training' : 'categorized'}.
            {job.validationReport && job.validationReport.skippedRowCount > 0 && 
              <span className="ml-1 text-green-300">({job.validationReport.skippedRowCount} rows were skipped due to data issues.)</span>
            }
        </div>
      )}
       {onCancel && (job.status === JobStatus.QUEUED || job.status === JobStatus.VALIDATING) && (
         <div className="mt-6 flex justify-end">
            <button 
                onClick={onCancel}
                className="px-4 py-2 text-xs font-medium text-red-200 bg-red-700 hover:bg-red-600 rounded-md shadow-sm transition-colors"
            >
                Cancel Job
            </button>
         </div>
       )}
    </div>
  );
};

export default JobProgress;