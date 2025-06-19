import React from 'react';
import { JobStatus, AccountingCategory } from '../types';

interface StatusBadgeProps {
  status: JobStatus | AccountingCategory | string;
  type?: 'job' | 'category' | 'confidence';
  confidenceScore?: number;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'job', confidenceScore }) => {
  let bgColor = 'bg-slate-600'; // Darker default background
  let textColor = 'text-slate-100'; // Lighter default text

  if (type === 'job') {
    switch (status as JobStatus) {
      case JobStatus.COMPLETED:
        bgColor = 'bg-green-700'; // Darker green
        textColor = 'text-green-100';
        break;
      case JobStatus.PROCESSING:
      case JobStatus.VALIDATING:
        bgColor = 'bg-blue-700'; // Darker blue
        textColor = 'text-blue-100';
        break;
      case JobStatus.QUEUED:
      case JobStatus.AWAITING_MAPPING:
        bgColor = 'bg-yellow-700'; // Darker yellow
        textColor = 'text-yellow-100';
        break;
      case JobStatus.FAILED:
        bgColor = 'bg-red-700'; // Darker red
        textColor = 'text-red-100';
        break;
      case JobStatus.PENDING_REVIEW:
      case JobStatus.VALIDATION_WARNING:
        bgColor = 'bg-orange-600'; // Darker orange
        textColor = 'text-orange-100';
        break;
      default: // IDLE or other
        bgColor = 'bg-slate-600';
        textColor = 'text-slate-200';
    }
  } else if (type === 'category') {
    bgColor = 'bg-indigo-600'; // Darker indigo
    textColor = 'text-indigo-100';
  } else if (type === 'confidence' && confidenceScore !== undefined) {
    if (confidenceScore >= 0.9) {
      bgColor = 'bg-green-700'; textColor = 'text-green-100'; status = `High (${(confidenceScore * 100).toFixed(0)}%)`;
    } else if (confidenceScore >= 0.7) {
      bgColor = 'bg-yellow-700'; textColor = 'text-yellow-100'; status = `Medium (${(confidenceScore * 100).toFixed(0)}%)`;
    } else {
      bgColor = 'bg-red-700'; textColor = 'text-red-100'; status = `Low (${(confidenceScore * 100).toFixed(0)}%)`;
    }
  }

  return (
    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor} shadow-sm`}>
      {status}
    </span>
  );
};

export default StatusBadge;