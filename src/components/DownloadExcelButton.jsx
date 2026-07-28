import React from 'react';
import { Download } from 'lucide-react';
import { downloadExcel } from '../utils/excelExport';

/**
 * Reusable Download Excel Button Component
 *
 * @param {Object} props
 * @param {Array} props.data - Array of data objects to export
 * @param {Array} props.columns - Column configuration array
 * @param {string} props.filename - Optional filename for the Excel file
 * @param {Object} props.options - Additional options for Excel export
 * @param {string} props.buttonText - Text for the button (default: "Download Excel")
 * @param {string} props.className - Additional CSS classes for the button
 * @param {boolean} props.disabled - Whether the button is disabled
 * @param {Function} props.onBeforeDownload - Callback function called before download starts
 * @param {Function} props.onAfterDownload - Callback function called after download completes
 */
const DownloadExcelButton = ({
  data,
  columns,
  filename,
  options = {},
  buttonText = "Download Excel",
  className = "",
  disabled = false,
  onBeforeDownload,
  onAfterDownload
}) => {
  const handleDownload = async () => {
    if (disabled || !data || !columns) return;

    try {
      // Call before download callback if provided
      if (onBeforeDownload) {
        await onBeforeDownload();
      }

      // Perform the download
      downloadExcel(data, columns, filename, options);

      // Call after download callback if provided
      if (onAfterDownload) {
        onAfterDownload();
      }
    } catch (error) {
      console.error('Download failed:', error);
      // You could also show a toast notification here if you have a toast system
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={disabled || !data || data.length === 0}
      className={`flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors text-white ${className}`}
      title={disabled ? "No data available" : "Download data as Excel file"}
    >
      <Download className="w-4 h-4" />
      {buttonText}
    </button>
  );
};

export default DownloadExcelButton;