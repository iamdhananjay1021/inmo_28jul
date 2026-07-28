import axios from 'axios';
import { API_CONFIG, API_ENDPOINTS, getApiUrl } from '../config/apiConfig';
const api = axios.create(API_CONFIG);

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handle common errors
 */
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const formatLiveDuration = (secs, durationStr) => {
  if (secs !== undefined && secs !== null) {
    const mins = Math.floor(secs / 60);
    const remainderSecs = secs % 60;
    return `${mins} Minutes ${remainderSecs} Seconds`;
  }
  if (durationStr && durationStr.includes(':')) {
    const parts = durationStr.split(':');
    if (parts.length >= 2) {
      const hh = parseInt(parts[0], 10) || 0;
      const mm = parseInt(parts[1], 10) || 0;
      const ss = parts[2] ? parseInt(parts[2], 10) || 0 : 0;
      const totalMins = hh * 60 + mm;
      return `${totalMins} Minutes ${ss} Seconds`;
    }
  }
  return durationStr || '0 Minutes 0 Seconds';
};

/**
 * Authentication APIs
 */
export const authAPI = {
  login: async (userName, password) => {
    const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, {
      userName,
      password,
    });

    // Extract and store JWT token from response
    const data = response.data;
    if (data) {
      // Support multiple token field names from backend
      const token = data.jwtToken;
      if (token) {
        localStorage.setItem('authToken', token);
      }
    }

    return data;
  },

  logout: async () => {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.LOGOUT);
      return response.data;
    } finally {
      localStorage.removeItem('authToken');
    }
  },

  changePassword: async (oldPassword, newPassword) => {
    const response = await api.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
      oldPassword,
      newPassword,
    });
    return response.data;
  },
};

/**
 * User Management APIs
 */
export const userAPI = {
  getAllUsers: async (page = 1, limit = 10) => {
    const response = await api.get(API_ENDPOINTS.USER.GET_ALL_USERS, {
      params: { page, limit },
    });
    return response.data;
  },

  getUserById: async (userId) => {
    const response = await api.get(`${API_ENDPOINTS.USER.GET_USER_BY_ID}/${userId}`);
    return response.data;
  },

  createUser: async (userData) => {
    const response = await api.post(API_ENDPOINTS.USER.CREATE_USER, userData);
    return response.data;
  },

  updateUser: async (userId, userData) => {
    const response = await api.put(`${API_ENDPOINTS.USER.UPDATE_USER}/${userId}`, userData);
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await api.delete(`${API_ENDPOINTS.USER.DELETE_USER}/${userId}`);
    return response.data;
  },

  getAppUsers: async () => {
    const response = await api.get(API_ENDPOINTS.USER.GET_APP_USERS);
    return response.data;
  },

  getAllUsersSearch: async (search) => {
    const response = await api.get(`/Registration/GetAllUsers?Search=${search}`);
    return response.data;
  },

  getMallFrames: async (itemType) => {
    const response = await api.get(`/Registration/GetMallFrames?ItemType=${itemType}`);
    return response.data;
  },

  sendRideFrameThemeAdmin: async (userId, itemId) => {
    const response = await api.post(`/Registration/SendRideFrameThemeAdmin`, {
      UserId: userId,
      ItemId: itemId
    });
    return response.data;
  },

  getResellerUsers: async () => {
    const response = await api.get(API_ENDPOINTS.USER.GET_ALL_ADMIN);
    return response.data;
  },

  createResellerId: async (payload) => {
    const response = await api.post(API_ENDPOINTS.USER.CREATE_RESELLERID, payload);
    return response.data;
  },
  adminToResellerCoinTransfer: async (payload) => {
    const response = await api.post(API_ENDPOINTS.USER.ADD_DEDUCT_RESELLER_COIN, payload);
    return response.data;
  },
  getCoinReselling: async () => {
    const response = await api.get(API_ENDPOINTS.USER.COIN_RESELLING);
    return response.data;
  },
  getCoinResellingDateRange: async (fromDate, toDate) => {
    const response = await api.get(
      API_ENDPOINTS.USER.COIN_RESELLING_DATERANGE,
      {
        params: {
          FromDate: fromDate,
          ToDate: toDate,
        },
      }
    );
    return response.data;
  },
  searchResellerByUserId: async (userId) => {
    const response = await api.post(API_ENDPOINTS.USER.COIN_RESELLING_SEARCH,
      { userId });
    return response.data;
  },
  addResellerCoin: async (userId, coinAmount) => {
    const response = await api.post(API_ENDPOINTS.USER.COIN_RESELLING_ADD,
      { userId, coinAmount });
    return response.data;
  },
  getMoments: async () => {
    const response = await api.get(API_ENDPOINTS.USER.GET_MOMENTS);
    return response.data;
  },

  getDeletedAccounts: async (userId) => {
    const url = userId
      ? `${API_ENDPOINTS.USER.GET_DELETED_ACCOUNTS}?UserId=${userId}`
      : API_ENDPOINTS.USER.GET_DELETED_ACCOUNTS;
    const response = await api.get(url);
    const data = response.data || {};
    const status = data.Status !== undefined ? data.Status : data.status;
    const rawList = data.data || data.Data || (Array.isArray(data) ? data : []);

    const deletedAccountsList = rawList.map((item, idx) => {
      const typeVal = item.Type || item.type || (item.IsAdmin ? 'Admin' : item.IsAgency ? 'Agency' : item.IsHost ? 'Host' : item.UserRoleType) || 'N/A';
      return {
        ...item,
        id: item.UserId || idx,
        userId: item.UserId,
        name: item.Name,
        mobile: item.MobileNumber,
        gender: item.Gender,
        profilePhoto: item.ProfilePhoto,
        coinsBalance: item.CoinsBalance,
        role: item.UserRoleType,
        type: typeVal,
        Type: typeVal,
        createdDate: item.Created_Date,
        deletedDate: item.DeletedAt
      };
    });

    return {
      status,
      deletedAccountsList
    };
  },

  // getAppUserDetails: async (pageNo = 1, pageSize = 20) => {
  //   const response = await api.get(API_ENDPOINTS.USER.APP_USER_DETAILS, {
  //     params: { pageNo, pageSize },
  //   });
  //   return response.data;
  // },
  // searchAppUsers: async (searchText) => {
  //   const response = await api.get(
  //     `${API_ENDPOINTS.USER.SEARCH_APP_USERS}?searchText=${encodeURIComponent(searchText)}`
  //   );
  //   return response.data;
  // },

  getUsers: async (pageNo = 1, pageSize = 20, search = '') => {
    const response = await api.get(API_ENDPOINTS.USER.GET_ALL_USERS_REGISTRATION, {
      params: { Page: pageNo, PageSize: pageSize, Search: search }
    });
    return response.data;
  },

  getUserDetails: async (userId) => {
    const response = await api.get(API_ENDPOINTS.USER.GET_USER_DETAILS, {
      params: { userId },
    });
    return response.data;
  },

  userEditDetails: async (userData) => {
    const response = await api.post(API_ENDPOINTS.USER.USER_EDIT_DETAILS, userData);
    return response.data;
  },
  deleteUserDetails: async (userId) => {
    const response = await api.post(API_ENDPOINTS.USER.DELETE_USER, {
      UserId: userId,
      Type: 'Admin'
    });
    return response.data;
  },
  // getUserDetailsHistory: async (userId, fromDate, toDate) => {
  //   const response = await api.post(API_ENDPOINTS.USER.USER_DETAILS_HISTORY, {
  //     userId,
  //     fromDate,
  //     toDate
  //   });
  //   return response.data;
  // },

  getGiftRecords: async (userId) => {
    const response = await api.get(API_ENDPOINTS.USER.GET_GIFT_RECORDS, {
      params: { UserId: userId }
    });
    return response.data;
  },

  getGameRecords: async (userId) => {
    const response = await api.get(API_ENDPOINTS.USER.GET_GAME_RECORDS, {
      params: { UserId: userId }
    });
    return response.data;
  },

  getTransactionalRecords: async (userId = '') => {
    const params = {};
    if (userId) {
      params.UserId = userId;
    }
    const response = await api.get(API_ENDPOINTS.USER.GET_TRANSACTION_RECORDS, {
      params
    });
    return response.data;
  },

  getUserRewardSummary: async (userId, fromDate, toDate) => {
    const response = await api.post(API_ENDPOINTS.USER.USER_REWARD_SUMMARY, {
      userId,
      fromDate,
      toDate
    });
    return response.data;
  },

  getUserCoinsBeansAmount: async (userId, fromDate, toDate) => {
    const response = await api.post(API_ENDPOINTS.USER.USER_COINS_BEANS_AMOUNT, {
      userId,
      fromDate,
      toDate
    });
    return response.data;
  },

  getUploadedMomentRecords: async () => {
    const response = await api.get(API_ENDPOINTS.USER.UPLOADED_MOMENT_RECORDS);
    const data = response.data || {};
    const status = data.Status !== undefined ? data.Status : data.status;
    const rawList = data.data || [];

    const formattedMoments = rawList.map(u => {
      let imageUploadDate = 'N/A';
      if (u.UploadedDate) {
        try {
          const d = new Date(u.UploadedDate);
          if (!isNaN(d.getTime())) {
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            const seconds = String(d.getSeconds()).padStart(2, '0');
            imageUploadDate = `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
          }
        } catch (e) { }
      }
      return {
        id: u.Id,
        momentId: u.Id,
        userId: u.UserId,
        name: u.Name,
        imagePreview: u.MomentImage,
        imageUploadDate
      };
    });

    return {
      status,
      uploadedMomentList: formattedMoments
    };
  },

  deleteMomentRecord: async (ids) => {
    let payload = {};
    if (Array.isArray(ids)) {
      if (ids.length === 1) {
        payload = { Id: Number(ids[0]) };
      } else {
        payload = { Ids: ids.map(Number) };
      }
    } else {
      payload = { Id: Number(ids) };
    }
    const response = await api.post(API_ENDPOINTS.USER.DELETE_MOMENT_RECORD, payload);
    return response.data;
  },

  // getAdminRequest: async () => {
  //   const response = await api.get(API_ENDPOINTS.USER.ADMIN_REQUEST);
  //   return response.data;
  // },

  getAgencyInsideAdmin: async (adminId) => {
    const response = await api.post(API_ENDPOINTS.USER.AGENCY_INSIDE_ADMIN, { adminId });
    return response.data;
  },

  getHostInsideAgency: async (agencyCode) => {
    const response = await api.post(API_ENDPOINTS.USER.HOST_INSIDE_AGENCY, { agencyCode });
    return response.data;
  },

  getAdminAgencyHostLinking: async (payload = {}) => {
    try {
      const response = await api.post(API_ENDPOINTS.USER.ADMIN_AGENCY_HOST_LINKING, payload);
      return response.data;
    } catch (e) {
      const response = await api.get(API_ENDPOINTS.USER.ADMIN_AGENCY_HOST_LINKING, { params: payload });
      return response.data;
    }
  },

  applyForAdminAgencyHost: async (payload = {}) => {
    try {
      const response = await api.post(API_ENDPOINTS.USER.APPLY_FOR_ADMIN_AGENCY_HOST, payload);
      return response.data;
    } catch (e) {
      const response = await api.post('/ApplyForAdminAgencyHost', payload);
      return response.data;
    }
  },

  getCoinsAndBeansTransactions: async (payload = {}) => {
    try {
      const response = await api.post(API_ENDPOINTS.USER.GET_COINS_AND_BEANS_TRANSACTIONS, payload);
      return response.data;
    } catch (e) {
      const response = await api.get(API_ENDPOINTS.USER.GET_COINS_AND_BEANS_TRANSACTIONS, { params: payload });
      return response.data;
    }
  },

  getDeletedAccounts: async (userId) => {
    const url = userId
      ? `${API_ENDPOINTS.USER.GET_DELETED_ACCOUNTS}?UserId=${userId}`
      : API_ENDPOINTS.USER.GET_DELETED_ACCOUNTS;
    const response = await api.get(url);
    const data = response.data || {};
    const status = data.Status !== undefined ? data.Status : data.status;
    const rawList = data.data || [];

    const deletedAccountsList = rawList.map((item, idx) => ({
      id: item.UserId || idx,
      userId: item.UserId,
      name: item.Name,
      mobile: item.MobileNumber,
      gender: item.Gender,
      profilePhoto: item.ProfilePhoto,
      coinsBalance: item.CoinsBalance,
      role: item.UserRoleType,
      createdDate: item.Created_Date,
      deletedDate: item.DeletedAt
    }));

    return {
      status,
      deletedAccountsList
    };
  },

  getPlayStoreRecord: async () => {
    const response = await api.get(API_ENDPOINTS.USER.PLAY_STORE_RECORD);
    return response.data;
  },

  getCoinPricing: async () => {
    const response = await api.get(API_ENDPOINTS.WALLET.GET_COIN_PRICING);
    return response.data;
  },

  insertCoinPricing: async (payload) => {
    const response = await api.post(API_ENDPOINTS.WALLET.INSERT_COIN_PRICING, payload);
    return response.data;
  },

  deleteCoinPricing: async (payload) => {
    const response = await api.post(API_ENDPOINTS.WALLET.DELETE_COIN_PRICING, payload);
    return response.data;
  },

  getWalletDetails: async () => {
    const response = await api.get(API_ENDPOINTS.USER.GET_WALLET_DETAILS);
    return response.data;
  },

  searchWalletFreezeUnfreeze: async (userId) => {
    const response = await api.post(API_ENDPOINTS.USER.SEARCH_WALLET_FREEZE_UNFREEZE, { userId });
    return response.data;
  },

  updateWalletStatus: async (userId, updateStatus) => {
    const response = await api.post(`${API_ENDPOINTS.USER.UPDATE_WALLET_STATUS}?UserId=${userId}&updateStatus=${updateStatus}`);
    return response.data;
  },

  getAddDeductCoinUserDetails: async () => {
    const response = await api.get(API_ENDPOINTS.USER.ADD_DEDUCT_COIN_USER_DETAILS);
    return response.data;
  },

  // searchByUserIdCoinAmount: async (userId) => {
  //   const response = await api.post(API_ENDPOINTS.USER.SEARCH_BY_USER_ID_COIN_AMOUNT, { userId });
  //   return response.data;
  // },

  getAllUsersSearch: async (search) => {
    const response = await api.get(API_ENDPOINTS.USER.GET_ALL_USERS_REGISTRATION, {
      params: { Search: search, Page: 1, PageSize: 100 }
    });
    return response.data;
  },

  // addCoinAmount: async (userId, coinAmount,reason) => {
  //   const response = await api.post(API_ENDPOINTS.USER.ADD_COIN_AMOUNT, { userId, coinAmount, reason });
  //   return response.data;
  // },

  // deductCoinAmount: async (userId, coinAmount,reason) => {
  //   const response = await api.post(API_ENDPOINTS.USER.DEDUCT_COIN_AMOUNT, { userId, coinAmount, reason });
  //   return response.data;
  // },

  sendCoinsBeansToUser: async (userId, amount, type, status) => {
    const response = await api.post(API_ENDPOINTS.USER.SEND_COINS_BEANS_TO_USER, {
      UserId: userId,
      Amount: Number(amount),
      Type: type,
      Status: status
    });
    return response.data;
  },

  getAddDeductBeansUserDetails: async () => {
    const response = await api.post(API_ENDPOINTS.USER.ADD_DEDUCT_BEANS_USER_DETAILS, { adminId: "" });
    return response.data;
  },

  // addBean: async (userId, beanAmount,reason) => {
  //   const response = await api.post(API_ENDPOINTS.USER.ADD_BEAN, { userId, beanAmount, reason });
  //   return response.data;
  // },

  // deductBean: async (userId, beanAmount,reason) => {
  //   const response = await api.post(API_ENDPOINTS.USER.DEDUCT_BEAN, { userId, beanAmount, reason });
  //   return response.data;
  // },

  getMallPurchaseRecord: async (userId = '') => {
    const response = await api.post(API_ENDPOINTS.USER.MALL_PURCHASE_RECORD, { userId });
    return response.data;
  },

  getIDBanUnbanUserDetails: async () => {
    const response = await api.get(API_ENDPOINTS.USER.ID_BAN_UNBAN_USER_DETAILS);
    return response.data;
  },

  getIDBanUnbanByUserId: async (userId) => {
    const response = await api.get(`${API_ENDPOINTS.USER.ID_BAN_UNBAN_BY_USER_ID}?userId=${userId}`);
    return response.data;
  },

  BanUnBanUsers: async (payload) => {
    const response = await api.post(API_ENDPOINTS.USER.ID_BAN_UNBAN, payload);
    return response.data;
  },

  insertBanForRoom: async (userId, banDuration, banReason) => {
    const response = await api.post(API_ENDPOINTS.USER.INSERT_BAN_FOR_ROOM, {
      UserId: userId,
      BanDuration: banDuration,
      BanReason: banReason,
    });
    return response.data;
  },

  deleteRoomBannedUser: async (userId) => {
    const response = await api.post(API_ENDPOINTS.USER.DELETE_ROOM_BANNED_USER, { UserId: userId });
    return response.data;
  },

  getPrivateCallData: async (userId) => {
    const response = await api.post(API_ENDPOINTS.USER.GET_PRIVATE_CALL_DATA, { UserId: userId });
    return response.data;
  },

  // idUnban: async (payload) => {
  //   const response = await api.post(API_ENDPOINTS.USER.ID_UNBAN, payload);
  //   return response.data;
  // },

  getDeviceBlockUserDetails: async () => {
    const response = await api.get(API_ENDPOINTS.USER.GET_DEVICE_BLOCK_USER_DETAILS);
    return response.data;
  },

  getDeviceBlockByUserId: async (userId) => {
    const response = await api.get(`${API_ENDPOINTS.USER.GET_DEVICE_BLOCK_BY_USER_ID}?userId=${userId}`);
    return response.data;
  },

  userDeviceIdBlockUnBlock: async (payload) => {
    const response = await api.post(API_ENDPOINTS.USER.DEVICE_BLOCK_UNBLOCK, payload);
    return response.data;
  },

  // userDeviceIdUnBlock: async (deviceId, userId) => {
  //   const response = await api.post(API_ENDPOINTS.USER.DEVICE_UNBLOCK, { deviceId, userId });
  //   return response.data;
  // },

  getAdminRequest: async () => {
    const response = await api.get(API_ENDPOINTS.USER.ADMIN_REQUEST);
    return response.data;
  },

  getNewAdminAgencyHostRequest: async (payload) => {
    const response = await await api.post(API_ENDPOINTS.USER.GET_NEW_ADMIN_AGENCY_HOST_REQUEST, payload);
    return response.data;
  },

  getAdminAgencyHostRequest: async (statusType) => {
    const response = await api.get(API_ENDPOINTS.USER.GET_ADMIN_AGENCY_HOST_REQUEST, {
      params: { StatusType: statusType }
    });
    return response.data;
  },

  approveRejectRequest: async (userId, statusType, status) => {
    const response = await api.post(API_ENDPOINTS.USER.APPROVE_REJECT_REQUEST, {
      UserId: userId,
      StatusType: statusType,
      Status: status
    });
    return response.data;
  },

  adminRequestApprove: async (adminId) => {
    const response = await api.post(API_ENDPOINTS.USER.ADMIN_REQUEST_APPROVE, { adminId });
    return response.data;
  },

  adminRequestReject: async (adminId) => {
    const response = await api.post(API_ENDPOINTS.USER.ADMIN_REQUEST_REJECT, { adminId });
    return response.data;
  },

  adminAgencyHostDelete: async (userId, type) => {
    const response = await api.post(API_ENDPOINTS.USER.ADMIN_AGENCY_HOST_DELETE, { userId, type });
    return response.data;
  },
  editAgencyRequest: async (data) => {
    const response = await api.post(API_ENDPOINTS.USER.EDIT_AGENCY_REQUEST, data);
    return response.data;
  },
  getAgencyRequest: async () => {
    const response = await api.get(API_ENDPOINTS.USER.AGENCY_REQUEST);
    return response.data;
  },
  agencyRequestApprove: async (agencyCode, userId) => {
    const response = await api.post(API_ENDPOINTS.USER.AGENCY_REQUEST_APPROVE, { AgencyCode: agencyCode, userId });
    return response.data;
  },
  agencyRequestReject: async (agencyCode, userId) => {
    const response = await api.post(API_ENDPOINTS.USER.AGENCY_REQUEST_REJECT, { AgencyCode: agencyCode, userId });
    return response.data;
  },

  getHostRequest: async () => {
    const response = await api.get(API_ENDPOINTS.USER.HOST_REQUEST);
    return response.data;
  },

  hostRequestApprove: async (agencyCode, userId) => {
    const response = await api.post(API_ENDPOINTS.USER.HOST_REQUEST_APPROVE, { agencyCode, userId });
    return response.data;
  },

  hostRequestReject: async (agencyCode, userId) => {
    const response = await api.post(API_ENDPOINTS.USER.HOST_REQUEST_REJECT, { agencyCode, userId });
    return response.data;
  },

  getAgentRequestPending: async () => {
    const response = await api.get(API_ENDPOINTS.USER.AGENT_REQUEST_PENDING);
    return response.data;
  },

  getAgentRequestApproved: async () => {
    const response = await api.post(API_ENDPOINTS.USER.AGENT_REQUEST_APPROVED);
    return response.data;
  },

  getAgentRequestRejected: async () => {
    const response = await api.post(API_ENDPOINTS.USER.AGENT_REQUEST_REJECTED);
    return response.data;
  },

  approveAgent: async (data) => {
    const response = await api.post(API_ENDPOINTS.USER.AGENT_APPROVE, data);
    return response.data;
  },

  rejectAgent: async (userId) => {
    const response = await api.post(API_ENDPOINTS.USER.AGENT_REJECT, { userId, isApproved: false });
    return response.data;
  },

  getOnlineAgents: async () => {
    const response = await api.get(API_ENDPOINTS.USER.ONLINE_AGENTS);
    return response.data;
  },

  updateUserIsLiveStatus: async (payload) => {
    const response = await api.post(API_ENDPOINTS.USER.SET_USER_OFFLINE, payload);
    return response.data;
  },

  updateHostCallRates: async (payload) => {
    const response = await api.post(API_ENDPOINTS.USER.UPDATE_HOST_CALL_REATES, payload);
    return response.data;
  },

  getBanners: async (type) => {
    const response = await api.get(API_ENDPOINTS.USER.BANNER_LIST, {
      params: type ? { Type: type } : {}
    });
    return response.data;
  },

  uploadBanner: async (formData) => {
    const response = await api.post(API_ENDPOINTS.USER.BANNER_UPLOAD, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateBanner: async (formData) => {
    const response = await api.post(API_ENDPOINTS.USER.BANNER_UPDATE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteBanner: async (id) => {
    const response = await api.post(API_ENDPOINTS.USER.BANNER_DELETE, { Id: Number(id) });
    return response.data;
  },

  getGifts: async (type) => {
    const response = await api.get(API_ENDPOINTS.USER.GIFT_LIST, {
      params: type ? { Type: type } : {}
    });
    return response.data;
  },

  uploadGift: async (formData) => {
    const response = await api.post(API_ENDPOINTS.USER.GIFT_UPLOAD, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateGift: async (formData) => {
    const response = await api.post(API_ENDPOINTS.USER.GIFT_UPDATE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteGift: async (id) => {
    const response = await api.post(API_ENDPOINTS.USER.GIFT_DELETE, { Id: Number(id) });
    return response.data;
  },

  getHomeImages: async () => {
    const response = await api.get(API_ENDPOINTS.USER.HOME_IMAGE_LIST);
    return response.data;
  },

  uploadHomeImage: async (formData) => {
    const response = await api.post(API_ENDPOINTS.USER.HOME_IMAGE_UPLOAD, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateHomeImage: async (formData) => {
    const response = await api.post(API_ENDPOINTS.USER.HOME_IMAGE_UPDATE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateHomeImageStatus: async (id, status) => {
    const response = await api.post(`${API_ENDPOINTS.USER.HOME_IMAGE_UPDATE_STATUS}?Id=${id}&Status=${status}`);
    return response.data;
  },

  deleteHomeImage: async (id) => {
    const response = await api.post(`${API_ENDPOINTS.USER.HOME_IMAGE_DELETE}?Id=${id}`);
    return response.data;
  },

  getGamesList: async () => {
    const response = await api.get(API_ENDPOINTS.USER.GAMES_LIST);
    return response.data;
  },

  updateGameStatus: async (payload) => {
    const response = await api.post(API_ENDPOINTS.USER.UPDATE_GAME_STATUS, payload);
    return response.data;
  },

  getBankWithdrawDetails: async () => {
    const response = await api.get(API_ENDPOINTS.USER.BANK_WITHDRAW);
    return response.data;
  },
  deleteBankWithdrawDetails: async (ids) => {
    const response = await api.post(API_ENDPOINTS.USER.DELETE_BANK_WITHDRAW, {
      ids: Array.isArray(ids) ? ids.join(',') : ids
    });
    return response.data;
  },
  getWalletWithdrawDetails: async () => {
    const response = await api.get(API_ENDPOINTS.USER.WALLET_WITHDRAW);
    return response.data;
  },
  deleteWalletWithdrawDetails: async (ids) => {
    const response = await api.post(API_ENDPOINTS.USER.DELETE_WALLET_WITHDRAW, {
      uniqueIds: Array.isArray(ids) ? ids.join(',') : ids
    });
    return response.data;
  },
  getResellerDetails: async () => {
    const response = await api.get(API_ENDPOINTS.USER.RESELLER_DETAILS);
    return response.data;
  },

  deductResellerCoin: async (userId, coinAmount) => {
    const response = await api.post(API_ENDPOINTS.USER.DEDUCT_RESELLER_COIN, { userId, coinAmount });
    return response.data;
  },

  getResellerList: async () => {
    const response = await api.get(API_ENDPOINTS.USER.RESELLER_LIST);
    return response.data;
  },

  removeReseller: async (userId) => {
    const response = await api.post(API_ENDPOINTS.USER.REMOVE_RESELLER, { userId });
    return response.data;
  },
  addDeductResellerCoin: async (payload) => {
    const response = await api.post(API_ENDPOINTS.USER.ADD_DEDUCT_RESELLER_COIN, payload);
    return response.data;
  },

  getResellerSendings: async () => {
    const response = await api.get(API_ENDPOINTS.USER.RESELLER_SENDINGS);
    return response.data;
  },

  getResellerRemove: async () => {
    const response = await api.get(API_ENDPOINTS.USER.RESELLER_REMOVE);
    return response.data;
  },
  getResellerTransactions: async (payload) => {
    const response = await api.post(
      API_ENDPOINTS.USER.RESELLER_ALL_TRANSACTIONS,
      payload
    );

    return response.data;
  },

  getAdminToResellerTransactions: async (payload = {}) => {
    const response = await api.post(
      API_ENDPOINTS.USER.ADMIN_TO_RESELLER_TRANSACTIONS,
      payload
    );

    return response.data;
  },

  updateResellerPassword: async (payload) => {
    const response = await api.post(API_ENDPOINTS.USER.RESELLER_PASSWORD_UPDATE, payload);
    return response.data;
  },

  getResellerCoinRecord: async () => {
    const response = await api.get(API_ENDPOINTS.USER.RESELLER_COIN_RECORD);
    return response.data;
  },

  getAudioStreamingToday: async () => {
    const today = new Date().toLocaleDateString('en-CA');
    const response = await api.post(API_ENDPOINTS.USER.GET_HOST_USERS_TIMING, {
      Type: 'Host',
      FromDate: today,
      ToDate: today
    });

    const data = response.data || {};
    const status = data.Status !== undefined ? data.Status : data.status;
    const rawList = data.data || [];
    const formattedData = rawList.map(u => ({
      id: u.Id,
      userid: u.UserId,
      Name: u.Name,
      StartDate: u.RoomStartTime,
      Start_Time: u.RoomStartTime ? new Date(u.RoomStartTime).toLocaleTimeString() : 'N/A',
      End_Time: u.RoomEndTime ? new Date(u.RoomEndTime).toLocaleTimeString() : 'N/A',
      Type: u.RoomType,
      LiveDuration: formatLiveDuration(u.DurationSecs, u.Duration),
      StreamStatus: u.IsActive ? 'Live' : 'Stream Ended'
    }));
    return {
      status,
      data: formattedData
    };
  },

  getAudioStreamingByDate: async (startDate, endDate) => {
    const fromDate = startDate ? startDate.split('T')[0] : new Date().toLocaleDateString('en-CA');
    const toDate = endDate ? endDate.split('T')[0] : new Date().toLocaleDateString('en-CA');
    const response = await api.post(API_ENDPOINTS.USER.GET_HOST_USERS_TIMING, {
      Type: 'Host',
      FromDate: fromDate,
      ToDate: toDate
    });
    const data = response.data || {};
    const status = data.Status !== undefined ? data.Status : data.status;
    const rawList = data.data || [];
    const formattedData = rawList.map(u => ({
      id: u.Id,
      userid: u.UserId,
      Name: u.Name,
      StartDate: u.RoomStartTime,
      Start_Time: u.RoomStartTime ? new Date(u.RoomStartTime).toLocaleTimeString() : 'N/A',
      End_Time: u.RoomEndTime ? new Date(u.RoomEndTime).toLocaleTimeString() : 'N/A',
      Type: u.RoomType,
      LiveDuration: formatLiveDuration(u.DurationSecs, u.Duration),
      StreamStatus: u.IsActive ? 'Live' : 'Stream Ended'
    }));
    return {
      status,
      data: formattedData
    };
  },

  getAudioStreamingByUser: async (userId, fromDate, toDate) => {
    const fDate = fromDate ? fromDate.split('T')[0] : new Date().toLocaleDateString('en-CA');
    const tDate = toDate ? toDate.split('T')[0] : new Date().toLocaleDateString('en-CA');
    const response = await api.post(API_ENDPOINTS.USER.GET_HOST_USERS_TIMING, {
      UserId: userId,
      Type: 'Host',
      FromDate: fDate,
      ToDate: tDate
    });
    const data = response.data || {};
    const status = data.Status !== undefined ? data.Status : data.status;
    const rawList = data.data || [];
    const formattedData = rawList.map(u => ({
      id: u.Id,
      userid: u.UserId,
      Name: u.Name,
      StartDate: u.RoomStartTime,
      Start_Time: u.RoomStartTime ? new Date(u.RoomStartTime).toLocaleTimeString() : 'N/A',
      End_Time: u.RoomEndTime ? new Date(u.RoomEndTime).toLocaleTimeString() : 'N/A',
      Type: u.RoomType,
      LiveDuration: formatLiveDuration(u.DurationSecs, u.Duration),
      StreamStatus: u.IsActive ? 'Live' : 'Stream Ended'
    }));
    return {
      status,
      data: formattedData
    };
  },

  getRoomLogsToday: async () => {
    const today = new Date().toLocaleDateString('en-CA');
    const response = await api.post(API_ENDPOINTS.USER.GET_HOST_USERS_TIMING, {
      Type: 'User',
      FromDate: today,
      ToDate: today
    });
    return response.data;
  },

  getRoomLogsByUser: async (userId, fromDate, toDate) => {
    const fDate = fromDate ? fromDate.split('T')[0] : new Date().toLocaleDateString('en-CA');
    const tDate = toDate ? toDate.split('T')[0] : new Date().toLocaleDateString('en-CA');
    const response = await api.post(API_ENDPOINTS.USER.GET_HOST_USERS_TIMING, {
      UserId: userId,
      Type: 'User',
      FromDate: fDate,
      ToDate: tDate
    });
    const data = response.data || {};
    const status = data.Status !== undefined ? data.Status : data.status;
    const rawList = data.data || [];
    const formattedData = rawList.map(u => ({
      id: u.Id,
      roomId: u.RoomId,
      hostName: u.Name,
      userId: u.UserId,
      userName: u.Name,
      startTime: u.RoomStartTime ? new Date(u.RoomStartTime).toLocaleString() : 'N/A',
      endTime: u.RoomEndTime ? new Date(u.RoomEndTime).toLocaleString() : 'N/A',
      inRoomDuration: formatLiveDuration(u.DurationSecs, u.Duration),
      type: u.RoomType,
      created_Date: u.RoomStartTime ? u.RoomStartTime.replace('T', ' ') : ''
    }));
    return {
      status,
      data: formattedData
    };
  },

  getLiveStreamingDetails: async () => {
    const response = await api.get(API_ENDPOINTS.USER.LIVE_STREAMING_DETAILS);
    const data = response.data || {};
    const status = data.Status !== undefined ? data.Status : data.status;
    const rawList = data.data || data.userLiveList || [];

    const userLiveList = rawList.map(u => ({
      userId: u.UserId || u.userId,
      name: u.Name || u.name,
      liveStatus: u.liveStatus !== undefined ? u.liveStatus : 'True',
      isBan: u.isBan || (u.IsBan === 'Active' ? 'Active' : 'Inactive'),
      roomId: u.RoomId || u.roomId,
      roomType: u.RoomType || u.roomType,
      roomStartTime: u.RoomStartTime || u.roomStartTime,
      image: u.Image || u.image,
    }));

    return {
      status,
      userLiveList
    };
  },

  getUserThemeList: async (userId) => {
    const response = await api.post(API_ENDPOINTS.USER.GET_THEMES, { userId });
    return response.data;
  },

  saveUserTheme: async (userId, rideId, duration, adminId) => {
    const response = await api.post(API_ENDPOINTS.USER.ADD_THEME, {
      userId,
      rideId,
      duration,
      adminId,
    });
    return response.data;
  },

  userLiveEnd: async (userId) => {
    const ids = typeof userId === 'string' && userId.includes(',')
      ? userId.split(',')
      : Array.isArray(userId)
        ? userId
        : [userId];

    if (ids.length > 1) {
      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            const res = await api.post(API_ENDPOINTS.USER.USER_LIVE_END, { UserId: String(id).trim() });
            return res.data;
          } catch (err) {
            console.error(`Failed to end stream for user ${id}:`, err);
            return { Status: false, Message: err.message };
          }
        })
      );

      const success = results.some(r => r.Status || r.status);
      return {
        status: success,
        Status: success,
        message: success ? 'Streams ended.' : 'Failed to end streams.',
        Message: success ? 'Streams ended.' : 'Failed to end streams.',
        results
      };
    } else {
      const response = await api.post(API_ENDPOINTS.USER.USER_LIVE_END, { UserId: String(ids[0]).trim() });
      const data = response.data || {};
      const status = data.Status !== undefined ? data.Status : data.status;
      const message = data.Message !== undefined ? data.Message : data.message;
      return {
        ...data,
        status,
        message
      };
    }
  },

  getReportFeedback: async () => {
    const response = await api.get(API_ENDPOINTS.USER.REPORT_FEEDBACK);
    const data = response.data || {};
    const status = data.Status !== undefined ? data.Status : data.status;
    const rawList = data.data || [];

    const reportFeedbackList = rawList.map(item => ({
      id: item.Id,
      userId: item.UserId,
      message: item.FeedBack,
      feedbackImage: item.FeedBackImage,
      date: item.Created_Date
    }));

    return {
      status,
      reportFeedbackList
    };
  },

  getAgentFeedback: async () => {
    const response = await api.get(API_ENDPOINTS.USER.AGENT_FEEDBACK);
    return response.data;
  },

  getUserReports: async () => {
    const response = await api.get(API_ENDPOINTS.USER.USER_REPORTS);
    return response.data;
  },

  getStaticOtp: async () => {
    const response = await api.get(API_ENDPOINTS.USER.GET_STATIC_NUMBER);
    return response.data;
  },

  insertStaticOtp: async (payload) => {
    const response = await api.post(API_ENDPOINTS.USER.INSERT_STATIC_NUMBER, payload);
    return response.data;
  },

  updateStaticOtp: async (payload) => {
    const response = await api.post(API_ENDPOINTS.USER.UPDATE_STATIC_NUMBER, payload);
    return response.data;
  },

  deleteStaticOtp: async (payload) => {
    const response = await api.post(API_ENDPOINTS.USER.DELETE_STATIC_NUMBER, payload);
    return response.data;
  },

  getWhatsAppOTPLogs: async () => {
    const response = await api.get(API_ENDPOINTS.USER.WHATSAPP_OTP_LOGS);
    return response.data;
  },

  getTodayUnclaimedRewards: async () => {
    const response = await api.get('/Registration/TodayUnclaimedRewards');
    return response.data;
  },



  getClaimedRewards: async (userId, fromDate, toDate) => {
    const payload = {};
    if (userId) payload.UserId = userId;
    if (fromDate) payload.FromDate = fromDate;
    if (toDate) payload.ToDate = toDate;

    const response = await api.post(API_ENDPOINTS.USER.GET_TIMING_REWARD_CLAIMS, payload);
    const data = response.data || {};
    const status = data.Status !== undefined ? data.Status : data.status;
    const rawList = data.data || [];

    const formattedRewards = rawList.map(u => {
      const mins = u.HostDurationMins || 0;
      const hh = Math.floor(mins / 60);
      const mm = Math.round(mins % 60);
      const liveDuration = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;

      const ClaimedAt = u.ClaimedAt || u.RewardDate;
      let insertedDate = 'N/A';
      if (ClaimedAt) {
        try {
          const d = new Date(ClaimedAt);
          if (!isNaN(d.getTime())) {
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            const seconds = String(d.getSeconds()).padStart(2, '0');
            insertedDate = `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
          }
        } catch (e) { }
      }

      return {
        id: u.Id,
        userId: u.UserId,
        userName: u.Name,
        image: u.Image,
        rewardDate: u.RewardDate,
        type: u.Type || 'Audio',
        roomsHosted: u.RoomsHosted || 0,
        hostDurationMins: u.HostDurationMins || 0,
        userDurationMins: u.UserDurationMins || 0,
        totalBeansReceived: u.TotalBeansReceived || 0,
        rewardBeans: u.RewardBeans || 0,
        isClaimed: u.IsClaimed || false,
        claimedAt: u.ClaimedAt,

        // Backwards compatibility keys
        liveDuration,
        beanAmount: u.RewardBeans,
        latestBeans: u.TotalBeansReceived,
        insertedDate
      };
    });

    return {
      status,
      data: formattedRewards
    };
  },

  getAppVersions: async () => {
    const response = await api.get(API_ENDPOINTS.USER.APP_VERSIONS);
    return response.data;
  },

  versionUpdate: async (appVersion, isAndroid) => {
    const response = await api.post(API_ENDPOINTS.USER.VERSION_UPDATE, {
      appVersion,
      isUpdate: true,
      isLogOut: true,
      isAndroid
    });
    return response.data;
  },

  getUserVersion: async (loginId) => {
    const response = await api.post(API_ENDPOINTS.USER.USER_VERSION, { loginId });
    return response.data;
  },
};

/**
 * Wallet APIs
 */
export const walletAPI = {
  getPlayStorePurchases: async () => {
    const response = await api.get(API_ENDPOINTS.WALLET.GET_PLAYSTORE_PURCHASES);
    return response.data;
  },

  freezeWallet: async (userId) => {
    const response = await api.post(API_ENDPOINTS.WALLET.FREEZE_WALLET, { userId });
    return response.data;
  },

  unfreezeWallet: async (userId) => {
    const response = await api.post(API_ENDPOINTS.WALLET.UNFREEZE_WALLET, { userId });
    return response.data;
  },

  addCoins: async (userId, amount) => {
    const response = await api.post(API_ENDPOINTS.WALLET.ADD_COINS, { userId, amount });
    return response.data;
  },

  deductCoins: async (userId, amount) => {
    const response = await api.post(API_ENDPOINTS.WALLET.DEDUCT_COINS, { userId, amount });
    return response.data;
  },

  addBeans: async (userId, amount) => {
    const response = await api.post(API_ENDPOINTS.WALLET.ADD_BEANS, { userId, amount });
    return response.data;
  },

  deductBeans: async (userId, amount) => {
    const response = await api.post(API_ENDPOINTS.WALLET.DEDUCT_BEANS, { userId, amount });
    return response.data;
  },

  getMallPurchases: async () => {
    const response = await api.get(API_ENDPOINTS.WALLET.GET_MALL_PURCHASES);
    return response.data;
  },
};

/**
 * Account Status APIs
 */
export const accountAPI = {
  banUser: async (userId, reason) => {
    const response = await api.post(API_ENDPOINTS.ACCOUNT.BAN_USER, { userId, reason });
    return response.data;
  },

  unbanUser: async (userId) => {
    const response = await api.post(API_ENDPOINTS.ACCOUNT.UNBAN_USER, { userId });
    return response.data;
  },

  blockDevice: async (deviceId, reason) => {
    const response = await api.post(API_ENDPOINTS.ACCOUNT.BLOCK_DEVICE, { deviceId, reason });
    return response.data;
  },

  unblockDevice: async (deviceId) => {
    const response = await api.post(API_ENDPOINTS.ACCOUNT.UNBLOCK_DEVICE, { deviceId });
    return response.data;
  },
};

/**
 * Customization APIs
 */
export const customizationAPI = {


  getResellerSendingthemes: async (userId) => {
    const response = await api.post(API_ENDPOINTS.CUSTOMIZATION.RESELLER_SENDINGS, { userId });
    return response.data;
  },
  getFrames: async (userId) => {
    const response = await api.post(API_ENDPOINTS.CUSTOMIZATION.GET_FRAMES, { userId });
    return response.data;
  },
  addFrame: async (framesPayload) => {
    const response = await api.post(API_ENDPOINTS.CUSTOMIZATION.ADD_FRAME, framesPayload);
    return response.data;
  },

  removeFrame: async (userId, frameId, adminId) => {
    const response = await api.post(API_ENDPOINTS.CUSTOMIZATION.REMOVE_FRAME, { userId, frameId, adminId });
    return response.data;
  },


  getRide: async (userId) => {
    const response = await api.post(API_ENDPOINTS.CUSTOMIZATION.GET_RIDES, { userId });
    return response.data;
  },
  addRide: async (ridePayload) => {
    const response = await api.post(API_ENDPOINTS.CUSTOMIZATION.ADD_RIDE, ridePayload);
    return response.data;
  },

  removeRide: async (userId, rideId, adminId) => {
    const response = await api.post(API_ENDPOINTS.CUSTOMIZATION.REMOVE_RIDE, { userId, rideId, adminId });
    return response.data;
  },

  getThemes: async (userId) => {
    const response = await api.post(API_ENDPOINTS.CUSTOMIZATION.GET_THEMES, { userId });
    return response.data;
  },

  saveUserTheme: async (payload) => {
    const response = await api.post(API_ENDPOINTS.CUSTOMIZATION.ADD_THEME, payload);
    return response.data;
  },

  removeTheme: async (userId, rideId, adminId) => {
    const response = await api.post(API_ENDPOINTS.CUSTOMIZATION.REMOVE_THEME, {
      userId,
      rideId,
      adminId
    });
    return response.data;
  },

  applyForAdminAgencyHost: async (payload) => {
    try {
      const response = await api.post(API_ENDPOINTS.USER.APPLY_FOR_ADMIN_AGENCY_HOST, payload);
      return response.data;
    } catch (err) {
      try {
        const response = await api.post('/ApplyForAdminAgencyHost', payload);
        return response.data;
      } catch (fallbackErr) {
        throw err;
      }
    }
  },
};

/**
 * Dashboard APIs
 */
export const dashboardAPI = {
  getStats: async () => {
    const response = await api.get(API_ENDPOINTS.DASHBOARD.GET_STATS);
    return response.data;
  },

  getRecentUsers: async () => {
    const response = await api.get(API_ENDPOINTS.DASHBOARD.GET_RECENT_USERS);
    return response.data;
  },

  getActivityChart: async () => {
    const response = await api.get(API_ENDPOINTS.DASHBOARD.GET_ACTIVITY_CHART);
    return response.data;
  },

  getDashboardDetails: async () => {
    try {
      const response = await api.post(API_ENDPOINTS.DASHBOARD.GET_DASHBOARD_DETAILS);
      return response.data;
    } catch (e) {
      const response = await api.get(API_ENDPOINTS.DASHBOARD.GET_DASHBOARD_DETAILS);
      return response.data;
    }
  },

  getTodayDashboardCounts: async () => {
    const response = await api.get(API_ENDPOINTS.DASHBOARD.GET_TODAY_DASHBOARD_COUNTS);
    return response.data;
  },
};

/**
 * Streaming APIs
 */
export const streamingAPI = {
  getLiveStreams: async () => {
    const response = await api.get(API_ENDPOINTS.STREAMING.GET_LIVE_STREAMS);
    return response.data;
  },

  getAudioStreams: async () => {
    const response = await api.get(API_ENDPOINTS.STREAMING.GET_AUDIO_STREAMS);
    return response.data;
  },

  getEndUserStreams: async () => {
    const response = await api.get(API_ENDPOINTS.STREAMING.GET_END_USER_STREAMS);
    return response.data;
  },

  endStream: async (streamId) => {
    const response = await api.post(API_ENDPOINTS.STREAMING.END_STREAM, { streamId });
    return response.data;
  },
};

/**
 * Reports APIs
 */
export const reportsAPI = {
  getUserReports: async () => {
    const response = await api.get(API_ENDPOINTS.REPORTS.GET_USER_REPORTS);
    return response.data;
  },

  getUserFeedback: async () => {
    const response = await api.get(API_ENDPOINTS.REPORTS.GET_USER_FEEDBACK);
    return response.data;
  },

  getAgentFeedback: async () => {
    const response = await api.get(API_ENDPOINTS.REPORTS.GET_AGENT_FEEDBACK);
    return response.data;
  },

  resolveReport: async (reportId) => {
    const response = await api.post(API_ENDPOINTS.REPORTS.RESOLVE_REPORT, { reportId });
    return response.data;
  },
};

/**
 * Rewards APIs
 */
export const rewardsAPI = {
  getAllRewards: async () => {
    const response = await api.get(API_ENDPOINTS.REWARDS.GET_ALL_REWARDS);
    return response.data;
  },

  createReward: async (rewardData) => {
    const response = await api.post(API_ENDPOINTS.REWARDS.CREATE_REWARD, rewardData);
    return response.data;
  },

  assignReward: async (userId, rewardId) => {
    const response = await api.post(API_ENDPOINTS.REWARDS.ASSIGN_REWARD, { userId, rewardId });
    return response.data;
  },
};

/**
 * Version APIs
 */
export const versionAPI = {
  getCurrentVersion: async () => {
    const response = await api.get(API_ENDPOINTS.VERSION.GET_CURRENT_VERSION);
    return response.data;
  },

  updateVersion: async (versionData) => {
    const response = await api.post(API_ENDPOINTS.VERSION.UPDATE_VERSION, versionData);
    return response.data;
  },

  getVersionHistory: async () => {
    const response = await api.get(API_ENDPOINTS.VERSION.GET_VERSION_HISTORY);
    return response.data;
  },
};

// Export default axios instance for custom requests
export default api;
