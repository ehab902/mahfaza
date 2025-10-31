import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';

export interface Agent {
  id: string;
  name: string;
  code: string;
  country: string;
  city: string;
  phone?: string;
  email?: string;
  commission_rate?: number;
  status: 'active' | 'inactive' | 'suspended';
  avatar_url?: string;
  rating?: number;
  max_transaction_amount?: number;
  total_transactions?: number;
  created_at: any;
  updated_at: any;
}

export function useAgentsManagement() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'agents'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const agentsData: Agent[] = [];
      snapshot.forEach((doc) => {
        agentsData.push({ id: doc.id, ...doc.data() } as Agent);
      });
      setAgents(agentsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const deleteAgent = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'agents', id));
      return true;
    } catch (error) {
      console.error('Error deleting agent:', error);
      return false;
    }
  };

  const changeAgentStatus = async (id: string, status: 'active' | 'inactive' | 'suspended') => {
    try {
      await updateDoc(doc(db, 'agents', id), {
        status,
        updated_at: Timestamp.now()
      });
      return true;
    } catch (error) {
      console.error('Error updating agent status:', error);
      return false;
    }
  };

  return {
    agents,
    loading,
    deleteAgent,
    changeAgentStatus
  };
}
