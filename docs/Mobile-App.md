# Mobile App

FlowDesk includes a React Native (Expo) mobile companion app.

---

## Tech Stack

| Technology | Version |
|------------|---------|
| React Native | SDK 52 |
| Expo | Latest |
| React Navigation | v7 |
| Axios | Latest |
| Expo SecureStore | Latest |

---

## Setup

```bash
cd mobile
npm install
npx expo start
```

### Requirements

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- For iOS: Xcode and CocoaPods
- For iOS Simulator: `npx expo run:ios`
- For Android Emulator: `npx expo run:android`

---

## Features

### Bottom Tab Navigation

| Tab | Screen | Description |
|-----|--------|-------------|
| Dashboard | DashboardScreen | Overview and stats |
| Projects | ProjectsScreen | Project list |
| Notifications | NotificationsScreen | Notification center |
| Profile | ProfileScreen | User profile and settings |

### Kanban Board

- Horizontal scrollable columns
- Task cards with priority indicators
- Pull-to-refresh support

### Authentication

- Secure token storage with `expo-secure-store`
- Automatic token refresh on 401 responses
- Login and registration screens

---

## Project Structure

```
mobile/
├── App.tsx                 # Navigation setup
└── src/
    ├── screens/            # Screen components
    │   ├── LoginScreen.tsx
    │   ├── RegisterScreen.tsx
    │   ├── DashboardScreen.tsx
    │   ├── ProjectsScreen.tsx
    │   ├── BoardScreen.tsx
    │   ├── NotificationsScreen.tsx
    │   └── ProfileScreen.tsx
    ├── stores/             # State management
    │   ├── authStore.ts
    │   └── workspaceStore.ts
    ├── lib/
    │   └── api.ts          # Axios API client
    └── types/
        └── index.ts        # TypeScript interfaces
```

---

## API Client

The mobile app uses the same REST API as the web frontend. See [API Reference](API-Reference.md) for endpoints.

### Configuration

Update the API base URL in `mobile/src/lib/api.ts`:

```typescript
const API_BASE_URL = "http://YOUR_API_URL/api/v1";
```

For local development with Expo on a physical device, use your machine's local IP address instead of `localhost`.

---

## Building for Production

### iOS

```bash
npx expo build:ios
```

### Android

```bash
npx expo build:android
```

### Using EAS Build

```bash
npm install -g eas-cli
eas login
eas build --platform ios
eas build --platform android
```

---

## Troubleshooting

### Expo start fails

```bash
# Clear cache
npx expo start --clear

# Reset project
rm -rf node_modules
npm install
```

### Can't connect to API

- Ensure the backend is running
- Use your machine's IP instead of `localhost` for physical devices
- Check that `NEXT_PUBLIC_API_URL` matches your backend URL

### iOS build fails

```bash
cd ios
pod install
cd ..
npx expo run:ios
```
