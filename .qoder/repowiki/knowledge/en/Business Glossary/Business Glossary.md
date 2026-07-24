---
kind: business_term
name: Business Glossary
category: business_term
scope:
  - '**'
---

### 8bit Sleep

- Definition：The project name and product: a pixel-art tamagotchi-style game where your hero stays alive only while you sleep. Seven hearts represent seven days of the week; bad nights deal damage, zero HP means death with one resurrection attempt per week, and a perfect week yields a level-up plus loot chest.
- Aliases：8bit-sleep

### night line

- Definition：A configurable bedtime/wake schedule expressed as a time-of-day string (e.g. '23:00'/'07:00'). Used throughout the system for scheduling reminders and calculating sleep windows.
- Aliases：bedtime line、sleep window

### check-in

- Definition：The user action of confirming they went to bed and woke up, recorded through the sleep/awake buttons. Must follow a strict sequential pattern (bed → wake → evaluate); re-entrant taps during screen transitions can cause phantom MISSED nights.
- Aliases：bed check-in、wake check-in

### phantom night

- Definition：A spurious night record created when a second tap lands during the ~300 ms screen transition after waking, causing `wakeNow()` to fire again with stale closure state and recording a missed night that should not exist.
- Aliases：phantom MISSED night

### perfect week

- Definition：Achieving seven consecutive PERFECT night outcomes (no damage taken), which triggers a level-up and a loot chest reward in the game loop.
- Aliases：PERFECT WEEK

### hero persona

- Definition：The rotating set of hero character types (druid, knight, mage, monk, ninja, paladin, ranger, rogue, warlock) each with walk animations and gold variants, used for visual variety in the game and e-ink cards.
- Aliases：hero class、hero type

### resurrection

- Definition：A one-time-per-week mechanic allowing the player to revive their hero after death (0 HP), followed by a resurrection mini-game. After resurrection, the hero continues with reduced HP.
- Aliases：revive

### demo mode

- Definition：A hidden feature activated by a 5-tap gesture on the Settings version label, exposing a floating panel with [PERFECT] [BAD] [DEATH] [RESET] buttons that run nights through the real store (true morning-scene/death flow). [RESET] restores the pre-demo snapshot.
- Aliases：DemoPanel

### E-ink widgets

- Definition：Two Dot Quote/0 cards pushed from the phone: a hero card (296×152 pixel-perfect B&W image) and a stats card (text showing last night outcome, perfect week streak, and perfect rate). Pushed via `scheduleEinkPush` with 5 s debounce.
- Aliases：Dot cards、e-ink cards

### booth insurance

- Definition：Fallback procedure for when the Dot API misbehaves at the hackathon booth: push a static card from a laptop using the documented curl command against the Dot API endpoint.
- Aliases：fallback card push
