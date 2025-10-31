import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';

export interface VirtualCard {
  id: string;
  user_id: string;
  name: string;
  card_number: string;
  expiry_date: string;
  cvv: string;
  balance: number;
  currency: string;
  status: 'active' | 'frozen' | 'expired';
  card_type: 'single-use' | 'multi-use';
  spending_limit: number;
  spent_amount: number;
  gradient: string;
  card_brand: 'visa' | 'mastercard';
  card_tier: 'platinum' | 'gold' | 'classic';
  accent_color: string;
  image_url: string;
  created_at: any;
  updated_at: any;
}

export interface CreateCardData {
  name: string;
  card_type: 'single-use' | 'multi-use';
  spending_limit: number;
  currency: string;
  card_brand: 'visa' | 'mastercard';
  card_tier: 'platinum' | 'gold' | 'classic';
}

const cardGradients = [
  { 
    gradient: 'from-slate-800 via-blue-900 to-slate-900', 
    card_brand: 'visa' as const, 
    card_tier: 'platinum' as const, 
    accent_color: '#7DD3FC', // أزرق سماوي للبلاتينيوم
    image_url: 'https://i.imgur.com/BERzY98.jpeg'
  },
  { 
    gradient: 'from-amber-700 via-amber-800 to-amber-900', 
    card_brand: 'mastercard' as const, 
    card_tier: 'gold' as const, 
    accent_color: '#FCD34D', // ذهبي ساطع للذهب
    image_url: 'https://i.imgur.com/5cgvHVC.jpeg'
  },
  { 
    gradient: 'from-gray-600 via-gray-700 to-gray-800', 
    card_brand: 'visa' as const, 
    card_tier: 'classic' as const, 
    accent_color: '#E5E7EB', // رمادي فاتح للكلاسيك
    image_url: 'https://i.imgur.com/1FtChWZ.jpeg'
  },
  { 
    gradient: 'from-purple-800 via-purple-900 to-indigo-900', 
    card_brand: 'visa' as const, 
    card_tier: 'platinum' as const, 
    accent_color: '#7DD3FC', // أزرق سماوي للبلاتينيوم
    image_url: 'https://i.imgur.com/BERzY98.jpeg'
  },
  { 
    gradient: 'from-emerald-700 via-emerald-800 to-teal-900', 
    card_brand: 'mastercard' as const, 
    card_tier: 'gold' as const, 
    accent_color: '#FCD34D', // ذهبي ساطع للذهب
    image_url: 'https://i.imgur.com/5cgvHVC.jpeg'
  }
];

export const useVirtualCards = () => {
  const [user] = useAuthState(auth);
  const [cards, setCards] = useState<VirtualCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate random card number
  const generateCardNumber = () => {
    const prefix = '4532'; // Visa prefix
    let number = prefix;
    for (let i = 0; i < 12; i++) {
      number += Math.floor(Math.random() * 10);
    }
    return number.replace(/(.{4})/g, '$1 ').trim();
  };

  // Generate random expiry date (1-3 years from now)
  const generateExpiryDate = () => {
    const now = new Date();
    const futureYear = now.getFullYear() + Math.floor(Math.random() * 3) + 1;
    const month = Math.floor(Math.random() * 12) + 1;
    return `${month.toString().padStart(2, '0')}/${futureYear.toString().slice(-2)}`;
  };

  // Generate random CVV
  const generateCVV = () => {
    return Math.floor(Math.random() * 900 + 100).toString();
  };

  // Create new card
  const createCard = async (cardData: CreateCardData): Promise<VirtualCard | null> => {
    if (!user) {
      setError('يجب تسجيل الدخول أولاً');
      return null;
    }

    try {
      setError(null);

      // اختيار التدرج اللوني المناسب حسب نوع البطاقة
      const selectedGradient = cardGradients.find(g => 
        g.card_tier === cardData.card_tier && g.card_brand === cardData.card_brand
      ) || cardGradients.find(g => g.card_tier === cardData.card_tier) || cardGradients[0];

      const newCardData = {
        user_id: user.uid,
        name: cardData.name,
        card_number: generateCardNumber(),
        expiry_date: generateExpiryDate(),
        cvv: generateCVV(),
        balance: cardData.spending_limit,
        currency: 'EUR',
        status: 'active' as const,
        card_type: cardData.card_type,
        spending_limit: cardData.spending_limit,
        spent_amount: 0,
        gradient: selectedGradient.gradient,
        card_brand: cardData.card_brand,
        card_tier: cardData.card_tier,
        accent_color: selectedGradient.accent_color,
        image_url: selectedGradient.image_url,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'virtual_cards'), newCardData);
      
      const createdCard: VirtualCard = {
        id: docRef.id,
        ...newCardData,
        created_at: new Date(),
        updated_at: new Date()
      };

      return createdCard;
    } catch (err) {
      console.error('Error creating card:', err);
      setError('فشل في إنشاء البطاقة');
      return null;
    }
  };

  // Update card status
  const updateCardStatus = async (cardId: string, status: 'active' | 'frozen'): Promise<boolean> => {
    try {
      setError(null);

      const cardRef = doc(db, 'virtual_cards', cardId);
      await updateDoc(cardRef, { 
        status,
        updated_at: serverTimestamp()
      });

      return true;
    } catch (err) {
      console.error('Error updating card status:', err);
      setError('فشل في تحديث حالة البطاقة');
      return false;
    }
  };

  // Delete card
  const deleteCard = async (cardId: string): Promise<boolean> => {
    try {
      setError(null);

      const cardRef = doc(db, 'virtual_cards', cardId);
      await deleteDoc(cardRef);

      return true;
    } catch (err) {
      console.error('Error deleting card:', err);
      setError('فشل في حذف البطاقة');
      return false;
    }
  };

  // Update card spending
  const updateCardSpending = async (cardId: string, amount: number): Promise<boolean> => {
    try {
      setError(null);

      const card = cards.find(c => c.id === cardId);
      if (!card) return false;

      const newSpentAmount = card.spent_amount + amount;
      const newBalance = card.balance - amount;

      const cardRef = doc(db, 'virtual_cards', cardId);
      await updateDoc(cardRef, { 
        spent_amount: newSpentAmount,
        balance: newBalance,
        updated_at: serverTimestamp()
      });

      return true;
    } catch (err) {
      console.error('Error updating card spending:', err);
      setError('فشل في تحديث مبلغ الإنفاق');
      return false;
    }
  };

  // Listen to cards changes in real-time
  useEffect(() => {
    if (!user) {
      setCards([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'virtual_cards'),
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const cardsData: VirtualCard[] = [];
        querySnapshot.forEach((doc) => {
          cardsData.push({
            id: doc.id,
            ...doc.data()
          } as VirtualCard);
        });
        setCards(cardsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching cards:', error);
        setError('فشل في تحميل البطاقات');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const refetch = () => {
    // Real-time listener handles refetching automatically
  };

  return {
    cards,
    loading,
    error,
    createCard,
    updateCardStatus,
    deleteCard,
    updateCardSpending,
    refetch
  };
};