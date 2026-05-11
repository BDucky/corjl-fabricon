# Running Fabricon on a Real iPhone (Dev Install)

This is the day-to-day flow for installing the dev build of Fabricon on your own iPhone via Xcode. For TestFlight / App Store distribution, see `MOBILE_BUILD_GUIDE.md` §8.

## One-time setup

### 1. Sign in to Xcode with an Apple ID

- Xcode → **Settings** → **Accounts** → **+** → Apple ID.
- A free personal Apple ID works for dev installs on your own device.
- A paid Apple Developer Program account is only needed for TestFlight, App Store, or some entitlements (push, in-app purchase, etc).

### 2. Configure signing for the App target

In Xcode, open `ios/App/App.xcworkspace` (not `.xcodeproj`):

- Select the **App** project in the left sidebar → **App** target → **Signing & Capabilities** tab.
- Tick **Automatically manage signing**.
- **Team**: pick your Apple ID.
- **Bundle Identifier**: must be globally unique. The default is `com.corjl.fabricon`. If Xcode complains it's taken, change it to something like `com.<yourname>.fabricon`.
  - If you change it here, also update `capacitor.config.ts` → `appId` so they match, then run `npx cap sync ios` once.

### 3. Enable Developer Mode on the iPhone (iOS 16+)

- Plug the iPhone into the Mac via USB, unlock it, tap **Trust This Computer** on the phone.
- On the phone: **Settings → Privacy & Security → Developer Mode → On**, then reboot when prompted.
- After reboot, unlock the phone and tap **Turn On** when the Developer Mode prompt appears.

## Every-time install

### 1. Build + sync the web bundle

From the repo root:

```bash
pnpm run build
npx cap sync ios
```

Run this any time web code changes. You can skip it if you only changed native iOS code.

### 2. Pick the device as the run destination

In Xcode, the destination dropdown is at the top, just to the right of the Run/Stop buttons. Click it and select your iPhone (its name will appear under **iOS Device**, not under **iOS Simulators**).

### 3. Run

Hit **⌘R** (or the Play button). Xcode will build, install to the phone, and launch.

### 4. First launch — trust the developer profile

The first install with a given Apple ID will show "Untrusted Developer" when you tap the app icon. On the phone:

- **Settings → General → VPN & Device Management** → your Apple ID under **Developer App** → **Trust**.
- Open Fabricon again — it will launch.

iOS will prompt for camera / photo-library permission the first time the app uses them. The permission strings come from `ios/App/App/Info.plist` (`NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSPhotoLibraryAddUsageDescription`).

## Live-reload dev loop (optional, much faster)

Instead of rebuilding the bundle for every change, point the phone at your Mac's Vite dev server. Both devices must be on the same Wi-Fi.

### 1. Find your Mac's LAN IP

```bash
ipconfig getifaddr en0
```

(Use `en1` if you're on a different interface.)

### 2. Add a `server` block to `capacitor.config.ts`

```ts
const config: CapacitorConfig = {
  // ...existing fields...
  server: {
    url: 'http://<your-mac-lan-ip>:5173',
    cleartext: true,
    androidScheme: 'https',
  },
}
```

### 3. Start Vite with `--host` so it binds to the LAN, not just localhost

```bash
pnpm run dev -- --host
```

### 4. Sync once, then run

```bash
npx cap sync ios
```

Hit **⌘R** in Xcode. The phone now loads the app from your Mac live — save a file, Vite HMR fires, the phone updates.

### 5. IMPORTANT — revert before a real build

Remove the `server.url` block (or comment it out) and re-run `npx cap sync ios` before shipping a build to TestFlight or doing a release archive. Otherwise the installed app will keep trying to reach your laptop's IP.

## Debugging on device

- **Safari Web Inspector**: with the phone connected, open Safari on the Mac → **Develop → [your iPhone] → Fabricon**. You get full DevTools (console, network, elements) attached to the WebView.
- Enable inspection on the phone first: **Settings → Safari → Advanced → Web Inspector → On**.

## Common gotchas

| Problem | Fix |
|---|---|
| "Failed to register bundle identifier" | The bundle ID is taken on Apple's side. Change to something unique like `com.<yourname>.fabricon` in Xcode + `capacitor.config.ts`. |
| "Untrusted Developer" when opening app | Settings → General → VPN & Device Management → Trust your Apple ID. |
| Build succeeds but device not listed | Unplug/replug, unlock the phone, accept the Trust prompt. Try a different USB cable — many cables are power-only. |
| Camera button does nothing | Check `Info.plist` has the three `NS*UsageDescription` keys, and that the app was reinstalled after they were added. |
| App opens to a white/blank screen | Usually means `dist/` was empty or stale at sync time. Re-run `pnpm run build && npx cap sync ios` and reinstall. |
| Live-reload won't connect | Mac and phone on the same Wi-Fi? Vite started with `--host`? Mac firewall blocking port 5173? IP changed (DHCP)? |
| Free Apple ID app expires after 7 days | This is normal for personal Apple IDs — re-run from Xcode to refresh. Paid Developer Program accounts get 1 year. |

## Quick reference

```bash
# Standard rebuild loop
pnpm run build && npx cap sync ios
# then ⌘R in Xcode

# Open the iOS workspace from CLI
npx cap open ios

# Just sync (no rebuild) — useful after capacitor.config.ts or plugin changes
npx cap sync ios
```
