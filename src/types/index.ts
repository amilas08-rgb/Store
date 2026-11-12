/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'ar' | 'fr';

export type Currency = 'MAD';

export interface StoreSettings {
  Setting_ID: string;
  Store_Name: string;
  Commercial_Name: string;
  Logo_URL: string;
  App_Icon_URL: string;
  Business_Type: string;
  Address: string;
  City: string;
  Phone: string;
  Email: string;
  Tax_ID: string; // IF / ICE / RC
  Legal_Info: string;
  Currency: string;
  Default_Language: Language;
  Invoice_Language: Language;
  Theme_Color: string;
  Secondary_Color: string;
  Dark_Mode: boolean | string;
  Invoice_Conditions: string;
  Invoice_Footer: string;
  Created_At: string;
  Updated_At: string;
}

export interface User {
  User_ID: string;
  Full_Name: string;
  Email: string;
  Role_ID: string;
  Status: 'Active' | 'Inactive';
  Created_At: string;
  Last_Login: string;
}

export interface Role {
  Role_ID: string;
  Role_Name: string;
  Description: string;
}

export interface Permission {
  Permission_ID: string;
  Permission_Name: string;
  Module: string;
  Action: string;
}

export interface RolePermission {
  ID: string;
  Role_ID: string;
  Permission_ID: string;
  Allowed: boolean | string;
}

export interface AuditLog {
  Log_ID: string;
  User_ID: string;
  Action: string;
  Module: string;
  Record_ID: string;
  Old_Value: string;
  New_Value: string;
  Timestamp: string;
  Description: string;
}

export interface Product {
  Product_ID: string;
  Internal_Reference: string; // e.g. MAG-000125
  Product_Name_AR: string;
  Product_Name_FR: string;
  Description: string;
  Category_ID: string;
  Brand: string;
  Image_URL: string;
  Unit: string; // Piece, Kg, Box, Litre, Meter
  Barcode: string;
  QR_Code: string;
  Original_Reference: string;
  Alternative_Reference: string;
  First_Purchase_Price: number;
  Last_Purchase_Price: number;
  Average_Purchase_Cost: number;
  Last_Supplier_ID: string;
  First_Supplier_ID: string;
  Profit_Type: 'Percentage' | 'Fixed';
  Profit_Value: number;
  Suggested_Selling_Price: number;
  Current_Selling_Price: number;
  Current_Stock: number;
  Minimum_Stock: number;
  Active: boolean | string;
  Created_At: string;
  Updated_At: string;
}

export interface ProductReference {
  Reference_ID: string;
  Product_ID: string;
  Reference_Type: 'Original' | 'Alternative' | 'Barcode' | 'Internal';
  Reference_Value: string;
  Description: string;
  Created_At: string;
  Active: boolean | string;
}

export interface SupplierProductReference {
  ID: string;
  Product_ID: string;
  Supplier_ID: string;
  Supplier_Reference: string;
  Supplier_Product_Name: string;
  Last_Purchase_Price: number;
  Last_Purchase_Date: string;
  Active: boolean | string;
  Created_At: string;
  Updated_At: string;
}

export interface ProductBarcode {
  Barcode_ID: string;
  Product_ID: string;
  Barcode_Value: string;
  Barcode_Type: string;
  Is_Primary: boolean | string;
  Created_At: string;
}

export interface ProductSerialNumber {
  Serial_ID: string;
  Product_ID: string;
  Serial_Number: string;
  Purchase_Invoice_ID: string;
  Sale_Invoice_ID: string;
  Supplier_ID: string;
  Status: 'Available' | 'Sold' | 'Returned' | 'Defective';
  Purchase_Date: string;
  Sale_Date: string;
  Warranty_Expiry: string;
  Notes: string;
}

export interface Category {
  Category_ID: string;
  Category_Name_AR: string;
  Category_Name_FR: string;
  Parent_Category_ID: string;
  Description: string;
  Active: boolean | string;
}

export interface Supplier {
  Supplier_ID: string;
  Supplier_Name: string;
  Commercial_Name: string;
  Phone: string;
  Email: string;
  Address: string;
  City: string;
  Tax_ID: string;
  Notes: string;
  Opening_Balance: number;
  Current_Balance: number;
  Active: boolean | string;
  Created_At: string;
}

export interface Customer {
  Customer_ID: string;
  Customer_Name: string;
  Phone: string;
  Email: string;
  Address: string;
  City: string;
  Notes: string;
  Opening_Balance: number;
  Current_Balance: number;
  Created_At: string;
}

export interface PurchaseInvoice {
  Purchase_Invoice_ID: string;
  Invoice_Number: string;
  Supplier_ID: string;
  Supplier_Invoice_Number: string;
  Invoice_Date: string;
  Receiving_Date: string;
  Subtotal: number;
  Discount: number;
  Tax: number;
  Transport_Cost: number;
  Other_Expenses: number;
  Total: number;
  Paid_Amount: number;
  Remaining_Amount: number;
  Payment_Method: 'Cash' | 'Card' | 'Bank_Transfer' | 'Cheque' | 'Credit';
  Status: 'Draft' | 'Confirmed' | 'Paid' | 'Partially_Paid' | 'Cancelled';
  Created_By: string;
  Created_At: string;
  Approved_At: string;
}

export interface PurchaseItem {
  Purchase_Item_ID: string;
  Purchase_Invoice_ID: string;
  Product_ID: string;
  Supplier_Reference: string;
  Quantity: number;
  Unit_Price: number;
  Discount: number;
  Tax: number;
  Total: number;
  Unit_Cost: number;
  Created_At: string;
}

export interface SalesInvoice {
  Sales_Invoice_ID: string;
  Invoice_Number: string;
  Customer_ID: string;
  Invoice_Date: string;
  Subtotal: number;
  Discount: number;
  Tax: number;
  Total: number;
  Paid_Amount: number;
  Remaining_Amount: number;
  Payment_Method: 'Cash' | 'Card' | 'Bank_Transfer' | 'Cheque' | 'Mixed' | 'Credit';
  Status: 'Draft' | 'Confirmed' | 'Paid' | 'Partially_Paid' | 'Cancelled' | 'Returned';
  Created_By: string;
  Created_At: string;
  Approved_At: string;
}

export interface SalesItem {
  Sales_Item_ID: string;
  Sales_Invoice_ID: string;
  Product_ID: string;
  Product_Reference: string;
  Quantity: number;
  Unit_Price: number;
  Purchase_Cost_At_Sale: number;
  Discount: number;
  Tax: number;
  Total: number;
  Gross_Profit: number;
  Created_At: string;
}

export interface StockMovement {
  Movement_ID: string;
  Product_ID: string;
  Movement_Type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN_IN' | 'RETURN_OUT';
  Source_Type: 'SALE' | 'PURCHASE' | 'ADJUSTMENT' | 'RETURN' | 'INITIAL';
  Source_ID: string;
  Quantity_In: number;
  Quantity_Out: number;
  Balance_After: number;
  Unit_Cost: number;
  Movement_Date: string;
  User_ID: string;
  Notes: string;
}

export interface StockAdjustment {
  Adjustment_ID: string;
  Product_ID: string;
  Old_Quantity: number;
  New_Quantity: number;
  Difference: number;
  Reason: string;
  Adjustment_Date: string;
  User_ID: string;
  Approved_By: string;
}

export interface ReturnRecord {
  Return_ID: string;
  Original_Invoice_ID: string;
  Return_Type: 'CUSTOMER_RETURN' | 'SUPPLIER_RETURN';
  Customer_ID: string;
  Supplier_ID: string;
  Return_Date: string;
  Total_Amount: number;
  Reason: string;
  Status: 'Pending' | 'Completed' | 'Rejected';
  Created_By: string;
}

export interface ReturnItem {
  Return_Item_ID: string;
  Return_ID: string;
  Product_ID: string;
  Quantity: number;
  Unit_Price: number;
  Unit_Cost: number;
  Total: number;
}

export interface CashSession {
  Session_ID: string;
  Opening_Balance: number;
  Closing_Balance: number;
  Expected_Balance: number;
  Difference: number;
  Opened_By: string;
  Closed_By: string;
  Opened_At: string;
  Closed_At: string;
  Status: 'Open' | 'Closed';
}

export interface CashTransaction {
  Transaction_ID: string;
  Session_ID: string;
  Transaction_Type: 'SALE' | 'RETURN' | 'EXPENSE' | 'DEPOSIT' | 'WITHDRAWAL';
  Source_Type: 'SALE_INVOICE' | 'RETURN' | 'EXPENSE' | 'MANUAL';
  Source_ID: string;
  Amount: number;
  Date: string;
  User_ID: string;
  Description: string;
}

export interface BankAccount {
  Bank_ID: string;
  Bank_Name: string;
  Account_Number: string;
  Opening_Balance: number;
  Current_Balance: number;
  Active: boolean | string;
}

export interface BankTransaction {
  Bank_Transaction_ID: string;
  Bank_ID: string;
  Transaction_Type: 'DEPOSIT' | 'WITHDRAWAL' | 'SALE' | 'PURCHASE' | 'EXPENSE';
  Source_Type: 'SALE_INVOICE' | 'PURCHASE_INVOICE' | 'EXPENSE' | 'TRANSFER' | 'MANUAL';
  Source_ID: string;
  Amount: number;
  Date: string;
  Description: string;
  User_ID: string;
}

export interface Expense {
  Expense_ID: string;
  Expense_Number: string;
  Category: string; // Rent, Electricity, Water, Salaries, Transport, Supplies, Other
  Description: string;
  Amount: number;
  Payment_Method: 'Cash' | 'Bank' | 'Cheque';
  Bank_ID: string;
  Supplier_ID: string;
  Expense_Date: string;
  Attachment_URL: string;
  User_ID: string;
  Created_At: string;
}

export interface FinancialTransaction {
  Financial_ID: string;
  Transaction_Type: 'SALE' | 'PURCHASE' | 'EXPENSE' | 'RETURN' | 'TRANSFER';
  Source_Type: string;
  Source_ID: string;
  Debit: number;
  Credit: number;
  Amount: number;
  Transaction_Date: string;
  Description: string;
  User_ID: string;
  Status: 'Posted' | 'Draft';
}

export interface JournalEntry {
  Journal_ID: string;
  Journal_Number: string;
  Transaction_Date: string;
  Description: string;
  Source_Type: string;
  Source_ID: string;
  Status: 'Draft' | 'Posted';
}

export interface JournalEntryLine {
  Line_ID: string;
  Journal_ID: string;
  Account_Code: string;
  Debit: number;
  Credit: number;
  Description: string;
}

export interface PriceHistory {
  Price_ID: string;
  Product_ID: string;
  Supplier_ID: string;
  Purchase_Price: number;
  Selling_Price: number;
  Profit_Type: string;
  Profit_Value: number;
  Effective_Date: string;
  Source_Invoice_ID: string;
  User_ID: string;
}

export interface AppSetting {
  Setting_ID: string;
  Setting_Name: string;
  Setting_Value: string;
  Updated_At: string;
}

export interface SyncLog {
  Sync_ID: string;
  Operation: string;
  Table_Name: string;
  Record_ID: string;
  Status: 'Success' | 'Failed' | 'Pending';
  Error_Message: string;
  Timestamp: string;
}

export interface DatabaseSchemaRow {
  Schema_Version: string;
  Table_Name: string;
  Column_Name: string;
  Data_Type: string;
  Required: boolean | string;
  Updated_At: string;
}

export type ViewMode =
  | 'dashboard'
  | 'pos'
  | 'sales'
  | 'purchases'
  | 'products'
  | 'inventory'
  | 'suppliers'
  | 'customers'
  | 'returns'
  | 'cash'
  | 'banks'
  | 'expenses'
  | 'profits'
  | 'reports'
  | 'users'
  | 'settings'
  | 'database'
  | 'backup'
  | 'audit';
