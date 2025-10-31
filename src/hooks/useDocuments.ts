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

export interface Document {
  id: string;
  user_id: string;
  type: 'statement' | 'certificate' | 'tax-document';
  title: string;
  description?: string;
  period?: string;
  file_size?: string;
  status: 'ready' | 'processing' | 'expired';
  download_url?: string;
  created_at: any;
  updated_at: any;
}

export interface CreateDocumentData {
  type: 'statement' | 'certificate' | 'tax-document';
  title: string;
  description?: string;
  period?: string;
  file_size?: string;
}

export const useDocuments = () => {
  const [user] = useAuthState(auth);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create new document
  const createDocument = async (documentData: CreateDocumentData): Promise<Document | null> => {
    if (!user) {
      setError('يجب تسجيل الدخول أولاً');
      return null;
    }

    try {
      setError(null);

      // تنظيف البيانات من القيم غير المعرفة
      const cleanedData = Object.fromEntries(
        Object.entries(documentData).filter(([_, value]) => value !== undefined && value !== null && value !== '')
      );

      const newDocumentData = {
        user_id: user.uid,
        ...cleanedData,
        status: 'processing' as const,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'documents'), newDocumentData);
      
      // Simulate processing time
      setTimeout(async () => {
        await updateDoc(doc(db, 'documents', docRef.id), {
          status: 'ready',
          file_size: '2.1 MB',
          updated_at: serverTimestamp()
        });
      }, 3000);

      const createdDocument: Document = {
        id: docRef.id,
        ...newDocumentData,
        created_at: new Date(),
        updated_at: new Date()
      };

      return createdDocument;
    } catch (err) {
      console.error('Error creating document:', err);
      setError('فشل في إنشاء المستند');
      return null;
    }
  };

  // Update document status
  const updateDocumentStatus = async (documentId: string, status: 'ready' | 'processing' | 'expired'): Promise<boolean> => {
    try {
      setError(null);

      const documentRef = doc(db, 'documents', documentId);
      await updateDoc(documentRef, { 
        status,
        updated_at: serverTimestamp()
      });

      return true;
    } catch (err) {
      console.error('Error updating document status:', err);
      setError('فشل في تحديث حالة المستند');
      return false;
    }
  };

  // Delete document
  const deleteDocument = async (documentId: string): Promise<boolean> => {
    try {
      setError(null);

      const documentRef = doc(db, 'documents', documentId);
      await deleteDoc(documentRef);

      return true;
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('فشل في حذف المستند');
      return false;
    }
  };

  // Listen to documents changes in real-time
  useEffect(() => {
    if (!user) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'documents'),
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const documentsData: Document[] = [];
        querySnapshot.forEach((doc) => {
          documentsData.push({
            id: doc.id,
            ...doc.data()
          } as Document);
        });
        setDocuments(documentsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching documents:', error);
        setError('فشل في تحميل المستندات');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return {
    documents,
    loading,
    error,
    createDocument,
    updateDocumentStatus,
    deleteDocument
  };
};