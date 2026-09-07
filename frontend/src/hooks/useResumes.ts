import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { ResumeAnalysis as ResumeAnalysisType } from "../components/ResumeAnalysisViewer";

export interface ResumeRecord {
  id: string
  fileName: string
  fileUrl: string
  fileSize: number
  uploadedAt: string
  status: string
  userId: string
  analysis?: ResumeAnalysisType
  roadmap?: any
  target_role?: string
  skill_gaps?: string[]
}

export function useResumes() {
  const { currentUser } = useAuth();
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  const fetchFallback = useCallback(async () => {
    if (!currentUser) return;
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/resumes`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Fallback failed");
      const json = await response.json();
      const data: ResumeRecord[] = json.data || [];
      data.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      setResumes(data);
      setLoading(false);
    } catch (err: any) {
      console.error("Fallback error:", err);
      setError(err);
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setResumes([]);
      setLoading(false);
      return;
    }

    if (useFallback) {
      fetchFallback();
      const interval = setInterval(fetchFallback, 3000);
      return () => clearInterval(interval);
    }

    setLoading(true);
    const resumesRef = collection(db, 'resumes');
    const q = query(
      resumesRef, 
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: ResumeRecord[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as ResumeRecord);
      });
      data.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      
      setResumes(data);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error("useResumes snapshot error:", err);
      // Fallback to API polling if Firestore rules block the client SDK
      setUseFallback(true);
    });

    return () => unsubscribe();
  }, [currentUser, useFallback, fetchFallback]);

  // Expose a manual refresh method for ResumeManager to use on demand if using fallback
  const refresh = () => {
    if (useFallback) fetchFallback();
  };

  return { resumes, loading, error, refresh };
}
