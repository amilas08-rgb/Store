/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const APPS_SCRIPT_SOURCE_CODE = `/**
 * STOREFLOW BACKEND - GOOGLE APPS SCRIPT API
 * Central Database Engine for Store Management with Concurrency Locking & AppSheet-style Sync
 * Deployment: Extensions > Apps Script > Deploy as Web App (Execute as Me, Anyone with Google account)
 */

const SCHEMA_VERSION = "1.0.0";

function doGet(e) {
  return handleRequest(e, 'GET');
}

function doPost(e) {
  return handleRequest(e, 'POST');
}

function handleRequest(e, method) {
  const lock = LockService.getScriptLock();
  try {
    // Acquire lock with 30-second timeout for atomic transactions
    lock.waitLock(30000);

    let params = {};
    if (method === 'GET') {
      params = e.parameter || {};
    } else {
      try {
        params = JSON.parse(e.postData.contents);
      } catch (err) {
        params = e.parameter || {};
      }
    }

    const action = params.action || 'ping';
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    let result = {};

    switch (action) {
      case 'ping':
        result = { status: 'success', message: 'StoreFlow Apps Script Backend Online', schemaVersion: SCHEMA_VERSION, timestamp: new Date().toISOString() };
        break;

      case 'readTable':
        result = readTable(ss, params.tableName);
        break;

      case 'readAllTables':
        result = readAllTables(ss);
        break;

      case 'appendRecord':
        result = appendRecord(ss, params.tableName, params.record, params.idempotencyKey);
        break;

      case 'updateRecord':
        result = updateRecord(ss, params.tableName, params.idColumn, params.idValue, params.record);
        break;

      case 'executePosSale':
        result = executePosSale(ss, params.saleInvoice, params.saleItems, params.cashTransaction, params.stockMovements);
        break;

      case 'executePurchaseReceipt':
        result = executePurchaseReceipt(ss, params.purchaseInvoice, params.purchaseItems, params.stockMovements, params.priceHistories);
        break;

      case 'createBackupSnapshot':
        result = createBackupSnapshot(ss);
        break;

      default:
        result = { status: 'error', message: 'Unknown action: ' + action };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function readTable(ss, tableName) {
  const sheet = ss.getSheetByName(tableName);
  if (!sheet) return { status: 'error', message: 'Sheet not found: ' + tableName };

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { status: 'success', data: [] };

  const headers = data[0];
  const records = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row.length === 0 || row.every(c => c === '')) continue;
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = row[idx];
    });
    records.push(obj);
  }

  return { status: 'success', tableName, count: records.length, data: records };
}

function readAllTables(ss) {
  const sheets = ss.getSheets();
  const tables = {};
  sheets.forEach(sheet => {
    const name = sheet.getName();
    const data = sheet.getDataRange().getValues();
    if (data.length >= 2) {
      const headers = data[0];
      const records = [];
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row.length === 0 || row.every(c => c === '')) continue;
        const obj = {};
        headers.forEach((h, idx) => {
          obj[h] = row[idx];
        });
        records.push(obj);
      }
      tables[name] = records;
    } else {
      tables[name] = [];
    }
  });

  return { status: 'success', tables, timestamp: new Date().toISOString() };
}

function appendRecord(ss, tableName, record, idempotencyKey) {
  const sheet = ss.getSheetByName(tableName);
  if (!sheet) throw new Error('Sheet not found: ' + tableName);

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(h => record[h] !== undefined ? record[h] : '');
  sheet.appendRow(row);

  return { status: 'success', tableName, recordId: record[headers[0]] };
}

function updateRecord(ss, tableName, idColumn, idValue, updatedFields) {
  const sheet = ss.getSheetByName(tableName);
  if (!sheet) throw new Error('Sheet not found: ' + tableName);

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idColIndex = headers.indexOf(idColumn);
  if (idColIndex === -1) throw new Error('ID column not found: ' + idColumn);

  for (let r = 1; r < data.length; r++) {
    if (String(data[r][idColIndex]) === String(idValue)) {
      headers.forEach((h, cIdx) => {
        if (updatedFields[h] !== undefined) {
          sheet.getRange(r + 1, cIdx + 1).setValue(updatedFields[h]);
        }
      });
      return { status: 'success', updatedRow: r + 1 };
    }
  }

  throw new Error('Record not found for ' + idColumn + ' = ' + idValue);
}

function executePosSale(ss, saleInvoice, saleItems, cashTx, stockMovements) {
  // 1. Append Sales Invoice
  appendRecord(ss, 'SALES_INVOICES', saleInvoice);

  // 2. Append Sales Items
  if (saleItems && saleItems.length) {
    saleItems.forEach(item => appendRecord(ss, 'SALES_ITEMS', item));
  }

  // 3. Append Cash Transaction if cash
  if (cashTx && cashTx.Amount > 0) {
    appendRecord(ss, 'CASH_TRANSACTIONS', cashTx);
  }

  // 4. Append Stock Movements & update product stock
  const prodSheet = ss.getSheetByName('PRODUCTS');
  if (prodSheet && stockMovements && stockMovements.length) {
    const prodData = prodSheet.getDataRange().getValues();
    const prodHeaders = prodData[0];
    const idIdx = prodHeaders.indexOf('Product_ID');
    const stockIdx = prodHeaders.indexOf('Current_Stock');

    stockMovements.forEach(sm => {
      appendRecord(ss, 'STOCK_MOVEMENTS', sm);
      // update product stock in row
      for (let r = 1; r < prodData.length; r++) {
        if (String(prodData[r][idIdx]) === String(sm.Product_ID)) {
          const current = Number(prodSheet.getRange(r + 1, stockIdx + 1).getValue()) || 0;
          const updated = current - Number(sm.Quantity_Out);
          prodSheet.getRange(r + 1, stockIdx + 1).setValue(updated);
          break;
        }
      }
    });
  }

  return { status: 'success', invoiceNumber: saleInvoice.Invoice_Number };
}

function executePurchaseReceipt(ss, purchaseInvoice, purchaseItems, stockMovements, priceHistories) {
  appendRecord(ss, 'PURCHASE_INVOICES', purchaseInvoice);

  if (purchaseItems && purchaseItems.length) {
    purchaseItems.forEach(item => appendRecord(ss, 'PURCHASE_ITEMS', item));
  }

  const prodSheet = ss.getSheetByName('PRODUCTS');
  if (prodSheet && stockMovements && stockMovements.length) {
    const prodData = prodSheet.getDataRange().getValues();
    const prodHeaders = prodData[0];
    const idIdx = prodHeaders.indexOf('Product_ID');
    const stockIdx = prodHeaders.indexOf('Current_Stock');
    const lastPriceIdx = prodHeaders.indexOf('Last_Purchase_Price');

    stockMovements.forEach(sm => {
      appendRecord(ss, 'STOCK_MOVEMENTS', sm);
      for (let r = 1; r < prodData.length; r++) {
        if (String(prodData[r][idIdx]) === String(sm.Product_ID)) {
          const current = Number(prodSheet.getRange(r + 1, stockIdx + 1).getValue()) || 0;
          const updated = current + Number(sm.Quantity_In);
          prodSheet.getRange(r + 1, stockIdx + 1).setValue(updated);
          if (lastPriceIdx !== -1 && sm.Unit_Cost > 0) {
            prodSheet.getRange(r + 1, lastPriceIdx + 1).setValue(sm.Unit_Cost);
          }
          break;
        }
      }
    });
  }

  if (priceHistories && priceHistories.length) {
    priceHistories.forEach(ph => appendRecord(ss, 'PRICE_HISTORY', ph));
  }

  return { status: 'success', invoiceNumber: purchaseInvoice.Invoice_Number };
}

function createBackupSnapshot(ss) {
  const file = DriveApp.getFileById(ss.getId());
  const copyName = "BACKUP - " + ss.getName() + " - " + Utilities.formatDate(new Date(), "GMT+1", "yyyy-MM-dd_HH-mm");
  const copy = file.makeCopy(copyName);
  return { status: 'success', backupUrl: copy.getUrl(), backupName: copyName };
}
`;
