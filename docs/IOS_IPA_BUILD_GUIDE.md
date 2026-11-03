# 📱 iOS & iPadOS IPA Compilation & Installation Guide

OmniAchievements is built using **Capacitor**, allowing the exact same modern, responsive application to run natively on **iPhone and iPad (iPadOS)** with notch/dynamic island safe areas, smooth gestures, and responsive grid layouts.

This guide provides the **easiest ways to compile the `.ipa` package** and install it on your iOS or iPadOS device.

---

## ⚡ Method 1: Automated GitHub Actions (Easiest - No Mac Required!)

You don't need a Mac or complex developer tools. GitHub provides free macOS virtual machines that will compile the IPA for you automatically with one click.

### How to use GitHub Actions:
1. Push this repository to your personal GitHub account (public or private).
2. Go to the **Actions** tab in your GitHub repository.
3. In the left sidebar, click **"Build iOS & iPadOS IPA"**.
4. Click the **Run workflow** button on the right and select the `main` branch.
5. Wait ~3 to 4 minutes for the workflow to complete.
6. Click on the completed workflow run, scroll down to **Artifacts**, and download `OmniAchievements-iOS-IPA.zip`.
7. Unzip `OmniAchievements-iOS-IPA.zip` to extract the `OmniAchievements.ipa` file!

> [!IMPORTANT]
> **DO NOT tap to decompress `OmniAchievements.ipa`!**
> On iOS and iPadOS, the Files app treats `.ipa` files like zip archives. If you tap on `OmniAchievements.ipa`, iOS will attempt to extract it and show an error: *"The operation couldn't be completed. Bad message"*!
> The `.ipa` is an app package. Instead of tapping it, open your sideloading app (SideStore, AltStore, TrollStore) and select the `.ipa` from the app's **"+"** or **Import** button.

### ⚠️ Troubleshooting: "Bad message" when uncompressing `OmniAchievements-iOS-IPA.zip`
If you see *"The operation couldn't be completed. Bad message"* when unzipping `OmniAchievements-iOS-IPA.zip`:
1. **Incomplete Download in Safari**: Downloading large files from GitHub in mobile Safari can get interrupted if the app is put in the background. Keep Safari open until the blue download progress circle finishes completely.
2. **Use a Robust Extractor**: If the default iOS Files app struggles, open the zip file using [Documents by Readdle](https://apps.apple.com/app/documents-file-reader-browser/id364901807) (free) or extract it on your computer with 7-Zip or The Unarchiver.

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
