# Stream For All (SFA) UAT Admin Panel - Brain File

This file serves as the core reference document containing all essential configurations and credentials for the UAT (User Acceptance Testing) environment of the SFA Admin Panel.

## 🌐 Environments & URLs
- **Frontend Live URL:** http://72.61.239.7:5002/
- **API Base URL:** https://nodeapi.sfalive.shop/

## 🖥️ Server Details (UAT)
- **SSH User & IP:** `root@72.61.239.7`
- **SSH Command:** `ssh root@72.61.239.7`
- **Password:** `Inmo@2020#`
- **Deployment Location:** `/var/www/admin_uat/`

## 📂 Local Project Path
- `d:\Inmortal Technologies\Admin Panel\sfa-admin-panel-uat`

## 📚 Recent API Additions
- **TodayUnclaimedRewards** (`/api/Registration/TodayUnclaimedRewards`)
  - **Type:** POST / GET (No Auth)
  - **Purpose:** Fetches all users who have an UNCLAIMED timing reward (RewardBeans > 0) for a given date.
  - **Usage:** Used by the admin panel to see pending claims.

- **SendRideFrameThemeAdmin** (`/api/Registration/SendRideFrameThemeAdmin`)
  - **Type:** POST (No Auth)
  - **Purpose:** Used by Admin Panel to send a free Ride/Frame/Theme (Mall item) to a user's bag, valid for 7 days.
  - **Usage:** Identical to the Reseller equivalent `SendRideFrameThemeReseller`.
