import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  RefreshCw,
  Upload,
  X,
  Edit2,
  Trash2,
  Power,
  PowerOff,
  Home,
  Check,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { userAPI } from '../../services/api';
import MediaPreview from '../../components/MediaPreview';
import { showSuccess, showError, showConfirm } from '../../utils/swalUtils';
// Upload Modal Component
const UploadModal = ({ onClose, onUpload, loading }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [name, setName] = useState('');
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = () => {
    if (selectedFile && name) {
      const formData = new FormData();
      formData.append('Name', name);
      formData.append('ImageFile', selectedFile);
      onUpload(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-strong rounded-xl p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gradient">Upload Home Image</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">Image Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
            placeholder="Enter image name"
          />
        </div>

        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragActive ? 'border-purple-500 bg-purple-500/10' : 'border-white/20'
            }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {preview ? (
            <div className="relative">
              <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setPreview(null);
                }}
                className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300 mb-2">Drag and drop your image here</p>
              <p className="text-gray-500 text-sm mb-4">or</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors"
              >
                Select Image
              </button>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedFile || !name || loading}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Upload
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// Edit Modal Component
const EditModal = ({ image, onClose, onSave, loading }) => {
  const [newName, setNewName] = useState(image.name || '');
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(image.image); // existing image preview
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = () => {
    const formData = new FormData();
    formData.append('Id', image.id);
    formData.append('Name', newName);

    // only append if user selects new image
    if (selectedFile) {
      formData.append('ImageFile', selectedFile);
    }

    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-strong rounded-xl p-6 w-full max-w-md"
      >
        <div className="flex justify-between mb-4">
          <h2 className="text-lg font-bold">Edit Image</h2>
          <button onClick={onClose}><X /></button>
        </div>

        {/* Name */}
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="w-full mb-4 px-3 py-2 border rounded text-gray-300 px-4 py-2 bg-white/5"
        />

        {/* Image Preview */}
        <div className="mb-4 text-center">
          <img
            src={preview}
            alt="preview"
            className="h-32 mx-auto rounded"
          />
        </div>

        {/* Upload New Image */}
        <div className="text-center mb-4">
          <button
            onClick={() => fileInputRef.current.click()}
            className="px-3 py-2 bg-purple-600 text-white rounded"
          >
            Change Image
          </button>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 bg-gray-500 p-2 rounded">
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-blue-600 p-2 rounded text-white"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
export const HomeImageUpload = () => {
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal states
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  const openPreview = (src, title = 'Image Preview') => {
    if (!src) return;
    setPreviewSrc(src);
    setPreviewTitle(title);
    setPreviewOpen(true);
  };
  const [selectedImage, setSelectedImage] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);const fetchImages = async () => {
    try {
      setLoading(true);

      const response = await userAPI.getHomeImages();

      if (response.status) {
        setImages(response.homeImagesList || []);
      } else {
        setImages([]);
      }
    } catch (err) {
      console.error('Fetch home images error:', err);
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  // Pagination
  const totalPages = Math.ceil(images.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedImages = images.slice(startIndex, startIndex + itemsPerPage);

  // Handle Upload
  const handleUpload = async (formData) => {
    setActionLoading(true);

    try {
      const response = await userAPI.uploadHomeImage(formData);

      if (response.status) {
        showSuccess(response.message || 'Home image uploaded successfully');
        setUploadModalOpen(false);
        setTimeout(() => window.location.reload(), 1200);
      } else {
        showError(response.message || 'Failed to upload');
      }
    } catch (err) {
      console.error('Upload error:', err);
      showError('Failed to upload. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Edit
  const handleEditClick = (image) => {
    setSelectedImage(image);
    setEditModalOpen(true);
  };

const handleSaveName = async (formData) => {
  setActionLoading(true);

  try {
    const response = await userAPI.updateHomeImage(formData);

    if (response.status) {
      showSuccess(response.message || 'Image updated successfully');
      setEditModalOpen(false);
      setSelectedImage(null);
      setTimeout(() => window.location.reload(), 1200);
    } else {
      showError(response.message || 'Failed to update');
    }
  } catch (err) {
    console.error('Update error:', err);
    showError('Failed to update. Please try again.');
  } finally {
    setActionLoading(false);
  }
};
  // Handle Enable/Disable
  const handleToggleStatus = async (image) => {
    const newStatus = image.status === 1 ? 0 : 1;
    const action = newStatus === 1 ? 'enable' : 'disable';

    const { isConfirmed } = await showConfirm({
      title: 'Confirm Action',
      text: `Are you sure you want to ${action} image: ${image.name}?`,
      confirmButtonText: 'Yes, Proceed',
      cancelButtonText: 'Cancel',
      variant: 'warning',
    });
    if (!isConfirmed) return;

    setActionLoading(true);

    try {
      const response = await userAPI.updateHomeImageStatus(image.id, newStatus);

      if (response.status) {
        showSuccess(response.message || `Image ${action}d successfully`);
                setTimeout(() => window.location.reload(), 1200);

      } else {
        showError(response.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Status update error:', err);
      showError('Failed to update status. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete
  const handleDelete = async (image) => {
    const { isConfirmed } = await showConfirm({
      title: 'Confirm Action',
      text: `Are you sure you want to delete image: ${image.name}?`,
      confirmButtonText: 'Yes, Proceed',
      cancelButtonText: 'Cancel',
      variant: 'warning',
    });
    if (!isConfirmed) return;

    setActionLoading(true);

    try {
      const response = await userAPI.deleteHomeImage(image.id);

      if (response.status) {
        showSuccess(response.message || 'Image deleted successfully');
        setTimeout(() => window.location.reload(), 1200);
      } else {
        showError(response.message || 'Failed to delete');
      }
    } catch (err) {
      console.error('Delete error:', err);
      showError('Failed to delete. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading home images...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-3 bg-cyan-500/20 rounded-lg">
            <Home className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gradient mb-1 sm:mb-2">Home Image Upload Details</h1>
            <p className="text-gray-400">Total {images.length.toLocaleString()} images</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload Image
          </button>
          <button
            onClick={fetchImages}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl overflow-hidden"
      >
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-[#1a1625] sticky top-0 z-10">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-16">
                  S.No
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Created Date
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-64">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedImages.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-400">
                    No Records Found
                  </td>
                </tr>
              ) : (
                paginatedImages.map((image, index) => {
                  const isActive = image.status === 1;

                  return (
                    <motion.tr
                      key={image.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-400">
                          {startIndex + index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <img
                          src={image.image}
                          alt={image.name}
                          className={`w-20 h-12 object-cover rounded-lg ${image.image ? 'cursor-pointer' : ''}`}
                          onClick={() => image.image && openPreview(image.image, image.name || 'Home Image')}
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="48" viewBox="0 0 80 48"%3E%3Crect width="80" height="48" fill="%236b7280"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="10"%3ENo Image%3C/text%3E%3C/svg%3E';
                            e.target.onerror = null;
                          }}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-medium text-white">
                          {image.name || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-400">
                          {image.created_Date || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isActive
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-400' : 'bg-red-400'
                            }`}></span>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditClick(image)}
                            disabled={actionLoading}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
                          >
                            <Edit2 className="w-3 h-3" />
                            Edit
                          </button>

                          {isActive ? (
                            <button
                              onClick={() => handleToggleStatus(image)}
                              disabled={actionLoading}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-600 hover:bg-orange-700 text-white transition-colors disabled:opacity-50"
                            >
                              <PowerOff className="w-3 h-3" />
                              Disable
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleStatus(image)}
                              disabled={actionLoading}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50"
                            >
                              <Power className="w-3 h-3" />
                              Enable
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(image)}
                            disabled={actionLoading}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/10 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, images.length)} of {images.length} entries
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-400 px-4">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Upload Modal */}
      <AnimatePresence>
        {uploadModalOpen && (
          <UploadModal
            onClose={() => setUploadModalOpen(false)}
            onUpload={handleUpload}
            loading={actionLoading}
          />
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editModalOpen && selectedImage && (
          <EditModal
            image={selectedImage}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedImage(null);
            }}
            onSave={handleSaveName}
            loading={actionLoading}
          />
        )}
      </AnimatePresence>
      <MediaPreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        src={previewSrc}
        title={previewTitle}
      />
    </div>
  );
};
