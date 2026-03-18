import React from 'react';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

interface Step {
  label: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface ApprovalTimelineProps {
  steps: Step[];
}

const ApprovalTimeline: React.FC<ApprovalTimelineProps> = ({ steps }) => {
  return (
    <div className="space-y-3">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="relative">
            {step.status === 'approved' ? (
              <CheckCircle size={24} className="text-green-500" />
            ) : step.status === 'rejected' ? (
              <XCircle size={24} className="text-red-500" />
            ) : (
              <Clock size={24} className="text-amber-500" />
            )}
            {i < steps.length - 1 && (
              <div
                className={`absolute left-3 top-7 w-0.5 h-6 ${
                  step.status === 'approved' ? 'bg-green-300' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{step.label}</p>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {step.status === 'approved'
                ? '✔ Cleared'
                : step.status === 'rejected'
                ? '✘ Rejected'
                : 'Pending'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ApprovalTimeline;
