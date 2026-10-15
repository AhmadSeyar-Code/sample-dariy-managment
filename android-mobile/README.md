# Dairy Management Android App

This is a native Android app written in Kotlin and Jetpack Compose. All app data is stored in a SQLite database inside the app on the phone. It works without a computer, API server, MySQL, or an internet connection.

## Requirements

- Android Studio with Android SDK 35
- JDK 17 (Android Studio's bundled JBR is suitable)

## Install the app

Copy the generated APK to the Android phone and open it to install:

- `app/build/outputs/apk/debug/app-debug.apk`

If Android asks, allow installation from that file manager/source. The app creates its local database automatically the first time it is opened.

## Build the APK

```powershell
.\gradlew.bat assembleDebug
```

## Included features

- Daily dashboard
- Supplier, milk intake, sales, expenses, and product listing/creation
- Business settings editing and dark mode
- On-device database with no server setup

Data is stored on the phone and is separate from the web application's database. Uninstalling the app or clearing its app data removes the local records. This debug APK is intended for direct installation/testing, not Play Store publication.
