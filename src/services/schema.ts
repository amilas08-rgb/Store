/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const SCHEMA_VERSION = '1.0.0';

export interface ColumnDef {
  name: string;
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'DATE' | 'CURRENCY';
  required: boolean;
}

export interface TableDef {
  name: string;
  columns: ColumnDef[];
  description: string;
}

export const TABLE_DEFINITIONS: Record<string, TableDef> = {
  STORE_SETTINGS: {
    name: 'STORE_SETTINGS',
    description: 'إعدادات وهوية المحل وبيانات الفاتورة',
    columns: [
      { name: 'Setting_ID', type: 'STRING', required: true },
      { name: 'Store_Name', type: 'STRING', required: true },
      { name: 'Commercial_Name', type: 'STRING', required: true },
      { name: 'Logo_URL', type: 'STRING', required: false },
      { name: 'App_Icon_URL', type: 'STRING', required: false },
      { name: 'Business_Type', type: 'STRING', required: false },
      { name: 'Address', type: 'STRING', required: false },
      { name: 'City', type: 'STRING', required: false },
      { name: 'Phone', type: 'STRING', required: false },
      { name: 'Email', type: 'STRING', required: false },
      { name: 'Tax_ID', type: 'STRING', required: false },
      { name: 'Legal_Info', type: 'STRING', required: false },
      { name: 'Currency', type: 'STRING', required: true },
      { name: 'Default_Language', type: 'STRING', required: true },
      { name: 'Invoice_Language', type: 'STRING', required: true },
      { name: 'Theme_Color', type: 'STRING', required: false },
      { name: 'Secondary_Color', type: 'STRING', required: false },
      { name: 'Dark_Mode', type: 'BOOLEAN', required: false },
      { name: 'Invoice_Conditions', type: 'STRING', required: false },
      { name: 'Invoice_Footer', type: 'STRING', required: false },
      { name: 'Created_At', type: 'DATE', required: true },
      { name: 'Updated_At', type: 'DATE', required: true }
    ]
  },
  USERS: {
    name: 'USERS',
    description: 'المستخدمون',
    columns: [
      { name: 'User_ID', type: 'STRING', required: true },
      { name: 'Full_Name', type: 'STRING', required: true },
      { name: 'Email', type: 'STRING', required: true },
      { name: 'Role_ID', type: 'STRING', required: true },
      { name: 'Status', type: 'STRING', required: true },
      { name: 'Created_At', type: 'DATE', required: true },
      { name: 'Last_Login', type: 'DATE', required: false }
    ]
  },
  ROLES: {
    name: 'ROLES',
    description: 'الأدوار الإدارية',
    columns: [
      { name: 'Role_ID', type: 'STRING', required: true },
      { name: 'Role_Name', type: 'STRING', required: true },
      { name: 'Description', type: 'STRING', required: false }
    ]
  },
  PERMISSIONS: {
    name: 'PERMISSIONS',
    description: 'الصلاحيات',
    columns: [
      { name: 'Permission_ID', type: 'STRING', required: true },
      { name: 'Permission_Name', type: 'STRING', required: true },
      { name: 'Module', type: 'STRING', required: true },
      { name: 'Action', type: 'STRING', required: true }
    ]
  },
  ROLE_PERMISSIONS: {
    name: 'ROLE_PERMISSIONS',
    description: 'ربط الأدوار بالصلاحيات',
    columns: [
      { name: 'ID', type: 'STRING', required: true },
      { name: 'Role_ID', type: 'STRING', required: true },
      { name: 'Permission_ID', type: 'STRING', required: true },
      { name: 'Allowed', type: 'BOOLEAN', required: true }
    ]
  },
  AUDIT_LOGS: {
    name: 'AUDIT_LOGS',
    description: 'سجل العمليات والتدقيق',
    columns: [
      { name: 'Log_ID', type: 'STRING', required: true },
      { name: 'User_ID', type: 'STRING', required: true },
      { name: 'Action', type: 'STRING', required: true },
      { name: 'Module', type: 'STRING', required: true },
      { name: 'Record_ID', type: 'STRING', required: false },
      { name: 'Old_Value', type: 'STRING', required: false },
      { name: 'New_Value', type: 'STRING', required: false },
      { name: 'Timestamp', type: 'DATE', required: true },
      { name: 'Description', type: 'STRING', required: false }
    ]
  },
  PRODUCTS: {
    name: 'PRODUCTS',
    description: 'دليل المنتجات والأسعار والمخزون',
    columns: [
      { name: 'Product_ID', type: 'STRING', required: true },
      { name: 'Internal_Reference', type: 'STRING', required: true },
      { name: 'Product_Name_AR', type: 'STRING', required: true },
      { name: 'Product_Name_FR', type: 'STRING', required: true },
      { name: 'Description', type: 'STRING', required: false },
      { name: 'Category_ID', type: 'STRING', required: false },
      { name: 'Brand', type: 'STRING', required: false },
      { name: 'Image_URL', type: 'STRING', required: false },
      { name: 'Unit', type: 'STRING', required: true },
      { name: 'Barcode', type: 'STRING', required: false },
      { name: 'QR_Code', type: 'STRING', required: false },
      { name: 'Original_Reference', type: 'STRING', required: false },
      { name: 'Alternative_Reference', type: 'STRING', required: false },
      { name: 'First_Purchase_Price', type: 'CURRENCY', required: true },
      { name: 'Last_Purchase_Price', type: 'CURRENCY', required: true },
      { name: 'Average_Purchase_Cost', type: 'CURRENCY', required: true },
      { name: 'Last_Supplier_ID', type: 'STRING', required: false },
      { name: 'First_Supplier_ID', type: 'STRING', required: false },
      { name: 'Profit_Type', type: 'STRING', required: true },
      { name: 'Profit_Value', type: 'NUMBER', required: true },
      { name: 'Suggested_Selling_Price', type: 'CURRENCY', required: true },
      { name: 'Current_Selling_Price', type: 'CURRENCY', required: true },
      { name: 'Current_Stock', type: 'NUMBER', required: true },
      { name: 'Minimum_Stock', type: 'NUMBER', required: true },
      { name: 'Active', type: 'BOOLEAN', required: true },
      { name: 'Created_At', type: 'DATE', required: true },
      { name: 'Updated_At', type: 'DATE', required: true }
    ]
  },
  PRODUCT_REFERENCES: {
    name: 'PRODUCT_REFERENCES',
    description: 'المراجع البديلة والأصلية للمنتجات',
    columns: [
      { name: 'Reference_ID', type: 'STRING', required: true },
      { name: 'Product_ID', type: 'STRING', required: true },
      { name: 'Reference_Type', type: 'STRING', required: true },
      { name: 'Reference_Value', type: 'STRING', required: true },
      { name: 'Description', type: 'STRING', required: false },
      { name: 'Created_At', type: 'DATE', required: true },
      { name: 'Active', type: 'BOOLEAN', required: true }
    ]
  },
  SUPPLIER_PRODUCT_REFERENCES: {
    name: 'SUPPLIER_PRODUCT_REFERENCES',
    description: 'مراجع الموردين للمنتجات',
    columns: [
      { name: 'ID', type: 'STRING', required: true },
      { name: 'Product_ID', type: 'STRING', required: true },
      { name: 'Supplier_ID', type: 'STRING', required: true },
      { name: 'Supplier_Reference', type: 'STRING', required: true },
      { name: 'Supplier_Product_Name', type: 'STRING', required: false },
      { name: 'Last_Purchase_Price', type: 'CURRENCY', required: false },
      { name: 'Last_Purchase_Date', type: 'DATE', required: false },
      { name: 'Active', type: 'BOOLEAN', required: true },
      { name: 'Created_At', type: 'DATE', required: true },
      { name: 'Updated_At', type: 'DATE', required: true }
    ]
  },
  PRODUCT_BARCODES: {
    name: 'PRODUCT_BARCODES',
    description: 'باركودات إضافية للمنتج',
    columns: [
      { name: 'Barcode_ID', type: 'STRING', required: true },
      { name: 'Product_ID', type: 'STRING', required: true },
      { name: 'Barcode_Value', type: 'STRING', required: true },
      { name: 'Barcode_Type', type: 'STRING', required: false },
      { name: 'Is_Primary', type: 'BOOLEAN', required: true },
      { name: 'Created_At', type: 'DATE', required: true }
    ]
  },
  PRODUCT_SERIAL_NUMBERS: {
    name: 'PRODUCT_SERIAL_NUMBERS',
    description: 'الأرقام التسلسلية للمنتجات',
    columns: [
      { name: 'Serial_ID', type: 'STRING', required: true },
      { name: 'Product_ID', type: 'STRING', required: true },
      { name: 'Serial_Number', type: 'STRING', required: true },
      { name: 'Purchase_Invoice_ID', type: 'STRING', required: false },
      { name: 'Sale_Invoice_ID', type: 'STRING', required: false },
      { name: 'Supplier_ID', type: 'STRING', required: false },
      { name: 'Status', type: 'STRING', required: true },
      { name: 'Purchase_Date', type: 'DATE', required: false },
      { name: 'Sale_Date', type: 'DATE', required: false },
      { name: 'Warranty_Expiry', type: 'DATE', required: false },
      { name: 'Notes', type: 'STRING', required: false }
    ]
  },
  CATEGORIES: {
    name: 'CATEGORIES',
    description: 'تصنيفات المنتجات',
    columns: [
      { name: 'Category_ID', type: 'STRING', required: true },
      { name: 'Category_Name_AR', type: 'STRING', required: true },
      { name: 'Category_Name_FR', type: 'STRING', required: true },
      { name: 'Parent_Category_ID', type: 'STRING', required: false },
      { name: 'Description', type: 'STRING', required: false },
      { name: 'Active', type: 'BOOLEAN', required: true }
    ]
  },
  SUPPLIERS: {
    name: 'SUPPLIERS',
    description: 'دليل الموردين',
    columns: [
      { name: 'Supplier_ID', type: 'STRING', required: true },
      { name: 'Supplier_Name', type: 'STRING', required: true },
      { name: 'Commercial_Name', type: 'STRING', required: false },
      { name: 'Phone', type: 'STRING', required: false },
      { name: 'Email', type: 'STRING', required: false },
      { name: 'Address', type: 'STRING', required: false },
      { name: 'City', type: 'STRING', required: false },
      { name: 'Tax_ID', type: 'STRING', required: false },
      { name: 'Notes', type: 'STRING', required: false },
      { name: 'Opening_Balance', type: 'CURRENCY', required: true },
      { name: 'Current_Balance', type: 'CURRENCY', required: true },
      { name: 'Active', type: 'BOOLEAN', required: true },
      { name: 'Created_At', type: 'DATE', required: true }
    ]
  },
  CUSTOMERS: {
    name: 'CUSTOMERS',
    description: 'دليل العملاء والزبائن',
    columns: [
      { name: 'Customer_ID', type: 'STRING', required: true },
      { name: 'Customer_Name', type: 'STRING', required: true },
      { name: 'Phone', type: 'STRING', required: false },
      { name: 'Email', type: 'STRING', required: false },
      { name: 'Address', type: 'STRING', required: false },
      { name: 'City', type: 'STRING', required: false },
      { name: 'Notes', type: 'STRING', required: false },
      { name: 'Opening_Balance', type: 'CURRENCY', required: true },
      { name: 'Current_Balance', type: 'CURRENCY', required: true },
      { name: 'Created_At', type: 'DATE', required: true }
    ]
  },
  PURCHASE_INVOICES: {
    name: 'PURCHASE_INVOICES',
    description: 'فواتير الشراء والتوريد',
    columns: [
      { name: 'Purchase_Invoice_ID', type: 'STRING', required: true },
      { name: 'Invoice_Number', type: 'STRING', required: true },
      { name: 'Supplier_ID', type: 'STRING', required: true },
      { name: 'Supplier_Invoice_Number', type: 'STRING', required: false },
      { name: 'Invoice_Date', type: 'DATE', required: true },
      { name: 'Receiving_Date', type: 'DATE', required: false },
      { name: 'Subtotal', type: 'CURRENCY', required: true },
      { name: 'Discount', type: 'CURRENCY', required: true },
      { name: 'Tax', type: 'CURRENCY', required: true },
      { name: 'Transport_Cost', type: 'CURRENCY', required: true },
      { name: 'Other_Expenses', type: 'CURRENCY', required: true },
      { name: 'Total', type: 'CURRENCY', required: true },
      { name: 'Paid_Amount', type: 'CURRENCY', required: true },
      { name: 'Remaining_Amount', type: 'CURRENCY', required: true },
      { name: 'Payment_Method', type: 'STRING', required: true },
      { name: 'Status', type: 'STRING', required: true },
      { name: 'Created_By', type: 'STRING', required: true },
      { name: 'Created_At', type: 'DATE', required: true },
      { name: 'Approved_At', type: 'DATE', required: false }
    ]
  },
  PURCHASE_ITEMS: {
    name: 'PURCHASE_ITEMS',
    description: 'بنود فواتير الشراء',
    columns: [
      { name: 'Purchase_Item_ID', type: 'STRING', required: true },
      { name: 'Purchase_Invoice_ID', type: 'STRING', required: true },
      { name: 'Product_ID', type: 'STRING', required: true },
      { name: 'Supplier_Reference', type: 'STRING', required: false },
      { name: 'Quantity', type: 'NUMBER', required: true },
      { name: 'Unit_Price', type: 'CURRENCY', required: true },
      { name: 'Discount', type: 'CURRENCY', required: true },
      { name: 'Tax', type: 'CURRENCY', required: true },
      { name: 'Total', type: 'CURRENCY', required: true },
      { name: 'Unit_Cost', type: 'CURRENCY', required: true },
      { name: 'Created_At', type: 'DATE', required: true }
    ]
  },
  SALES_INVOICES: {
    name: 'SALES_INVOICES',
    description: 'فواتير البيع والمبيعات',
    columns: [
      { name: 'Sales_Invoice_ID', type: 'STRING', required: true },
      { name: 'Invoice_Number', type: 'STRING', required: true },
      { name: 'Customer_ID', type: 'STRING', required: true },
      { name: 'Invoice_Date', type: 'DATE', required: true },
      { name: 'Subtotal', type: 'CURRENCY', required: true },
      { name: 'Discount', type: 'CURRENCY', required: true },
      { name: 'Tax', type: 'CURRENCY', required: true },
      { name: 'Total', type: 'CURRENCY', required: true },
      { name: 'Paid_Amount', type: 'CURRENCY', required: true },
      { name: 'Remaining_Amount', type: 'CURRENCY', required: true },
      { name: 'Payment_Method', type: 'STRING', required: true },
      { name: 'Status', type: 'STRING', required: true },
      { name: 'Created_By', type: 'STRING', required: true },
      { name: 'Created_At', type: 'DATE', required: true },
      { name: 'Approved_At', type: 'DATE', required: false }
    ]
  },
  SALES_ITEMS: {
    name: 'SALES_ITEMS',
    description: 'بنود فواتير البيع وتكلفة البضاعة المباعة',
    columns: [
      { name: 'Sales_Item_ID', type: 'STRING', required: true },
      { name: 'Sales_Invoice_ID', type: 'STRING', required: true },
      { name: 'Product_ID', type: 'STRING', required: true },
      { name: 'Product_Reference', type: 'STRING', required: false },
      { name: 'Quantity', type: 'NUMBER', required: true },
      { name: 'Unit_Price', type: 'CURRENCY', required: true },
      { name: 'Purchase_Cost_At_Sale', type: 'CURRENCY', required: true },
      { name: 'Discount', type: 'CURRENCY', required: true },
      { name: 'Tax', type: 'CURRENCY', required: true },
      { name: 'Total', type: 'CURRENCY', required: true },
      { name: 'Gross_Profit', type: 'CURRENCY', required: true },
      { name: 'Created_At', type: 'DATE', required: true }
    ]
  },
  STOCK_MOVEMENTS: {
    name: 'STOCK_MOVEMENTS',
    description: 'حركات المخزون الموثقة',
    columns: [
      { name: 'Movement_ID', type: 'STRING', required: true },
      { name: 'Product_ID', type: 'STRING', required: true },
      { name: 'Movement_Type', type: 'STRING', required: true },
      { name: 'Source_Type', type: 'STRING', required: true },
      { name: 'Source_ID', type: 'STRING', required: false },
      { name: 'Quantity_In', type: 'NUMBER', required: true },
      { name: 'Quantity_Out', type: 'NUMBER', required: true },
      { name: 'Balance_After', type: 'NUMBER', required: true },
      { name: 'Unit_Cost', type: 'CURRENCY', required: true },
      { name: 'Movement_Date', type: 'DATE', required: true },
      { name: 'User_ID', type: 'STRING', required: true },
      { name: 'Notes', type: 'STRING', required: false }
    ]
  },
  STOCK_ADJUSTMENTS: {
    name: 'STOCK_ADJUSTMENTS',
    description: 'تسويات وجرد المخزون',
    columns: [
      { name: 'Adjustment_ID', type: 'STRING', required: true },
      { name: 'Product_ID', type: 'STRING', required: true },
      { name: 'Old_Quantity', type: 'NUMBER', required: true },
      { name: 'New_Quantity', type: 'NUMBER', required: true },
      { name: 'Difference', type: 'NUMBER', required: true },
      { name: 'Reason', type: 'STRING', required: true },
      { name: 'Adjustment_Date', type: 'DATE', required: true },
      { name: 'User_ID', type: 'STRING', required: true },
      { name: 'Approved_By', type: 'STRING', required: true }
    ]
  },
  RETURNS: {
    name: 'RETURNS',
    description: 'مرتجعات البيع والشراء',
    columns: [
      { name: 'Return_ID', type: 'STRING', required: true },
      { name: 'Original_Invoice_ID', type: 'STRING', required: true },
      { name: 'Return_Type', type: 'STRING', required: true },
      { name: 'Customer_ID', type: 'STRING', required: false },
      { name: 'Supplier_ID', type: 'STRING', required: false },
      { name: 'Return_Date', type: 'DATE', required: true },
      { name: 'Total_Amount', type: 'CURRENCY', required: true },
      { name: 'Reason', type: 'STRING', required: false },
      { name: 'Status', type: 'STRING', required: true },
      { name: 'Created_By', type: 'STRING', required: true }
    ]
  },
  RETURN_ITEMS: {
    name: 'RETURN_ITEMS',
    description: 'بنود المرتجعات',
    columns: [
      { name: 'Return_Item_ID', type: 'STRING', required: true },
      { name: 'Return_ID', type: 'STRING', required: true },
      { name: 'Product_ID', type: 'STRING', required: true },
      { name: 'Quantity', type: 'NUMBER', required: true },
      { name: 'Unit_Price', type: 'CURRENCY', required: true },
      { name: 'Unit_Cost', type: 'CURRENCY', required: true },
      { name: 'Total', type: 'CURRENCY', required: true }
    ]
  },
  CASH_SESSIONS: {
    name: 'CASH_SESSIONS',
    description: 'جلسات الصندوق والورديات',
    columns: [
      { name: 'Session_ID', type: 'STRING', required: true },
      { name: 'Opening_Balance', type: 'CURRENCY', required: true },
      { name: 'Closing_Balance', type: 'CURRENCY', required: false },
      { name: 'Expected_Balance', type: 'CURRENCY', required: false },
      { name: 'Difference', type: 'CURRENCY', required: false },
      { name: 'Opened_By', type: 'STRING', required: true },
      { name: 'Closed_By', type: 'STRING', required: false },
      { name: 'Opened_At', type: 'DATE', required: true },
      { name: 'Closed_At', type: 'DATE', required: false },
      { name: 'Status', type: 'STRING', required: true }
    ]
  },
  CASH_TRANSACTIONS: {
    name: 'CASH_TRANSACTIONS',
    description: 'حركات الصندوق النقدية',
    columns: [
      { name: 'Transaction_ID', type: 'STRING', required: true },
      { name: 'Session_ID', type: 'STRING', required: true },
      { name: 'Transaction_Type', type: 'STRING', required: true },
      { name: 'Source_Type', type: 'STRING', required: true },
      { name: 'Source_ID', type: 'STRING', required: false },
      { name: 'Amount', type: 'CURRENCY', required: true },
      { name: 'Date', type: 'DATE', required: true },
      { name: 'User_ID', type: 'STRING', required: true },
      { name: 'Description', type: 'STRING', required: false }
    ]
  },
  BANK_ACCOUNTS: {
    name: 'BANK_ACCOUNTS',
    description: 'الحسابات البنكية للمحل',
    columns: [
      { name: 'Bank_ID', type: 'STRING', required: true },
      { name: 'Bank_Name', type: 'STRING', required: true },
      { name: 'Account_Number', type: 'STRING', required: true },
      { name: 'Opening_Balance', type: 'CURRENCY', required: true },
      { name: 'Current_Balance', type: 'CURRENCY', required: true },
      { name: 'Active', type: 'BOOLEAN', required: true }
    ]
  },
  BANK_TRANSACTIONS: {
    name: 'BANK_TRANSACTIONS',
    description: 'حركات الحسابات البنكية',
    columns: [
      { name: 'Bank_Transaction_ID', type: 'STRING', required: true },
      { name: 'Bank_ID', type: 'STRING', required: true },
      { name: 'Transaction_Type', type: 'STRING', required: true },
      { name: 'Source_Type', type: 'STRING', required: true },
      { name: 'Source_ID', type: 'STRING', required: false },
      { name: 'Amount', type: 'CURRENCY', required: true },
      { name: 'Date', type: 'DATE', required: true },
      { name: 'Description', type: 'STRING', required: false },
      { name: 'User_ID', type: 'STRING', required: true }
    ]
  },
  EXPENSES: {
    name: 'EXPENSES',
    description: 'مصاريف المحل التشغيلية',
    columns: [
      { name: 'Expense_ID', type: 'STRING', required: true },
      { name: 'Expense_Number', type: 'STRING', required: true },
      { name: 'Category', type: 'STRING', required: true },
      { name: 'Description', type: 'STRING', required: false },
      { name: 'Amount', type: 'CURRENCY', required: true },
      { name: 'Payment_Method', type: 'STRING', required: true },
      { name: 'Bank_ID', type: 'STRING', required: false },
      { name: 'Supplier_ID', type: 'STRING', required: false },
      { name: 'Expense_Date', type: 'DATE', required: true },
      { name: 'Attachment_URL', type: 'STRING', required: false },
      { name: 'User_ID', type: 'STRING', required: true },
      { name: 'Created_At', type: 'DATE', required: true }
    ]
  },
  FINANCIAL_TRANSACTIONS: {
    name: 'FINANCIAL_TRANSACTIONS',
    description: 'سجل الحركات المالية المركزية',
    columns: [
      { name: 'Financial_ID', type: 'STRING', required: true },
      { name: 'Transaction_Type', type: 'STRING', required: true },
      { name: 'Source_Type', type: 'STRING', required: true },
      { name: 'Source_ID', type: 'STRING', required: false },
      { name: 'Debit', type: 'CURRENCY', required: true },
      { name: 'Credit', type: 'CURRENCY', required: true },
      { name: 'Amount', type: 'CURRENCY', required: true },
      { name: 'Transaction_Date', type: 'DATE', required: true },
      { name: 'Description', type: 'STRING', required: false },
      { name: 'User_ID', type: 'STRING', required: true },
      { name: 'Status', type: 'STRING', required: true }
    ]
  },
  JOURNAL_ENTRIES: {
    name: 'JOURNAL_ENTRIES',
    description: 'القيود المحاسبية اليومية',
    columns: [
      { name: 'Journal_ID', type: 'STRING', required: true },
      { name: 'Journal_Number', type: 'STRING', required: true },
      { name: 'Transaction_Date', type: 'DATE', required: true },
      { name: 'Description', type: 'STRING', required: false },
      { name: 'Source_Type', type: 'STRING', required: false },
      { name: 'Source_ID', type: 'STRING', required: false },
      { name: 'Status', type: 'STRING', required: true }
    ]
  },
  JOURNAL_ENTRY_LINES: {
    name: 'JOURNAL_ENTRY_LINES',
    description: 'خطوط القيود المحاسبية (مدين / دائن)',
    columns: [
      { name: 'Line_ID', type: 'STRING', required: true },
      { name: 'Journal_ID', type: 'STRING', required: true },
      { name: 'Account_Code', type: 'STRING', required: true },
      { name: 'Debit', type: 'CURRENCY', required: true },
      { name: 'Credit', type: 'CURRENCY', required: true },
      { name: 'Description', type: 'STRING', required: false }
    ]
  },
  PRICE_HISTORY: {
    name: 'PRICE_HISTORY',
    description: 'تاريخ تغيرات أسعار الشراء والبيع وهامش الربح',
    columns: [
      { name: 'Price_ID', type: 'STRING', required: true },
      { name: 'Product_ID', type: 'STRING', required: true },
      { name: 'Supplier_ID', type: 'STRING', required: false },
      { name: 'Purchase_Price', type: 'CURRENCY', required: true },
      { name: 'Selling_Price', type: 'CURRENCY', required: true },
      { name: 'Profit_Type', type: 'STRING', required: true },
      { name: 'Profit_Value', type: 'NUMBER', required: true },
      { name: 'Effective_Date', type: 'DATE', required: true },
      { name: 'Source_Invoice_ID', type: 'STRING', required: false },
      { name: 'User_ID', type: 'STRING', required: true }
    ]
  },
  APP_SETTINGS: {
    name: 'APP_SETTINGS',
    description: 'إعدادات النظام العامة',
    columns: [
      { name: 'Setting_ID', type: 'STRING', required: true },
      { name: 'Setting_Name', type: 'STRING', required: true },
      { name: 'Setting_Value', type: 'STRING', required: true },
      { name: 'Updated_At', type: 'DATE', required: true }
    ]
  },
  SYNC_LOGS: {
    name: 'SYNC_LOGS',
    description: 'سجل عمليات المزامنة مع Google Sheets',
    columns: [
      { name: 'Sync_ID', type: 'STRING', required: true },
      { name: 'Operation', type: 'STRING', required: true },
      { name: 'Table_Name', type: 'STRING', required: true },
      { name: 'Record_ID', type: 'STRING', required: false },
      { name: 'Status', type: 'STRING', required: true },
      { name: 'Error_Message', type: 'STRING', required: false },
      { name: 'Timestamp', type: 'DATE', required: true }
    ]
  },
  DATABASE_SCHEMA: {
    name: 'DATABASE_SCHEMA',
    description: 'فهرس بنية قاعدة البيانات لتتبع الإصدارات والمخطط',
    columns: [
      { name: 'Schema_Version', type: 'STRING', required: true },
      { name: 'Table_Name', type: 'STRING', required: true },
      { name: 'Column_Name', type: 'STRING', required: true },
      { name: 'Data_Type', type: 'STRING', required: true },
      { name: 'Required', type: 'BOOLEAN', required: true },
      { name: 'Updated_At', type: 'DATE', required: true }
    ]
  }
};

export const DEFAULT_STORE_SETTINGS = {
  Setting_ID: 'SET-001',
  Store_Name: 'متجر الصفوة للتجارة',
  Commercial_Name: 'AL SAFWA TRADING S.A.R.L',
  Logo_URL: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?w=160&auto=format&fit=crop&q=80',
  App_Icon_URL: '',
  Business_Type: 'تجارة عامة ومواد تقنية ولوازم',
  Address: 'شارع الحسن الثاني، رقم 45',
  City: 'الدار البيضاء / أسفي',
  Phone: '+212 5 22 00 11 22',
  Email: 'contact@alsafwa-store.ma',
  Tax_ID: 'IF: 45892104 | ICE: 002341982000045 | RC: 89412',
  Legal_Info: 'Patente: 289410 - CNSS: 9812401',
  Currency: 'MAD',
  Default_Language: 'ar',
  Invoice_Language: 'ar',
  Theme_Color: '#f59e0b',
  Secondary_Color: '#0f172a',
  Dark_Mode: true,
  Invoice_Conditions: 'البضاعة المباعة لا ترد ولا تستبدل بعد مرور 48 ساعة. الضمان لا يشمل أضرار التيار الكهربائي وسوء الاستعمال.',
  Invoice_Footer: 'شكراً لزيارتكم وثقتكم بنا - Merci pour votre visite!',
  Created_At: new Date().toISOString(),
  Updated_At: new Date().toISOString()
};

export const INITIAL_ROLES = [
  { Role_ID: 'ROLE-ADMIN', Role_Name: 'مدير عام (Admin)', Description: 'كامل الصلاحيات في النظام وقاعدة البيانات' },
  { Role_ID: 'ROLE-MANAGER', Role_Name: 'مدير المحل (Manager)', Description: 'إدارة المخزون والمشتريات والمبيعات والتقارير' },
  { Role_ID: 'ROLE-CASHIER', Role_Name: 'أمين صندوق (Cashier)', Description: 'نقاط البيع والفواتير اليومية وإدارة وردية الصندوق' },
  { Role_ID: 'ROLE-ACCOUNTANT', Role_Name: 'محاسب (Accountant)', Description: 'الاطلاع على الحسابات والأرباح والقيود والتقارير المالية' }
];

export const INITIAL_PERMISSIONS = [
  { Permission_ID: 'PERM-POS', Permission_Name: 'استخدام نقطة البيع POS', Module: 'POS', Action: 'Execute' },
  { Permission_ID: 'PERM-DISCOUNT', Permission_Name: 'منح خصومات إضافية', Module: 'POS', Action: 'Discount' },
  { Permission_ID: 'PERM-BELOW-COST', Permission_Name: 'البيع بأقل من التكلفة', Module: 'POS', Action: 'OverridePrice' },
  { Permission_ID: 'PERM-STOCK-ADJUST', Permission_Name: 'إجراء تسويات مخزنية', Module: 'Inventory', Action: 'Adjust' },
  { Permission_ID: 'PERM-SETTINGS', Permission_Name: 'تعديل إعدادات المحل', Module: 'Settings', Action: 'Update' },
  { Permission_ID: 'PERM-SHEETS-SYNC', Permission_Name: 'ربط ومزامنة Google Sheets', Module: 'Database', Action: 'Manage' },
  { Permission_ID: 'PERM-REPORTS', Permission_Name: 'عرض التقارير والأرباح', Module: 'Reports', Action: 'View' }
];

export const INITIAL_CATEGORIES = [
  { Category_ID: 'CAT-001', Category_Name_AR: 'إلكترونيات وهواتف', Category_Name_FR: 'Électronique & Téléphones', Parent_Category_ID: '', Description: 'أجهزة وأكسسوارات', Active: true },
  { Category_ID: 'CAT-002', Category_Name_AR: 'أدوات منزلية ومكتبية', Category_Name_FR: 'Maison & Bureau', Parent_Category_ID: '', Description: 'مستلزمات عامة', Active: true },
  { Category_ID: 'CAT-003', Category_Name_AR: 'قطع غيار ولوازم تقنية', Category_Name_FR: 'Pièces de Rechange', Parent_Category_ID: '', Description: 'مكونات ولوازم الصيانة', Active: true },
  { Category_ID: 'CAT-004', Category_Name_AR: 'مواد استهلاكية', Category_Name_FR: 'Consommables', Parent_Category_ID: '', Description: 'لوازم سريعة الاستهلاك', Active: true }
];

export const INITIAL_BANK = {
  Bank_ID: 'BANK-001',
  Bank_Name: 'Attijariwafa Bank (التجاري وفا بنك)',
  Account_Number: '007 780 0001234567890123 45',
  Opening_Balance: 50000,
  Current_Balance: 50000,
  Active: true
};

export const INITIAL_USER = {
  User_ID: 'USR-001',
  Full_Name: 'المدير العام (Yassine Absi)',
  Email: 'admin@storeflow.ma',
  Role_ID: 'ROLE-ADMIN',
  Status: 'Active' as const,
  Created_At: new Date().toISOString(),
  Last_Login: new Date().toISOString()
};

export const INITIAL_CUSTOMER_COUNTER = {
  Customer_ID: 'CUST-000',
  Customer_Name: 'زبون عادي (Client Comptoir)',
  Phone: '-',
  Email: '-',
  Address: '-',
  City: 'المحل',
  Notes: 'مبيعات الكاش المباشرة بدون حساب آجل',
  Opening_Balance: 0,
  Current_Balance: 0,
  Created_At: new Date().toISOString()
};
