# Ashmie mobile apps (iOS & Android)

The storefront and API now ship with a Capacitor 8 native shell. The same Vite build is bundled inside the iOS and Android apps, and the app talks to the Express API over HTTPS.

## What is included

- Native projects in `android/` and `ios/` (bundle id `com.ashmie.cakes`, display name `Ashmie`)
- Secure session storage through `@capacitor/preferences` (app-private storage, not `localStorage`)
- Native status bar, splash screen, haptics, share sheet, clipboard and in-app browser
- Offline detection with a banner, cached storefront data and paused chat polling while backgrounded
- Android back-button navigation and deep-link handling
- Payment return deep link: `ashmie://payment/callback?reference=...` (falls back to verifying the pending reference when the app resumes)
- Hardened native defaults: cleartext HTTP disabled, backups disabled, ATS enforced, release signing wired to a local `keystore.properties`

## Prerequisites

- Node.js 22+
- A public HTTPS deployment of the API (`VITE_API_BASE_URL`)
- Android: Java 21 + Android SDK (Android Studio) for local builds
- iOS: macOS + Xcode 16+ with a signing team

The native folders can be generated and synced on any OS. Compiling an APK/IPA requires the platform SDKs.

## 1. Point the app at your API

Native apps cannot use relative `/api` paths, so set the public API origin before building:

```bash
# .env.production or your CI environment
VITE_API_BASE_URL=https://your-api.example.com
VITE_PUBLIC_APP_URL=https://your-api.example.com
```

The web build keeps working with relative paths when `VITE_API_BASE_URL` is empty.

## 2. Build and sync

```bash
npm run build:mobile   # vite build + npx cap sync
```

Other useful commands:

```bash
npm run assets        # regenerate icons and splash screens from public/ashmie-logo.jpeg
npm run cap:sync      # copy dist/ into the native projects and update plugins
npm run android:open  # open the Android project in Android Studio
npm run ios:open      # open the iOS project in Xcode (macOS)
```

## 3. Paystack return URL

Set the server environment so Paystack sends customers back into the app:

```env
PAYSTACK_CALLBACK_URL=ashmie://payment/callback
```

The `ashmie` scheme is registered in `android/app/src/main/AndroidManifest.xml` and `ios/App/App/Info.plist`. If the in-app browser cannot hand control back to the app, the app still verifies `ashmie_pending_payment_reference` the next time it becomes active.

## 4. Android release signing

Create a keystore once (keep it out of version control):

```bash
keytool -genkeypair -v -keystore android/app/ashmie-release.jks \
  -alias ashmie -keyalg RSA -keysize 4096 -validity 10000
```

Create `android/keystore.properties`:

```properties
storeFile=ashmie-release.jks
storePassword=...
keyAlias=ashmie
keyPassword=...
```

Then build:

```bash
cd android
./gradlew assembleDebug      # debug APK
./gradlew bundleRelease      # signed release AAB for Play Console
```

`android/keystore.properties`, `*.jks` and `*.keystore` are already git-ignored.

## 5. iOS archive

```bash
npm run build:mobile
npm run ios:open
```

In Xcode: select the `App` scheme, set your Team under *Signing & Capabilities*, bump the version, then *Product → Archive* to upload to App Store Connect.

The iOS project uses Swift Package Manager (`CapApp-SPM`), so no `pod install` step is required.

## 6. CI builds

- `.github/workflows/android.yml` builds a debug APK and a release AAB on every push and uploads both.
- `.github/workflows/ios.yml` syncs Capacitor and builds the simulator app on macOS.
- `.github/workflows/ci.yml` runs lint, tests and the web build.

For signed Android artifacts in CI, add these repository secrets: `ANDROID_KEYSTORE_BASE64` (base64 of the `.jks`), `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`. Add the repository variable `VITE_API_BASE_URL`.

## Deep links

`ashmie://payment/callback?reference=...` is handled at launch and while the app is running. `parsePaymentReference` accepts both `reference` and `trxref` query parameters.
