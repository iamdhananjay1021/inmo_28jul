import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import { userAPI } from '../../services/api';
import { showSuccess, showError } from '../../utils/swalUtils';

const ApproveAgentRequest = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedRow = location.state?.selectedRow;

  const [audioPrice, setAudioPrice] = useState('');
  const [videoPrice, setVideoPrice] = useState('');
  const [adminCommission, setAdminCommission] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (selectedRow) {
      setAudioPrice(selectedRow.audioPricePerMin ?? '');
      setVideoPrice(selectedRow.videoPricePerMin ?? '');
      setAdminCommission(selectedRow.adminComission ?? '');
    }
  }, [selectedRow]);

  const audioCommission =
    (parseFloat(audioPrice || 0) * parseFloat(adminCommission || 0)) / 100;
  const videoCommission =
    (parseFloat(videoPrice || 0) * parseFloat(adminCommission || 0)) / 100;

  const handleApproveSubmit = async () => {
    if (!selectedRow) return;
    setSubmitting(true);

    try {
      const response = await userAPI.approveAgent({
        userId: selectedRow.userId,
        audioPricePerMin: parseFloat(audioPrice) || 0,
        videoPricePerMin: parseFloat(videoPrice) || 0,
        adminComission: adminCommission,
      });

      if (response?.status) {
        showSuccess(response.message || 'Agent rates updated successfully');
        setTimeout(() => navigate('/agent/request'), 1200);
      } else {
        showError(response?.message || 'Unable to update agent rates.');
      }
    } catch (error) {
      console.error('Error updating agent rates:', error);
      showError('Unable to update agent rates. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!selectedRow) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="glass rounded-3xl border border-white/10 px-8 py-10 text-center max-w-lg">
          <h2 className="text-xl font-semibold text-white mb-3">Agent not selected</h2>
          <p className="text-gray-400 mb-6">Please go back to the agent list and select an agent to edit.</p>
          <button
            type="button"
            onClick={() => navigate('/agent/request')}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 hover:bg-purple-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Agent Requests
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 px-2 sm:px-4 lg:px-8">
      <div className="glass rounded-2xl border border-white/10 p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/agent/request')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gradient">Agent Approval Details</h1>
              <p className="text-sm text-gray-400 mt-1">
                Update audio/video pricing and admin commission for the selected agent.
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm text-gray-300">
            <span>Status:</span>
            <span className="font-semibold text-purple-400">{selectedRow.status || 'Approved'}</span>
          </div>
        </div>

        {/* Agent Info - Read Only */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-400">User ID</label>
            <input
              type="text"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none cursor-not-allowed opacity-70"
              value={selectedRow.userId || ''}
              readOnly
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-400">User Name</label>
            <input
              type="text"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none cursor-not-allowed opacity-70"
              value={selectedRow.userName || ''}
              readOnly
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Mobile Number</label>
            <input
              type="text"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none cursor-not-allowed opacity-70"
              value={selectedRow.mobileNo || ''}
              readOnly
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Email ID</label>
            <input
              type="text"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none cursor-not-allowed opacity-70"
              value={selectedRow.emailID || ''}
              readOnly
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-400">DOB</label>
            <input
              type="text"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none cursor-not-allowed opacity-70"
              value={selectedRow.dob || ''}
              readOnly
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Gender</label>
            <input
              type="text"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none cursor-not-allowed opacity-70"
              value={selectedRow.gender || ''}
              readOnly
            />
          </div>
        </div>
        <div className="border-t border-white/10 pt-6">
          <h3 className="text-lg font-semibold text-white mb-4">Pricing & Commission</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Audio Price / minute</label>
              <input
                type="number"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-purple-500 transition-colors"
                value={audioPrice}
                onChange={(e) => setAudioPrice(e.target.value)}
                placeholder="Enter audio price"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Video Price / minute</label>
              <input
                type="number"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-purple-500 transition-colors"
                value={videoPrice}
                onChange={(e) => setVideoPrice(e.target.value)}
                placeholder="Enter video price"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Admin Commission (%)</label>
              <input
                type="number"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-purple-500 transition-colors"
                value={adminCommission}
                onChange={(e) => setAdminCommission(e.target.value)}
                placeholder="Enter commission %"
              />
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-5">
          <p className="text-sm text-gray-400 mb-3 font-medium">Commission Summary</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3">
              <span className="text-sm text-gray-300">Audio Commission</span>
              <span className="text-lg font-bold text-green-400">₹{audioCommission.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3">
              <span className="text-sm text-gray-300">Video Commission</span>
              <span className="text-lg font-bold text-blue-400">₹{videoCommission.toFixed(2)}</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Calculated as: Price × Commission% / 100
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/agent/request')}
            className="px-6 py-3 rounded-xl border border-white/10 text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApproveSubmit}
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 hover:bg-purple-700 transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Saving...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApproveAgentRequest;
