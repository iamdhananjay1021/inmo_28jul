# Excel Export Utility

This utility provides a common way to add Excel download functionality to any page with tabular data.

## Components

### DownloadExcelButton

A reusable React component that renders a download button and handles Excel export.

```jsx
import DownloadExcelButton from '../components/DownloadExcelButton';
import { commonColumnConfigs } from '../utils/excelExport';

// In your component
<DownloadExcelButton
  data={yourDataArray}
  columns={commonColumnConfigs.users} // or custom columns
  filename="my_data.xlsx"
  options={{
    colWidths: [
      { wch: 15 }, // Column width in characters
      { wch: 20 },
      // ...
    ]
  }}
/>
```

#### Props

- `data` (Array, required): Array of objects to export
- `columns` (Array, required): Column configuration array
- `filename` (String, optional): Filename for the Excel file (defaults to 'export_YYYY-MM-DD.xlsx')
- `options` (Object, optional): Additional Excel export options
- `buttonText` (String, optional): Button text (defaults to "Download Excel")
- `className` (String, optional): Additional CSS classes
- `disabled` (Boolean, optional): Disable the button
- `onBeforeDownload` (Function, optional): Callback before download starts
- `onAfterDownload` (Function, optional): Callback after download completes

## Utility Functions

### downloadExcel(data, columns, filename, options)

Direct function to download Excel files programmatically.

```jsx
import { downloadExcel, commonColumnConfigs } from '../utils/excelExport';

const handleExport = () => {
  downloadExcel(data, commonColumnConfigs.users, 'users.xlsx');
};
```

### commonColumnConfigs

Predefined column configurations for common data types:

- `users`: For user data
- `transactions`: For transaction data
- `reports`: For report data

### createColumnConfig(fields)

Helper to create custom column configurations:

```jsx
import { createColumnConfig } from '../utils/excelExport';

const columns = createColumnConfig([
  { key: 'id', header: 'ID', type: 'number' },
  { key: 'name', header: 'Name', type: 'string' },
  { key: 'createdAt', header: 'Created', type: 'datetime' }
]);
```

## Column Configuration

Each column object should have:

```jsx
{
  key: 'fieldName',        // The key in your data object
  header: 'Display Name',  // Column header in Excel
  formatter: (value, item, index) => {  // Optional formatter function
    // Transform the value before export
    return formattedValue;
  }
}
```

## Usage Examples

### Basic Usage

```jsx
// Simple table data
const data = [
  { id: 1, name: 'John', email: 'john@example.com' },
  { id: 2, name: 'Jane', email: 'jane@example.com' }
];

const columns = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: 'Name' },
  { key: 'email', header: 'Email' }
];

<DownloadExcelButton data={data} columns={columns} />
```

### With Custom Formatting

```jsx
const columns = [
  { key: 'id', header: 'ID' },
  {
    key: 'balance',
    header: 'Balance',
    formatter: (value) => `$${parseFloat(value || 0).toFixed(2)}`
  },
  {
    key: 'createdAt',
    header: 'Created Date',
    formatter: (value) => {
      if (!value) return 'N/A';
      return new Date(value).toLocaleDateString();
    }
  }
];
```

### With Serial Numbers

```jsx
// Add serial numbers to your data
const dataWithSerial = data.map((item, index) => ({
  ...item,
  serialNumber: index + 1
}));

const columns = [
  { key: 'serialNumber', header: 'S.No' },
  // ... other columns
];
```

## Integration in Pages

To add Excel download to any page:

1. Import the component
2. Prepare your data array
3. Define column configuration
4. Add the component to your JSX

The button will automatically be disabled if no data is available.