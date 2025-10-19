import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';

export interface Agent {
  id: string;
  name: string;
  code: string;
  country: string;
  city: string;
  address: string;
  phone: string;
  email?: string;
  avatar_url?: string;
  working_hours: string;
  status: 'active' | 'inactive' | 'suspended';
  commission_rate: number;
  max_transaction_amount: number;
  min_transaction_amount: number;
  supported_currencies: string[];
  latitude?: number;
  longitude?: number;
  rating: number;
  total_transactions: number;
  created_at: any;
  updated_at: any;
}

export interface AgentLocation {
  id: string;
  agent_id: string;
  name: string;
  address: string;
  city: string;
  phone?: string;
  working_hours: string;
  status: 'active' | 'inactive' | 'maintenance';
  latitude?: number;
  longitude?: number;
  created_at: any;
  updated_at: any;
}

export interface AgentTransaction {
  id: string;
  user_id: string;
  agent_id: string;
  agent_location_id?: string;
  transaction_type: 'deposit' | 'withdrawal';
  amount: number;
  currency: string;
  commission: number;
  reference_code: string;
  status: 'pending' | 'completed' | 'cancelled' | 'failed';
  notes?: string;
  created_at: any;
  updated_at: any;
  completed_at?: any;
}

export interface CreateAgentTransactionData {
  agent_id: string;
  agent_location_id?: string;
  transaction_type: 'deposit' | 'withdrawal';
  amount: number;
  currency: string;
  notes?: string;
}

// Smart country comparison function
function matchesCountry(agentCountry: string, userCountry: string): boolean {
  if (!agentCountry || !userCountry || userCountry === 'Unknown') {
    return true; // Show all if no filter
  }

  const normalize = (str: string) => str.toLowerCase().trim();
  const agent = normalize(agentCountry);
  const user = normalize(userCountry);

  // Country code to full name mapping
  const countryMap: { [key: string]: string[] } = {
    'ma': ['morocco', 'maroc', 'المغرب'],
    'morocco': ['ma', 'maroc', 'المغرب'],
    'lb': ['lebanon', 'liban', 'لبنان'],
    'lebanon': ['lb', 'liban', 'لبنان'],
    'sa': ['saudi arabia', 'saudi', 'ksa', 'السعودية'],
    'saudi arabia': ['sa', 'saudi', 'ksa', 'السعودية'],
    'ae': ['uae', 'emirates', 'الإمارات'],
    'uae': ['ae', 'emirates', 'الإمارات'],
    'eg': ['egypt', 'مصر'],
    'egypt': ['eg', 'مصر'],
    'jo': ['jordan', 'الأردن'],
    'jordan': ['jo', 'الأردن'],
    'qa': ['qatar', 'قطر'],
    'qatar': ['qa', 'قطر'],
    'kw': ['kuwait', 'الكويت'],
    'kuwait': ['kw', 'الكويت'],
    'bh': ['bahrain', 'البحرين'],
    'bahrain': ['bh', 'البحرين'],
    'om': ['oman', 'عمان'],
    'oman': ['om', 'عمان'],
  };

  // Direct match
  if (agent === user) return true;

  // Check if agent country matches user country through mapping
  const userVariants = countryMap[user] || [];
  if (userVariants.some(v => v === agent)) return true;

  // Check reverse
  const agentVariants = countryMap[agent] || [];
  if (agentVariants.some(v => v === user)) return true;

  return false;
}

export const useAgents = (country?: string) => {
  const [user] = useAuthState(auth);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentLocations, setAgentLocations] = useState<AgentLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen to agents changes in real-time
  useEffect(() => {
    if (!user) {
      setAgents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'agents'),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        let agentsData: Agent[] = [];
        querySnapshot.forEach((doc) => {
          agentsData.push({
            id: doc.id,
            ...doc.data()
          } as Agent);
        });

        // Filter by country if provided (smart matching)
        if (country && country !== 'Unknown') {
          agentsData = agentsData.filter(agent => matchesCountry(agent.country, country));
        }

        // Sort by rating
        agentsData.sort((a, b) => (b.rating || 0) - (a.rating || 0));

        setAgents(agentsData);
        setLoading(false);
      },
      (error) => {
        console.error('❌ Error fetching agents:', error);
        setError('فشل في تحميل الوكلاء');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, country]);

  // Listen to agent locations changes in real-time
  useEffect(() => {
    if (!user || agents.length === 0) {
      setAgentLocations([]);
      return;
    }

    const agentIds = agents.map(agent => agent.id);
    
    const q = query(
      collection(db, 'agent_locations'),
      where('status', '==', 'active'),
      where('agent_id', 'in', agentIds.slice(0, 10)) // Firestore limit for 'in' queries
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const locationsData: AgentLocation[] = [];
        querySnapshot.forEach((doc) => {
          locationsData.push({
            id: doc.id,
            ...doc.data()
          } as AgentLocation);
        });
        setAgentLocations(locationsData);
      },
      (error) => {
        console.error('Error fetching agent locations:', error);
      }
    );

    return () => unsubscribe();
  }, [user, agents]);

  return {
    agents,
    agentLocations,
    loading,
    error
  };
};

export const useAgentTransactions = () => {
  const [user] = useAuthState(auth);
  const [transactions, setTransactions] = useState<AgentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create new agent transaction
  const createAgentTransaction = async (transactionData: CreateAgentTransactionData): Promise<AgentTransaction | null> => {
    if (!user) {
      setError('يجب تسجيل الدخول أولاً');
      return null;
    }

    try {
      setError(null);

      // Generate unique reference code
      const referenceCode = `AG${Date.now().toString().slice(-8)}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      const newTransactionData = {
        user_id: user.uid,
        ...transactionData,
        commission: (transactionData.amount * 2.5) / 100, // Default 2.5% commission
        reference_code: referenceCode,
        status: 'pending' as const,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'agent_transactions'), newTransactionData);
      
      const createdTransaction: AgentTransaction = {
        id: docRef.id,
        ...newTransactionData,
        created_at: new Date(),
        updated_at: new Date()
      };

      return createdTransaction;
    } catch (err) {
      console.error('Error creating agent transaction:', err);
      setError('فشل في إنشاء المعاملة');
      return null;
    }
  };

  // Update transaction status
  const updateTransactionStatus = async (transactionId: string, status: 'completed' | 'cancelled' | 'failed'): Promise<boolean> => {
    try {
      setError(null);

      const transactionRef = doc(db, 'agent_transactions', transactionId);
      const updateData: any = { 
        status,
        updated_at: serverTimestamp()
      };

      if (status === 'completed') {
        updateData.completed_at = serverTimestamp();
      }

      await updateDoc(transactionRef, updateData);

      return true;
    } catch (err) {
      console.error('Error updating transaction status:', err);
      setError('فشل في تحديث حالة المعاملة');
      return false;
    }
  };

  // Listen to user's agent transactions changes in real-time
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'agent_transactions'),
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const transactionsData: AgentTransaction[] = [];
        querySnapshot.forEach((doc) => {
          transactionsData.push({
            id: doc.id,
            ...doc.data()
          } as AgentTransaction);
        });
        setTransactions(transactionsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching agent transactions:', error);
        setError('فشل في تحميل معاملات الوكلاء');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return {
    transactions,
    loading,
    error,
    createAgentTransaction,
    updateTransactionStatus
  };
};