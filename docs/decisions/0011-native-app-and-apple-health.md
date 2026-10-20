# 0011 The iPhone app, Apple Health and speech

Date: 20 October 2026. Decided by: the founder (Apple Developer account approved 19–20 Oct 2026).

## Decision
- Happy Orange becomes a real iPhone app (bundle id `in.happyorange.heal`), built in the cloud with EAS and given to testers through **TestFlight**; the public App Store comes later.
- **Apple Health (read only)** via `@kingstinct/react-native-healthkit`: today's steps, Apple exercise minutes and last night's sleep (largest single source, so watch + phone are not double counted). Read when the app opens, when it comes back to the front and every 15 minutes. Nothing is written to Health. Values from Health replace typed ones for that day (manual entry is the last resort).
- **Speak** in the iPhone app via `expo-speech-recognition` (Apple's recognition, English India or Hindi India by app language). Safari on iPhone still uses the keyboard microphone.
- Web stays live at app.happyorange.in; Android Health Connect later.

## Signing and uploads
- App Store Connect API key "Expo EAS" (Admin, Team key, Key ID 5L7B7CK24H) uploaded by the founder to the Expo account (expo.dev → healmyra → Android & iOS credentials). The .p8 file stays with the founder; never in chat or the repository.
- Expo's builder cannot create the first distribution certificate without a person (eas-cli `SetUpDistributionCertificate` throws for non-interactive builds when none exists). So the founder runs the first build once from his computer: `npx eas-cli@latest build --platform ios --profile production --auto-submit`, signing in to Apple himself. After that, `.eas/workflows/ios-testflight.yml` builds and submits on every push to the `testflight` branch.
