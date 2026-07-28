// ------UAT Config---------
export const API_BASE_URL = 'https://nodeapi.sfalive.shop/api';
export const gameURL = 'https://sfagameadmin.sfalive.shop/login';

// -----prod (reference)---------
// export const API_BASE_URL = 'https://api.sfalive.com/api';
// export const gameURL = 'https://gameadmin.sfalive.com/login';

export const API_ENDPOINTS = {
  // Authentication APIs
  AUTH: {
    LOGIN: '/Registration/Login',
    LOGOUT: '/Registration/Logout',
    REFRESH_TOKEN: '/Registration/RefreshToken',
    CHANGE_PASSWORD: '/Registration/ChangePassword',
  },

  // User Management APIs
  USER: {
    GET_ALL_USERS: '/User/GetAllUsers',
    GET_USER_BY_ID: '/User/GetUserById',
    CREATE_USER: '/User/CreateUser',
    UPDATE_USER: '/User/UpdateUser',
    DELETE_USER: '/User/DeleteUser',
    GET_APP_USERS: '/User/GetAppUsers',
    GET_MOMENTS: '/User/GetMoments',
    GET_DELETED_ACCOUNTS: '/User/GetDeletedAccounts',
    APP_USER_DETAILS: '/Registration/AppUserDetails',
    GET_USER_DETAILS: '/Registration/GetUserDetails',
    SEARCH_APP_USERS: '/Registration/SearchAppUsers',
    DELETE_USER: '/Registration/AccountDeletion',
    ACCOUNT_DELETION: '/Registration/AccountDeletion',
    USER_EDIT_DETAILS: '/Registration/UserEditDetails',
    USER_DETAILS_HISTORY: '/Registration/UserDetailsHistory',
    GET_GIFT_RECORDS: '/Registration/GetGiftRecords',
    GET_GAME_RECORDS: '/Registration/GetGameRecords',
    USER_REWARD_SUMMARY: '/Registration/GetUserRewardAndGiftSummary',
    USER_COINS_BEANS_AMOUNT: '/Registration/UserCoinsBeansAmount',
    UPLOADED_MOMENT_RECORDS: '/Registration/GetMomentsRecord',
    DELETE_MOMENT_RECORD: '/Registration/DeleteMoment',
    ADMIN_REQUEST: '/Registration/AdminRequest',
    AGENCY_INSIDE_ADMIN: '/Registration/AgencyInsideAdmin',
    HOST_INSIDE_AGENCY: '/Registration/HostInsideAgency',
    ADMIN_AGENCY_HOST_LINKING: '/Registration/AdminAgencyHostLinking',
    APPLY_FOR_ADMIN_AGENCY_HOST: '/Registration/ApplyForAdminAgencyHost',
    GET_COINS_AND_BEANS_TRANSACTIONS: '/Registration/GetCoinsAndBeansTransactions',
    GET_DELETED_ACCOUNTS: '/Registration/GetDeletedAccounts',
    PLAY_STORE_RECORD: '/Registration/PlayStoreRecord',
    GET_WALLET_DETAILS: '/Registration/get_wallet_details',
    SEARCH_WALLET_FREEZE_UNFREEZE: '/Registration/SearchWalletFreezeUnfreezeUser',
    UPDATE_WALLET_STATUS: '/Registration/update_wallet_status',
    ADD_DEDUCT_COIN_USER_DETAILS: '/Registration/Add_DeductCoinUserDetails',
    // SEARCH_BY_USER_ID_COIN_AMOUNT: '/Registration/SearchByUserIdCoinAmount',
    GET_ALL_USERS_REGISTRATION: '/Registration/GetAllUsers',
    ADD_COIN_AMOUNT: '/Registration/AddCoinAmount',
    DEDUCT_COIN_AMOUNT: '/Registration/DeductCoinAmount',
    ADD_DEDUCT_BEANS_USER_DETAILS: '/Registration/Add_DeductBeansUserDetails',
    ADD_BEAN: '/Registration/AddBean',
    DEDUCT_BEAN: '/Registration/DeductBean',
    SEND_COINS_BEANS_TO_USER: '/Registration/SendCoinsToUser',
    GET_TRANSACTION_RECORDS: '/Registration/GetTransactionalRecords',
    MALL_PURCHASE_RECORD: '/Registration/MallPurchaseRecord',
    ID_BAN_UNBAN_USER_DETAILS: '/Registration/GetIdBanUnbanUsers',
    ID_BAN_UNBAN_BY_USER_ID: '/Registration/IDBanUnBanUserDetails_ByUserId',
    ID_BAN_UNBAN: '/Registration/BanUnBanUsers',
    // ID_UNBAN: '/Registration/BanUnBanUsers',
    INSERT_BAN_FOR_ROOM: '/Registration/InsertBanForRoom',
    DELETE_ROOM_BANNED_USER: '/Registration/DeleteRoomBannedUsers',
    GET_PRIVATE_CALL_DATA: '/Registration/GetPrivateCallData',
    GET_DEVICE_BLOCK_USER_DETAILS: '/Registration/GetDeviceBlockUnBlockedUsers',
    GET_DEVICE_BLOCK_BY_USER_ID: '/Registration/GetDeviceBlockUserDetailsByUserId',
    ADMIN_REQUEST: '/Registration/AdminRequest',
    ADMIN_REQUEST_APPROVE: '/Registration/AdminRequestApprove',
    ADMIN_REQUEST_REJECT: '/Registration/AdminRequestReject',
    ADMIN_AGENCY_HOST_DELETE: '/Registration/AdminAgencyHostDelete',
    EDIT_AGENCY_REQUEST: '/Registration/EditAgencyrequest',
    AGENCY_REQUEST: '/Registration/AgencyRequest',
    HOST_REQUEST: '/Registration/HostRequest',
    HOST_REQUEST_APPROVE: '/Registration/HostRequestApprove',
    HOST_REQUEST_REJECT: '/Registration/HostRequestReject',
    GET_ADMIN_AGENCY_HOST_REQUEST: '/Registration/GetAdminAgencyHostRequest',
    GET_NEW_ADMIN_AGENCY_HOST_REQUEST: '/Registration/GetApprovedAdminAgencyHost',
    APPROVE_REJECT_REQUEST: '/Registration/ApproveRejectRequest',
    AGENT_REQUEST_PENDING: '/Registration/GetAllAgentUsersPending',
    AGENT_REQUEST_APPROVED: '/Registration/Get_ApprovedAgentUserList',
    AGENT_REQUEST_REJECTED: '/Registration/Get_RejectedAgentUserList',
    AGENT_APPROVE: '/Registration/UpdateAgentRates',
    AGENT_REJECT: '/Registration/RejectAgentUser',
    ONLINE_AGENTS: '/Registration/GetLiveOnlineUsers',
    SET_USER_OFFLINE: '/Registration/UpdateUserIsLiveStatus',
    UPDATE_HOST_CALL_REATES: '/Registration/UpdateHostCallRates',
    BANNER_LIST: '/Registration/GetHomeAppBanners',
    AGENCY_REQUEST_APPROVE: '/Registration/AgencyRequestApprove',
    AGENCY_REQUEST_REJECT: '/Registration/AgencyRequestReject',
    DEVICE_BLOCK_UNBLOCK: '/Registration/BlockUnBlockDevices',
    DEVICE_UNBLOCK: '/Registration/UserDeviceIdUnBlock',
    BANNER_UPLOAD: '/Registration/InsertHomeAppBanner',
    BANNER_UPDATE: '/Registration/UpdateHomeAppBanner',
    BANNER_DELETE: '/Registration/DeleteHomeAppBanner',
    GIFT_LIST: '/Registration/GetGiftData',
    GIFT_UPLOAD: '/Registration/InsertGiftData',
    GIFT_UPDATE: '/Registration/UpdateGiftData',
    GIFT_DELETE: '/Registration/DeleteGiftData',
    HOME_IMAGE_LIST: '/Registration/GetHomeImages',
    HOME_IMAGE_UPLOAD: '/Registration/InsertHomeImage',
    HOME_IMAGE_UPDATE: '/Registration/UpdateHomeImage',
    HOME_IMAGE_UPDATE_STATUS: '/Registration/UpdateHomeImageStatus',
    HOME_IMAGE_DELETE: '/Registration/DeleteHomeImage',
    GAMES_LIST: '/Registration/GetAllGames',
    UPDATE_GAME_STATUS: '/Registration/UpdateGameStatus',
    BANK_WITHDRAW: '/Registration/GetBankWithdrawDetails',
    DELETE_BANK_WITHDRAW: '/Registration/DeleteBankWithdrawById',
    DELETE_WALLET_WITHDRAW: '/Registration/DeleteWalletWithdrawByUniqueId',
    WALLET_WITHDRAW: '/Registration/GetWithdrawRequests',
    RESELLER_DETAILS: '/Registration/GetResellerDetails',
    DEDUCT_RESELLER_COIN: '/Registration/DeductResellerCoin',
    RESELLER_LIST: '/Registration/GetResellerDetails',
    REMOVE_RESELLER: '/Registration/RemoveResellerByUserId',
    ADD_DEDUCT_RESELLER_COIN: '/Registration/AdminToResellerCoinTransfer',
    RESELLER_SENDINGS: '/Registration/GetResellerSendings',
    RESELLER_REMOVE: '/Registration/GetResellerRemove',
    RESELLER_COIN_RECORD: '/Registration/GetResellerCoinRecord',
    RESELLER_ALL_TRANSACTIONS: '/Registration/GetResellerTransactions',
    ADMIN_TO_RESELLER_TRANSACTIONS: '/Registration/GetAdminToResellerTransactions',
    RESELLER_PASSWORD_UPDATE: '/Registration/ResellerPasswordUpdate',
    GET_HOST_USERS_TIMING: '/Registration/GetHostAndUsersTiming',
    GET_TIMING_REWARD_CLAIMS: '/Registration/GetTimingRewardClaims',
    LIVE_STREAMING_DETAILS: '/Registration/GetLiveStreamingDetails',
    USER_LIVE_END: '/Registration/EndUserStream',
    REPORT_FEEDBACK: '/Registration/GetFeedBack',
    AGENT_FEEDBACK: '/Registration/GetFeedbackOnAgents',
    USER_REPORTS: '/Registration/GetUserReports',
    GET_STATIC_NUMBER: '/Registration/GetStaticNumbers',
    INSERT_STATIC_NUMBER: '/Registration/InsertStaticNumber',
    UPDATE_STATIC_NUMBER: '/Registration/UpdateStaticOTP',
    DELETE_STATIC_NUMBER: '/Registration/DeleteStaticNumber',
    WHATSAPP_OTP_LOGS: '/Registration/WhatsappOTPLogs',
    APP_VERSIONS: '/Registration/GetAndroidAppVersions',
    VERSION_UPDATE: '/Registration/VersionUpdate',
    USER_VERSION: '/Registration/GetUserVersion',
    // CREATE_RESELLER: '/Registration/GetAdminUsers',
    GET_ALL_ADMIN: '/Registration/GetAllAdmins',
    CREATE_RESELLERID: '/Registration/CreateReseller',
    COIN_RESELLING: '/Registration/WeeklyCoinResellingRecord',
    COIN_RESELLING_DATERANGE: '/Registration/DateRangeCoinResellingRecord',
    COIN_RESELLING_SEARCH: '/Registration/SearchResellerByUserId',
    COIN_RESELLING_ADD: '/Registration/AddResellerCoin',

  },

  // Purchase & Wallet APIs
  WALLET: {
    GET_PLAYSTORE_PURCHASES: '/Wallet/GetPlayStorePurchases',
    FREEZE_WALLET: '/Wallet/FreezeWallet',
    UNFREEZE_WALLET: '/Wallet/UnfreezeWallet',
    ADD_COINS: '/Wallet/AddCoins',
    DEDUCT_COINS: '/Wallet/DeductCoins',
    ADD_BEANS: '/Wallet/AddBeans',
    DEDUCT_BEANS: '/Wallet/DeductBeans',
    GET_MALL_PURCHASES: '/Wallet/GetMallPurchases',
    GET_COIN_PRICING: '/Registration/GetCoinPricing',
    INSERT_COIN_PRICING: '/Registration/InsertCoinPricing',
    DELETE_COIN_PRICING: '/Registration/DeleteCoinPricing',
  },

  // Account Status APIs
  ACCOUNT: {
    BAN_USER: '/Account/BanUser',
    UNBAN_USER: '/Account/UnbanUser',
    BLOCK_DEVICE: '/Account/BlockDevice',
    UNBLOCK_DEVICE: '/Account/UnblockDevice',
  },

  // Requests APIs
  REQUESTS: {
    GET_ADMIN_REQUESTS: '/Requests/GetAdminRequests',
    GET_AGENCY_REQUESTS: '/Requests/GetAgencyRequests',
    GET_HOST_REQUESTS: '/Requests/GetHostRequests',
    APPROVE_REQUEST: '/Requests/ApproveRequest',
    REJECT_REQUEST: '/Requests/RejectRequest',
  },

  // Agent APIs
  AGENT: {
    GET_BANNERS: '/Agent/GetBanners',
    UPLOAD_BANNER: '/Agent/UploadBanner',
    DELETE_BANNER: '/Agent/DeleteBanner',
    GET_HOME_IMAGES: '/Agent/GetHomeImages',
    UPLOAD_HOME_IMAGE: '/Agent/UploadHomeImage',
    GET_GAMES: '/Agent/GetGames',
    ADD_GAME: '/Agent/AddGame',
  },

  // Withdraw APIs
  WITHDRAW: {
    GET_BANK_WITHDRAWALS: '/Withdraw/GetBankWithdrawals',
    GET_WALLET_WITHDRAWALS: '/Withdraw/GetWalletWithdrawals',
    APPROVE_WITHDRAWAL: '/Withdraw/ApproveWithdrawal',
    REJECT_WITHDRAWAL: '/Withdraw/RejectWithdrawal',
  },

  // Reseller APIs
  RESELLER: {
    // CREATE_RESELLER: '/Reseller/CreateReseller',
    GET_ALL_RESELLERS: '/Reseller/GetAllResellers',
    GET_RESELLER_SUMMARY: '/Reseller/GetResellerSummary',
    // COIN_RESELLING: '/Reseller/CoinReselling',
    DEDUCT_COINS: '/Reseller/DeductCoins',
    GET_TRANSACTIONS: '/Reseller/GetTransactions',
  },

  // Customization APIs
  CUSTOMIZATION: {
    GET_FRAMES: '/Registration/SearchUserByUserIdForFrame',
    ADD_FRAME: '/Registration/SendFrameToUser',
    REMOVE_FRAME: '/Registration/RemoveFrameToUser',
    RESELLER_SENDINGS: '/Registration/GetUserCoinRecordByUserId',
    GET_RIDES: '/Registration/SearchUserByUserIdForRide',
    ADD_RIDE: '/Registration/SendRideToUser',
    REMOVE_RIDE: '/Registration/RemoveRideToUser',
    GET_THEMES: '/Registration/UserThemeList',
    ADD_THEME: '/Registration/SaveUserTheme',
    REMOVE_THEME: '/Registration/RemoveUserTheme',
  },

  // Streaming APIs
  STREAMING: {
    GET_AUDIO_STREAMS: '/Streaming/GetAudioStreams',
    GET_END_USER_STREAMS: '/Streaming/GetEndUserStreams',
    GET_LIVE_STREAMS: '/Streaming/GetLiveStreams',
    END_STREAM: '/Streaming/EndStream',
  },

  // Reports APIs
  REPORTS: {
    GET_USER_REPORTS: '/Reports/GetUserReports',
    GET_USER_FEEDBACK: '/Reports/GetUserFeedback',
    GET_AGENT_FEEDBACK: '/Reports/GetAgentFeedback',
    RESOLVE_REPORT: '/Reports/ResolveReport',
  },

  // WhatsApp OTP APIs
  WHATSAPP: {
    GET_OTP_LOGS: '/WhatsApp/GetOTPLogs',
    SEND_OTP: '/WhatsApp/SendOTP',
    VERIFY_OTP: '/WhatsApp/VerifyOTP',
  },

  // Rewards APIs
  REWARDS: {
    GET_ALL_REWARDS: '/Rewards/GetAllRewards',
    CREATE_REWARD: '/Rewards/CreateReward',
    UPDATE_REWARD: '/Rewards/UpdateReward',
    DELETE_REWARD: '/Rewards/DeleteReward',
    ASSIGN_REWARD: '/Rewards/AssignReward',
  },

  // Version Update APIs
  VERSION: {
    GET_CURRENT_VERSION: '/Registration/GetAppVersion',
    UPDATE_VERSION: '/Registration//UpdateAppVersion',
    GET_VERSION_HISTORY: '/Registration/GetVersionHistory',
  },

  // Dashboard APIs
  DASHBOARD: {
    GET_STATS: '/Dashboard/GetStats',
    GET_RECENT_USERS: '/Dashboard/GetRecentUsers',
    GET_ACTIVITY_CHART: '/Dashboard/GetActivityChart',
    GET_REVENUE_CHART: '/Dashboard/GetRevenueChart',
    GET_DASHBOARD_DETAILS: '/Registration/GetDashboardDetails',
    GET_TODAY_DASHBOARD_COUNTS: '/Registration/GetTodayDashboardCounts',
  },
};

/**
 * Helper function to get full API URL
 * @param {string} endpoint - Endpoint from API_ENDPOINTS
 * @returns {string} Full API URL
 */
export const getApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

/**
 * API Configuration for Axios
 */
export const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * Export karne ke liye shortcut functions
 */
export const getAuthUrl = (endpoint) => getApiUrl(API_ENDPOINTS.AUTH[endpoint]);
export const getUserUrl = (endpoint) => getApiUrl(API_ENDPOINTS.USER[endpoint]);
export const getWalletUrl = (endpoint) => getApiUrl(API_ENDPOINTS.WALLET[endpoint]);
export const getAccountUrl = (endpoint) => getApiUrl(API_ENDPOINTS.ACCOUNT[endpoint]);
export const getRequestsUrl = (endpoint) => getApiUrl(API_ENDPOINTS.REQUESTS[endpoint]);
export const getAgentUrl = (endpoint) => getApiUrl(API_ENDPOINTS.AGENT[endpoint]);
export const getWithdrawUrl = (endpoint) => getApiUrl(API_ENDPOINTS.WITHDRAW[endpoint]);
export const getResellerUrl = (endpoint) => getApiUrl(API_ENDPOINTS.RESELLER[endpoint]);
export const getCustomizationUrl = (endpoint) => getApiUrl(API_ENDPOINTS.CUSTOMIZATION[endpoint]);
export const getStreamingUrl = (endpoint) => getApiUrl(API_ENDPOINTS.STREAMING[endpoint]);
export const getReportsUrl = (endpoint) => getApiUrl(API_ENDPOINTS.REPORTS[endpoint]);
export const getWhatsAppUrl = (endpoint) => getApiUrl(API_ENDPOINTS.WHATSAPP[endpoint]);
export const getRewardsUrl = (endpoint) => getApiUrl(API_ENDPOINTS.REWARDS[endpoint]);
export const getVersionUrl = (endpoint) => getApiUrl(API_ENDPOINTS.VERSION[endpoint]);
export const getDashboardUrl = (endpoint) => getApiUrl(API_ENDPOINTS.DASHBOARD[endpoint]);
