/**
 * Health auto-detection spike (FLAGS.healthSync, P1, timeboxed 4 h) — CUT.
 *
 * Written note (the deliverable PROMPT D asks for when the spike fails):
 * - iOS HealthKit (react-native-health) and Android Health Connect both need
 *   native modules + platform entitlements/permissions → a custom dev build.
 *   The hackathon demo must run in the store Expo Go (AGENTS.md rule 7 locks
 *   the SDK to Expo Go), where these modules cannot load at all.
 * - Spec §2.4 declares the manual check-in an honor-system FEATURE for the
 *   hackathon ("игра, а не полиграф") — auto-detection is optional depth.
 * - The 4 h timebox is better spent on the e-ink module (the booth wow).
 * Decision: manual check-in stays. Post-hackathon revival path: dev-client
 * build with HealthKit entitlement / Health Connect permission, read the
 * asleep stages overlapping [bedMin, wakeMin] and pre-fill the check-ins.
 */
import { FLAGS } from '../contracts/flags';

/** Always null while the feature is cut — the engine keeps manual check-ins. */
export async function readLastNightSleep(): Promise<null> {
  if (!FLAGS.healthSync) {
    return null;
  }
  return null;
}
