# 📱 iOS & iPadOS IPA Compilation & Installation Guide

OmniAchievements is built using **Capacitor**, allowing the exact same modern, responsive application to run natively on **iPhone and iPad (iPadOS)** with notch/dynamic island safe areas, smooth gestures, and responsive grid layouts.

This guide provides the **easiest ways to compile the `.ipa` package** and install it on your iOS or iPadOS device.

> [!TIP]
> **Want a zero-maintenance alternative with no 7-day certificate resigning?**
> You can install OmniAchievements instantly as a **Progressive Web App (PWA)**: open your server address (`http://<YOUR_SERVER_IP>:3001`) in **Safari** on your iPhone or iPad and tap **Share > Add to Home Screen**. It runs full-screen, caches your games offline via IndexedDB, and updates automatically whenever you update your server!

---

## ⚡ Method 1: Automated GitHub Actions & Direct Releases (Easiest - No Mac Required!)

You don't need a Mac or complex developer tools. GitHub provides free macOS virtual machines that compile the IPA automatically with one click and attach it directly to **GitHub Releases**.

### How to get the IPA:
1. Push this repository to your personal GitHub account.
2. Go to the **Actions** tab in your GitHub repository > Click **"Build iOS & iPadOS IPA"** > Click **Run workflow**.
3. When the build finishes (~3 minutes), go to the **Releases** section of your GitHub repository (or click **Releases > Latest**).
4. Download **`OmniAchievements.ipa`** directly!
   * 👉 **Direct Download URL**: `https://github.com/<your-username>/OmniAchievements/releases/latest/download/OmniAchievements.ipa`
   * This is the raw `.ipa` file directly. **No unzipping or decompression is needed!**

> [!IMPORTANT]
> **DO NOT try to uncompress or unzip `OmniAchievements.ipa`!**
> An `.ipa` file IS the final iOS app installer (just like an `.apk` on Android or `.exe` on Windows). 
> If you tap on `OmniAchievements.ipa` in the iOS Files app or try to uncompress it, iOS will attempt to treat it as a regular archive and fail with:
> *"Unsupported file format"* or *"Bad message"*.
> **Do not open or extract it.** Instead, open your sideloading app (SideStore, AltStore, TrollStore) and import the `.ipa` directly.

### ⚠️ Troubleshooting: "Unsupported file format even though it's a zip"
If you downloaded an artifact `.zip` from GitHub and it says *"unsupported file format"*:
1. **The file is not a real zip (it is an HTML error page)**: GitHub Actions artifact downloads require authentication cookies. If you tap the download button from a mobile browser where you are not logged in, or if cross-site tracking is blocked, GitHub downloads a tiny 401/403 HTML page named `.zip`. When you try to unzip it, the system says *"unsupported file format"* because the file contains HTML text, not zip data!
   * **Fix**: Use the direct **GitHub Releases** download link above instead, which is public and never requires authentication!
2. **Double Extensions (`.ipa.zip`)**: Make sure your phone or PC didn't rename the file to `OmniAchievements.ipa.zip`. It must strictly be `OmniAchievements.ipa`.

---

## 📲 How to Install the IPA on iPhone or iPad

Once you have your `OmniAchievements.ipa` file, you can install ("sideload") it onto your iOS/iPadOS device using any of the following free tools:

### Option A: SideStore (Recommended - No Computer Needed After Setup!)
[SideStore](https://sidestore.io) allows you to install and automatically refresh the app wirelessly on your local Wi-Fi without needing a PC.
1. Download the `OmniAchievements.ipa` in Safari on your iPhone or iPad.
2. Open **SideStore** > Tap the **+** icon in the top left.
3. Select `OmniAchievements.ipa`.
4. SideStore will sign and install the app onto your home screen!

### Option B: AltStore
[AltStore](https://altstore.io) is the classic free sideloading app for Windows and macOS.
1. Connect your iPhone/iPad to your computer via USB or Wi-Fi.
2. Open AltStore on your device.
3. In the "My Apps" tab, tap **+** and select `OmniAchievements.ipa`.
4. Enter your free Apple ID when prompted to sign the app.

### Option C: Sideloadly (Windows & Mac)
[Sideloadly](https://sideloadly.io) is a simple drag-and-drop tool:
1. Connect your iPhone/iPad to your PC or Mac.
2. Open Sideloadly.
3. Drag `OmniAchievements.ipa` into Sideloadly.
4. Enter your Apple ID and click **Start**.

### Option D: TrollStore (For iOS 14.0 - 16.6.1)
If your device runs a compatible iOS version with TrollStore:
1. Share `OmniAchievements.ipa` directly to TrollStore.
2. The app is installed permanently with zero revokes and zero 7-day expiration limits.

---

## 💻 Method 2: Compile Locally on macOS

If you have a Mac and prefer to build locally using Xcode:

### Prerequisites:
- macOS with [Xcode](https://developer.apple.com/xcode/) installed
- Node.js 18+ & CocoaPods (`sudo gem install cocoapods`)

### Build Steps:
```bash
# 1. Navigate to the client directory
cd client

# 2. Install dependencies & build web bundle
npm install
npm run build

# 3. Add and sync Capacitor iOS project
npx cap add ios
npx cap sync ios

# 4. Open in Xcode
npx cap open ios
```
In Xcode:
1. Select your target device or "Any iOS Device (arm64)".
2. Choose your free Apple ID under **Signing & Capabilities**.
3. Click **Product > Archive**, or click the **Play** button to install directly onto your connected iPhone or iPad!
