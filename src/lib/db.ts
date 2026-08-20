import { isConfigured, db as firestoreDb } from "./firebase";
// Import firestore methods here if we were implementing the full firestore side.
// For now, this is deeply mocked to use LocalStorage to ensure the review
// process is perfectly fluid without setting up Firebase config.

export interface Transaction {
  id: string;
  parentPhone: string;
  parentName: string;
  kids: Array<{
    kidName: string;
    planId: string;
    planLabel: string;
    price: number;
  }>;
  subtotal: number;
  discountPercentage: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  paymentMethod: string;
  timestamp: string;
}

export interface KidSession {
  id: string;
  transactionId: string;
  parentPhone: string;
  parentName: string;
  kidName: string;
  planId: string;
  checkedInAt: string;
  checkedOutAt: string | null;
  checkOutTimeExpected: string;
  status: "active" | "checked-out";
}

export interface Customer {
  phone: string;
  parentName: string;
  kids: string[];
  lastVisitedAt: string;
  totalVisits: number;
}

const STORAGE_KEYS = {
  TRANSACTIONS: "little_lions_transactions",
  SESSIONS: "little_lions_sessions",
  CUSTOMERS: "little_lions_customers",
};

// Generic helper to get from LocalStorage
function getFromStorage<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Local storage error:", e);
    return [];
  }
}

// Generic helper to save to LocalStorage
function saveToStorage<T>(key: string, data: T[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

// Generates a mock UUID
function uuidv4() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (
      +c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))
    ).toString(16)
  );
}

// -----------------------------------------------------
// DATABASE SERVICE EXPORTS (Local Storage Implementations)
// -----------------------------------------------------

export const dbService = {
  // TRANSACTIONS
  async createTransaction(tx: Omit<Transaction, "id">): Promise<Transaction> {
    const transactions = getFromStorage<Transaction>(STORAGE_KEYS.TRANSACTIONS);
    const newTx = { ...tx, id: uuidv4() };
    transactions.push(newTx);
    saveToStorage(STORAGE_KEYS.TRANSACTIONS, transactions);
    return newTx;
  },

  async getTransactions(): Promise<Transaction[]> {
    return getFromStorage<Transaction>(STORAGE_KEYS.TRANSACTIONS);
  },

  // SESSIONS
  async createSessions(sessions: Omit<KidSession, "id">[]): Promise<KidSession[]> {
    const existing = getFromStorage<KidSession>(STORAGE_KEYS.SESSIONS);
    const newSessions = sessions.map((s) => ({ ...s, id: uuidv4() }));
    saveToStorage(STORAGE_KEYS.SESSIONS, [...existing, ...newSessions]);
    return newSessions;
  },

  async getActiveSessions(): Promise<KidSession[]> {
    const all = getFromStorage<KidSession>(STORAGE_KEYS.SESSIONS);
    return all.filter((s) => s.status === "active");
  },

  async checkoutSession(sessionId: string): Promise<void> {
    const all = getFromStorage<KidSession>(STORAGE_KEYS.SESSIONS);
    const updated = all.map((s) => {
      if (s.id === sessionId) {
        return {
          ...s,
          status: "checked-out" as const,
          checkedOutAt: new Date().toISOString(),
        };
      }
      return s;
    });
    saveToStorage(STORAGE_KEYS.SESSIONS, updated);
  },

  // CUSTOMERS
  async upsertCustomer(customer: Customer): Promise<void> {
    const customers = getFromStorage<Customer>(STORAGE_KEYS.CUSTOMERS);
    const index = customers.findIndex((c) => c.phone === customer.phone);
    if (index >= 0) {
      // Merge unique kids
      const existingKids = new Set(customers[index].kids);
      customer.kids.forEach(k => existingKids.add(k));
      customers[index] = {
        ...customers[index],
        parentName: customer.parentName,
        kids: Array.from(existingKids),
        lastVisitedAt: customer.lastVisitedAt,
        totalVisits: (customers[index].totalVisits || 0) + 1,
      };
    } else {
      customer.totalVisits = 1;
      customers.push(customer);
    }
    saveToStorage(STORAGE_KEYS.CUSTOMERS, customers);
  },

  async getCustomerByPhone(phone: string): Promise<Customer | null> {
    const customers = getFromStorage<Customer>(STORAGE_KEYS.CUSTOMERS);
    return customers.find((c) => c.phone === phone) || null;
  },
  
  async getCustomers(): Promise<Customer[]> {
    return getFromStorage<Customer>(STORAGE_KEYS.CUSTOMERS);
  }
};
