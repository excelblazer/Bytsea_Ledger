import { useState } from 'react';
import { ProcessingJob, JobStatus, Client, Book, Industry } from '../types';

/**
 * Custom hook for managing the current processing job state
 * Handles job creation, updates, and status management
 */
export const useJobManager = () => {
  const [currentJob, setCurrentJob] = useState<ProcessingJob | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const resetJob = () => {
    setCurrentJob(null);
    setGlobalError(null);
  };

  const updateJobStatus = (status: JobStatus, errorMessage?: string) => {
    setCurrentJob(prev => prev ? {
      ...prev,
      status,
      errorMessage,
      ...(status === JobStatus.COMPLETED || status === JobStatus.FAILED ? { completedAt: new Date() } : {})
    } : null);
  };

  const updateJobProgress = (progress: number, processedRows?: number) => {
    setCurrentJob(prev => prev ? {
      ...prev,
      progress,
      ...(processedRows !== undefined ? { processedRows } : {})
    } : null);
  };

  const createJob = (
    fileName: string,
    fileSize: number,
    client?: Client,
    book?: Book,
    industry?: Industry,
    isTrainingData: boolean = false
  ): ProcessingJob => {
    const job: ProcessingJob = {
      id: crypto.randomUUID(),
      fileName,
      fileSize,
      client,
      book,
      industry,
      isTrainingData,
      status: JobStatus.IDLE,
      progress: 0,
      processedRows: 0,
      totalRows: 0,
      createdAt: new Date(),
      transactions: []
    };

    setCurrentJob(job);
    return job;
  };

  const updateJobContext = (client?: Client, book?: Book, industry?: Industry, isTrainingData?: boolean) => {
    setCurrentJob(prev => prev ? {
      ...prev,
      client: client || prev.client,
      book: book || prev.book,
      industry: industry || prev.industry,
      isTrainingData: isTrainingData !== undefined ? isTrainingData : prev.isTrainingData
    } : null);
  };

  return {
    currentJob,
    globalError,
    setGlobalError,
    resetJob,
    updateJobStatus,
    updateJobProgress,
    createJob,
    updateJobContext,
    setCurrentJob
  };
};