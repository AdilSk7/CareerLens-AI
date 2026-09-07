import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface ApplicationRecord {
  id: string;
  company_name: string;
  job_title: string;
  job_description: string;
  status: string;
  job_url: string;
  notes: string;
  resume_id: string;
  createdAt: string;
  updatedAt: string;
  tailored_resume_data?: any;
}

export function useApplications() {
  const { currentUser } = useAuth();
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchApplications = useCallback(async () => {
    if (!currentUser) {
        setApplications([]);
        setLoading(false);
        return;
    }
    
    try {
      setLoading(true);
      const token = await currentUser.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/applications`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to fetch applications");
      const json = await response.json();
      const data: ApplicationRecord[] = json.data || [];
      
      setApplications(data);
    } catch (err: any) {
      console.error(err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  return { applications, loading, error, refresh: fetchApplications };
}
