# 8bit Sleep

Pixel-art sleep tamagotchi. Your hero stays alive only while **you** sleep — bad nights deal damage, a perfect week levels you up and opens a loot chest.

<p align="center">
  <img src="assets/pixellab/root/icon.png" alt="8bit Sleep" width="96" height="96" />
</p>

<p align="center">
  <img alt="Expo" src="https://img.shields.io/badge/Expo-54-000000?style=flat-square&logo=expo&logoColor=white" />
  <img alt="React Native" src="https://img.shields.io/badge/React_Native-0.81-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img alt="Zustand" src="https://img.shields.io/badge/Zustand-5-443E38?style=flat-square" />
  <img alt="Go" src="https://img.shields.io/badge/Go-1.22+-00ADD8?style=flat-square&logo=go&logoColor=white" />
  <img alt="Jest" src="https://img.shields.io/badge/Jest-29-C21325?style=flat-square&logo=jest&logoColor=white" />
  <img alt="pnpm" src="https://img.shields.io/badge/pnpm-9-F69220?style=flat-square&logo=pnpm&logoColor=white" />
</p>

## Stack

- **App:** Expo SDK 54 · React Native · TypeScript · Expo Router
- **State:** Zustand + AsyncStorage (offline-first)
- **Backend:** Go (`server/`) — AI oracle, morning chat, Mi Fitness
- **Tests and codestyle:** Jest - ESLint - Prettier

> Demo runs in store **Expo Go** — don't bump Expo past what Expo Go supports.

## Run

```bash
pnpm install
cp .env.example .env    # set EXPO_PUBLIC_API_ORIGIN if you need the API
pnpm start              # scan QR with Expo Go
```

```bash
pnpm run check          # lint + typecheck + jest (before commit)
```

Keep your sleep.
