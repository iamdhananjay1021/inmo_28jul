import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  RefreshCw,
  Upload,
  X,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Check,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { userAPI } from '../../services/api';
import MediaPreview from '../../components/MediaPreview';
import { showSuccess, showError, showConfirm } from '../../utils/swalUtils';

// Upload Modal Component
const UploadModal = ({ onClose, onUpload, loading, defaultType }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  // New fields matching the InsertHomeAppBanner API
  const [imageName, setImageName] = useState('');
  const [bannerId, setBannerId] = useState('');
  const [type, setType] = useState(defaultType || 'Home');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setImageName(file.name);
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
      setImageName(file.name);
    }
  };

  const handleSubmit = () => {
    if (selectedFile) {
      const formData = new FormData();
      formData.append('BannerImage', selectedFile);
      formData.append('ImageName', imageName);
      formData.append('Type', type);
      if (bannerId.trim()) {
        formData.append('BannerId', bannerId.trim());
      }
      onUpload(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-strong rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gradient">Upload Banner</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors mb-4 ${
            dragActive ? 'border-purple-500 bg-purple-500/10' : 'border-white/20'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {preview ? (
            <div className="relative">
              <img src={preview} alt="Preview" className="max-h-40 mx-auto rounded-lg" />
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setPreview(null);
                  setImageName('');
                }}
                className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <ImageIcon className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-300 text-sm mb-1">Drag and drop your image here</p>
              <p className="text-gray-500 text-xs mb-3">or</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm transition-colors"
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

        {selectedFile && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Image Name *</label>
              <input
                type="text"
                value={imageName}
                onChange={(e) => setImageName(e.target.value)}
                placeholder="Image Name (e.g. hiring.webp)"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Banner Id (Optional)</label>
              <input
                type="text"
                value={bannerId}
                onChange={(e) => setBannerId(e.target.value)}
                placeholder="Optional custom BannerId"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Banner Type *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-2 bg-[#1c0e3a] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="Home">Home</option>
                <option value="App">App</option>
              </select>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedFile || !imageName.trim() || loading}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Upload Banner
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// Edit Modal Component
const EditModal = ({ banner, onClose, onSave, loading }) => {
  const [imageName, setImageName] = useState(banner.BannerName || '');
  const [bannerId, setBannerId] = useState(banner.BannerId || '');
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(banner.BannerImage || null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setImageName(file.name);
    }
  };

  const handleSubmit = () => {
    const formData = new FormData();
    // Id is required (parsed as integer)
    const id = parseInt(banner.BannerId, 10);
    formData.append('Id', id);
    
    if (selectedFile) {
      formData.append('BannerImage', selectedFile);
    }
    if (imageName.trim()) {
      formData.append('ImageName', imageName.trim());
    }
    if (bannerId.trim()) {
      formData.append('BannerId', bannerId.trim());
    }
    
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-strong rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gradient">Edit Banner</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Banner ID (System DB ID)</label>
            <p className="text-gray-300 px-4 py-2 bg-white/5 rounded-lg text-sm">{banner.BannerId}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">New Image File</label>
            <div className="border border-white/10 rounded-lg p-4 text-center">
              {preview ? (
                <div className="relative mb-3">
                  <img src={preview} alt="Preview" className="max-h-32 mx-auto rounded-lg" />
                  {selectedFile && (
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setPreview(banner.BannerImage || null);
                      }}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ) : (
                <ImageIcon className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-xs transition-colors"
              >
                Change Image
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Image Name</label>
            <input
              type="text"
              value={imageName}
              onChange={(e) => imageName(e.target.value)}
              placeholder="e.g. new_name.webp"
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Banner ID Display</label>
            <input
              type="text"
              value={bannerId}
              onChange={(e) => setBannerId(e.target.value)}
              placeholder="e.g. BANNER_NEW"
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export const BannerUpload = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Home');
  const [bannersData, setBannersData] = useState({ HomeBanners: {}, AppBanners: {} });
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Modal states
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  const openPreview = (src, title = 'Image Preview') => {
    if (!src) return;
    setPreviewSrc(src);
    setPreviewTitle(title);
    setPreviewOpen(true);
  };

  const fetchBanners = async () => {
    try {
      setLoading(true);
      // Fetch banners using the new API (optionally filtered by activeTab)
      const response = await userAPI.getBanners(activeTab);
      
      const isSuccess = response.Status === true || response.status === true;
      if (isSuccess && response.data) {
        setBannersData(response.data);
      } else {
        setBannersData({ HomeBanners: {}, AppBanners: {} });
      }
    } catch (err) {
      console.error('Fetch banners error:', err);
      setBannersData({ HomeBanners: {}, AppBanners: {} });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, [activeTab]);

  const getBannersList = (bannerObjOrArr) => {
    if (!bannerObjOrArr) return [];
    if (Array.isArray(bannerObjOrArr)) return bannerObjOrArr;
    return Object.values(bannerObjOrArr);
  };

  // Derive current banners based on tab selection
  const currentBanners = activeTab === 'Home'
    ? getBannersList(bannersData.HomeBanners)
    : getBannersList(bannersData.AppBanners);

  // Pagination
  const totalPages = Math.ceil(currentBanners.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBanners = currentBanners.slice(startIndex, startIndex + itemsPerPage);

  // Handle Upload
  const handleUpload = async (formData) => {
    setActionLoading(true);
    try {
      const response = await userAPI.uploadBanner(formData);
      const isSuccess = response.Status === true || response.status === true;
      if (isSuccess) {
        showSuccess(response.Message || response.message || 'Banner uploaded successfully');
        setUploadModalOpen(false);
        fetchBanners();
      } else {
        showError(response.Message || response.message || 'Failed to upload');
      }
    } catch (err) {
      console.error('Upload error:', err);
      showError('Failed to upload. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Edit Click
  const handleEditClick = (banner) => {
    setSelectedBanner(banner);
    setEditModalOpen(true);
  };

  // Handle Save (Update)
  const handleSave = async (formData) => {
    setActionLoading(true);
    try {
      const response = await userAPI.updateBanner(formData);
      const isSuccess = response.Status === true || response.status === true;
      if (isSuccess) {
        showSuccess(response.Message || response.message || 'Banner updated successfully');
        setEditModalOpen(false);
        setSelectedBanner(null);
        fetchBanners();
      } else {
        showError(response.Message || response.message || 'Failed to update');
      }
    } catch (err) {
      console.error('Update error:', err);
      showError('Failed to update. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete
  const handleDelete = async (banner) => {
    const { isConfirmed } = await showConfirm({
      title: 'Confirm Action',
      text: `Are you sure you want to delete banner: ${banner.BannerName || 'this banner'}?`,
      confirmButtonText: 'Yes, Proceed',
      cancelButtonText: 'Cancel',
      variant: 'warning',
    });
    if (!isConfirmed) return;
    
    setActionLoading(true);
    try {
      const response = await userAPI.deleteBanner(banner.BannerId);
      const isSuccess = response.Status === true || response.status === true;
      if (isSuccess) {
        showSuccess(response.Message || response.message || 'Banner deleted successfully');
        fetchBanners();
      } else {
        showError(response.Message || response.message || 'Failed to delete');
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
          <p className="text-gray-400">Loading banners...</p>
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
          <div className="p-3 bg-pink-500/20 rounded-lg">
            <ImageIcon className="w-8 h-8 text-pink-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gradient mb-1 sm:mb-2">Banner Upload Details</h1>
            <p className="text-gray-400">Total {currentBanners.length.toLocaleString()} banners</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload Banner
          </button>
          <button
            onClick={fetchBanners}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setActiveTab('Home');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors ${
            activeTab === 'Home'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          Home
        </button>
        <button
          onClick={() => {
            setActiveTab('App');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors ${
            activeTab === 'App'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          App
        </button>
      </div>

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
                  Banner Image
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Banner Name
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Created Date
                </th>
                {/* Status Column Commented Out */}
                {/* <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Status
                </th> */}
                <th className="px-4 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-64">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedBanners.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                    No Records Found
                  </td>
                </tr>
              ) : (
                paginatedBanners.map((banner, index) => {
                  return (
                    <motion.tr
                      key={banner.BannerId}
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
                          src={banner.BannerImage}
                          alt={banner.BannerName}
                          className={`w-20 h-12 object-cover rounded-lg ${banner.BannerImage ? 'cursor-pointer' : ''}`}
                          onClick={() => banner.BannerImage && openPreview(banner.BannerImage, banner.BannerName || 'Banner')}
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="48" viewBox="0 0 80 48"%3E%3Crect width="80" height="48" fill="%236b7280"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="10"%3ENo Image%3C/text%3E%3C/svg%3E';
                            e.target.onerror = null;
                          }}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-medium text-white">
                          {banner.BannerName || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-400">
                          {banner.Created_Date ? new Date(banner.Created_Date).toLocaleString() : 'N/A'}
                        </span>
                      </td>
                      {/* Status Row Commented Out */}
                      {/* <td className="px-4 py-4">
                        ...
                      </td> */}
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditClick(banner)}
                            disabled={actionLoading}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
                          >
                            <Edit2 className="w-3 h-3" />
                            Edit
                          </button>
                          
                          {/* Enable/Disable Buttons Commented Out */}
                          {/* {isActive ? (
                            <button
                              onClick={() => handleToggleStatus(banner)}
                              disabled={actionLoading}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-600 hover:bg-orange-700 text-white transition-colors disabled:opacity-50"
                            >
                              <PowerOff className="w-3 h-3" />
                              Disable
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleStatus(banner)}
                              disabled={actionLoading}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50"
                            >
                              <Power className="w-3 h-3" />
                              Enable
                            </button>
                          )} */}
                          
                          <button
                            onClick={() => handleDelete(banner)}
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
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, currentBanners.length)} of {currentBanners.length} entries
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
            defaultType={activeTab}
          />
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editModalOpen && selectedBanner && (
          <EditModal
            banner={selectedBanner}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedBanner(null);
            }}
            onSave={handleSave}
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
