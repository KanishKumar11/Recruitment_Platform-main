// components/company/ResumeCountBadge.tsx
import React from 'react';
import { useGetResumesByJobIdQuery } from '@/app/store/services/resumesApi';

interface ResumeCountBadgeProps {
  jobId: string;
}

const ResumeCountBadge: React.FC<ResumeCountBadgeProps> = ({ jobId }) => {
  const { data: resumes, isLoading } = useGetResumesByJobIdQuery(jobId);
  
  if (isLoading) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        ...
      </span>
    );
  }
  
  let count = 0;
  if (Array.isArray(resumes)) {
    count = resumes.length;
  } else if (resumes && Array.isArray((resumes as any).results)) {
    count = (resumes as any).results.length;
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
      ${count > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
    >
      {count} Resume{count !== 1 ? 's' : ''}
    </span>
  );
};

export default ResumeCountBadge;