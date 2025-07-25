/**
 * Filter an array of data objects based on a given time frame
 * @param data Array of objects with createdAt properties
 * @param timeFrame The time period to filter by ('day', 'week', 'month', 'all')
 * @returns Filtered array of data
 */
export const filterDataByTime = (data: any[], timeFrame: string): any[] => {
  // If no data or timeFrame is 'all', return the original data
  if (!data || !data.length || timeFrame === 'all') {
    return data;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Set filtering date threshold based on time frame
  let threshold: Date;
  switch (timeFrame) {
    case 'day':
      threshold = today; // Start of today
      break;
    case 'week':
      // Set threshold to the beginning of the current week (Sunday)
      const dayOfWeek = now.getDay(); // 0 is Sunday, 6 is Saturday
      threshold = new Date(now);
      threshold.setDate(now.getDate() - dayOfWeek); // Go back to the beginning of the week
      threshold.setHours(0, 0, 0, 0);
      break;
    case 'month':
      // Set threshold to the beginning of the current month
      threshold = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      return data; // Return original data for unknown time frames
  }

  // Filter data where the createdAt date is after or equal to the threshold date
  return data.filter(item => {
    // Check if the item has a createdAt property
    if (!item.createdAt) {
      return true; // Keep items without createdAt (you might want to change this logic)
    }
    const itemDate = new Date(item.createdAt);
    return itemDate >= threshold;
  });
};

/**
 * Filter job status data based on time frame
 */
export const filterJobStatusData = (jobs: any[], timeFrame: string): any[] => {
  if (timeFrame === 'all' || !jobs) {
    return [
      { name: 'Active', value: jobs?.filter(job => job.status === 'ACTIVE').length || 0 },
      { name: 'Closed', value: jobs?.filter(job => job.status === 'CLOSED').length || 0 },
      { name: 'Draft', value: jobs?.filter(job => job.status === 'DRAFT').length || 0 },
      { name: 'Paused', value: jobs?.filter(job => job.status === 'PAUSED').length || 0 },
      
    ];
  }

  // Apply time filter
  const filteredJobs = filterDataByTime(jobs, timeFrame);
  
  // Calculate statistics
  return [
    { name: 'Active', value: filteredJobs.filter(job => job.status === 'ACTIVE').length },
    { name: 'Closed', value: filteredJobs.filter(job => job.status === 'CLOSED').length },
    { name: 'Draft', value: filteredJobs.filter(job => job.status === 'DRAFT').length },
    { name: 'Paused', value: filteredJobs.filter(job => job.status === 'PAUSED').length }
  ];
};

/**
 * Filter resume status data based on time frame
 */
export const filterResumeStatusData = (resumes: any[], timeFrame: string): any[] => {
  if (timeFrame === 'all' || !resumes) {
    return [
      { name: 'Submitted', value: resumes?.filter(resume => resume.status === 'SUBMITTED').length || 0 },
      { name: 'Shortlisted', value: resumes?.filter(resume => resume.status === 'SHORTLISTED').length || 0 },
      { name: 'Rejected', value: resumes?.filter(resume => resume.status === 'REJECTED').length || 0 },
      { name: 'Hired', value: resumes?.filter(resume => resume.status === 'HIRED').length || 0 },
      { name: 'Duplicate', value: resumes?.filter(resume => resume.status === 'DUPLICATE').length || 0 }
    ];
  }

  // Apply time filter
  const filteredResumes = filterDataByTime(resumes, timeFrame);
  
  // Calculate statistics
  return [
    { name: 'Submitted', value: filteredResumes.filter(resume => resume.status === 'SUBMITTED').length },
    { name: 'Shortlisted', value: filteredResumes.filter(resume => resume.status === 'SHORTLISTED').length },
    { name: 'Rejected', value: filteredResumes.filter(resume => resume.status === 'REJECTED').length },
    { name: 'Hired', value: filteredResumes.filter(resume => resume.status === 'HIRED').length },
    { name: 'Duplicate', value: filteredResumes.filter(resume => resume.status === 'DUPLICATE').length }
  ];
};

/**
 * Special case for user distribution data from statsData
 * Note: For full implementation, the API would need to support time filtering
 */
export const filterUsersByRoleData = (statsData: any, recentUsers: any[], timeFrame: string): any[] => {
  if (!statsData?.stats?.users?.byRole) {
    return [];
  }
  
  // For proper implementation, the API would need to return detailed user data with timestamps
  // For now, we'll just return the original data
  return [
    { name: 'Companies', value: statsData.stats.users.byRole.companyPrimary },
    { name: 'Recruiters', value: statsData.stats.users.byRole.recruiter },
    { name: 'Internal', value: statsData.stats.users.byRole.internal },
    { name: 'Admin', value: statsData.stats.users.byRole.admin }
  ];
};

/**
 * Get statistics for dashboard stat cards with time filtering
 */
export const getFilteredStatCards = (statsData: any, jobs: any[], resumes: any[], timeFrame: string) => {
  // Filter jobs and resumes by time if needed
  const filteredJobs = timeFrame !== 'all' ? filterDataByTime(jobs || [], timeFrame) : jobs;
  const filteredResumes = timeFrame !== 'all' ? filterDataByTime(resumes || [], timeFrame) : resumes;
  
  // Calculate hiring rate
  const hiredCount = filteredResumes?.filter(resume => resume.status === 'HIRED').length || 0;
  const hiringRate = filteredResumes && filteredResumes.length > 0 
    ? `${Math.round((hiredCount / filteredResumes.length) * 100)}%` 
    : '0%';

  return [
    { 
      title: 'Total Users', 
      value: statsData?.stats.users.total || 0,
      bgColor: 'bg-blue-500',
      icon: 'User',
      link: '/dashboard/admin/users'
    },
    { 
      title: 'Companies', 
      value: statsData?.stats.users.byRole.companyPrimary || 0,
      bgColor: 'bg-green-500', 
      icon: 'Briefcase',
      link: '/dashboard/admin/users?role=COMPANY&isPrimary=true'
    },
    { 
      title: 'Recruiters', 
      value: statsData?.stats.users.byRole.recruiter || 0,
      bgColor: 'bg-purple-500',
      icon: 'Layers',
      link: '/dashboard/admin/users?role=RECRUITER'
    },
    { 
      title: 'Active Jobs', 
      value: filteredJobs?.filter(job => job.status === 'ACTIVE').length || 0,
      bgColor: 'bg-yellow-500',
      icon: 'Briefcase',
      link: '/dashboard/admin/jobs'
    },
    { 
      title: 'Total Resumes', 
      value: filteredResumes?.length || 0,
      bgColor: 'bg-red-500',
      icon: 'FileText',
      link: '/dashboard/admin/resumes'
    },
    { 
      title: 'Hiring Rate', 
      value: hiringRate,
      bgColor: 'bg-indigo-500',
      icon: 'Calendar',
      link: '/dashboard/admin'
    }
  ];
};