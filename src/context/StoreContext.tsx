/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Language,
  StoreSettings,
  User,
  Role,
  Permission,
  RolePermission,
  AuditLog,
  Product,
  ProductReference,
  SupplierProductReference,
  ProductBarcode,
  ProductSerialNumber,
  Category,
  Supplier,
  Customer,
  PurchaseInvoice,
  PurchaseItem,
  SalesInvoice,
  SalesItem,
  StockMovement,
  StockAdjustment,
  ReturnRecord,
  ReturnItem,
  CashSession,
  CashTransaction,
  BankAccount,
  BankTransaction,
  Expense,
  FinancialTransaction,
  JournalEntry,
  JournalEntryLine,
  PriceHistory,
  AppSetting,
  SyncLog,
  DatabaseSchemaRow,
  ViewMode
} from '../types';
import {
  TABLE_DEFINITIONS,
  DEFAULT_STORE_SETTINGS,
  INITIAL_ROLES,
  INITIAL_PERMISSIONS,
  INITIAL_CATEGORIES,
  INITIAL_BANK,
  INITIAL_USER,
  INITIAL_CUSTOMER_COUNTER,
  SCHEMA_VERSION
} from '../services/schema';
import { GoogleSheetsService, SheetInspectionResult } from '../services/googleSheetsApi';
import { initAuth, googleSignIn, logout as firebaseLogout, getAccessToken } from '../services/firebaseAuth';

export type Theme = 'dark' | 'light';

export interface AuthUser {
  email: string;
  name: string;
  role: string;
}

interface StoreContextType {
  // Theme & Localization & Navigation
  theme: Theme;
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  activeView: ViewMode;
  setActiveView: (view: ViewMode) => void;

  // Email & Password Authentication
  isAuthenticated: boolean;
  authUser: AuthUser | null;
  adminEmail: string;
  adminPassword: string;
  loginWithCredentials: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateAdminCredentials: (email: string, newPass: string) => void;

  // Google Sheets Integration (Permanently Persisted)
  isGoogleConnected: boolean;
  googleUser: any | null;
  spreadsheetId: string | null;
  spreadsheetTitle: string;
  spreadsheetUrl: string | null;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error' | 'offline';
  lastSyncTime: string | null;
  syncError: string | null;
  inspectionResult: SheetInspectionResult | null;
  connectSpreadsheet: (idOrUrl: string) => Promise<boolean>;
  createNewDatabase: (name?: string) => Promise<boolean>;
  repairDatabase: () => Promise<boolean>;
  syncNow: () => Promise<void>;
  pushAllDataToGoogleSheets: () => Promise<{ success: boolean; message: string; counts?: Record<string, number> }>;
  purgeUnregisteredData: () => Promise<void>;
  disconnectSpreadsheet: () => void;
  loginGoogle: () => Promise<void>;
  logoutGoogle: () => Promise<void>;
  autoSyncEnabled: boolean;
  toggleAutoSync: () => void;

  // Data Collections
  storeSettings: StoreSettings;
  updateStoreSettings: (settings: Partial<StoreSettings>) => void;
  users: User[];
  roles: Role[];
  permissions: Permission[];
  rolePermissions: RolePermission[];
  auditLogs: AuditLog[];
  products: Product[];
  productReferences: ProductReference[];
  supplierProductReferences: SupplierProductReference[];
  productBarcodes: ProductBarcode[];
  productSerialNumbers: ProductSerialNumber[];
  categories: Category[];
  suppliers: Supplier[];
  customers: Customer[];
  purchaseInvoices: PurchaseInvoice[];
  purchaseItems: PurchaseItem[];
  salesInvoices: SalesInvoice[];
  salesItems: SalesItem[];
  stockMovements: StockMovement[];
  stockAdjustments: StockAdjustment[];
  returns: ReturnRecord[];
  returnItems: ReturnItem[];
  cashSessions: CashSession[];
  activeCashSession: CashSession | null;
  cashTransactions: CashTransaction[];
  bankAccounts: BankAccount[];
  bankTransactions: BankTransaction[];
  expenses: Expense[];
  financialTransactions: FinancialTransaction[];
  journalEntries: JournalEntry[];
  journalEntryLines: JournalEntryLine[];
  priceHistory: PriceHistory[];

  // Core Operations & Financial Engine
  saveProduct: (product: Partial<Product>, supplierRef?: string, supplierId?: string) => Product;
  deleteProduct: (productId: string) => void;
  executeSaleInvoice: (
    invoice: Omit<SalesInvoice, 'Sales_Invoice_ID' | 'Invoice_Number' | 'Created_At'>,
    items: Omit<SalesItem, 'Sales_Item_ID' | 'Sales_Invoice_ID' | 'Created_At'>[]
  ) => Promise<SalesInvoice>;
  editSaleInvoice: (
    invoiceId: string,
    updatedInvoice: Partial<SalesInvoice>,
    updatedItems: SalesItem[]
  ) => Promise<SalesInvoice>;
  deleteSaleInvoice: (invoiceId: string) => Promise<boolean>;
  addSalePayment: (
    invoiceId: string,
    amount: number,
    method: 'Cash' | 'Card' | 'Bank_Transfer' | 'Cheque',
    bankId?: string
  ) => Promise<SalesInvoice>;

  executePurchaseInvoice: (
    invoice: Omit<PurchaseInvoice, 'Purchase_Invoice_ID' | 'Invoice_Number' | 'Created_At'>,
    items: Omit<PurchaseItem, 'Purchase_Item_ID' | 'Purchase_Invoice_ID' | 'Created_At'>[]
  ) => Promise<PurchaseInvoice>;
  editPurchaseInvoice: (
    invoiceId: string,
    updatedInvoice: Partial<PurchaseInvoice>,
    updatedItems: PurchaseItem[]
  ) => Promise<PurchaseInvoice>;
  deletePurchaseInvoice: (invoiceId: string) => Promise<boolean>;
  addPurchasePayment: (
    invoiceId: string,
    amount: number,
    method: 'Cash' | 'Card' | 'Bank_Transfer' | 'Cheque',
    bankId?: string
  ) => Promise<PurchaseInvoice>;

  createStockAdjustment: (productId: string, newQty: number, reason: string) => void;
  processReturn: (
    returnRecord: Omit<ReturnRecord, 'Return_ID'>,
    items: Omit<ReturnItem, 'Return_Item_ID' | 'Return_ID'>[]
  ) => void;
  openCashSession: (openingBalance: number) => CashSession;
  closeCashSession: (closingBalance: number) => CashSession;
  recordExpense: (expense: Omit<Expense, 'Expense_ID' | 'Expense_Number' | 'Created_At'>) => void;
  saveSupplier: (supplier: Partial<Supplier>) => void;
  saveCustomer: (customer: Partial<Customer>) => void;
  saveBankAccount: (bank: Partial<BankAccount>) => void;
  deleteBankAccount: (bankId: string) => void;
  saveBankTransaction: (tx: Partial<BankTransaction>) => void;
  deleteBankTransaction: (txId: string) => void;
  recordCashTransaction: (type: 'DEPOSIT' | 'WITHDRAWAL', amount: number, description: string) => void;
  findProductByAnyCode: (code: string) => Product | null;
}

const StoreContext = createContext<StoreContextType | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state (Dark / Light)
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('storeflow_theme') as Theme) || 'dark';
  });

  const toggleTheme = () => {
    setTheme(prev => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('storeflow_theme', next);
      if (next === 'light') {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
      }
      return next;
    });
  };

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  }, [theme]);

  // Navigation & Language
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('storeflow_lang') as Language) || 'ar';
  });
  const [activeView, setActiveView] = useState<ViewMode>('dashboard');

  // Admin Credentials & Authentication State
  const [adminEmail, setAdminEmail] = useState<string>(() => {
    return localStorage.getItem('storeflow_admin_email') || 'amilas08@gmail.com';
  });
  const [adminPassword, setAdminPassword] = useState<string>(() => {
    return localStorage.getItem('storeflow_admin_password') || '123456';
  });
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('storeflow_auth_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('storeflow_auth_user') !== null;
  });

  const updateAdminCredentials = (email: string, newPass: string) => {
    setAdminEmail(email);
    setAdminPassword(newPass);
    localStorage.setItem('storeflow_admin_email', email);
    localStorage.setItem('storeflow_admin_password', newPass);
  };

  // Google Sheets state - Permanently Preserved unless Admin explicitly changes it
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [googleUser, setGoogleUser] = useState<any | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(() => {
    return localStorage.getItem('storeflow_spreadsheet_id') || null;
  });
  const [spreadsheetTitle, setSpreadsheetTitle] = useState<string>(() => {
    return localStorage.getItem('storeflow_spreadsheet_title') || 'STORE MANAGEMENT DATABASE';
  });
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(() => {
    return localStorage.getItem('storeflow_spreadsheet_url') || null;
  });
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error' | 'offline'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    return localStorage.getItem('storeflow_last_sync') || null;
  });
  const [syncError, setSyncError] = useState<string | null>(null);
  const [inspectionResult, setInspectionResult] = useState<SheetInspectionResult | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('storeflow_auto_sync');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleAutoSync = () => {
    setAutoSyncEnabled(prev => {
      const next = !prev;
      localStorage.setItem('storeflow_auto_sync', String(next));
      return next;
    });
  };

  // Safe initializers (filter out mock data)
  const getCleanInitialProducts = (): Product[] => {
    try {
      const saved = localStorage.getItem('storeflow_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(p => p.Product_ID !== 'PRD-101' && p.Product_ID !== 'PRD-102');
        }
      }
    } catch {}
    return [];
  };

  const getCleanInitialSuppliers = (): Supplier[] => {
    try {
      const saved = localStorage.getItem('storeflow_suppliers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(s => s.Supplier_ID !== 'SUP-001' || !s.Supplier_Name.includes('النور'));
        }
      }
    } catch {}
    return [];
  };

  const getCleanInitialCustomers = (): Customer[] => {
    try {
      const saved = localStorage.getItem('storeflow_customers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(c => c.Customer_ID !== 'CUST-001' && c.Customer_ID !== 'CUST-002');
          if (filtered.length > 0) return filtered;
        }
      }
    } catch {}
    return [INITIAL_CUSTOMER_COUNTER];
  };

  // Core Data Tables - Initialized clean
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem('storeflow_settings');
    return saved ? JSON.parse(saved) : DEFAULT_STORE_SETTINGS;
  });
  const [users, setUsers] = useState<User[]>([INITIAL_USER]);
  const [roles] = useState<Role[]>(INITIAL_ROLES);
  const [permissions] = useState<Permission[]>(INITIAL_PERMISSIONS);
  const [rolePermissions] = useState<RolePermission[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('storeflow_audit_logs');
    return saved ? JSON.parse(saved) : [
      {
        Log_ID: `LOG-${Date.now()}`,
        User_ID: INITIAL_USER.User_ID,
        Action: 'SYSTEM_BOOT',
        Module: 'Core',
        Record_ID: 'APP-INIT',
        Old_Value: '',
        New_Value: 'Version 1.0.0 Online',
        Timestamp: new Date().toISOString(),
        Description: 'تهيئة نظام إدارة المخازن ونقاط البيع'
      }
    ];
  });

  const [products, setProducts] = useState<Product[]>(getCleanInitialProducts);
  const [productReferences, setProductReferences] = useState<ProductReference[]>([]);
  const [supplierProductReferences, setSupplierProductReferences] = useState<SupplierProductReference[]>([]);
  const [productBarcodes, setProductBarcodes] = useState<ProductBarcode[]>([]);
  const [productSerialNumbers, setProductSerialNumbers] = useState<ProductSerialNumber[]>([]);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [suppliers, setSuppliers] = useState<Supplier[]>(getCleanInitialSuppliers);
  const [customers, setCustomers] = useState<Customer[]>(getCleanInitialCustomers);
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>(() => {
    const saved = localStorage.getItem('storeflow_purchases');
    return saved ? JSON.parse(saved) : [];
  });
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>(() => {
    const saved = localStorage.getItem('storeflow_purchase_items');
    return saved ? JSON.parse(saved) : [];
  });
  const [salesInvoices, setSalesInvoices] = useState<SalesInvoice[]>(() => {
    const saved = localStorage.getItem('storeflow_sales');
    return saved ? JSON.parse(saved) : [];
  });
  const [salesItems, setSalesItems] = useState<SalesItem[]>(() => {
    const saved = localStorage.getItem('storeflow_sales_items');
    return saved ? JSON.parse(saved) : [];
  });
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>([]);
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [cashSessions, setCashSessions] = useState<CashSession[]>(() => {
    const saved = localStorage.getItem('storeflow_cash_sessions');
    return saved ? JSON.parse(saved) : [
      {
        Session_ID: 'CASH-001',
        Opening_Balance: 1000,
        Closing_Balance: 0,
        Expected_Balance: 1000,
        Difference: 0,
        Opened_By: 'المدير العام',
        Closed_By: '',
        Opened_At: new Date().toISOString(),
        Closed_At: '',
        Status: 'Open'
      }
    ];
  });
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() => {
    const saved = localStorage.getItem('storeflow_banks');
    return saved ? JSON.parse(saved) : [INITIAL_BANK];
  });
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>(() => {
    const saved = localStorage.getItem('storeflow_bank_txs');
    return saved ? JSON.parse(saved) : [];
  });
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('storeflow_expenses');
    return saved ? JSON.parse(saved) : [];
  });
  const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [journalEntryLines, setJournalEntryLines] = useState<JournalEntryLine[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);

  const activeCashSession = cashSessions.find(s => s.Status === 'Open') || null;

  // Language switcher
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('storeflow_lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  // Persist state locally
  useEffect(() => {
    localStorage.setItem('storeflow_settings', JSON.stringify(storeSettings));
  }, [storeSettings]);

  useEffect(() => {
    localStorage.setItem('storeflow_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('storeflow_sales', JSON.stringify(salesInvoices));
  }, [salesInvoices]);

  useEffect(() => {
    localStorage.setItem('storeflow_sales_items', JSON.stringify(salesItems));
  }, [salesItems]);

  useEffect(() => {
    localStorage.setItem('storeflow_purchases', JSON.stringify(purchaseInvoices));
  }, [purchaseInvoices]);

  useEffect(() => {
    localStorage.setItem('storeflow_purchase_items', JSON.stringify(purchaseItems));
  }, [purchaseItems]);

  useEffect(() => {
    localStorage.setItem('storeflow_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('storeflow_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('storeflow_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('storeflow_cash_sessions', JSON.stringify(cashSessions));
  }, [cashSessions]);

  useEffect(() => {
    localStorage.setItem('storeflow_banks', JSON.stringify(bankAccounts));
  }, [bankAccounts]);

  useEffect(() => {
    localStorage.setItem('storeflow_bank_txs', JSON.stringify(bankTransactions));
  }, [bankTransactions]);

  useEffect(() => {
    localStorage.setItem('storeflow_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setIsGoogleConnected(true);
        setGoogleUser(user);
        setAccessToken(token);
      },
      () => {
        setIsGoogleConnected(false);
        setGoogleUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const loginGoogle = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setIsGoogleConnected(true);
        setGoogleUser(res.user);
        setAccessToken(res.accessToken);
      }
    } catch (e: any) {
      console.error('Login error:', e);
      alert(e.message || 'فشل تسجيل الدخول بحساب Google');
    }
  };

  const logoutGoogle = async () => {
    await firebaseLogout();
    setIsGoogleConnected(false);
    setGoogleUser(null);
    setAccessToken(null);
  };

  // Audit log helper
  const addAuditLog = useCallback((action: string, module: string, recordId: string, oldVal: string, newVal: string, desc: string) => {
    const log: AuditLog = {
      Log_ID: `LOG-${Date.now()}`,
      User_ID: INITIAL_USER.User_ID,
      Action: action,
      Module: module,
      Record_ID: recordId,
      Old_Value: oldVal,
      New_Value: newVal,
      Timestamp: new Date().toISOString(),
      Description: desc
    };
    setAuditLogs(prev => [log, ...prev].slice(0, 500));
  }, []);

  // Sync state with Google Sheets (Strict 100% sync from Google Sheets)
  const syncNow = useCallback(async () => {
    if (!spreadsheetId) {
      setSyncStatus('idle');
      return;
    }

    const token = accessToken || await getAccessToken();
    if (!token) {
      setSyncStatus('offline');
      setSyncError('Google Account غير متصل. يرجى تسجيل الدخول بحساب Google للمزامنة.');
      return;
    }

    setSyncStatus('syncing');
    setSyncError(null);

    try {
      const inspection = await GoogleSheetsService.inspectSpreadsheet(token, spreadsheetId);
      setInspectionResult(inspection);

      if (inspection.missingSheets.length > 0 || inspection.columnIssues.length > 0) {
        await GoogleSheetsService.repairAndMigrateSpreadsheet(token, spreadsheetId, inspection);
      }

      // Sync Products (Safe non-destructive sync)
      try {
        const remoteProducts = await GoogleSheetsService.readTable(token, spreadsheetId, 'PRODUCTS');
        if (remoteProducts && Array.isArray(remoteProducts)) {
          if (remoteProducts.length > 0) {
            const parsedProducts: Product[] = remoteProducts.map(p => ({
              Product_ID: String(p.Product_ID || `PRD-${Date.now()}`),
              Internal_Reference: String(p.Internal_Reference || ''),
              Product_Name_AR: String(p.Product_Name_AR || ''),
              Product_Name_FR: String(p.Product_Name_FR || ''),
              Description: String(p.Description || ''),
              Category_ID: String(p.Category_ID || ''),
              Brand: String(p.Brand || ''),
              Image_URL: String(p.Image_URL || ''),
              Unit: String(p.Unit || 'قطعة'),
              Barcode: String(p.Barcode || ''),
              QR_Code: String(p.QR_Code || ''),
              Original_Reference: String(p.Original_Reference || ''),
              Alternative_Reference: String(p.Alternative_Reference || ''),
              First_Purchase_Price: Number(p.First_Purchase_Price) || 0,
              Last_Purchase_Price: Number(p.Last_Purchase_Price) || 0,
              Average_Purchase_Cost: Number(p.Average_Purchase_Cost) || 0,
              Last_Supplier_ID: String(p.Last_Supplier_ID || ''),
              First_Supplier_ID: String(p.First_Supplier_ID || ''),
              Profit_Type: p.Profit_Type === 'Fixed' ? 'Fixed' : 'Percentage',
              Profit_Value: Number(p.Profit_Value) || 0,
              Suggested_Selling_Price: Number(p.Suggested_Selling_Price) || 0,
              Current_Selling_Price: Number(p.Current_Selling_Price) || 0,
              Current_Stock: Number(p.Current_Stock) || 0,
              Minimum_Stock: Number(p.Minimum_Stock) || 0,
              Active: p.Active === 'true' || p.Active === true || p.Active === 'TRUE',
              Created_At: String(p.Created_At || new Date().toISOString()),
              Updated_At: String(p.Updated_At || new Date().toISOString())
            }));
            setProducts(parsedProducts);
            localStorage.setItem('storeflow_products', JSON.stringify(parsedProducts));
          } else {
            // Sheet is empty - preserve local products and populate Google Sheets
            setProducts(current => {
              if (current.length > 0) {
                GoogleSheetsService.overwriteTableData(token, spreadsheetId, 'PRODUCTS', current as any).catch(console.warn);
              }
              return current;
            });
          }
        }
      } catch (err) {
        console.warn('Could not sync products:', err);
      }

      // Sync Suppliers
      try {
        const remoteSuppliers = await GoogleSheetsService.readTable(token, spreadsheetId, 'SUPPLIERS');
        if (remoteSuppliers && Array.isArray(remoteSuppliers)) {
          if (remoteSuppliers.length > 0) {
            const parsedSuppliers: Supplier[] = remoteSuppliers.map(s => ({
              Supplier_ID: String(s.Supplier_ID || ''),
              Supplier_Name: String(s.Supplier_Name || ''),
              Commercial_Name: String(s.Commercial_Name || ''),
              Phone: String(s.Phone || ''),
              Email: String(s.Email || ''),
              Address: String(s.Address || ''),
              City: String(s.City || ''),
              Tax_ID: String(s.Tax_ID || ''),
              Notes: String(s.Notes || ''),
              Opening_Balance: Number(s.Opening_Balance) || 0,
              Current_Balance: Number(s.Current_Balance) || 0,
              Active: s.Active === 'true' || s.Active === true || s.Active === 'TRUE',
              Created_At: String(s.Created_At || new Date().toISOString())
            }));
            setSuppliers(parsedSuppliers);
            localStorage.setItem('storeflow_suppliers', JSON.stringify(parsedSuppliers));
          } else {
            setSuppliers(current => {
              if (current.length > 0) {
                GoogleSheetsService.overwriteTableData(token, spreadsheetId, 'SUPPLIERS', current as any).catch(console.warn);
              }
              return current;
            });
          }
        }
      } catch (err) {
        console.warn('Could not sync suppliers:', err);
      }

      // Sync Customers
      try {
        const remoteCustomers = await GoogleSheetsService.readTable(token, spreadsheetId, 'CUSTOMERS');
        if (remoteCustomers && Array.isArray(remoteCustomers)) {
          if (remoteCustomers.length > 0) {
            const parsedCustomers: Customer[] = remoteCustomers.map(c => ({
              Customer_ID: String(c.Customer_ID || ''),
              Customer_Name: String(c.Customer_Name || ''),
              Phone: String(c.Phone || ''),
              Email: String(c.Email || ''),
              Address: String(c.Address || ''),
              City: String(c.City || ''),
              Notes: String(c.Notes || ''),
              Opening_Balance: Number(c.Opening_Balance) || 0,
              Current_Balance: Number(c.Current_Balance) || 0,
              Created_At: String(c.Created_At || new Date().toISOString())
            }));
            if (!parsedCustomers.some(c => c.Customer_ID === 'CUST-000')) {
              parsedCustomers.unshift(INITIAL_CUSTOMER_COUNTER);
            }
            setCustomers(parsedCustomers);
            localStorage.setItem('storeflow_customers', JSON.stringify(parsedCustomers));
          } else {
            setCustomers(current => {
              if (current.length > 1) {
                GoogleSheetsService.overwriteTableData(token, spreadsheetId, 'CUSTOMERS', current as any).catch(console.warn);
              }
              return current;
            });
          }
        }
      } catch (err) {
        console.warn('Could not sync customers:', err);
      }

      // Sync Sales Invoices
      try {
        const remoteSales = await GoogleSheetsService.readTable(token, spreadsheetId, 'SALES_INVOICES');
        if (remoteSales && Array.isArray(remoteSales)) {
          if (remoteSales.length > 0) {
            const parsedSales: SalesInvoice[] = remoteSales.map(inv => ({
              Sales_Invoice_ID: String(inv.Sales_Invoice_ID || ''),
              Invoice_Number: String(inv.Invoice_Number || ''),
              Customer_ID: String(inv.Customer_ID || 'CUST-000'),
              Invoice_Date: String(inv.Invoice_Date || ''),
              Subtotal: Number(inv.Subtotal) || 0,
              Discount: Number(inv.Discount) || 0,
              Tax: Number(inv.Tax) || 0,
              Total: Number(inv.Total) || 0,
              Paid_Amount: Number(inv.Paid_Amount) || 0,
              Remaining_Amount: Number(inv.Remaining_Amount) || 0,
              Payment_Method: (inv.Payment_Method as any) || 'Cash',
              Status: (inv.Status as any) || 'Paid',
              Cashier_ID: String(inv.Cashier_ID || ''),
              Session_ID: String(inv.Session_ID || ''),
              Notes: String(inv.Notes || ''),
              Created_By: String(inv.Created_By || 'المدير العام'),
              Created_At: String(inv.Created_At || new Date().toISOString()),
              Approved_At: String(inv.Approved_At || inv.Created_At || new Date().toISOString())
            }));
            setSalesInvoices(parsedSales);
            localStorage.setItem('storeflow_sales', JSON.stringify(parsedSales));
          } else {
            setSalesInvoices(current => {
              if (current.length > 0) {
                GoogleSheetsService.overwriteTableData(token, spreadsheetId, 'SALES_INVOICES', current as any).catch(console.warn);
              }
              return current;
            });
          }
        }
      } catch (err) {
        console.warn('Could not sync sales invoices:', err);
      }

      // Sync Sales Items
      try {
        const remoteSalesItems = await GoogleSheetsService.readTable(token, spreadsheetId, 'SALES_ITEMS');
        if (remoteSalesItems && Array.isArray(remoteSalesItems)) {
          if (remoteSalesItems.length > 0) {
            const parsedItems: SalesItem[] = remoteSalesItems.map(it => ({
              Sales_Item_ID: String(it.Sales_Item_ID || ''),
              Sales_Invoice_ID: String(it.Sales_Invoice_ID || ''),
              Product_ID: String(it.Product_ID || ''),
              Product_Reference: String(it.Product_Reference || ''),
              Quantity: Number(it.Quantity) || 0,
              Unit_Price: Number(it.Unit_Price) || 0,
              Purchase_Cost_At_Sale: Number(it.Purchase_Cost_At_Sale) || 0,
              Discount: Number(it.Discount) || 0,
              Tax: Number(it.Tax) || 0,
              Total: Number(it.Total) || 0,
              Gross_Profit: Number(it.Gross_Profit) || 0,
              Created_At: String(it.Created_At || new Date().toISOString())
            }));
            setSalesItems(parsedItems);
            localStorage.setItem('storeflow_sales_items', JSON.stringify(parsedItems));
          } else {
            setSalesItems(current => {
              if (current.length > 0) {
                GoogleSheetsService.overwriteTableData(token, spreadsheetId, 'SALES_ITEMS', current as any).catch(console.warn);
              }
              return current;
            });
          }
        }
      } catch (err) {
        console.warn('Could not sync sales items:', err);
      }

      // Sync Purchase Invoices
      try {
        const remotePurchases = await GoogleSheetsService.readTable(token, spreadsheetId, 'PURCHASE_INVOICES');
        if (remotePurchases && Array.isArray(remotePurchases)) {
          if (remotePurchases.length > 0) {
            const parsedPurchases: PurchaseInvoice[] = remotePurchases.map(inv => ({
              Purchase_Invoice_ID: String(inv.Purchase_Invoice_ID || ''),
              Invoice_Number: String(inv.Invoice_Number || ''),
              Supplier_ID: String(inv.Supplier_ID || ''),
              Supplier_Invoice_Number: String(inv.Supplier_Invoice_Number || ''),
              Invoice_Date: String(inv.Invoice_Date || ''),
              Receiving_Date: String(inv.Receiving_Date || ''),
              Subtotal: Number(inv.Subtotal) || 0,
              Discount: Number(inv.Discount) || 0,
              Tax: Number(inv.Tax) || 0,
              Transport_Cost: Number(inv.Transport_Cost) || 0,
              Other_Expenses: Number(inv.Other_Expenses) || 0,
              Total: Number(inv.Total) || 0,
              Paid_Amount: Number(inv.Paid_Amount) || 0,
              Remaining_Amount: Number(inv.Remaining_Amount) || 0,
              Payment_Method: (inv.Payment_Method as any) || 'Bank_Transfer',
              Status: (inv.Status as any) || 'Paid',
              Created_By: String(inv.Created_By || ''),
              Approved_At: String(inv.Approved_At || ''),
              Created_At: String(inv.Created_At || new Date().toISOString())
            }));
            setPurchaseInvoices(parsedPurchases);
            localStorage.setItem('storeflow_purchases', JSON.stringify(parsedPurchases));
          } else {
            setPurchaseInvoices(current => {
              if (current.length > 0) {
                GoogleSheetsService.overwriteTableData(token, spreadsheetId, 'PURCHASE_INVOICES', current as any).catch(console.warn);
              }
              return current;
            });
          }
        }
      } catch (err) {
        console.warn('Could not sync purchase invoices:', err);
      }

      // Sync Purchase Items
      try {
        const remotePurchaseItems = await GoogleSheetsService.readTable(token, spreadsheetId, 'PURCHASE_ITEMS');
        if (remotePurchaseItems && Array.isArray(remotePurchaseItems)) {
          if (remotePurchaseItems.length > 0) {
            const parsedItems: PurchaseItem[] = remotePurchaseItems.map(it => ({
              Purchase_Item_ID: String(it.Purchase_Item_ID || ''),
              Purchase_Invoice_ID: String(it.Purchase_Invoice_ID || ''),
              Product_ID: String(it.Product_ID || ''),
              Supplier_Reference: String(it.Supplier_Reference || ''),
              Quantity: Number(it.Quantity) || 0,
              Unit_Price: Number(it.Unit_Price) || 0,
              Discount: Number(it.Discount) || 0,
              Tax: Number(it.Tax) || 0,
              Total: Number(it.Total) || 0,
              Unit_Cost: Number(it.Unit_Cost) || 0,
              Created_At: String(it.Created_At || new Date().toISOString())
            }));
            setPurchaseItems(parsedItems);
            localStorage.setItem('storeflow_purchase_items', JSON.stringify(parsedItems));
          } else {
            setPurchaseItems(current => {
              if (current.length > 0) {
                GoogleSheetsService.overwriteTableData(token, spreadsheetId, 'PURCHASE_ITEMS', current as any).catch(console.warn);
              }
              return current;
            });
          }
        }
      } catch (err) {
        console.warn('Could not sync purchase items:', err);
      }

      // Sync Expenses
      try {
        const remoteExpenses = await GoogleSheetsService.readTable(token, spreadsheetId, 'EXPENSES');
        if (remoteExpenses && Array.isArray(remoteExpenses)) {
          if (remoteExpenses.length > 0) {
            const parsedExpenses: Expense[] = remoteExpenses.map(e => ({
              Expense_ID: String(e.Expense_ID || ''),
              Expense_Number: String(e.Expense_Number || ''),
              Category: String(e.Category || ''),
              Description: String(e.Description || ''),
              Amount: Number(e.Amount) || 0,
              Payment_Method: (e.Payment_Method as any) || 'Cash',
              Bank_ID: String(e.Bank_ID || ''),
              Receipt_URL: String(e.Receipt_URL || ''),
              Supplier_ID: String(e.Supplier_ID || ''),
              Expense_Date: String(e.Expense_Date || e.Created_At || new Date().toISOString().slice(0, 10)),
              Attachment_URL: String(e.Attachment_URL || ''),
              User_ID: String(e.User_ID || ''),
              Created_At: String(e.Created_At || new Date().toISOString())
            }));
            setExpenses(parsedExpenses);
            localStorage.setItem('storeflow_expenses', JSON.stringify(parsedExpenses));
          } else {
            setExpenses(current => {
              if (current.length > 0) {
                GoogleSheetsService.overwriteTableData(token, spreadsheetId, 'EXPENSES', current as any).catch(console.warn);
              }
              return current;
            });
          }
        }
      } catch (err) {
        console.warn('Could not sync expenses:', err);
      }

      // Sync Bank Accounts
      try {
        const remoteBanks = await GoogleSheetsService.readTable(token, spreadsheetId, 'BANK_ACCOUNTS');
        if (remoteBanks && Array.isArray(remoteBanks)) {
          if (remoteBanks.length > 0) {
            const parsedBanks: BankAccount[] = remoteBanks.map(b => ({
              Bank_ID: String(b.Bank_ID || ''),
              Bank_Name: String(b.Bank_Name || ''),
              Account_Number: String(b.Account_Number || ''),
              Opening_Balance: Number(b.Opening_Balance) || 0,
              Current_Balance: Number(b.Current_Balance) || 0,
              Active: b.Active === 'true' || b.Active === true || b.Active === 'TRUE'
            }));
            setBankAccounts(parsedBanks);
            localStorage.setItem('storeflow_bank_accounts', JSON.stringify(parsedBanks));
          } else {
            setBankAccounts(current => {
              if (current.length > 0) {
                GoogleSheetsService.overwriteTableData(token, spreadsheetId, 'BANK_ACCOUNTS', current as any).catch(console.warn);
              }
              return current;
            });
          }
        }
      } catch (err) {
        console.warn('Could not sync bank accounts:', err);
      }

      const now = new Date().toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSyncTime(now);
      localStorage.setItem('storeflow_last_sync', now);
      setSyncStatus('synced');
    } catch (err: any) {
      console.error('Sync failed:', err);
      setSyncStatus('error');
      setSyncError(err.message || 'حدث خطأ أثناء الاتصال بـ Google Sheets');
    }
  }, [spreadsheetId, accessToken]);

  // Login With Credentials & Link directly to Google Sheets database with Google confirmation popup
  const loginWithCredentials = async (email: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    // Check credentials against admin or users table
    const isAdmin = (cleanEmail === adminEmail.toLowerCase() && cleanPass === adminPassword);
    const matchedUser = users.find(u => u.Email.toLowerCase() === cleanEmail);
    const isUserValid = matchedUser && (cleanPass === adminPassword || cleanPass === '123456');

    if (!isAdmin && !isUserValid) {
      return {
        success: false,
        message: language === 'ar'
          ? 'البريد الإلكتروني أو الرقم السري غير صحيح. يرجى التأكد من البيانات أو مراجعة الإدارة.'
          : 'Identifiants invalides. Vérifiez l’adresse e-mail et le mot de passe.'
      };
    }

    // Direct Google authentication popup to confirm and link Google Sheets data
    try {
      const gRes = await googleSignIn();
      if (!gRes || !gRes.accessToken) {
        return {
          success: false,
          message: language === 'ar'
            ? 'لم يتم استلام تفويض حساب Google. يرجى تأكيد الربط للمتابعة.'
            : 'Autorisation Google non confirmée.'
        };
      }
      setAccessToken(gRes.accessToken);
      setGoogleUser(gRes.user);
      setIsGoogleConnected(true);
      localStorage.setItem('storeflow_google_access_token', gRes.accessToken);
      localStorage.setItem('storeflow_google_user', JSON.stringify({
        uid: gRes.user.uid,
        email: gRes.user.email,
        displayName: gRes.user.displayName,
        photoURL: gRes.user.photoURL
      }));
    } catch (gErr: any) {
      console.warn('Google sign-in error:', gErr);
      if (gErr.code === 'auth/popup-closed-by-user' || gErr.code === 'auth/cancelled-popup-request') {
        return {
          success: false,
          message: language === 'ar'
            ? 'تم إغلاق نافذة Google لتأكيد الربط. يرجى الموافقة على الربط مع بيانات Google لتشغيل المزامنة وقاعدة البيانات.'
            : 'Veuillez accepter la confirmation Google pour lier la base de données.'
        };
      }
      return {
        success: false,
        message: language === 'ar'
          ? `فشل الربط بحساب Google: ${gErr.message || 'تأكد من السماح بالنوافذ المنبثقة'}`
          : `Erreur de connexion Google: ${gErr.message}`
      };
    }

    const userObj: AuthUser = {
      email: cleanEmail,
      name: isAdmin ? 'مدير النظام (Admin)' : (matchedUser?.Full_Name || cleanEmail),
      role: isAdmin ? 'Admin' : (matchedUser?.Role_ID || 'User')
    };

    setAuthUser(userObj);
    setIsAuthenticated(true);
    localStorage.setItem('storeflow_auth_user', JSON.stringify(userObj));

    addAuditLog('USER_LOGIN', 'Auth', cleanEmail, '', 'Success', `تسجيل دخول ناجح وربط مباشر بحساب Google للمستخدم ${userObj.name}`);

    // Direct Link & Sync with database file
    if (spreadsheetId) {
      syncNow().catch(console.warn);
    }

    return { success: true };
  };

  const logout = () => {
    setAuthUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('storeflow_auth_user');
  };

  // Purge dummy data
  const purgeUnregisteredData = async (): Promise<void> => {
    localStorage.removeItem('storeflow_products');
    localStorage.removeItem('storeflow_suppliers');
    localStorage.removeItem('storeflow_customers');
    localStorage.removeItem('storeflow_sales');
    localStorage.removeItem('storeflow_sales_items');
    localStorage.removeItem('storeflow_purchases');
    localStorage.removeItem('storeflow_purchase_items');
    localStorage.removeItem('storeflow_expenses');

    setProducts([]);
    setSuppliers([]);
    setCustomers([INITIAL_CUSTOMER_COUNTER]);
    setSalesInvoices([]);
    setSalesItems([]);
    setPurchaseInvoices([]);
    setPurchaseItems([]);
    setExpenses([]);
    setSupplierProductReferences([]);

    addAuditLog('PURGE_DATA', 'Database', 'SYSTEM', 'All Mock Records', 'Clean Empty', 'حذف جميع البيانات التجريبية والتطهير التام');

    if (spreadsheetId) {
      await syncNow();
    }
  };

  // Full manual push of all operations to Google Sheets
  const pushAllDataToGoogleSheets = async (): Promise<{ success: boolean; message: string; counts?: Record<string, number> }> => {
    if (!spreadsheetId) {
      return { success: false, message: 'لا يوجد ملف Google Sheets متصل حالياً' };
    }
    const token = accessToken || await getAccessToken();
    if (!token) {
      return { success: false, message: 'حساب Google غير متصل أو انتهت صلاحية الجلسة' };
    }

    try {
      setSyncStatus('syncing');
      setSyncError(null);

      // Verify and repair missing sheets or columns first
      const inspection = await GoogleSheetsService.inspectSpreadsheet(token, spreadsheetId);
      if (inspection.missingSheets.length > 0 || inspection.columnIssues.length > 0) {
        await GoogleSheetsService.repairAndMigrateSpreadsheet(token, spreadsheetId, inspection);
      }

      // Overwrite / Update every sheet table with latest active state
      await GoogleSheetsService.overwriteTableData(token, spreadsheetId, 'PRODUCTS', products as any);
      await GoogleSheetsService.overwriteTableData(token, spreadsheetId, 'SUPPLIERS', suppliers as any);
      await GoogleSheetsService.overwriteTableData(token, spreadsheetId, 'CUSTOMERS', customers as any);
      await GoogleSheetsService.overwriteTableData(token, spreadsheetId, 'SALES_INVOICES', salesInvoices as any);
      await GoogleSheetsService.overwriteTableData(token, spreadsheetId, 'SALES_ITEMS', salesItems as any);
      await GoogleSheetsService.overwriteTableData(token, spreadsheetId, 'PURCHASE_INVOICES', purchaseInvoices as any);
      await GoogleSheetsService.overwriteTableData(token, spreadsheetId, 'PURCHASE_ITEMS', purchaseItems as any);
      await GoogleSheetsService.overwriteTableData(token, spreadsheetId, 'EXPENSES', expenses as any);
      await GoogleSheetsService.overwriteTableData(token, spreadsheetId, 'BANK_ACCOUNTS', bankAccounts as any);
      await GoogleSheetsService.overwriteTableData(token, spreadsheetId, 'BANK_TRANSACTIONS', bankTransactions as any);
      await GoogleSheetsService.overwriteTableData(token, spreadsheetId, 'STORE_SETTINGS', [storeSettings] as any);
      await GoogleSheetsService.overwriteTableData(token, spreadsheetId, 'USERS', users as any);
      await GoogleSheetsService.overwriteTableData(token, spreadsheetId, 'AUDIT_LOGS', auditLogs.slice(0, 100) as any);

      // Also ensure localStorage is completely backed up
      try {
        localStorage.setItem('storeflow_products', JSON.stringify(products));
        localStorage.setItem('storeflow_suppliers', JSON.stringify(suppliers));
        localStorage.setItem('storeflow_customers', JSON.stringify(customers));
        localStorage.setItem('storeflow_sales', JSON.stringify(salesInvoices));
        localStorage.setItem('storeflow_sales_items', JSON.stringify(salesItems));
        localStorage.setItem('storeflow_purchases', JSON.stringify(purchaseInvoices));
        localStorage.setItem('storeflow_purchase_items', JSON.stringify(purchaseItems));
        localStorage.setItem('storeflow_expenses', JSON.stringify(expenses));
        localStorage.setItem('storeflow_bank_accounts', JSON.stringify(bankAccounts));
        localStorage.setItem('storeflow_bank_transactions', JSON.stringify(bankTransactions));
      } catch (storageErr) {
        console.warn('Storage backup warning:', storageErr);
      }

      const timeStr = new Date().toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSyncTime(timeStr);
      setSyncStatus('synced');

      addAuditLog('MANUAL_FULL_PUSH', 'Database', spreadsheetId, '', 'All Tables', 'مزامنة يدوية وتحديث شامل لجميع العمليات في ملف Google Sheets');

      const counts = {
        products: products.length,
        suppliers: suppliers.length,
        customers: customers.length,
        salesInvoices: salesInvoices.length,
        salesItems: salesItems.length,
        purchaseInvoices: purchaseInvoices.length,
        purchaseItems: purchaseItems.length,
        expenses: expenses.length,
        bankAccounts: bankAccounts.length,
        bankTransactions: bankTransactions.length
      };

      return {
        success: true,
        message: 'تم تسجيل وتحديث كافة العمليات في ملف Google Sheets بنجاح تام!',
        counts
      };
    } catch (err: any) {
      setSyncStatus('error');
      setSyncError(err.message || 'حدث خطأ أثناء المزامنة والتسجيل في Google Sheets');
      return {
        success: false,
        message: err.message || 'فشلت المزامنة'
      };
    }
  };

  // Background Auto-Sync Interval (every 45s)
  useEffect(() => {
    if (!autoSyncEnabled || !spreadsheetId || !isGoogleConnected) return;

    const interval = setInterval(() => {
      syncNow().catch(err => console.warn('Auto sync tick warning:', err));
    }, 45000);

    return () => clearInterval(interval);
  }, [autoSyncEnabled, spreadsheetId, isGoogleConnected, syncNow]);

  // Connect existing spreadsheet
  const connectSpreadsheet = async (idOrUrl: string): Promise<boolean> => {
    const id = GoogleSheetsService.extractSpreadsheetId(idOrUrl);
    if (!id) {
      alert('يرجى إدخال معرف ملف Google Sheets صحيح أو رابطه الكامل');
      return false;
    }

    const token = accessToken || await getAccessToken();
    if (!token) {
      alert('يرجى تسجيل الدخول بحساب Google أولاً عبر زر Connect Google Account');
      return false;
    }

    try {
      setSyncStatus('syncing');
      const inspection = await GoogleSheetsService.inspectSpreadsheet(token, id);
      setInspectionResult(inspection);

      const url = `https://docs.google.com/spreadsheets/d/${id}/edit`;
      setSpreadsheetId(id);
      setSpreadsheetTitle(inspection.spreadsheetTitle);
      setSpreadsheetUrl(url);

      localStorage.setItem('storeflow_spreadsheet_id', id);
      localStorage.setItem('storeflow_spreadsheet_title', inspection.spreadsheetTitle);
      localStorage.setItem('storeflow_spreadsheet_url', url);

      addAuditLog('CONNECT_DATABASE', 'GoogleSheets', id, '', inspection.spreadsheetTitle, `ربط ملف قاعدة البيانات: ${inspection.spreadsheetTitle}`);
      await syncNow();
      return true;
    } catch (e: any) {
      setSyncStatus('error');
      setSyncError(e.message || 'فشل الاتصال بملف Google Sheets');
      alert(`خطأ في الربط: ${e.message}`);
      return false;
    }
  };

  // Create brand new database in Google Drive
  const createNewDatabase = async (name?: string): Promise<boolean> => {
    const token = accessToken || await getAccessToken();
    if (!token) {
      alert('يرجى تسجيل الدخول بحساب Google أولاً لإنشاء قاعدة البيانات في Drive الخاص بك');
      return false;
    }

    try {
      setSyncStatus('syncing');
      const created = await GoogleSheetsService.createCompleteStoreDatabase(token, name || storeSettings.Store_Name);

      setSpreadsheetId(created.id);
      setSpreadsheetTitle(created.title);
      setSpreadsheetUrl(created.url);

      localStorage.setItem('storeflow_spreadsheet_id', created.id);
      localStorage.setItem('storeflow_spreadsheet_title', created.title);
      localStorage.setItem('storeflow_spreadsheet_url', created.url);

      const inspection = await GoogleSheetsService.inspectSpreadsheet(token, created.id);
      setInspectionResult(inspection);

      addAuditLog('CREATE_DATABASE', 'GoogleSheets', created.id, '', created.title, 'إنشاء ملف قاعدة بيانات مركزي جديد متكامل');
      setSyncStatus('synced');
      return true;
    } catch (e: any) {
      setSyncStatus('error');
      setSyncError(e.message || 'فشل إنشاء قاعدة البيانات في Google Sheets');
      alert(`خطأ في الإنشاء: ${e.message}`);
      return false;
    }
  };

  const repairDatabase = async (): Promise<boolean> => {
    if (!spreadsheetId || !inspectionResult) return false;
    const token = accessToken || await getAccessToken();
    if (!token) return false;

    try {
      setSyncStatus('syncing');
      await GoogleSheetsService.repairAndMigrateSpreadsheet(token, spreadsheetId, inspectionResult);
      const updatedInspection = await GoogleSheetsService.inspectSpreadsheet(token, spreadsheetId);
      setInspectionResult(updatedInspection);
      setSyncStatus('synced');
      alert('تم فحص وإصلاح وترقية جميع الأوراق والأعمدة الناقصة بنجاح!');
      return true;
    } catch (e: any) {
      setSyncStatus('error');
      alert(`فشل الإصلاح: ${e.message}`);
      return false;
    }
  };

  const disconnectSpreadsheet = () => {
    setSpreadsheetId(null);
    setSpreadsheetTitle('STORE MANAGEMENT DATABASE');
    setSpreadsheetUrl(null);
    setInspectionResult(null);
    localStorage.removeItem('storeflow_spreadsheet_id');
    localStorage.removeItem('storeflow_spreadsheet_title');
    localStorage.removeItem('storeflow_spreadsheet_url');
    setSyncStatus('idle');
  };

  const calculateSuggestedSellingPrice = (purchaseCost: number, profitType: 'Percentage' | 'Fixed', profitVal: number) => {
    if (profitType === 'Percentage') {
      return purchaseCost * (1 + (profitVal || 0) / 100);
    }
    return purchaseCost + (profitVal || 0);
  };

  // Product Operations
  const saveProduct = (prodData: Partial<Product>, supplierRef?: string, supplierId?: string): Product => {
    const isNew = !prodData.Product_ID;
    const now = new Date().toISOString();
    const productId = prodData.Product_ID || `PRD-${Date.now().toString().slice(-6)}`;
    const internalRef = prodData.Internal_Reference || `MAG-${Date.now().toString().slice(-6)}`;

    const firstPrice = Number(prodData.First_Purchase_Price) || Number(prodData.Last_Purchase_Price) || 0;
    const lastPrice = Number(prodData.Last_Purchase_Price) || firstPrice;
    const avgCost = Number(prodData.Average_Purchase_Cost) || lastPrice;

    const profitType = prodData.Profit_Type || 'Percentage';
    const profitVal = Number(prodData.Profit_Value) || 25;
    const suggested = calculateSuggestedSellingPrice(avgCost || lastPrice, profitType, profitVal);
    const sellingPrice = Number(prodData.Current_Selling_Price) || suggested;

    const product: Product = {
      Product_ID: productId,
      Internal_Reference: internalRef,
      Product_Name_AR: prodData.Product_Name_AR || 'منتج جديد',
      Product_Name_FR: prodData.Product_Name_FR || '',
      Description: prodData.Description || '',
      Category_ID: prodData.Category_ID || 'CAT-001',
      Brand: prodData.Brand || '',
      Image_URL: prodData.Image_URL || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80',
      Unit: prodData.Unit || 'قطعة (Pièce)',
      Barcode: prodData.Barcode || '',
      QR_Code: prodData.QR_Code || internalRef,
      Original_Reference: prodData.Original_Reference || '',
      Alternative_Reference: prodData.Alternative_Reference || '',
      First_Purchase_Price: firstPrice,
      Last_Purchase_Price: lastPrice,
      Average_Purchase_Cost: avgCost,
      Last_Supplier_ID: prodData.Last_Supplier_ID || supplierId || '',
      First_Supplier_ID: prodData.First_Supplier_ID || supplierId || '',
      Profit_Type: profitType,
      Profit_Value: profitVal,
      Suggested_Selling_Price: Math.round(suggested * 100) / 100,
      Current_Selling_Price: Math.round(sellingPrice * 100) / 100,
      Current_Stock: Number(prodData.Current_Stock) || 0,
      Minimum_Stock: Number(prodData.Minimum_Stock) || 5,
      Active: prodData.Active !== undefined ? prodData.Active : true,
      Created_At: prodData.Created_At || now,
      Updated_At: now
    };

    const idx = products.findIndex(p => p.Product_ID === productId);
    const updatedList = idx !== -1
      ? products.map((p, i) => (i === idx ? product : p))
      : [product, ...products];

    setProducts(updatedList);
    localStorage.setItem('storeflow_products', JSON.stringify(updatedList));

    if (supplierRef && supplierId) {
      const spr: SupplierProductReference = {
        ID: `SPR-${Date.now()}`,
        Product_ID: productId,
        Supplier_ID: supplierId,
        Supplier_Reference: supplierRef,
        Supplier_Product_Name: product.Product_Name_AR,
        Last_Purchase_Price: lastPrice,
        Last_Purchase_Date: now,
        Active: true,
        Created_At: now,
        Updated_At: now
      };
      setSupplierProductReferences(prev => [spr, ...prev]);
    }

    addAuditLog(isNew ? 'CREATE_PRODUCT' : 'UPDATE_PRODUCT', 'Products', productId, '', product.Product_Name_AR, `${isNew ? 'إضافة' : 'تعديل'} المنتج ${product.Internal_Reference}`);

    if (spreadsheetId) {
      getAccessToken().then(tok => {
        if (tok) GoogleSheetsService.overwriteTableData(tok, spreadsheetId, 'PRODUCTS', updatedList as any).catch(console.warn);
      });
    }

    return product;
  };

  const deleteProduct = (productId: string) => {
    const nextProducts = products.filter(p => p.Product_ID !== productId);
    setProducts(nextProducts);
    localStorage.setItem('storeflow_products', JSON.stringify(nextProducts));
    addAuditLog('DELETE_PRODUCT', 'Products', productId, '', '', `حذف المنتج ${productId}`);

    if (spreadsheetId) {
      getAccessToken().then(tok => {
        if (tok) GoogleSheetsService.overwriteTableData(tok, spreadsheetId, 'PRODUCTS', nextProducts as any).catch(console.warn);
      });
    }
  };

  const findProductByAnyCode = (rawCode: string): Product | null => {
    const code = rawCode.trim().toLowerCase();
    if (!code) return null;

    const byBarcode = products.find(p => p.Barcode && p.Barcode.toLowerCase() === code);
    if (byBarcode) return byBarcode;

    const byInternal = products.find(p => p.Internal_Reference && p.Internal_Reference.toLowerCase() === code);
    if (byInternal) return byInternal;

    const byOriginal = products.find(p => p.Original_Reference && p.Original_Reference.toLowerCase() === code);
    if (byOriginal) return byOriginal;

    const byAlt = products.find(p => p.Alternative_Reference && p.Alternative_Reference.toLowerCase() === code);
    if (byAlt) return byAlt;

    const barcodeEntry = productBarcodes.find(b => b.Barcode_Value.toLowerCase() === code);
    if (barcodeEntry) {
      const p = products.find(prod => prod.Product_ID === barcodeEntry.Product_ID);
      if (p) return p;
    }

    const suppRef = supplierProductReferences.find(s => s.Supplier_Reference.toLowerCase() === code);
    if (suppRef) {
      const p = products.find(prod => prod.Product_ID === suppRef.Product_ID);
      if (p) return p;
    }

    return null;
  };

  // Sales Invoices Operations
  const executeSaleInvoice = async (
    invoiceData: Omit<SalesInvoice, 'Sales_Invoice_ID' | 'Invoice_Number' | 'Created_At'>,
    itemsData: Omit<SalesItem, 'Sales_Item_ID' | 'Sales_Invoice_ID' | 'Created_At'>[]
  ): Promise<SalesInvoice> => {
    const now = new Date().toISOString();
    const invoiceId = `INV-${Date.now()}`;
    const invoiceNumber = `FAC-${new Date().getFullYear()}-${(salesInvoices.length + 1).toString().padStart(5, '0')}`;

    const newInvoice: SalesInvoice = {
      ...invoiceData,
      Sales_Invoice_ID: invoiceId,
      Invoice_Number: invoiceNumber,
      Created_At: now
    };

    const newItems: SalesItem[] = itemsData.map((it, idx) => ({
      ...it,
      Sales_Item_ID: `ITEM-${invoiceId}-${idx + 1}`,
      Sales_Invoice_ID: invoiceId,
      Created_At: now
    }));

    const nextSalesInvoices = [newInvoice, ...salesInvoices];
    const nextSalesItems = [...newItems, ...salesItems];

    const nextProducts = products.map(prod => {
      const it = newItems.find(item => item.Product_ID === prod.Product_ID);
      if (it) {
        return {
          ...prod,
          Current_Stock: prod.Current_Stock - it.Quantity,
          Updated_At: now
        };
      }
      return prod;
    });

    setSalesInvoices(nextSalesInvoices);
    setSalesItems(nextSalesItems);
    setProducts(nextProducts);

    localStorage.setItem('storeflow_sales', JSON.stringify(nextSalesInvoices));
    localStorage.setItem('storeflow_sales_items', JSON.stringify(nextSalesItems));
    localStorage.setItem('storeflow_products', JSON.stringify(nextProducts));

    if (newInvoice.Remaining_Amount > 0 && newInvoice.Customer_ID !== 'CUST-000') {
      const nextCustomers = customers.map(c => c.Customer_ID === newInvoice.Customer_ID ? { ...c, Current_Balance: c.Current_Balance + newInvoice.Remaining_Amount } : c);
      setCustomers(nextCustomers);
      localStorage.setItem('storeflow_customers', JSON.stringify(nextCustomers));
    }

    addAuditLog('CREATE_SALE', 'Sales', invoiceId, '', invoiceNumber, `تسجيل فاتورة بيع ${invoiceNumber} بمبلغ ${newInvoice.Total} MAD`);

    if (spreadsheetId) {
      getAccessToken().then(tok => {
        if (tok) {
          GoogleSheetsService.overwriteTableData(tok, spreadsheetId, 'SALES_INVOICES', nextSalesInvoices as any).catch(console.warn);
          GoogleSheetsService.overwriteTableData(tok, spreadsheetId, 'SALES_ITEMS', nextSalesItems as any).catch(console.warn);
          GoogleSheetsService.overwriteTableData(tok, spreadsheetId, 'PRODUCTS', nextProducts as any).catch(console.warn);
        }
      });
    }

    return newInvoice;
  };

  const editSaleInvoice = async (
    invoiceId: string,
    updatedInvoice: Partial<SalesInvoice>,
    updatedItems: SalesItem[]
  ): Promise<SalesInvoice> => {
    const existing = salesInvoices.find(inv => inv.Sales_Invoice_ID === invoiceId);
    if (!existing) throw new Error('فاتورة البيع غير موجودة');

    const oldItems = salesItems.filter(it => it.Sales_Invoice_ID === invoiceId);
    const now = new Date().toISOString();

    const mergedInvoice: SalesInvoice = {
      ...existing,
      ...updatedInvoice,
      Sales_Invoice_ID: invoiceId
    };

    let nextProducts = [...products];
    oldItems.forEach(oldIt => {
      const pIndex = nextProducts.findIndex(p => p.Product_ID === oldIt.Product_ID);
      if (pIndex !== -1) {
        nextProducts[pIndex] = { ...nextProducts[pIndex], Current_Stock: nextProducts[pIndex].Current_Stock + oldIt.Quantity };
      }
    });
    updatedItems.forEach(newIt => {
      const pIndex = nextProducts.findIndex(p => p.Product_ID === newIt.Product_ID);
      if (pIndex !== -1) {
        nextProducts[pIndex] = { ...nextProducts[pIndex], Current_Stock: nextProducts[pIndex].Current_Stock - newIt.Quantity, Updated_At: now };
      }
    });

    const nextSalesInvoices = salesInvoices.map(inv => inv.Sales_Invoice_ID === invoiceId ? mergedInvoice : inv);
    const otherItems = salesItems.filter(it => it.Sales_Invoice_ID !== invoiceId);
    const nextSalesItems = [...updatedItems, ...otherItems];

    setProducts(nextProducts);
    setSalesInvoices(nextSalesInvoices);
    setSalesItems(nextSalesItems);

    localStorage.setItem('storeflow_products', JSON.stringify(nextProducts));
    localStorage.setItem('storeflow_sales', JSON.stringify(nextSalesInvoices));
    localStorage.setItem('storeflow_sales_items', JSON.stringify(nextSalesItems));

    addAuditLog('EDIT_SALE', 'Sales', invoiceId, `${existing.Total}`, `${mergedInvoice.Total}`, `تعديل فاتورة البيع ${mergedInvoice.Invoice_Number}`);

    if (spreadsheetId) {
      const tok = await getAccessToken();
      if (tok) {
        await GoogleSheetsService.overwriteTableData(tok, spreadsheetId, 'SALES_INVOICES', nextSalesInvoices as any).catch(console.warn);
        await GoogleSheetsService.overwriteTableData(tok, spreadsheetId, 'SALES_ITEMS', nextSalesItems as any).catch(console.warn);
        await GoogleSheetsService.overwriteTableData(tok, spreadsheetId, 'PRODUCTS', nextProducts as any).catch(console.warn);
      }
    }

    return mergedInvoice;
  };

  const deleteSaleInvoice = async (invoiceId: string): Promise<boolean> => {
    const existing = salesInvoices.find(inv => inv.Sales_Invoice_ID === invoiceId);
    if (!existing) return false;

    const oldItems = salesItems.filter(it => it.Sales_Invoice_ID === invoiceId);

    let nextProducts = [...products];
    oldItems.forEach(it => {
      const pIndex = nextProducts.findIndex(p => p.Product_ID === it.Product_ID);
      if (pIndex !== -1) {
        nextProducts[pIndex] = { ...nextProducts[pIndex], Current_Stock: nextProducts[pIndex].Current_Stock + it.Quantity, Updated_At: new Date().toISOString() };
      }
    });

    if (existing.Remaining_Amount > 0 && existing.Customer_ID !== 'CUST-000') {
      const nextCustomers = customers.map(c => c.Customer_ID === existing.Customer_ID ? { ...c, Current_Balance: Math.max(0, c.Current_Balance - existing.Remaining_Amount) } : c);
      setCustomers(nextCustomers);
      localStorage.setItem('storeflow_customers', JSON.stringify(nextCustomers));
    }

    const nextSalesInvoices = salesInvoices.filter(inv => inv.Sales_Invoice_ID !== invoiceId);
    const nextSalesItems = salesItems.filter(it => it.Sales_Invoice_ID !== invoiceId);

    setProducts(nextProducts);
    setSalesInvoices(nextSalesInvoices);
    setSalesItems(nextSalesItems);

    localStorage.setItem('storeflow_products', JSON.stringify(nextProducts));
    localStorage.setItem('storeflow_sales', JSON.stringify(nextSalesInvoices));
    localStorage.setItem('storeflow_sales_items', JSON.stringify(nextSalesItems));

    addAuditLog('DELETE_SALE', 'Sales', invoiceId, existing.Invoice_Number, 'DELETED', `حذف فاتورة البيع ${existing.Invoice_Number}`);

    if (spreadsheetId) {
      const tok = await getAccessToken();
      if (tok) {
        await GoogleSheetsService.overwriteTableData(tok, spreadsheetId, 'SALES_INVOICES', nextSalesInvoices as any).catch(console.warn);
        await GoogleSheetsService.overwriteTableData(tok, spreadsheetId, 'SALES_ITEMS', nextSalesItems as any).catch(console.warn);
        await GoogleSheetsService.overwriteTableData(tok, spreadsheetId, 'PRODUCTS', nextProducts as any).catch(console.warn);
      }
    }

    return true;
  };

  // Add Payment / Settlement to Sale Invoice
  const addSalePayment = async (
    invoiceId: string,
    amount: number,
    method: 'Cash' | 'Card' | 'Bank_Transfer' | 'Cheque',
    bankId?: string
  ): Promise<SalesInvoice> => {
    const inv = salesInvoices.find(i => i.Sales_Invoice_ID === invoiceId);
    if (!inv) throw new Error('الفاتورة غير موجودة');

    const newPaid = Math.min(inv.Total, inv.Paid_Amount + amount);
    const newRemaining = Math.max(0, inv.Total - newPaid);
    const newStatus = newRemaining === 0 ? 'Paid' : 'Partially_Paid';

    const updated: SalesInvoice = {
      ...inv,
      Paid_Amount: newPaid,
      Remaining_Amount: newRemaining,
      Status: newStatus
    };

    const nextSalesInvoices = salesInvoices.map(i => i.Sales_Invoice_ID === invoiceId ? updated : i);
    setSalesInvoices(nextSalesInvoices);

    // If Bank, update bank balance & record bank transaction
    if ((method === 'Bank_Transfer' || method === 'Card') && bankAccounts.length > 0) {
      const bId = bankId || bankAccounts[0].Bank_ID;
      const bTx: BankTransaction = {
        Bank_Transaction_ID: `BTX-${Date.now()}`,
        Bank_ID: bId,
        Transaction_Type: 'SALE',
        Source_Type: 'SALE_INVOICE',
        Source_ID: invoiceId,
        Amount: amount,
        Date: new Date().toISOString(),
        Description: `أداء فاتورة بيع ${inv.Invoice_Number}`,
        User_ID: INITIAL_USER.User_ID
      };
      setBankTransactions(prev => [bTx, ...prev]);
      setBankAccounts(prev => prev.map(b => b.Bank_ID === bId ? { ...b, Current_Balance: b.Current_Balance + amount } : b));
    }

    // Customer balance reduction
    if (inv.Customer_ID !== 'CUST-000') {
      setCustomers(prev => prev.map(c => c.Customer_ID === inv.Customer_ID ? { ...c, Current_Balance: Math.max(0, c.Current_Balance - amount) } : c));
    }

    addAuditLog('SALE_PAYMENT', 'Sales', invoiceId, `${inv.Paid_Amount}`, `${newPaid}`, `تسجيل دفعة أداء لفاتورة البيع ${inv.Invoice_Number} بمبلغ ${amount} MAD`);

    if (spreadsheetId && autoSyncEnabled) {
      getAccessToken().then(tok => {
        if (tok) GoogleSheetsService.overwriteTableData(tok, spreadsheetId, 'SALES_INVOICES', nextSalesInvoices as any).catch(console.warn);
      });
    }

    return updated;
  };

  // Purchase Invoices Operations
  const executePurchaseInvoice = async (
    invoiceData: Omit<PurchaseInvoice, 'Purchase_Invoice_ID' | 'Invoice_Number' | 'Created_At'>,
    itemsData: Omit<PurchaseItem, 'Purchase_Item_ID' | 'Purchase_Invoice_ID' | 'Created_At'>[]
  ): Promise<PurchaseInvoice> => {
    const now = new Date().toISOString();
    const invoiceId = `PUR-${Date.now()}`;
    const invoiceNumber = `BL-${new Date().getFullYear()}-${(purchaseInvoices.length + 1).toString().padStart(5, '0')}`;

    const newInvoice: PurchaseInvoice = {
      ...invoiceData,
      Purchase_Invoice_ID: invoiceId,
      Invoice_Number: invoiceNumber,
      Created_At: now
    };

    const newItems: PurchaseItem[] = itemsData.map((it, idx) => ({
      ...it,
      Purchase_Item_ID: `PITEM-${invoiceId}-${idx + 1}`,
      Purchase_Invoice_ID: invoiceId,
      Created_At: now
    }));

    const nextPurchases = [newInvoice, ...purchaseInvoices];
    const nextPurchaseItems = [...newItems, ...purchaseItems];

    const nextProducts = products.map(prod => {
      const item = newItems.find(it => it.Product_ID === prod.Product_ID);
      if (item) {
        const oldStock = Math.max(prod.Current_Stock, 0);
        const oldCost = prod.Average_Purchase_Cost || prod.Last_Purchase_Price || item.Unit_Cost;
        const newQty = item.Quantity;
        const newCost = item.Unit_Cost || item.Unit_Price;

        const totalStock = oldStock + newQty;
        const weightedCost = totalStock > 0 ? ((oldStock * oldCost) + (newQty * newCost)) / totalStock : newCost;
        const suggested = calculateSuggestedSellingPrice(newCost, prod.Profit_Type, prod.Profit_Value);

        return {
          ...prod,
          First_Purchase_Price: prod.First_Purchase_Price || newCost,
          Last_Purchase_Price: newCost,
          Average_Purchase_Cost: Math.round(weightedCost * 100) / 100,
          Last_Supplier_ID: newInvoice.Supplier_ID,
          Suggested_Selling_Price: Math.round(suggested * 100) / 100,
          Current_Stock: prod.Current_Stock + newQty,
          Updated_At: now
        };
      }
      return prod;
    });

    setPurchaseInvoices(nextPurchases);
    setPurchaseItems(nextPurchaseItems);
    setProducts(nextProducts);

    localStorage.setItem('storeflow_purchases', JSON.stringify(nextPurchases));
    localStorage.setItem('storeflow_purchase_items', JSON.stringify(nextPurchaseItems));
    localStorage.setItem('storeflow_products', JSON.stringify(nextProducts));

    if (newInvoice.Remaining_Amount > 0) {
      const nextSuppliers = suppliers.map(s => s.Supplier_ID === newInvoice.Supplier_ID ? { ...s, Current_Balance: s.Current_Balance + newInvoice.Remaining_Amount } : s);
      setSuppliers(nextSuppliers);
      localStorage.setItem('storeflow_suppliers', JSON.stringify(nextSuppliers));
    }

    addAuditLog('CREATE_PURCHASE', 'Purchases', invoiceId, '', invoiceNumber, `تسجيل فاتورة شراء ${invoiceNumber} بمبلغ ${newInvoice.Total} MAD`);

    if (spreadsheetId) {
      getAccessToken().then(tok => {
        if (tok) {
          GoogleSheetsService.overwriteTableData(tok, spreadsheetId, 'PURCHASE_INVOICES', nextPurchases as any).catch(console.warn);
          GoogleSheetsService.overwriteTableData(tok, spreadsheetId, 'PURCHASE_ITEMS', nextPurchaseItems as any).catch(console.warn);
          GoogleSheetsService.overwriteTableData(tok, spreadsheetId, 'PRODUCTS', nextProducts as any).catch(console.warn);
        }
      });
    }

    return newInvoice;
  };

  const editPurchaseInvoice = async (
    invoiceId: string,
    updatedInvoice: Partial<PurchaseInvoice>,
    updatedItems: PurchaseItem[]
  ): Promise<PurchaseInvoice> => {
    const existing = purchaseInvoices.find(inv => inv.Purchase_Invoice_ID === invoiceId);
    if (!existing) throw new Error('فاتورة الشراء غير موجودة');

    const oldItems = purchaseItems.filter(it => it.Purchase_Invoice_ID === invoiceId);
    const now = new Date().toISOString();

    const mergedInvoice: PurchaseInvoice = {
      ...existing,
      ...updatedInvoice,
      Purchase_Invoice_ID: invoiceId
    };

    let nextProducts = [...products];
    oldItems.forEach(oldIt => {
      const pIndex = nextProducts.findIndex(p => p.Product_ID === oldIt.Product_ID);
      if (pIndex !== -1) {
        nextProducts[pIndex] = { ...nextProducts[pIndex], Current_Stock: nextProducts[pIndex].Current_Stock - oldIt.Quantity };
      }
    });
    updatedItems.forEach(newIt => {
      const pIndex = nextProducts.findIndex(p => p.Product_ID === newIt.Product_ID);
      if (pIndex !== -1) {
        nextProducts[pIndex] = {
          ...nextProducts[pIndex],
          Current_Stock: nextProducts[pIndex].Current_Stock + newIt.Quantity,
          Last_Purchase_Price: newIt.Unit_Cost || newIt.Unit_Price,
          Updated_At: now
        };
      }
    });

    const nextPurchases = purchaseInvoices.map(inv => inv.Purchase_Invoice_ID === invoiceId ? mergedInvoice : inv);
    const otherItems = purchaseItems.filter(it => it.Purchase_Invoice_ID !== invoiceId);
    const nextPurchaseItems = [...updatedItems, ...otherItems];

    setProducts(nextProducts);
    setPurchaseInvoices(nextPurchases);
    setPurchaseItems(nextPurchaseItems);

    localStorage.setItem('storeflow_products', JSON.stringify(nextProducts));
    localStorage.setItem('storeflow_purchases', JSON.stringify(nextPurchases));
    localStorage.setItem('storeflow_purchase_items', JSON.stringify(nextPurchaseItems));

    addAuditLog('EDIT_PURCHASE', 'Purchases', invoiceId, `${existing.Total}`, `${mergedInvoice.Total}`, `تعديل فاتورة الشراء ${mergedInvoice.Invoice_Number}`);

    if (spreadsheetId) {
      const tok = await getAccessToken();
      if (tok) {
        await GoogleSheetsService.overwriteTableData(tok, spreadsheetId, 'PURCHASE_INVOICES', nextPurchases as any).catch(console.warn);
        await GoogleSheetsService.overwriteTableData(tok, spreadsheetId, 'PURCHASE_ITEMS', nextPurchaseItems as any).catch(console.warn);
        await GoogleSheetsService.overwriteTableData(tok, spreadsheetId, 'PRODUCTS', nextProducts as any).catch(console.warn);
      }
    }

    return mergedInvoice;
  };

  const deletePurchaseInvoice = async (invoiceId: string): Promise<boolean> => {
    const existing = purchaseInvoices.find(inv => inv.Purchase_Invoice_ID === invoiceId);
    if (!existing) return false;

    const oldItems = purchaseItems.filter(it => it.Purchase_Invoice_ID === invoiceId);

    let nextProducts = [...products];
    oldItems.forEach(it => {
      const pIndex = nextProducts.findIndex(p => p.Product_ID === it.Product_ID);
      if (pIndex !== -1) {
        nextProducts[pIndex] = { ...nextProducts[pIndex], Current_Stock: Math.max(0, nextProducts[pIndex].Current_Stock - it.Quantity), Updated_At: new Date().toISOString() };
      }
    });

    if (existing.Remaining_Amount > 0) {
      const nextSuppliers = suppliers.map(s => s.Supplier_ID === existing.Supplier_ID ? { ...s, Current_Balance: Math.max(0, s.Current_Balance - existing.Remaining_Amount) } : s);
      setSuppliers(nextSuppliers);
      localStorage.setItem('storeflow_suppliers', JSON.stringify(nextSuppliers));
    }

    const nextPurchases = purchaseInvoices.filter(inv => inv.Purchase_Invoice_ID !== invoiceId);
    const nextPurchaseItems = purchaseItems.filter(it => it.Purchase_Invoice_ID !== invoiceId);

    setProducts(nextProducts);
    setPurchaseInvoices(nextPurchases);
    setPurchaseItems(nextPurchaseItems);

    localStorage.setItem('storeflow_products', JSON.stringify(nextProducts));
    localStorage.setItem('storeflow_purchases', JSON.stringify(nextPurchases));
    localStorage.setItem('storeflow_purchase_items', JSON.stringify(nextPurchaseItems));

    addAuditLog('DELETE_PURCHASE', 'Purchases', invoiceId, existing.Invoice_Number, 'DELETED', `حذف فاتورة الشراء ${existing.Invoice_Number}`);

    if (spreadsheetId) {
      const tok = await getAccessToken();
      if (tok) {
        await GoogleSheetsService.overwriteTableData(tok, spreadsheetId, 'PURCHASE_INVOICES', nextPurchases as any).catch(console.warn);
        await GoogleSheetsService.overwriteTableData(tok, spreadsheetId, 'PURCHASE_ITEMS', nextPurchaseItems as any).catch(console.warn);
        await GoogleSheetsService.overwriteTableData(tok, spreadsheetId, 'PRODUCTS', nextProducts as any).catch(console.warn);
      }
    }

    return true;
  };

  // Add Payment / Settle Purchase Invoice
  const addPurchasePayment = async (
    invoiceId: string,
    amount: number,
    method: 'Cash' | 'Card' | 'Bank_Transfer' | 'Cheque',
    bankId?: string
  ): Promise<PurchaseInvoice> => {
    const inv = purchaseInvoices.find(i => i.Purchase_Invoice_ID === invoiceId);
    if (!inv) throw new Error('فاتورة الشراء غير موجودة');

    const newPaid = Math.min(inv.Total, inv.Paid_Amount + amount);
    const newRemaining = Math.max(0, inv.Total - newPaid);
    const newStatus = newRemaining === 0 ? 'Paid' : 'Partially_Paid';

    const updated: PurchaseInvoice = {
      ...inv,
      Paid_Amount: newPaid,
      Remaining_Amount: newRemaining,
      Status: newStatus
    };

    const nextPurchases = purchaseInvoices.map(i => i.Purchase_Invoice_ID === invoiceId ? updated : i);
    setPurchaseInvoices(nextPurchases);
    localStorage.setItem('storeflow_purchases', JSON.stringify(nextPurchases));

    if (method === 'Bank_Transfer' || method === 'Card') {
      const bId = bankId || bankAccounts[0]?.Bank_ID;
      if (bId) {
        const bTx: BankTransaction = {
          Bank_Transaction_ID: `BTX-${Date.now()}`,
          Bank_ID: bId,
          Transaction_Type: 'PURCHASE',
          Source_Type: 'PURCHASE_INVOICE',
          Source_ID: invoiceId,
          Amount: amount,
          Date: new Date().toISOString(),
          Description: `أداء فاتورة مورد ${inv.Invoice_Number}`,
          User_ID: INITIAL_USER.User_ID
        };
        const nextTx = [bTx, ...bankTransactions];
        const nextBanks = bankAccounts.map(b => b.Bank_ID === bId ? { ...b, Current_Balance: b.Current_Balance - amount } : b);
        setBankTransactions(nextTx);
        setBankAccounts(nextBanks);
        localStorage.setItem('storeflow_bank_accounts', JSON.stringify(nextBanks));
        if (spreadsheetId) {
          getAccessToken().then(tok => {
            if (tok) GoogleSheetsService.overwriteTableData(tok, spreadsheetId, 'BANK_ACCOUNTS', nextBanks as any).catch(console.warn);
          });
        }
      }
    }

    const nextSuppliers = suppliers.map(s => s.Supplier_ID === inv.Supplier_ID ? { ...s, Current_Balance: Math.max(0, s.Current_Balance - amount) } : s);
    setSuppliers(nextSuppliers);
    localStorage.setItem('storeflow_suppliers', JSON.stringify(nextSuppliers));

    addAuditLog('PURCHASE_PAYMENT', 'Purchases', invoiceId, `${inv.Paid_Amount}`, `${newPaid}`, `أداء دفعة للمورد عن فاتورة ${inv.Invoice_Number} بمبلغ ${amount} MAD`);

    if (spreadsheetId) {
      getAccessToken().then(tok => {
        if (tok) GoogleSheetsService.overwriteTableData(tok, spreadsheetId, 'PURCHASE_INVOICES', nextPurchases as any).catch(console.warn);
      });
    }

    return updated;
  };

  // Bank Management Operations
  const saveBankAccount = (bankData: Partial<BankAccount>) => {
    const isNew = !bankData.Bank_ID;
    const bankId = bankData.Bank_ID || `BANK-${Date.now().toString().slice(-4)}`;
    const bank: BankAccount = {
      Bank_ID: bankId,
      Bank_Name: bankData.Bank_Name || 'حساب بنكي جديد',
      Account_Number: bankData.Account_Number || '',
      Opening_Balance: Number(bankData.Opening_Balance) || 0,
      Current_Balance: Number(bankData.Current_Balance) || Number(bankData.Opening_Balance) || 0,
      Active: bankData.Active !== undefined ? bankData.Active : true
    };

    const idx = bankAccounts.findIndex(b => b.Bank_ID === bankId);
    let nextBanks: BankAccount[];
    if (idx !== -1) {
      nextBanks = [...bankAccounts];
      nextBanks[idx] = bank;
    } else {
      nextBanks = [bank, ...bankAccounts];
    }
    setBankAccounts(nextBanks);
    try { localStorage.setItem('storeflow_bank_accounts', JSON.stringify(nextBanks)); } catch {}

    addAuditLog(isNew ? 'CREATE_BANK' : 'UPDATE_BANK', 'Banking', bankId, '', bank.Bank_Name, `حفظ الحساب البنكي ${bank.Bank_Name}`);

    if (spreadsheetId) {
      getAccessToken().then(tok => {
        if (tok) GoogleSheetsService.overwriteTableData(tok, spreadsheetId, 'BANK_ACCOUNTS', nextBanks as any).catch(console.warn);
      });
    }
  };

  const deleteBankAccount = (bankId: string) => {
    const nextBanks = bankAccounts.filter(b => b.Bank_ID !== bankId);
    setBankAccounts(nextBanks);
    try { localStorage.setItem('storeflow_bank_accounts', JSON.stringify(nextBanks)); } catch {}

    addAuditLog('DELETE_BANK', 'Banking', bankId, '', 'DELETED', `حذف الحساب البنكي ${bankId}`);

    if (spreadsheetId) {
      getAccessToken().then(tok => {
        if (tok) GoogleSheetsService.overwriteTableData(tok, spreadsheetId, 'BANK_ACCOUNTS', nextBanks as any).catch(console.warn);
      });
    }
  };

  const saveBankTransaction = (txData: Partial<BankTransaction>) => {
    const isNew = !txData.Bank_Transaction_ID;
    const txId = txData.Bank_Transaction_ID || `BTX-${Date.now()}`;
    const amount = Number(txData.Amount) || 0;
    const bankId = txData.Bank_ID || (bankAccounts[0]?.Bank_ID || 'BANK-001');

    const tx: BankTransaction = {
      Bank_Transaction_ID: txId,
      Bank_ID: bankId,
      Transaction_Type: txData.Transaction_Type || 'DEPOSIT',
      Source_Type: txData.Source_Type || 'MANUAL',
      Source_ID: txData.Source_ID || 'MANUAL',
      Amount: amount,
      Date: txData.Date || new Date().toISOString(),
      Description: txData.Description || 'حركة بنكية',
      User_ID: INITIAL_USER.User_ID
    };

    const nextTx = [tx, ...bankTransactions];
    setBankTransactions(nextTx);
    try { localStorage.setItem('storeflow_bank_transactions', JSON.stringify(nextTx)); } catch {}

    // Update account balance synchronously
    const nextBanks = bankAccounts.map(b => {
      if (b.Bank_ID === bankId) {
        const delta = (tx.Transaction_Type === 'DEPOSIT' || tx.Transaction_Type === 'SALE') ? amount : -amount;
        return { ...b, Current_Balance: b.Current_Balance + delta };
      }
      return b;
    });
    setBankAccounts(nextBanks);
    try { localStorage.setItem('storeflow_bank_accounts', JSON.stringify(nextBanks)); } catch {}

    addAuditLog('BANK_TRANSACTION', 'Banking', txId, '', `${amount}`, `تسجيل حركة بنكية (${tx.Transaction_Type}): ${amount} MAD`);

    if (spreadsheetId) {
      getAccessToken().then(tok => {
        if (tok) {
          GoogleSheetsService.overwriteTableData(tok, spreadsheetId, 'BANK_ACCOUNTS', nextBanks as any).catch(console.warn);
        }
      });
    }
  };

  const deleteBankTransaction = (txId: string) => {
    const tx = bankTransactions.find(t => t.Bank_Transaction_ID === txId);
    if (!tx) return;

    const nextTx = bankTransactions.filter(t => t.Bank_Transaction_ID !== txId);
    setBankTransactions(nextTx);
    try { localStorage.setItem('storeflow_bank_transactions', JSON.stringify(nextTx)); } catch {}

    // Revert bank balance
    const nextBanks = bankAccounts.map(b => {
      if (b.Bank_ID === tx.Bank_ID) {
        const reverseDelta = (tx.Transaction_Type === 'DEPOSIT' || tx.Transaction_Type === 'SALE') ? -tx.Amount : tx.Amount;
        return { ...b, Current_Balance: b.Current_Balance + reverseDelta };
      }
      return b;
    });
    setBankAccounts(nextBanks);
    try { localStorage.setItem('storeflow_bank_accounts', JSON.stringify(nextBanks)); } catch {}

    addAuditLog('DELETE_BANK_TX', 'Banking', txId, `${tx.Amount}`, 'DELETED', `إلغاء وحذف الحركة البنكية ${txId}`);

    if (spreadsheetId) {
      getAccessToken().then(tok => {
        if (tok) {
          GoogleSheetsService.overwriteTableData(tok, spreadsheetId, 'BANK_ACCOUNTS', nextBanks as any).catch(console.warn);
        }
      });
    }
  };

  // Stock Adjustment
  const createStockAdjustment = (productId: string, newQty: number, reason: string) => {
    const prod = products.find(p => p.Product_ID === productId);
    if (!prod) return;

    const oldQty = prod.Current_Stock;
    const diff = newQty - oldQty;
    const now = new Date().toISOString();

    const adj: StockAdjustment = {
      Adjustment_ID: `ADJ-${Date.now()}`,
      Product_ID: productId,
      Old_Quantity: oldQty,
      New_Quantity: newQty,
      Difference: diff,
      Reason: reason,
      Adjustment_Date: now,
      User_ID: INITIAL_USER.User_ID,
      Approved_By: INITIAL_USER.Full_Name
    };

    setStockAdjustments(prev => [adj, ...prev]);

    let nextProducts: Product[] = [];
    setProducts(prev => {
      nextProducts = prev.map(p => p.Product_ID === productId ? { ...p, Current_Stock: newQty, Updated_At: now } : p);
      return nextProducts;
    });

    addAuditLog('STOCK_ADJUSTMENT', 'Inventory', productId, `${oldQty}`, `${newQty}`, `تسوية مخزون ${prod.Product_Name_AR}`);

    if (spreadsheetId && autoSyncEnabled) {
      getAccessToken().then(tok => {
        if (tok) GoogleSheetsService.overwriteTableData(tok, spreadsheetId, 'PRODUCTS', nextProducts as any).catch(console.warn);
      });
    }
  };

  // Process Return
  const processReturn = (
    returnData: Omit<ReturnRecord, 'Return_ID'>,
    itemsData: Omit<ReturnItem, 'Return_Item_ID' | 'Return_ID'>[]
  ) => {
    const returnId = `RET-${Date.now()}`;
    const now = new Date().toISOString();

    const newReturn: ReturnRecord = {
      ...returnData,
      Return_ID: returnId
    };

    const newItems: ReturnItem[] = itemsData.map((it, idx) => ({
      ...it,
      Return_Item_ID: `RIT-${returnId}-${idx + 1}`,
      Return_ID: returnId
    }));

    setReturns(prev => [newReturn, ...prev]);
    setReturnItems(prev => [...newItems, ...prev]);

    let nextProducts: Product[] = [];
    setProducts(prev => {
      nextProducts = [...prev];
      newItems.forEach(item => {
        const idx = nextProducts.findIndex(p => p.Product_ID === item.Product_ID);
        if (idx !== -1) {
          const current = nextProducts[idx].Current_Stock;
          const adjusted = newReturn.Return_Type === 'CUSTOMER_RETURN'
            ? current + item.Quantity
            : current - item.Quantity;
          nextProducts[idx] = { ...nextProducts[idx], Current_Stock: adjusted, Updated_At: now };
        }
      });
      return nextProducts;
    });

    addAuditLog('PROCESS_RETURN', 'Returns', returnId, '', newReturn.Return_Type, `معالجة مرتجع بمبلغ ${newReturn.Total_Amount} MAD`);

    if (spreadsheetId && autoSyncEnabled) {
      getAccessToken().then(tok => {
        if (tok) GoogleSheetsService.overwriteTableData(tok, spreadsheetId, 'PRODUCTS', nextProducts as any).catch(console.warn);
      });
    }
  };

  // Cash Session Management
  const openCashSession = (openingBalance: number): CashSession => {
    const session: CashSession = {
      Session_ID: `CASH-${Date.now()}`,
      Opening_Balance: openingBalance,
      Closing_Balance: 0,
      Expected_Balance: openingBalance,
      Difference: 0,
      Opened_By: authUser?.name || INITIAL_USER.Full_Name,
      Closed_By: '',
      Opened_At: new Date().toISOString(),
      Closed_At: '',
      Status: 'Open'
    };

    setCashSessions(prev => [session, ...prev.map(s => s.Status === 'Open' ? { ...s, Status: 'Closed' as const, Closed_At: new Date().toISOString() } : s)]);
    addAuditLog('OPEN_CASH_SESSION', 'Cash', session.Session_ID, '', `${openingBalance}`, `فتح وردية صندوق جديدة: ${openingBalance} MAD`);
    return session;
  };

  const closeCashSession = (closingBalance: number): CashSession => {
    if (!activeCashSession) throw new Error('لا توجد جلسة صندوق مفتوحة حالياً');

    const totalSales = cashTransactions.filter(t => t.Session_ID === activeCashSession.Session_ID && t.Transaction_Type === 'SALE').reduce((a, b) => a + b.Amount, 0);
    const totalExpenses = cashTransactions.filter(t => t.Session_ID === activeCashSession.Session_ID && t.Transaction_Type === 'EXPENSE').reduce((a, b) => a + b.Amount, 0);
    const totalDeposits = cashTransactions.filter(t => t.Session_ID === activeCashSession.Session_ID && t.Transaction_Type === 'DEPOSIT').reduce((a, b) => a + b.Amount, 0);
    const totalWithdrawals = cashTransactions.filter(t => t.Session_ID === activeCashSession.Session_ID && t.Transaction_Type === 'WITHDRAWAL').reduce((a, b) => a + b.Amount, 0);

    const expected = activeCashSession.Opening_Balance + totalSales + totalDeposits - totalExpenses - totalWithdrawals;
    const diff = closingBalance - expected;

    const updated: CashSession = {
      ...activeCashSession,
      Closing_Balance: closingBalance,
      Expected_Balance: expected,
      Difference: diff,
      Closed_By: authUser?.name || INITIAL_USER.Full_Name,
      Closed_At: new Date().toISOString(),
      Status: 'Closed'
    };

    setCashSessions(prev => prev.map(s => s.Session_ID === updated.Session_ID ? updated : s));
    addAuditLog('CLOSE_CASH_SESSION', 'Cash', updated.Session_ID, `${expected}`, `${closingBalance}`, `إغلاق الصندوق الفعلي: ${closingBalance} MAD`);
    return updated;
  };

  const recordCashTransaction = (type: 'DEPOSIT' | 'WITHDRAWAL', amount: number, description: string) => {
    if (!activeCashSession) {
      alert('يرجى فتح جلسة الصندوق أولاً');
      return;
    }
    const tx: CashTransaction = {
      Transaction_ID: `CTX-${Date.now()}`,
      Session_ID: activeCashSession.Session_ID,
      Transaction_Type: type,
      Source_Type: 'MANUAL',
      Source_ID: 'MANUAL',
      Amount: amount,
      Date: new Date().toISOString(),
      User_ID: INITIAL_USER.User_ID,
      Description: description
    };
    setCashTransactions(prev => [tx, ...prev]);
  };

  const recordExpense = (expData: Omit<Expense, 'Expense_ID' | 'Expense_Number' | 'Created_At'>) => {
    const expenseId = `EXP-${Date.now()}`;
    const expNum = `DEP-${(expenses.length + 1).toString().padStart(4, '0')}`;
    const now = new Date().toISOString();

    const expense: Expense = {
      ...expData,
      Expense_ID: expenseId,
      Expense_Number: expNum,
      Created_At: now
    };

    const nextExpenses = [expense, ...expenses];
    setExpenses(nextExpenses);
    try { localStorage.setItem('storeflow_expenses', JSON.stringify(nextExpenses)); } catch {}

    if (expense.Payment_Method === 'Cash' && activeCashSession) {
      const cTx: CashTransaction = {
        Transaction_ID: `CTX-${Date.now()}`,
        Session_ID: activeCashSession.Session_ID,
        Transaction_Type: 'EXPENSE',
        Source_Type: 'EXPENSE',
        Source_ID: expenseId,
        Amount: expense.Amount,
        Date: now,
        User_ID: INITIAL_USER.User_ID,
        Description: `مصروف: ${expense.Category} - ${expense.Description}`
      };
      setCashTransactions(prev => [cTx, ...prev]);
    }

    addAuditLog('RECORD_EXPENSE', 'Expenses', expenseId, '', `${expense.Amount}`, `تسجيل مصروف ${expense.Category}: ${expense.Amount} MAD`);

    if (spreadsheetId) {
      getAccessToken().then(tok => {
        if (tok) GoogleSheetsService.overwriteTableData(tok, spreadsheetId, 'EXPENSES', nextExpenses as any).catch(console.warn);
      });
    }
  };

  const saveSupplier = (suppData: Partial<Supplier>) => {
    const isNew = !suppData.Supplier_ID;
    const suppId = suppData.Supplier_ID || `SUP-${Date.now().toString().slice(-4)}`;
    const supplier: Supplier = {
      Supplier_ID: suppId,
      Supplier_Name: suppData.Supplier_Name || 'مورد جديد',
      Commercial_Name: suppData.Commercial_Name || '',
      Phone: suppData.Phone || '',
      Email: suppData.Email || '',
      Address: suppData.Address || '',
      City: suppData.City || '',
      Tax_ID: suppData.Tax_ID || '',
      Notes: suppData.Notes || '',
      Opening_Balance: Number(suppData.Opening_Balance) || 0,
      Current_Balance: Number(suppData.Current_Balance) || 0,
      Active: suppData.Active !== undefined ? suppData.Active : true,
      Created_At: suppData.Created_At || new Date().toISOString()
    };

    const idx = suppliers.findIndex(s => s.Supplier_ID === suppId);
    let nextSuppliers: Supplier[];
    if (idx !== -1) {
      nextSuppliers = [...suppliers];
      nextSuppliers[idx] = supplier;
    } else {
      nextSuppliers = [supplier, ...suppliers];
    }
    setSuppliers(nextSuppliers);
    try { localStorage.setItem('storeflow_suppliers', JSON.stringify(nextSuppliers)); } catch {}

    addAuditLog(isNew ? 'CREATE_SUPPLIER' : 'UPDATE_SUPPLIER', 'Suppliers', suppId, '', supplier.Supplier_Name, `حفظ بيانات المورد ${supplier.Supplier_Name}`);

    if (spreadsheetId) {
      getAccessToken().then(tok => {
        if (tok) GoogleSheetsService.overwriteTableData(tok, spreadsheetId, 'SUPPLIERS', nextSuppliers as any).catch(console.warn);
      });
    }
  };

  const saveCustomer = (custData: Partial<Customer>) => {
    const isNew = !custData.Customer_ID;
    const custId = custData.Customer_ID || `CUST-${Date.now().toString().slice(-4)}`;
    const customer: Customer = {
      Customer_ID: custId,
      Customer_Name: custData.Customer_Name || 'زبون جديد',
      Phone: custData.Phone || '',
      Email: custData.Email || '',
      Address: custData.Address || '',
      City: custData.City || '',
      Notes: custData.Notes || '',
      Opening_Balance: Number(custData.Opening_Balance) || 0,
      Current_Balance: Number(custData.Current_Balance) || 0,
      Created_At: custData.Created_At || new Date().toISOString()
    };

    const idx = customers.findIndex(c => c.Customer_ID === custId);
    let nextCustomers: Customer[];
    if (idx !== -1) {
      nextCustomers = [...customers];
      nextCustomers[idx] = customer;
    } else {
      nextCustomers = [customer, ...customers];
    }
    setCustomers(nextCustomers);
    try { localStorage.setItem('storeflow_customers', JSON.stringify(nextCustomers)); } catch {}

    addAuditLog(isNew ? 'CREATE_CUSTOMER' : 'UPDATE_CUSTOMER', 'Customers', custId, '', customer.Customer_Name, `حفظ بيانات العميل ${customer.Customer_Name}`);

    if (spreadsheetId) {
      getAccessToken().then(tok => {
        if (tok) GoogleSheetsService.overwriteTableData(tok, spreadsheetId, 'CUSTOMERS', nextCustomers as any).catch(console.warn);
      });
    }
  };

  const updateStoreSettings = (partial: Partial<StoreSettings>) => {
    const updated = {
      ...storeSettings,
      ...partial,
      Updated_At: new Date().toISOString()
    };
    setStoreSettings(updated);

    if (spreadsheetId && autoSyncEnabled) {
      getAccessToken().then(tok => {
        if (tok) GoogleSheetsService.overwriteTableData(tok, spreadsheetId, 'STORE_SETTINGS', [updated as any]).catch(console.warn);
      });
    }
  };

  return (
    <StoreContext.Provider
      value={{
        theme,
        toggleTheme,
        language,
        setLanguage,
        activeView,
        setActiveView,

        isAuthenticated,
        authUser,
        adminEmail,
        adminPassword,
        loginWithCredentials,
        logout,
        updateAdminCredentials,

        isGoogleConnected,
        googleUser,
        spreadsheetId,
        spreadsheetTitle,
        spreadsheetUrl,
        syncStatus,
        lastSyncTime,
        syncError,
        inspectionResult,
        connectSpreadsheet,
        createNewDatabase,
        repairDatabase,
        syncNow,
        pushAllDataToGoogleSheets,
        purgeUnregisteredData,
        disconnectSpreadsheet,
        loginGoogle,
        logoutGoogle,
        autoSyncEnabled,
        toggleAutoSync,

        storeSettings,
        updateStoreSettings,
        users,
        roles,
        permissions,
        rolePermissions,
        auditLogs,
        products,
        productReferences,
        supplierProductReferences,
        productBarcodes,
        productSerialNumbers,
        categories,
        suppliers,
        customers,
        purchaseInvoices,
        purchaseItems,
        salesInvoices,
        salesItems,
        stockMovements,
        stockAdjustments,
        returns,
        returnItems,
        cashSessions,
        activeCashSession,
        cashTransactions,
        bankAccounts,
        bankTransactions,
        expenses,
        financialTransactions,
        journalEntries,
        journalEntryLines,
        priceHistory,

        saveProduct,
        deleteProduct,
        executeSaleInvoice,
        editSaleInvoice,
        deleteSaleInvoice,
        addSalePayment,

        executePurchaseInvoice,
        editPurchaseInvoice,
        deletePurchaseInvoice,
        addPurchasePayment,

        createStockAdjustment,
        processReturn,
        openCashSession,
        closeCashSession,
        recordExpense,
        saveSupplier,
        saveCustomer,
        saveBankAccount,
        deleteBankAccount,
        saveBankTransaction,
        deleteBankTransaction,
        recordCashTransaction,
        findProductByAnyCode
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
