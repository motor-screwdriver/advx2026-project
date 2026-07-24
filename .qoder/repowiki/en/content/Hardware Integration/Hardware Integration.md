# Hardware Integration

<cite>
**Referenced Files in This Document**
- [nfc.ts](file://src/systems/nfc.ts)
- [audio.ts](file://src/systems/audio.ts)
- [eink.ts](file://src/systems/eink.ts)
- [einkCard.tsx](file://src/systems/einkCard.tsx)
- [einkConfig.ts](file://src/systems/einkConfig.ts)
- [healthSync.ts](file://src/systems/healthSync.ts)
- [notifications.ts](file://src/systems/notifications.ts)
- [index.tsx](file://src/systems/index.tsx)
- [Screen.tsx](file://src/ui/Screen.tsx)
- [PixelArt.tsx](file://src/ui/PixelArt.tsx)
- [manifest.ts](file://assets/manifest.ts)
</cite>

## Table of Contents

1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction

This document explains the hardware integration systems that connect the application to device capabilities. It covers NFC card reading and writing for physical media interaction, audio playback for sound effects and music, E Ink optimizations and display-specific rendering, health data synchronization with external APIs, and notification systems. It also includes error handling strategies, permission management, platform-specific considerations, examples of integrating each hardware feature, and troubleshooting guidance for common issues.

## Project Structure

The hardware integrations are implemented under src/systems as modular components:

- NFC: nfc.ts
- Audio: audio.ts
- E Ink: eink.ts, einkCard.tsx, einkConfig.ts
- Health Sync: healthSync.ts
- Notifications: notifications.ts
- Systems index: index.tsx (exports and aggregates subsystems)
- UI rendering helpers: Screen.tsx, PixelArt.tsx
- Asset manifest: assets/manifest.ts

```mermaid
graph TB
subgraph "Systems"
NFC["NFC Module<br/>src/systems/nfc.ts"]
Audio["Audio Module<br/>src/systems/audio.ts"]
EINK["E Ink Core<br/>src/systems/eink.ts"]
EINK_CARD["E Ink Card Renderer<br/>src/systems/einkCard.tsx"]
EINK_CFG["E Ink Config<br/>src/systems/einkConfig.ts"]
Health["Health Sync<br/>src/systems/healthSync.ts"]
Notif["Notifications<br/>src/systems/notifications.ts"]
SysIdx["Systems Index<br/>src/systems/index.tsx"]
end
subgraph "UI"
Screen["Screen Helper<br/>src/ui/Screen.tsx"]
PixelArt["Pixel Art Renderer<br/>src/ui/PixelArt.tsx"]
end
Assets["Asset Manifest<br/>assets/manifest.ts"]
SysIdx --> NFC
SysIdx --> Audio
SysIdx --> EINK
SysIdx --> EINK_CARD
SysIdx --> EINK_CFG
SysIdx --> Health
SysIdx --> Notif
EINK_CARD --> EINK
EINK_CARD --> EINK_CFG
EINK --> Screen
EINK --> PixelArt
Audio --> Assets
```

**Diagram sources**

- [index.tsx](file://src/systems/index.tsx)
- [nfc.ts](file://src/systems/nfc.ts)
- [audio.ts](file://src/systems/audio.ts)
- [eink.ts](file://src/systems/eink.ts)
- [einkCard.tsx](file://src/systems/einkCard.tsx)
- [einkConfig.ts](file://src/systems/einkConfig.ts)
- [healthSync.ts](file://src/systems/healthSync.ts)
- [notifications.ts](file://src/systems/notifications.ts)
- [Screen.tsx](file://src/ui/Screen.tsx)
- [PixelArt.tsx](file://src/ui/PixelArt.tsx)
- [manifest.ts](file://assets/manifest.ts)

**Section sources**

- [index.tsx](file://src/systems/index.tsx)
- [nfc.ts](file://src/systems/nfc.ts)
- [audio.ts](file://src/systems/audio.ts)
- [eink.ts](file://src/systems/eink.ts)
- [einkCard.tsx](file://src/systems/einkCard.tsx)
- [einkConfig.ts](file://src/systems/einkConfig.ts)
- [healthSync.ts](file://src/systems/healthSync.ts)
- [notifications.ts](file://src/systems/notifications.ts)
- [Screen.tsx](file://src/ui/Screen.tsx)
- [PixelArt.tsx](file://src/ui/PixelArt.tsx)
- [manifest.ts](file://assets/manifest.ts)

## Core Components

- NFC module provides scanning, reading, and writing flows for NFC tags/cards.
- Audio module manages playback of sound effects and background music with lifecycle control.
- E Ink modules provide optimized rendering paths, refresh strategies, and card rendering tailored for monochrome displays.
- Health sync module integrates with external health APIs to synchronize user metrics and events.
- Notifications module handles local notifications and system-level alerts.

Key responsibilities and interactions are coordinated via the systems index, which exposes a unified API surface to screens and game logic.

**Section sources**

- [nfc.ts](file://src/systems/nfc.ts)
- [audio.ts](file://src/systems/audio.ts)
- [eink.ts](file://src/systems/eink.ts)
- [einkCard.tsx](file://src/systems/einkCard.tsx)
- [einkConfig.ts](file://src/systems/einkConfig.ts)
- [healthSync.ts](file://src/systems/healthSync.ts)
- [notifications.ts](file://src/systems/notifications.ts)
- [index.tsx](file://src/systems/index.tsx)

## Architecture Overview

The hardware integration architecture follows a modular design where each capability is encapsulated in its own module. The systems index aggregates these modules and exports them consistently to the rest of the app. UI layers consume these modules through well-defined interfaces, ensuring separation between presentation and hardware concerns.

```mermaid
sequenceDiagram
participant App as "App Layer"
participant Sys as "Systems Index"
participant NFC as "NFC Module"
participant Audio as "Audio Module"
participant EINK as "E Ink Core"
participant EINKC as "E Ink Card"
participant Health as "Health Sync"
participant Notif as "Notifications"
App->>Sys : Initialize subsystems
Sys-->>App : Expose APIs
App->>NFC : Request scan/read/write
NFC-->>App : Tag data or errors
App->>Audio : Play SFX/Music
Audio-->>App : Playback status
App->>EINK : Render optimized frame
EINK->>EINKC : Generate card bitmap
EINKC-->>EINK : Optimized image
EINK-->>App : Displayed frame
App->>Health : Sync metrics
Health-->>App : Sync result
App->>Notif : Schedule alert
Notif-->>App : Notification ID
```

**Diagram sources**

- [index.tsx](file://src/systems/index.tsx)
- [nfc.ts](file://src/systems/nfc.ts)
- [audio.ts](file://src/systems/audio.ts)
- [eink.ts](file://src/systems/eink.ts)
- [einkCard.tsx](file://src/systems/einkCard.tsx)
- [healthSync.ts](file://src/systems/healthSync.ts)
- [notifications.ts](file://src/systems/notifications.ts)

## Detailed Component Analysis

### NFC Card Reading/Writing System

Responsibilities:

- Detect NFC availability and request permissions.
- Start/stop scanning sessions.
- Read tag payloads and parse into structured data.
- Write data to supported tags safely.
- Handle platform differences and error conditions.

Integration example:

- On screen mount, initialize NFC session and register event listeners.
- When a tag is detected, read payload and update state.
- On write action, validate input, perform write, and confirm success.

Error handling:

- Gracefully handle unsupported devices, denied permissions, and I/O errors.
- Provide user feedback and fallback flows when NFC is unavailable.

Permission management:

- Check and request NFC permissions at runtime on platforms requiring explicit consent.

Platform considerations:

- Android typically requires foreground service or activity-based NFC access; iOS has limited NFC support depending on context.

```mermaid
flowchart TD
Start(["Start NFC Flow"]) --> CheckAvail["Check NFC Availability"]
CheckAvail --> Avail{"Available?"}
Avail --> |No| Fallback["Show Fallback UI"]
Avail --> |Yes| Perm["Request Permission if Needed"]
Perm --> PermOK{"Permission Granted?"}
PermOK --> |No| Deny["Handle Denied State"]
PermOK --> |Yes| Scan["Start Scan Session"]
Scan --> Detect{"Tag Detected?"}
Detect --> |No| Wait["Wait for Detection"]
Detect --> |Yes| Read["Read Tag Payload"]
Read --> Parse["Parse Data"]
Parse --> Update["Update App State"]
Update --> End(["End"])
Deny --> End
Fallback --> End
```

**Diagram sources**

- [nfc.ts](file://src/systems/nfc.ts)

**Section sources**

- [nfc.ts](file://src/systems/nfc.ts)

### Audio Playback System

Responsibilities:

- Load and manage audio assets from the manifest.
- Play sound effects and background music with volume control.
- Pause/resume/cleanup audio resources appropriately.
- Handle interruptions and platform audio routing.

Integration example:

- Preload critical SFX on app start.
- Trigger SFX on user actions (clicks, transitions).
- Manage music lifecycle across scenes to avoid overlapping playback.

Error handling:

- Catch decoding failures, missing assets, and playback errors.
- Provide silent fallbacks and log diagnostics.

Permission management:

- Ensure required audio permissions are granted on platforms that require it.

Platform considerations:

- Background audio policies differ by OS; respect system interruptions and do not assume persistent playback.

```mermaid
sequenceDiagram
participant UI as "UI Layer"
participant Audio as "Audio Module"
participant Assets as "Asset Manifest"
UI->>Audio : preload(id)
Audio->>Assets : resolve(id)
Assets-->>Audio : asset path
Audio-->>UI : ready
UI->>Audio : play(id, options)
Audio-->>UI : started
UI->>Audio : pause()
Audio-->>UI : paused
UI->>Audio : stop()
Audio-->>UI : stopped
```

**Diagram sources**

- [audio.ts](file://src/systems/audio.ts)
- [manifest.ts](file://assets/manifest.ts)

**Section sources**

- [audio.ts](file://src/systems/audio.ts)
- [manifest.ts](file://assets/manifest.ts)

### E Ink Device Optimizations and Display-Specific Rendering

Responsibilities:

- Optimize rendering for monochrome, low-refresh displays.
- Minimize full-screen refreshes and use partial updates where possible.
- Generate high-contrast bitmaps suitable for E Ink panels.
- Provide card rendering utilities tailored for E Ink constraints.

Integration example:

- Use E Ink core to render frames efficiently.
- Compose card visuals using the E Ink card renderer.
- Configure E Ink behavior via configuration module.

Error handling:

- Handle unsupported display modes and fallback to standard rendering.
- Validate bitmap dimensions and color depth before sending to display.

Platform considerations:

- Respect device-specific refresh limits and power-saving features.

```mermaid
classDiagram
class EInkCore {
+renderFrame(scene)
+optimizeForEink(bitmap)
+partialRefresh(rect)
}
class EInkCardRenderer {
+renderCard(cardData)
+applyContrastThreshold()
+reduceDithering()
}
class EInkConfig {
+refreshMode
+contrastLevel
+ditherEnabled
}
class ScreenHelper {
+getDimensions()
+createCanvas()
}
class PixelArtRenderer {
+drawPixels(image)
+quantizeColors()
}
EInkCardRenderer --> EInkCore : "uses"
EInkCore --> ScreenHelper : "uses"
EInkCore --> PixelArtRenderer : "uses"
EInkCore --> EInkConfig : "reads config"
```

**Diagram sources**

- [eink.ts](file://src/systems/eink.ts)
- [einkCard.tsx](file://src/systems/einkCard.tsx)
- [einkConfig.ts](file://src/systems/einkConfig.ts)
- [Screen.tsx](file://src/ui/Screen.tsx)
- [PixelArt.tsx](file://src/ui/PixelArt.tsx)

**Section sources**

- [eink.ts](file://src/systems/eink.ts)
- [einkCard.tsx](file://src/systems/einkCard.tsx)
- [einkConfig.ts](file://src/systems/einkConfig.ts)
- [Screen.tsx](file://src/ui/Screen.tsx)
- [PixelArt.tsx](file://src/ui/PixelArt.tsx)

### Health Data Synchronization

Responsibilities:

- Connect to external health APIs for syncing metrics and events.
- Authenticate securely and manage tokens.
- Batch and reconcile data to avoid conflicts.
- Handle rate limits and retries.

Integration example:

- On user login, establish connection and fetch latest metrics.
- Periodically push new data based on app state changes.
- Show sync status and allow manual retry on failure.

Error handling:

- Network errors, authentication failures, and schema mismatches must be handled gracefully.
- Queue failed operations and retry with backoff.

Permission management:

- Request health data permissions explicitly and explain purpose to users.

Platform considerations:

- Different APIs per platform (e.g., Apple HealthKit vs Google Fit); abstract behind a unified interface.

```mermaid
flowchart TD
Init(["Init Health Sync"]) --> Auth["Authenticate with Provider"]
Auth --> AuthOK{"Auth Success?"}
AuthOK --> |No| RetryAuth["Retry with Backoff"]
AuthOK --> |Yes| Fetch["Fetch Latest Metrics"]
Fetch --> Merge["Merge Local and Remote"]
Merge --> Push["Push New Events"]
Push --> Done(["Sync Complete"])
RetryAuth --> Done
```

**Diagram sources**

- [healthSync.ts](file://src/systems/healthSync.ts)

**Section sources**

- [healthSync.ts](file://src/systems/healthSync.ts)

### Notification Systems

Responsibilities:

- Create and schedule local notifications.
- Handle permission requests and user preferences.
- Support recurring reminders and one-time alerts.

Integration example:

- Schedule daily reminders based on user settings.
- Trigger contextual notifications during gameplay milestones.

Error handling:

- Handle denied permissions and system limitations.
- Provide fallback messaging when notifications are unavailable.

Platform considerations:

- Respect OS-specific notification channels and scheduling rules.

```mermaid
sequenceDiagram
participant App as "App Layer"
participant Notif as "Notifications Module"
participant OS as "OS Notification Service"
App->>Notif : requestPermission()
Notif->>OS : prompt user
OS-->>Notif : granted/denied
Notif-->>App : permission status
App->>Notif : scheduleNotification(payload)
Notif->>OS : create scheduled alert
OS-->>Notif : notificationId
Notif-->>App : id
```

**Diagram sources**

- [notifications.ts](file://src/systems/notifications.ts)

**Section sources**

- [notifications.ts](file://src/systems/notifications.ts)

## Dependency Analysis

The systems index centralizes imports and exports, reducing coupling between screens and hardware modules. Each module depends only on its specific domain and shared UI helpers where necessary.

```mermaid
graph LR
Index["Systems Index<br/>src/systems/index.tsx"] --> NFC["NFC<br/>src/systems/nfc.ts"]
Index --> Audio["Audio<br/>src/systems/audio.ts"]
Index --> EINK["E Ink Core<br/>src/systems/eink.ts"]
Index --> EINKC["E Ink Card<br/>src/systems/einkCard.tsx"]
Index --> EINKCFG["E Ink Config<br/>src/systems/einkConfig.ts"]
Index --> Health["Health Sync<br/>src/systems/healthSync.ts"]
Index --> Notif["Notifications<br/>src/systems/notifications.ts"]
EINKC --> EINK
EINK --> Screen["Screen Helper<br/>src/ui/Screen.tsx"]
EINK --> PixelArt["Pixel Art Renderer<br/>src/ui/PixelArt.tsx"]
Audio --> Manifest["Asset Manifest<br/>assets/manifest.ts"]
```

**Diagram sources**

- [index.tsx](file://src/systems/index.tsx)
- [nfc.ts](file://src/systems/nfc.ts)
- [audio.ts](file://src/systems/audio.ts)
- [eink.ts](file://src/systems/eink.ts)
- [einkCard.tsx](file://src/systems/einkCard.tsx)
- [einkConfig.ts](file://src/systems/einkConfig.ts)
- [healthSync.ts](file://src/systems/healthSync.ts)
- [notifications.ts](file://src/systems/notifications.ts)
- [Screen.tsx](file://src/ui/Screen.tsx)
- [PixelArt.tsx](file://src/ui/PixelArt.tsx)
- [manifest.ts](file://assets/manifest.ts)

**Section sources**

- [index.tsx](file://src/systems/index.tsx)

## Performance Considerations

- NFC: Avoid continuous scanning; use event-driven detection to conserve battery.
- Audio: Preload frequently used assets and reuse instances to reduce allocation overhead.
- E Ink: Prefer partial updates and minimize full refreshes; quantize colors and reduce dithering for faster rendering.
- Health Sync: Batch operations and implement exponential backoff for retries.
- Notifications: Coalesce similar notifications and respect system batching policies.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide

Common issues and resolutions:

- NFC not detected:
  - Verify device compatibility and permissions.
  - Ensure tags are within range and properly formatted.
- Audio playback fails:
  - Confirm asset paths exist in the manifest.
  - Check platform audio permissions and interruption handling.
- E Ink rendering artifacts:
  - Validate bitmap dimensions and color thresholds.
  - Adjust contrast and dithering settings via configuration.
- Health sync errors:
  - Inspect authentication tokens and network connectivity.
  - Review API rate limits and retry policies.
- Notifications not appearing:
  - Confirm permission grants and OS-specific channel setup.
  - Test scheduling intervals and payload validity.

**Section sources**

- [nfc.ts](file://src/systems/nfc.ts)
- [audio.ts](file://src/systems/audio.ts)
- [eink.ts](file://src/systems/eink.ts)
- [einkCard.tsx](file://src/systems/einkCard.tsx)
- [einkConfig.ts](file://src/systems/einkConfig.ts)
- [healthSync.ts](file://src/systems/healthSync.ts)
- [notifications.ts](file://src/systems/notifications.ts)

## Conclusion

The hardware integration layer provides robust, modular capabilities for NFC, audio, E Ink rendering, health synchronization, and notifications. By adhering to clear interfaces and centralized exports, the app maintains flexibility and maintainability while delivering reliable device interactions. Proper error handling, permission management, and platform awareness ensure consistent experiences across diverse environments.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

- Example integration patterns:
  - NFC: Initialize on screen mount, listen for tag events, read/write with validation.
  - Audio: Preload assets, trigger SFX on interactions, manage music lifecycle.
  - E Ink: Use optimized rendering pipeline, configure contrast and refresh modes.
  - Health Sync: Authenticate, fetch and merge data, schedule periodic syncs.
  - Notifications: Request permissions, schedule alerts, handle user preferences.

[No sources needed since this section provides general guidance]
