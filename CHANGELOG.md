# Changelog

All notable changes to the **OmniAchievements** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to the **`a.b.c`** versioning scheme:
- **`a`**: Main architecture version (current: `0`).
- **`b`**: Major feature updates and milestones.
- **`c`**: Minor improvements, bug fixes, and configuration updates.

---

## [0.2.5] - 2026-11-08

### Added
- **Automated GitHub Release Changelogs**: Updated `.github/workflows/build-ios.yml` to automatically compare tags and append a complete list of commits and modifications (`git log ${PREV_TAG}..HEAD`) to every GitHub release.
- **Root `CHANGELOG.md`**: Created a centralized changelog documenting all releases from `v0.1.0` through `v0.2.5`.
- **TrueNAS SCALE 1-Click Updates**: Added `pull_policy: always` to `docker-compose.yml` and documented TrueNAS SCALE Web UI updates (Edit -> Save pulls the latest image without requiring SSH or CLI).
- **Comprehensive Version Synchronization**: Updated `scripts/bump-version.sh` to update `VERSION`, `client/package.json`, `server/package.json`, `decky-plugin/plugin.json`, `decky-plugin/package.json`, `decky-plugin/src/index.tsx`, `decky-plugin/main.py`, and `client/ios/App/App.xcodeproj/project.pbxproj` automatically on every release.

### Changed
- **Handheld Terminology Refinement**: Updated Web Settings tab labels, subheadings, placeholder text, and Decky plugin UI from single-device branding to **"Steam Deck & Handhelds"** (supporting Steam Deck, Lenovo Legion Go, ASUS ROG Ally, MSI Claw, OneXPlayer, Ayaneo running SteamOS, Bazzite, or ChimeraOS).

---

## [0.2.4] - 2026-11-08

### Fixed
- **Decky Pairing Authentication**: Updated `/api/decky/pair` endpoint in `server/src/routes/deckyRoutes.ts` to accept session `Bearer <token>` authorizations from the Web UI, resolving token rejection errors and removing dummy fallback token generation.
- **Decky SteamOS Permissions**: Added `sudo` and `sudo tee` to all installation commands, configuration file writes, and the Web UI's "Copy 1-Line Command" button to guarantee permissions inside `/home/deck/homebrew/`.
- **Dynamic Config Loading**: Updated `decky-plugin/main.py` so `load_config()` checks all standard configuration paths dynamically on every Quick Access Menu open, eliminating stale state after command-line pairing.

### Documentation
- **Handheld Guide Overhaul**: Expanded `README.md`, `docker/README.md`, and `docs/DECKY_PLUGIN_GUIDE.md` to cover all handheld PC form factors running SteamOS, Bazzite, and ChimeraOS.

---

## [0.2.3] - 2026-11-07

### Added
- **Multi-Architecture Docker CI**: Added automated GitHub Actions workflow (`docker-publish.yml`) publishing multi-arch (`linux/amd64`, `linux/arm64`) images to GitHub Container Registry (GHCR) and Docker Hub on every release.
- **NAS Deployment Documentation**: Added step-by-step installation guides for TrueNAS SCALE (Electric Eel Compose & legacy UI), Unraid Community Applications, and Synology Container Manager.
- **Docker Hub Sync**: Integrated `peter-evans/dockerhub-description` action to keep Docker Hub repository overview synchronized with `docker/README.md`.
- **Decky Process Detection**: Implemented multi-layer running game detection in Decky plugin inspecting `/proc` cmdlines and active non-Steam shortcuts.

---

## [0.2.2] - 2026-11-06

### Fixed
- **Decky Module Bundling**: Resolved `'cannot use import statement outside a module'` error in Decky Loader by bundling the frontend into a standalone Rollup distribution (`dist/index.js`).

---

## [0.2.1] - 2026-11-05

### Added
- **Localization Completion**: Full English and Spanish localization across Settings, Statistics, and Platform management views.

---

## [0.2.0] - 2026-11-04

### Added
- **Bilingual Interface**: Seamless instant English/Spanish language switching across all navigation bars, modals, and views.
- **Gemini AI Achievement Architect**: Integrated Google Gemini 2.5 Flash for generating custom achievements, badges, lore, and bilingual trophy descriptions for retro and emulator games.
- **Release Automation**: Transitioned from generic `latest` releases to numbered releases with GitHub's official Latest badge.

---

## [0.1.0] - 2026-11-03

### Added
- **Native iOS / iPadOS IPA**: GitHub Actions automated Xcode compilation workflow producing sideloadable `.ipa` packages compatible with SideStore, AltStore, TrollStore, and Sideloadly.
- **Decky Loader Plugin**: Native SteamOS overlay plugin package (`OmniAchievements-Decky.zip`) with 1-click in-Decky self-updating.
- **Offline-First Storage**: IndexedDB client-side database with automatic bidirectional cloud synchronization to the self-hosted Node.js server.
- **Steam Integration**: Family Sharing library detection and custom console platform tagging.
