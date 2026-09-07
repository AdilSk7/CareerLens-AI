import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export interface InterviewSession {
  id: string
  userId: string
  resumeId: string
  mode: string
  questionsAnswered: number
  averageScore: number
  completedAt: string
}

export function useInterviews() {
  const { currentUser } = useAuth();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setSessions([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'interviewSessions'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: InterviewSession[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as InterviewSession);
      });
      setSessions(data);
      setLoading(false);
    }, (err) => {
      console.error('useInterviews snapshot error:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  return { sessions, loading };
}
