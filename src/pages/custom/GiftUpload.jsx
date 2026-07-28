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
  ChevronRight,
  Gift
} from 'lucide-react';
// import { Player, Parser } from "svgaplayerweb";
import { userAPI } from '../../services/api';
import MediaPreview from '../../components/MediaPreview';
import { showSuccess, showError, showConfirm } from '../../utils/swalUtils';

// Upload Modal Component
const UploadModal = ({ onClose, onUpload, loading, defaultType }) => {
  const [giftName, setGiftName] = useState('');
  const [giftAmount, setGiftAmount] = useState('');
  const [type, setType] = useState(defaultType || 'Animation');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [gifFile, setGifFile] = useState(null);
  const [gifPreview, setGifPreview] = useState(null);

  const imageInputRef = useRef(null);
  const gifInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleGifChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setGifFile(file);
      setGifPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = () => {
    if (!giftName.trim()) {
      showError('Gift Name is required');
      return;
    }
    if (!giftAmount) {
      showError('Gift Amount is required');
      return;
    }

    const formData = new FormData();
    formData.append('GiftName', giftName.trim());
    formData.append('GiftAmount', parseInt(giftAmount, 10));
    formData.append('Type', type);

    if (imageFile) {
      formData.append('GiftImage', imageFile);
    }
    if (gifFile) {
      formData.append('GiftGIFFile', gifFile);
    }

    onUpload(formData);
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
          <h2 className="text-xl font-bold text-gradient">Upload Gift</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Gift Name *</label>
            <input
              type="text"
              value={giftName}
              onChange={(e) => setGiftName(e.target.value)}
              placeholder="e.g. Flower"
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Gift Amount (Coins) *</label>
            <input
              type="number"
              value={giftAmount}
              onChange={(e) => setGiftAmount(e.target.value)}
              placeholder="e.g. 10"
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Gift Type *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-2 bg-[#1c0e3a] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
            >
              <option value="Animation">Animation</option>
              <option value="Sticker">Sticker</option>
              <option value="Lucky">Lucky</option>
            </select>
          </div>

          {/* Gift Image (PNG/JPG) Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Gift Image (PNG/JPG) - Optional</label>
            <div className="border-2 border-dashed border-white/20 rounded-xl p-4 text-center mb-2">
              {imagePreview ? (
                <div className="relative inline-block">
                  <img src={imagePreview} alt="Image Preview" className="max-h-24 rounded-lg mx-auto" />
                  <button
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3. h-3" />
                  </button>
                </div>
              ) : (
                <div>
                  <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-xs transition-colors"
                  >
                    Choose Image
                  </button>
                </div>
              )}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Gift GIF/SVGA Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Gift GIF/SVGA File - Optional</label>
            <div className="border-2 border-dashed border-white/20 rounded-xl p-4 text-center">
              {gifPreview ? (
                <div className="relative inline-block">
                  <img src={gifPreview} alt="GIF Preview" className="max-h-24 rounded-lg mx-auto" />
                  <button
                    onClick={() => {
                      setGifFile(null);
                      setGifPreview(null);
                    }}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div>
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <button
                    onClick={() => gifInputRef.current?.click()}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-xs transition-colors"
                  >
                    Choose GIF/SVGA
                  </button>
                </div>
              )}
              <input
                ref={gifInputRef}
                type="file"
                accept="image/gif, .svga"
                onChange={handleGifChange}
                className="hidden"
              />
            </div>
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
            disabled={!giftName.trim() || !giftAmount || loading}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Upload Gift
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// Edit Modal Component
const EditModal = ({ gift, onClose, onSave, loading }) => {
  const [giftName, setGiftName] = useState(gift.GiftName || '');
  const [giftAmount, setGiftAmount] = useState(gift.GiftAmount || '');
  const [type, setType] = useState(gift.Type || 'Animation');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(gift.GiftImages || null);
  const [gifFile, setGifFile] = useState(null);
  const [gifPreview, setGifPreview] = useState(gift.GiftGIF || null);

  const imageInputRef = useRef(null);
  const gifInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleGifChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setGifFile(file);
      setGifPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = () => {
    if (!giftName.trim()) {
      showError('Gift Name is required');
      return;
    }
    if (!giftAmount) {
      showError('Gift Amount is required');
      return;
    }

    const formData = new FormData();
    formData.append('Id', parseInt(gift.Id, 10));
    formData.append('GiftName', giftName.trim());
    formData.append('GiftAmount', parseInt(giftAmount, 10));
    formData.append('Type', type);

    if (imageFile) {
      formData.append('GiftImage', imageFile);
    }
    if (gifFile) {
      formData.append('GiftGIFFile', gifFile);
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
          <h2 className="text-xl font-bold text-gradient">Edit Gift</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Gift ID</label>
            <p className="text-gray-300 px-4 py-2 bg-white/5 rounded-lg text-sm">{gift.Id}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Gift Name</label>
            <input
              type="text"
              value={giftName}
              onChange={(e) => setGiftName(e.target.value)}
              placeholder="Gift Name"
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Gift Amount (Coins)</label>
            <input
              type="number"
              value={giftAmount}
              onChange={(e) => setGiftAmount(e.target.value)}
              placeholder="Gift Amount"
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Gift Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-2 bg-[#1c0e3a] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
            >
              <option value="Animation">Animation</option>
              <option value="Sticker">Sticker</option>
              <option value="Lucky">Lucky</option>
            </select>
          </div>

          {/* Edit Image File */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Gift Image (PNG/JPG)</label>
            <div className="border border-white/10 rounded-lg p-4 text-center">
              {imagePreview ? (
                <div className="relative mb-3">
                  <img src={imagePreview} alt="Image Preview" className="max-h-24 mx-auto rounded-lg" />
                  {imageFile && (
                    <button
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(gift.GiftImages || null);
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
                onClick={() => imageInputRef.current?.click()}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-xs transition-colors"
              >
                Change Image
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Edit GIF/SVGA File */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Gift GIF/SVGA File</label>
            <div className="border border-white/10 rounded-lg p-4 text-center">
              {gifPreview ? (
                <div className="relative mb-3">
                  <img src={gifPreview} alt="GIF Preview" className="max-h-24 mx-auto rounded-lg" />
                  {gifFile && (
                    <button
                      onClick={() => {
                        setGifFile(null);
                        setGifPreview(gift.GiftGIF || null);
                      }}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ) : (
                <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              )}
              <button
                onClick={() => gifInputRef.current?.click()}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-xs transition-colors"
              >
                Change GIF/SVGA
              </button>
              <input
                ref={gifInputRef}
                type="file"
                accept="image/gif, .svga"
                onChange={handleGifChange}
                className="hidden"
              />
            </div>
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

// const SVGAPlayer = ({ src }) => {
//   console.log('SVGAPlayer src:', src);
//   const containerRef = useRef(null);

//   useEffect(() => {
//     if (!src || !containerRef.current) return;

//     const player = new Player(containerRef.current);
//     const parser = new Parser();

//     (async () => {
//       try {
//         console.log("Loading:", src);

//         const videoItem = await parser.load(src);

//         console.log("Loaded:", videoItem);

//         player.setVideoItem(videoItem);
//         player.loops = 0; // infinite loop
//         player.startAnimation();
//       } catch (err) {
//         console.error("SVGA Error:", err);
//       }
//     })();

//     return () => {
//       player.clear();
//     };
//   }, [src]);
//   return (
//     <div
//       ref={containerRef}
//       style={{
//         width: "48px",
//         height: "48px",
//         display: "block",
//         overflow: "hidden",
//         background: "#222",
//       }}
//     />
//   );
// };

export const GiftUpload = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Animation');
  const [giftsList, setGiftsList] = useState([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const pageSizeOptions = [20, 40, 100, 200, 300, 500];

  // Modal states
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedGift, setSelectedGift] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  const openPreview = (src, title = 'Media Preview') => {
    if (!src) return;
    setPreviewSrc(src);
    setPreviewTitle(title);
    setPreviewOpen(true);
  };

  const fetchGifts = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getGifts(activeTab);
      const isSuccess = response.Status === true || response.status === true;
      if (isSuccess && response.data) {
        setGiftsList(response.data);
      } else {
        setGiftsList([]);
      }
    } catch (err) {
      console.error('Fetch gifts error:', err);
      setGiftsList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGifts();
  }, [activeTab]);

  // Pagination
  const totalPages = Math.ceil(giftsList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedGifts = giftsList.slice(startIndex, startIndex + itemsPerPage);

  // Handle Upload
  const handleUpload = async (formData) => {
    setActionLoading(true);
    try {
      const response = await userAPI.uploadGift(formData);
      const isSuccess = response.Status === true || response.status === true;
      if (isSuccess) {
        showSuccess(response.Message || response.message || 'Gift uploaded successfully');
        setUploadModalOpen(false);
        fetchGifts();
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
  const handleEditClick = (gift) => {
    setSelectedGift(gift);
    setEditModalOpen(true);
  };

  // Handle Save (Update)
  const handleSave = async (formData) => {
    setActionLoading(true);
    try {
      const response = await userAPI.updateGift(formData);
      const isSuccess = response.Status === true || response.status === true;
      if (isSuccess) {
        showSuccess(response.Message || response.message || 'Gift updated successfully');
        setEditModalOpen(false);
        setSelectedGift(null);
        fetchGifts();
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
  const handleDelete = async (gift) => {
    const { isConfirmed } = await showConfirm({
      title: 'Confirm Action',
      text: `Are you sure you want to delete gift: ${gift.GiftName || 'this gift'}?`,
      confirmButtonText: 'Yes, Proceed',
      cancelButtonText: 'Cancel',
      variant: 'warning',
    });
    if (!isConfirmed) return;

    setActionLoading(true);
    try {
      const response = await userAPI.deleteGift(gift.Id);
      const isSuccess = response.Status === true || response.status === true;
      if (isSuccess) {
        showSuccess(response.Message || response.message || 'Gift deleted successfully');
        fetchGifts();
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
          <p className="text-gray-400">Loading gifts...</p>
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
            <Gift className="w-8 h-8 text-pink-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gradient mb-1 sm:mb-2">Gift Upload Details</h1>
            <p className="text-gray-400">Total {giftsList.length.toLocaleString()} gifts</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload Gift
          </button>
          <button
            onClick={fetchGifts}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2">
        {['Animation', 'Sticker', 'Lucky'].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setCurrentPage(1);
            }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors ${activeTab === tab
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
          >
            {tab}
          </button>
        ))}
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
                  Gift Image
                </th>
                {/* <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Gift GIF/Animation
                </th> */}
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Gift Name
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Gift Amount
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-64">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedGifts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-400">
                    No Records Found
                  </td>
                </tr>
              ) : (
                paginatedGifts.map((gift, index) => {
                  return (
                    <motion.tr
                      key={gift.Id}
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
                        {gift.GiftImages ? (
                          <img
                            src={gift.GiftImages}
                            alt={gift.GiftName}
                            className="w-12 h-12 object-cover rounded-lg cursor-pointer"
                            onClick={() => openPreview(gift.GiftImages, gift.GiftName || 'Gift')}
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"%3E%3Crect width="48" height="48" fill="%236b7280"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="6"%3ENo Image%3C/text%3E%3C/svg%3E';
                              e.target.onerror = null;
                            }}
                          />
                        ) : (
                          <span className="text-sm text-gray-500">N/A</span>
                        )}
                      </td>
                      {/* <td className="px-4 py-4">
                        {gift.GiftGIF ? (
                          gift.GiftGIF.toLowerCase().endsWith(".svga") ? (
                            <SVGAPlayer src={gift.GiftGIF} />
                          ) : (
                            <img
                              src={gift.GiftGIF}
                              alt={gift.GiftName}
                              className="w-12 h-12 object-cover rounded-lg cursor-pointer"
                            />
                          )
                        ) : (
                          <span className="text-sm text-gray-500">N/A</span>
                        )}
                      </td> */}
                      <td className="px-4 py-4">
                        <span className="text-sm font-medium text-white">
                          {gift.GiftName || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-300 font-semibold">
                          {gift.GiftAmount ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          {gift.Type || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditClick(gift)}
                            disabled={actionLoading}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
                          >
                            <Edit2 className="w-3 h-3" />
                            Edit
                          </button>

                          <button
                            onClick={() => handleDelete(gift)}
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
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <p className="text-sm text-gray-400">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, giftsList.length)} of {giftsList.length} entries
              </p>
              <label className="flex items-center gap-2 text-sm text-gray-400">
                Rows per page:
                <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="bg-[#1a1625] border border-white/10 text-sm text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-purple-500">
                  {pageSizeOptions.map(size => <option key={size} value={size}>{size}</option>)}
                </select>
              </label>
            </div>
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
        {editModalOpen && selectedGift && (
          <EditModal
            gift={selectedGift}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedGift(null);
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
