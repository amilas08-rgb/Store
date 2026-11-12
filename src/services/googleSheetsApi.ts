/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TABLE_DEFINITIONS, SCHEMA_VERSION, DEFAULT_STORE_SETTINGS, INITIAL_ROLES, INITIAL_PERMISSIONS, INITIAL_CATEGORIES, INITIAL_BANK, INITIAL_USER, INITIAL_CUSTOMER_COUNTER } from './schema';

export interface SheetRowRecord {
  [key: string]: any;
}

export interface SheetInspectionResult {
  spreadsheetTitle: string;
  existingSheets: string[];
  missingSheets: string[];
  columnIssues: {
    sheetName: string;
    existingColumns: string[];
    missingColumns: string[];
  }[];
  isValid: boolean;
  totalSheetsFound: number;
}

export class GoogleSheetsService {
  private static SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
  private static DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

  /**
   * Search for existing spreadsheets in user's Drive
   */
  static async listSpreadsheets(accessToken: string): Promise<{ id: string; name: string; modifiedTime: string }[]> {
    const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
    const res = await fetch(`${this.DRIVE_API_BASE}/files?q=${query}&fields=files(id,name,modifiedTime)&pageSize=30&orderBy=modifiedTime desc`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `فشل استرجاع الملفات من Google Drive (${res.status})`);
    }

    const data = await res.json();
    return data.files || [];
  }

  /**
   * Extract Spreadsheet ID from raw input (ID or full URL)
   */
  static extractSpreadsheetId(input: string): string {
    const trimmed = input.trim();
    const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return match[1];
    }
    return trimmed;
  }

  /**
   * Fetch spreadsheet metadata and sheet list
   */
  static async getSpreadsheetMetadata(accessToken: string, spreadsheetId: string) {
    const res = await fetch(`${this.SHEETS_API_BASE}/${spreadsheetId}?fields=properties.title,sheets.properties`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `فشل قراءة ملف Google Sheets (${res.status})`);
    }

    return await res.json();
  }

  /**
   * Inspect existing spreadsheet against AppSheet schema
   */
  static async inspectSpreadsheet(accessToken: string, spreadsheetId: string): Promise<SheetInspectionResult> {
    const meta = await this.getSpreadsheetMetadata(accessToken, spreadsheetId);
    const existingSheetNames: string[] = (meta.sheets || []).map((s: any) => s.properties?.title);
    const allRequiredTables = Object.keys(TABLE_DEFINITIONS);

    const missingSheets = allRequiredTables.filter(name => !existingSheetNames.includes(name));
    const columnIssues: SheetInspectionResult['columnIssues'] = [];

    // Check columns for existing sheets
    for (const sheetName of existingSheetNames) {
      if (TABLE_DEFINITIONS[sheetName]) {
        try {
          const res = await fetch(
            `${this.SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!1:1`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (res.ok) {
            const data = await res.json();
            const existingHeaders: string[] = (data.values && data.values[0]) || [];
            const requiredHeaders = TABLE_DEFINITIONS[sheetName].columns.map(c => c.name);
            const missing = requiredHeaders.filter(c => !existingHeaders.includes(c));
            if (missing.length > 0) {
              columnIssues.push({
                sheetName,
                existingColumns: existingHeaders,
                missingColumns: missing,
              });
            }
          }
        } catch {
          // ignore individual read error
        }
      }
    }

    const isValid = missingSheets.length === 0 && columnIssues.length === 0;

    return {
      spreadsheetTitle: meta.properties?.title || 'STORE MANAGEMENT DATABASE',
      existingSheets: existingSheetNames,
      missingSheets,
      columnIssues,
      isValid,
      totalSheetsFound: existingSheetNames.length,
    };
  }

  /**
   * Create a brand-new complete store database in Google Drive
   */
  static async createCompleteStoreDatabase(accessToken: string, customStoreName?: string): Promise<{ id: string; url: string; title: string }> {
    const title = `STORE MANAGEMENT DATABASE - ${customStoreName || 'متجر الصفوة'}`;
    const tableKeys = Object.keys(TABLE_DEFINITIONS);

    // Initial sheets configuration
    const sheetsRequests = tableKeys.map(name => ({
      properties: {
        title: name,
        gridProperties: {
          rowCount: 500,
          columnCount: Math.max(TABLE_DEFINITIONS[name].columns.length + 2, 26),
          frozenRowCount: 1,
        },
      },
    }));

    const createPayload = {
      properties: {
        title,
        locale: 'ar_MA',
        timeZone: 'Africa/Casablanca',
      },
      sheets: sheetsRequests,
    };

    const res = await fetch(this.SHEETS_API_BASE, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createPayload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `فشل إنشاء ملف Google Sheets (${res.status})`);
    }

    const newSheet = await res.json();
    const spreadsheetId = newSheet.spreadsheetId;

    // Now populate headers and seed data in batch
    await this.populateInitialData(accessToken, spreadsheetId);

    return {
      id: spreadsheetId,
      url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
      title,
    };
  }

  /**
   * Populate all headers and initial seed tables
   */
  private static async populateInitialData(accessToken: string, spreadsheetId: string) {
    const tableKeys = Object.keys(TABLE_DEFINITIONS);
    const dataValues: { range: string; values: any[][] }[] = [];

    for (const name of tableKeys) {
      const def = TABLE_DEFINITIONS[name];
      const headers = def.columns.map(c => c.name);
      const rows: any[][] = [headers];

      // Add default seeds
      if (name === 'STORE_SETTINGS') {
        const row = headers.map(h => (DEFAULT_STORE_SETTINGS as any)[h] ?? '');
        rows.push(row);
      } else if (name === 'ROLES') {
        for (const role of INITIAL_ROLES) {
          rows.push(headers.map(h => (role as any)[h] ?? ''));
        }
      } else if (name === 'PERMISSIONS') {
        for (const p of INITIAL_PERMISSIONS) {
          rows.push(headers.map(h => (p as any)[h] ?? ''));
        }
      } else if (name === 'ROLE_PERMISSIONS') {
        INITIAL_PERMISSIONS.forEach((p, idx) => {
          rows.push([`RP-${idx + 1}`, 'ROLE-ADMIN', p.Permission_ID, true]);
        });
      } else if (name === 'USERS') {
        rows.push(headers.map(h => (INITIAL_USER as any)[h] ?? ''));
      } else if (name === 'CATEGORIES') {
        for (const cat of INITIAL_CATEGORIES) {
          rows.push(headers.map(h => (cat as any)[h] ?? ''));
        }
      } else if (name === 'BANK_ACCOUNTS') {
        rows.push(headers.map(h => (INITIAL_BANK as any)[h] ?? ''));
      } else if (name === 'CUSTOMERS') {
        rows.push(headers.map(h => (INITIAL_CUSTOMER_COUNTER as any)[h] ?? ''));
      } else if (name === 'DATABASE_SCHEMA') {
        for (const t of Object.keys(TABLE_DEFINITIONS)) {
          for (const c of TABLE_DEFINITIONS[t].columns) {
            rows.push([SCHEMA_VERSION, t, c.name, c.type, c.required, new Date().toISOString()]);
          }
        }
      } else if (name === 'APP_SETTINGS') {
        rows.push(['APP-01', 'Schema_Version', SCHEMA_VERSION, new Date().toISOString()]);
        rows.push(['APP-02', 'Auto_Sync', 'true', new Date().toISOString()]);
        rows.push(['APP-03', 'Default_Currency', 'MAD', new Date().toISOString()]);
      }

      dataValues.push({
        range: `${name}!A1:${this.colIndexToA1(headers.length)}${rows.length}`,
        values: rows,
      });
    }

    const batchRes = await fetch(`${this.SHEETS_API_BASE}/${spreadsheetId}/values:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: dataValues,
      }),
    });

    if (!batchRes.ok) {
      console.warn('Batch header write warning:', await batchRes.text());
    }

    // Format headers (bold + amber background + borders)
    await this.formatSpreadsheetHeaders(accessToken, spreadsheetId);
  }

  /**
   * Apply professional header formatting to all sheets
   */
  static async formatSpreadsheetHeaders(accessToken: string, spreadsheetId: string) {
    try {
      const meta = await this.getSpreadsheetMetadata(accessToken, spreadsheetId);
      const sheets = meta.sheets || [];

      const requests: any[] = [];
      for (const sheet of sheets) {
        const sheetId = sheet.properties.sheetId;
        requests.push({
          repeatCell: {
            range: {
              sheetId: sheetId,
              startRowIndex: 0,
              endRowIndex: 1,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.08, green: 0.12, blue: 0.18 }, // Slate-900
                textFormat: {
                  foregroundColor: { red: 0.96, green: 0.71, blue: 0.16 }, // Amber-500
                  fontSize: 11,
                  bold: true,
                },
                horizontalAlignment: 'CENTER',
              },
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
          },
        });
      }

      await fetch(`${this.SHEETS_API_BASE}/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests }),
      });
    } catch (e) {
      console.warn('Could not format headers:', e);
    }
  }

  /**
   * Non-destructive Repair / Migration:
   * Adds missing sheets and appends missing column headers to existing sheets.
   */
  static async repairAndMigrateSpreadsheet(accessToken: string, spreadsheetId: string, inspection: SheetInspectionResult) {
    // 1. Create missing sheets
    if (inspection.missingSheets.length > 0) {
      const addSheetRequests = inspection.missingSheets.map(title => ({
        addSheet: {
          properties: {
            title,
            gridProperties: {
              rowCount: 500,
              columnCount: 26,
              frozenRowCount: 1,
            },
          },
        },
      }));

      await fetch(`${this.SHEETS_API_BASE}/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests: addSheetRequests }),
      });

      // Write headers for newly created sheets
      const headerUpdates = inspection.missingSheets.map(name => {
        const headers = TABLE_DEFINITIONS[name]?.columns.map(c => c.name) || [];
        return {
          range: `${name}!A1:${this.colIndexToA1(headers.length)}1`,
          values: [headers],
        };
      });

      await fetch(`${this.SHEETS_API_BASE}/${spreadsheetId}/values:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          valueInputOption: 'USER_ENTERED',
          data: headerUpdates,
        }),
      });
    }

    // 2. Add missing columns to existing sheets without touching data
    for (const issue of inspection.columnIssues) {
      if (issue.missingColumns.length > 0) {
        const startCol = issue.existingColumns.length + 1;
        const endCol = startCol + issue.missingColumns.length - 1;
        const range = `${issue.sheetName}!${this.colIndexToA1(startCol)}1:${this.colIndexToA1(endCol)}1`;

        await fetch(`${this.SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: [issue.missingColumns],
          }),
        });
      }
    }

    return true;
  }

  /**
   * Read all records from a specific sheet as an array of JS objects
   */
  static async readTable(accessToken: string, spreadsheetId: string, sheetName: string): Promise<SheetRowRecord[]> {
    const res = await fetch(
      `${this.SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:ZZ`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!res.ok) {
      if (res.status === 404) return [];
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `خطأ قراءة الجدول ${sheetName}`);
    }

    const data = await res.json();
    const rows: any[][] = data.values || [];
    if (rows.length < 2) return [];

    const headers: string[] = rows[0];
    const records: SheetRowRecord[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0 || row.every(val => val === '' || val === undefined)) continue;

      const obj: SheetRowRecord = {};
      headers.forEach((header, idx) => {
        let val = row[idx];
        if (val === undefined) val = '';
        obj[header] = val;
      });
      records.push(obj);
    }

    return records;
  }

  /**
   * Write all records back to a sheet (replace rows after header)
   */
  static async overwriteTableData(
    accessToken: string,
    spreadsheetId: string,
    sheetName: string,
    records: SheetRowRecord[]
  ) {
    const def = TABLE_DEFINITIONS[sheetName];
    if (!def) return;

    const headers = def.columns.map(c => c.name);
    const rowValues = records.map(rec => headers.map(h => (rec[h] !== undefined && rec[h] !== null ? String(rec[h]) : '')));

    // Clear existing values from row 2 onwards
    await fetch(`${this.SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A2:ZZ:clear`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (rowValues.length > 0) {
      await fetch(
        `${this.SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A2?valueInputOption=USER_ENTERED`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: rowValues }),
        }
      );
    }
  }

  /**
   * Append a single row or batch of rows to a sheet
   */
  static async appendTableRows(
    accessToken: string,
    spreadsheetId: string,
    sheetName: string,
    records: SheetRowRecord[]
  ) {
    if (!records.length) return;
    const def = TABLE_DEFINITIONS[sheetName];
    const headers = def ? def.columns.map(c => c.name) : Object.keys(records[0]);
    const rowValues = records.map(rec => headers.map(h => (rec[h] !== undefined && rec[h] !== null ? String(rec[h]) : '')));

    const res = await fetch(
      `${this.SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: rowValues }),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `فشل إضافة السجل إلى جدول ${sheetName}`);
    }
  }

  /**
   * Helper: Column index to A1 notation (1 -> A, 27 -> AA)
   */
  private static colIndexToA1(colIndex: number): string {
    let temp = colIndex;
    let letter = '';
    while (temp > 0) {
      const mod = (temp - 1) % 26;
      letter = String.fromCharCode(65 + mod) + letter;
      temp = Math.floor((temp - mod) / 26);
    }
    return letter || 'A';
  }
}
