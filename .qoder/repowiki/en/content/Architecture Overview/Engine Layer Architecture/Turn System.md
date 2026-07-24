# Turn System

<cite>
**Referenced Files in This Document**
- [turn.ts](file://src/engine/turn.ts)
- [time.ts](file://src/engine/time.ts)
- [levels.ts](file://src/engine/levels.ts)
- [night.ts](file://src/engine/night.ts)
- [hero.ts](file://src/engine/hero.ts)
- [artifacts.ts](file://src/engine/artifacts.ts)
- [chest.ts](file://src/engine/chest.ts)
- [resurrection.ts](file://src/engine/resurrection.ts)
- [actions.ts](file://src/state/actions.ts)
- [store.ts](file://src/state/store.ts)
- [events.ts](file://src/contracts/events.ts)
- [types.ts](file://src/contracts/types.ts)
- [flags.ts](file://src/contracts/flags.ts)
- [mock.ts](file://src/contracts/mock.ts)
- [turn.test.ts](file://src/engine/__tests__/turn.test.ts)
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

This document explains the turn-based system that manages game turns, player actions, and turn progression. It covers how turns are structured, how actions are resolved within a turn, and how state transitions occur between turns. It also documents the turn lifecycle, action queuing, multi-entity interactions within turn boundaries, common patterns for managing turns, and integration points with other game systems such as time, levels, night cycles, heroes, artifacts, chests, and resurrection logic.

## Project Structure

The turn system is implemented primarily under src/engine with supporting contracts and state management modules:

- Engine layer: turn orchestration, timekeeping, level progression, night cycle, hero behavior, artifacts, chests, and resurrection.
- Contracts: shared types, events, flags, and mocks used across engine and UI.
- State layer: actions and store for persisting and broadcasting game state changes.

```mermaid
graph TB
subgraph "Engine"
T["turn.ts"]
TM["time.ts"]
LV["levels.ts"]
NG["night.ts"]
HR["hero.ts"]
AR["artifacts.ts"]
CH["chest.ts"]
RS["resurrection.ts"]
end
subgraph "Contracts"
EV["events.ts"]
TP["types.ts"]
FL["flags.ts"]
MK["mock.ts"]
end
subgraph "State"
AC["actions.ts"]
ST["store.ts"]
end
T --> TM
T --> LV
T --> NG
T --> HR
T --> AR
T --> CH
T --> RS
T --> EV
T --> TP
T --> FL
T --> AC
T --> ST
AC --> ST
EV --> ST
```

**Diagram sources**

- [turn.ts](file://src/engine/turn.ts)
- [time.ts](file://src/engine/time.ts)
- [levels.ts](file://src/engine/levels.ts)
- [night.ts](file://src/engine/night.ts)
- [hero.ts](file://src/engine/hero.ts)
- [artifacts.ts](file://src/engine/artifacts.ts)
- [chest.ts](file://src/engine/chest.ts)
- [resurrection.ts](file://src/engine/resurrection.ts)
- [events.ts](file://src/contracts/events.ts)
- [types.ts](file://src/contracts/types.ts)
- [flags.ts](file://src/contracts/flags.ts)
- [actions.ts](file://src/state/actions.ts)
- [store.ts](file://src/state/store.ts)

**Section sources**

- [turn.ts](file://src/engine/turn.ts)
- [time.ts](file://src/engine/time.ts)
- [levels.ts](file://src/engine/levels.ts)
- [night.ts](file://src/engine/night.ts)
- [hero.ts](file://src/engine/hero.ts)
- [artifacts.ts](file://src/engine/artifacts.ts)
- [chest.ts](file://src/engine/chest.ts)
- [resurrection.ts](file://src/engine/resurrection.ts)
- [events.ts](file://src/contracts/events.ts)
- [types.ts](file://src/contracts/types.ts)
- [flags.ts](file://src/contracts/flags.ts)
- [actions.ts](file://src/state/actions.ts)
- [store.ts](file://src/state/store.ts)

## Core Components

- Turn orchestrator: coordinates start, action resolution, and end-of-turn transitions; enforces turn boundaries and ensures consistent state updates.
- Time manager: tracks day/night ticks and provides timing hooks for turn phases.
- Level manager: handles progression between levels and resets or persists per-level state.
- Night cycle: controls night-specific rules and transitions back to day.
- Hero subsystem: processes hero actions, movement, and combat within a turn.
- Artifacts and Chests: item effects and loot resolution during turns.
- Resurrection: handles death/rebirth mechanics triggered by turn events.
- Contracts (types, events, flags): define data shapes, event payloads, and feature flags governing turn behavior.
- State actions and store: dispatches immutable updates and broadcasts events to subscribers.

Key responsibilities:

- Maintain a single source of truth for turn state.
- Enforce deterministic order of operations within a turn.
- Emit typed events for cross-system reactions.
- Persist state changes via actions and store.

**Section sources**

- [turn.ts](file://src/engine/turn.ts)
- [time.ts](file://src/engine/time.ts)
- [levels.ts](file://src/engine/levels.ts)
- [night.ts](file://src/engine/night.ts)
- [hero.ts](file://src/engine/hero.ts)
- [artifacts.ts](file://src/engine/artifacts.ts)
- [chest.ts](file://src/engine/chest.ts)
- [resurrection.ts](file://src/engine/resurrection.ts)
- [events.ts](file://src/contracts/events.ts)
- [types.ts](file://src/contracts/types.ts)
- [flags.ts](file://src/contracts/flags.ts)
- [actions.ts](file://src/state/actions.ts)
- [store.ts](file://src/state/store.ts)

## Architecture Overview

The turn system follows a layered architecture:

- Input layer: user actions and system triggers queue into an action queue.
- Orchestrator: processes queued actions deterministically within a turn boundary.
- Subsystems: each subsystem encapsulates its own logic and side effects.
- State layer: central store persists state and emits events.

```mermaid
sequenceDiagram
participant UI as "UI Layer"
participant Store as "Store"
participant Actions as "Actions"
participant Turn as "Turn Orchestrator"
participant Time as "Time Manager"
participant Level as "Level Manager"
participant Night as "Night Cycle"
participant Hero as "Hero System"
participant Items as "Artifacts/Chests"
participant Res as "Resurrection"
UI->>Actions : enqueue(action)
Actions->>Store : dispatch(action)
Store-->>Turn : notify pending actions
Turn->>Turn : beginTurn()
loop Within Turn
Turn->>Time : tick()
Turn->>Hero : resolveHeroActions()
Turn->>Items : applyEffects()
Turn->>Night : checkNightTransition()
Turn->>Level : checkLevelProgression()
Turn->>Res : handleDeathRebirth()
end
Turn->>Turn : endTurn()
Turn->>Store : persist(state)
Store-->>UI : emit(events)
```

**Diagram sources**

- [turn.ts](file://src/engine/turn.ts)
- [time.ts](file://src/engine/time.ts)
- [levels.ts](file://src/engine/levels.ts)
- [night.ts](file://src/engine/night.ts)
- [hero.ts](file://src/engine/hero.ts)
- [artifacts.ts](file://src/engine/artifacts.ts)
- [chest.ts](file://src/engine/chest.ts)
- [resurrection.ts](file://src/engine/resurrection.ts)
- [actions.ts](file://src/state/actions.ts)
- [store.ts](file://src/state/store.ts)

## Detailed Component Analysis

### Turn Lifecycle and Phases

The turn lifecycle consists of discrete phases:

- Begin Turn: validate prerequisites, initialize phase-local state, and prepare subsystems.
- Action Resolution: process queued actions in a deterministic order; execute hero moves, attacks, item effects, and environmental updates.
- End Turn: finalize changes, trigger transitions (night/day, level), and broadcast events.

```mermaid
flowchart TD
Start(["Begin Turn"]) --> Validate["Validate Prerequisites"]
Validate --> InitPhase["Initialize Phase State"]
InitPhase --> ResolveActions["Resolve Queued Actions"]
ResolveActions --> CheckTransitions{"Any Transitions?"}
CheckTransitions --> |Yes| ApplyTransitions["Apply Night/Level/Death Changes"]
CheckTransitions --> |No| Finalize["Finalize Turn"]
ApplyTransitions --> Finalize
Finalize --> End(["End Turn"])
```

**Diagram sources**

- [turn.ts](file://src/engine/turn.ts)
- [time.ts](file://src/engine/time.ts)
- [levels.ts](file://src/engine/levels.ts)
- [night.ts](file://src/engine/night.ts)
- [resurrection.ts](file://src/engine/resurrection.ts)

**Section sources**

- [turn.ts](file://src/engine/turn.ts)
- [time.ts](file://src/engine/time.ts)
- [levels.ts](file://src/engine/levels.ts)
- [night.ts](file://src/engine/night.ts)
- [resurrection.ts](file://src/engine/resurrection.ts)

### Action Queue and Resolution

- Queueing: actions are enqueued from UI or system triggers and dispatched through the actions module.
- Deterministic processing: the turn orchestrator processes actions in a stable order to ensure reproducibility.
- Side effects: each action may update multiple subsystems; changes are batched until end-of-turn persistence.

```mermaid
classDiagram
class ActionQueue {
+enqueue(action)
+processNext()
+hasPending()
}
class TurnOrchestrator {
+beginTurn()
+resolveActions()
+endTurn()
}
class Store {
+dispatch(action)
+getState()
+subscribe(listener)
}
ActionQueue --> TurnOrchestrator : "feeds"
TurnOrchestrator --> Store : "reads/writes"
```

**Diagram sources**

- [actions.ts](file://src/state/actions.ts)
- [store.ts](file://src/state/store.ts)
- [turn.ts](file://src/engine/turn.ts)

**Section sources**

- [actions.ts](file://src/state/actions.ts)
- [store.ts](file://src/state/store.ts)
- [turn.ts](file://src/engine/turn.ts)

### Multi-Entity Interactions Within Turns

- Heroes: movement, combat, and ability usage are processed sequentially to avoid race conditions.
- Artifacts and Chests: item effects and loot drops are applied after hero actions to maintain order.
- Environmental updates: time ticks and night checks occur at defined intervals within the turn.

```mermaid
sequenceDiagram
participant Turn as "Turn Orchestrator"
participant Hero as "Hero System"
participant Items as "Artifacts/Chests"
participant Env as "Time/Night"
Turn->>Hero : move(heroId, target)
Turn->>Hero : attack(attacker, defender)
Turn->>Items : activateArtifact(effect)
Turn->>Items : openChest(lootTable)
Turn->>Env : tick()
Turn->>Env : checkNightTransition()
```

**Diagram sources**

- [hero.ts](file://src/engine/hero.ts)
- [artifacts.ts](file://src/engine/artifacts.ts)
- [chest.ts](file://src/engine/chest.ts)
- [time.ts](file://src/engine/time.ts)
- [night.ts](file://src/engine/night.ts)
- [turn.ts](file://src/engine/turn.ts)

**Section sources**

- [hero.ts](file://src/engine/hero.ts)
- [artifacts.ts](file://src/engine/artifacts.ts)
- [chest.ts](file://src/engine/chest.ts)
- [time.ts](file://src/engine/time.ts)
- [night.ts](file://src/engine/night.ts)
- [turn.ts](file://src/engine/turn.ts)

### State Transitions Between Turns

- Night transition: when certain thresholds are met, the system switches to night mode and applies night-specific rules.
- Level progression: upon meeting criteria (e.g., objectives completed), the next level is loaded and state is reset accordingly.
- Death and resurrection: if a hero dies during a turn, resurrection logic determines revival outcomes and subsequent state.

```mermaid
stateDiagram-v2
[*] --> Day
Day --> Night : "threshold reached"
Night --> Day : "cycle complete"
Day --> LevelUp : "objectives met"
LevelUp --> Day : "new level started"
Day --> Dead : "hero HP <= 0"
Dead --> Day : "resurrection successful"
Dead --> [*] : "game over"
```

**Diagram sources**

- [night.ts](file://src/engine/night.ts)
- [levels.ts](file://src/engine/levels.ts)
- [resurrection.ts](file://src/engine/resurrection.ts)
- [turn.ts](file://src/engine/turn.ts)

**Section sources**

- [night.ts](file://src/engine/night.ts)
- [levels.ts](file://src/engine/levels.ts)
- [resurrection.ts](file://src/engine/resurrection.ts)
- [turn.ts](file://src/engine/turn.ts)

### Integration With Other Systems

- Events: the system emits typed events for UI updates, analytics, and cross-module reactions.
- Flags: feature flags gate turn behaviors and optional subsystems.
- Mocks: test doubles enable isolated testing of turn logic without full environment setup.

```mermaid
graph LR
Turn["Turn Orchestrator"] --> Events["Events Emitter"]
Turn --> Flags["Feature Flags"]
Turn --> Store["State Store"]
Store --> UI["UI Subscribers"]
```

**Diagram sources**

- [events.ts](file://src/contracts/events.ts)
- [flags.ts](file://src/contracts/flags.ts)
- [store.ts](file://src/state/store.ts)
- [turn.ts](file://src/engine/turn.ts)

**Section sources**

- [events.ts](file://src/contracts/events.ts)
- [flags.ts](file://src/contracts/flags.ts)
- [store.ts](file://src/state/store.ts)
- [turn.ts](file://src/engine/turn.ts)

### Patterns and Best Practices

- Single Responsibility: each subsystem owns its domain logic and exposes clear interfaces.
- Deterministic Order: enforce strict sequencing to prevent non-deterministic outcomes.
- Event-Driven Updates: decouple subsystems using typed events for reactive updates.
- Immutable State: use actions and store to maintain consistent snapshots and history.

[No sources needed since this section provides general guidance]

## Dependency Analysis

The turn orchestrator depends on multiple subsystems and contracts. Understanding these dependencies helps identify coupling and potential circular references.

```mermaid
graph TB
Turn["turn.ts"] --> Time["time.ts"]
Turn --> Levels["levels.ts"]
Turn --> Night["night.ts"]
Turn --> Hero["hero.ts"]
Turn --> Artifacts["artifacts.ts"]
Turn --> Chest["chest.ts"]
Turn --> Resurrection["resurrection.ts"]
Turn --> Events["events.ts"]
Turn --> Types["types.ts"]
Turn --> Flags["flags.ts"]
Turn --> Actions["actions.ts"]
Turn --> Store["store.ts"]
```

**Diagram sources**

- [turn.ts](file://src/engine/turn.ts)
- [time.ts](file://src/engine/time.ts)
- [levels.ts](file://src/engine/levels.ts)
- [night.ts](file://src/engine/night.ts)
- [hero.ts](file://src/engine/hero.ts)
- [artifacts.ts](file://src/engine/artifacts.ts)
- [chest.ts](file://src/engine/chest.ts)
- [resurrection.ts](file://src/engine/resurrection.ts)
- [events.ts](file://src/contracts/events.ts)
- [types.ts](file://src/contracts/types.ts)
- [flags.ts](file://src/contracts/flags.ts)
- [actions.ts](file://src/state/actions.ts)
- [store.ts](file://src/state/store.ts)

**Section sources**

- [turn.ts](file://src/engine/turn.ts)
- [time.ts](file://src/engine/time.ts)
- [levels.ts](file://src/engine/levels.ts)
- [night.ts](file://src/engine/night.ts)
- [hero.ts](file://src/engine/hero.ts)
- [artifacts.ts](file://src/engine/artifacts.ts)
- [chest.ts](file://src/engine/chest.ts)
- [resurrection.ts](file://src/engine/resurrection.ts)
- [events.ts](file://src/contracts/events.ts)
- [types.ts](file://src/contracts/types.ts)
- [flags.ts](file://src/contracts/flags.ts)
- [actions.ts](file://src/state/actions.ts)
- [store.ts](file://src/state/store.ts)

## Performance Considerations

- Batch updates: group state mutations within a turn to minimize re-renders and I/O.
- Lazy evaluation: defer expensive calculations until necessary (e.g., pathfinding).
- Event throttling: coalesce frequent events to reduce UI overhead.
- Memory management: reuse objects where possible and avoid unnecessary allocations during high-frequency loops.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide

Common issues and resolutions:

- Non-deterministic outcomes: verify action ordering and ensure no concurrent modifications during resolution.
- Stuck turns: check prerequisites and validation logic; ensure transitions are reachable.
- Missing events: confirm event emission points and subscriber registration.
- State inconsistencies: inspect action dispatch sequence and store persistence.

Use tests to isolate problems:

- Turn behavior tests: validate lifecycle and transitions.
- Mock environments: simulate subsystems to reproduce edge cases.

**Section sources**

- [turn.test.ts](file://src/engine/__tests__/turn.test.ts)
- [mock.ts](file://src/contracts/mock.ts)

## Conclusion

The turn-based system provides a robust framework for managing game turns, resolving actions deterministically, and transitioning between states reliably. By adhering to clear separation of concerns, event-driven communication, and immutable state practices, the system supports complex interactions among heroes, items, and environment while maintaining performance and predictability.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

- Example scenarios:
  - Player initiates a move followed by an attack; artifacts activate post-combat; night transition occurs if threshold reached.
  - Level completion triggers level-up; new level initializes with fresh state; events propagate to UI.
- References:
  - Contract types define payload structures for events and actions.
  - Flags control optional features like advanced night mechanics or artifact chains.

[No sources needed since this section provides general guidance]
