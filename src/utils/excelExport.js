import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/**
 * Downloads data as an Excel file
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Array of column definitions: [{ key: 'fieldName', header: 'Display Name', formatter?: (value) => formattedValue }]
 * @param {string} filename - Optional filename (defaults to 'export_YYYY-MM-DD.xlsx')
 * @param {Object} options - Additional options
 * @param {Array} options.colWidths - Array of column widths: [{ wch: width }]
 */
export const downloadExcel = (data, columns, filename, options = {}) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    alert('No data available to export');
    return;
  }

  if (!columns || !Array.isArray(columns) || columns.length === 0) {
    alert('No columns defined for export');
    return;
  }

  try {
    // Transform data according to column definitions
    const excelData = data.map((item, index) => {
      const row = {};

      columns.forEach(column => {
        const value = item[column.key];
        const formattedValue = column.formatter ? column.formatter(value, item, index) : value;
        row[column.header] = formattedValue !== undefined && formattedValue !== null ? formattedValue : '';
      });

      return row;
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths if provided
    if (options.colWidths && Array.isArray(options.colWidths)) {
      ws['!cols'] = options.colWidths;
    } else {
      // Auto-size columns based on content
      const colWidths = columns.map(column => {
        const headerLength = column.header.length;
        const maxDataLength = Math.max(
          headerLength,
          ...excelData.map(row => String(row[column.header] || '').length)
        );
        return { wch: Math.min(maxDataLength + 2, 50) }; // Cap at 50 chars, add 2 for padding
      });
      ws['!cols'] = colWidths;
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Data');

    // Generate filename
    const finalFilename = filename || `export_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Save file
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, finalFilename);
  } catch (error) {
    alert('Error exporting to Excel:');
    console.error('Error exporting to Excel:', error);
  }
};

/**
 * Predefined column configurations for common data types
 */
export const commonColumnConfigs = {
  // For user data
  users: [
    { key: 'userId', header: 'User ID' },
    { key: 'name', header: 'Name', formatter: (value) => value || 'No Name' },
    { key: 'mobile', header: 'Mobile', formatter: (value) => value || 'N/A' },
    { key: 'countryName', header: 'Country', formatter: (value, item) => item.countryName || item.country || 'N/A' },
    { key: 'latestCoins', header: 'Coins', formatter: (value) => parseInt(value || 0) },
    { key: 'latestBeans', header: 'Beans', formatter: (value) => parseInt(value || 0) },
    { key: 'createDate', header: 'Joined Date', formatter: (value) => {
      if (!value) return 'N/A';
      const date = new Date(value);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }}
  ],

  // For transaction data
  transactions: [
    { key: 'id', header: 'Transaction ID' },
    { key: 'userId', header: 'User ID' },
    { key: 'amount', header: 'Amount', formatter: (value) => parseFloat(value || 0) },
    { key: 'type', header: 'Type' },
    { key: 'status', header: 'Status' },
    { key: 'date', header: 'Date', formatter: (value) => {
      if (!value) return 'N/A';
      const date = new Date(value);
      return date.toLocaleDateString('en-IN');
    }}
  ],

  // For report data
  reports: [
    { key: 'id', header: 'ID' },
    { key: 'title', header: 'Title' },
    { key: 'description', header: 'Description' },
    { key: 'status', header: 'Status' },
    { key: 'createdAt', header: 'Created Date', formatter: (value) => {
      if (!value) return 'N/A';
      const date = new Date(value);
      return date.toLocaleDateString('en-IN');
    }}
  ]
};

/**
 * Helper function to create custom column config
 * @param {Array} fields - Array of field definitions: [{ key: 'fieldName', header: 'Display Name', type?: 'string|number|date' }]
 * @returns {Array} Column configuration array
 */
export const createColumnConfig = (fields) => {
  return fields.map(field => ({
    key: field.key,
    header: field.header,
    formatter: (value) => {
      if (value === null || value === undefined) return '';

      switch (field.type) {
        case 'number':
          return parseFloat(value) || 0;
        case 'date':
          if (!value) return 'N/A';
          const date = new Date(value);
          return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        case 'datetime':
          if (!value) return 'N/A';
          const datetime = new Date(value);
          return datetime.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        default:
          return String(value);
      }
    }
  }));
};