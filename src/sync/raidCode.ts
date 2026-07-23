/**
 * Raid invite codes (P2): 6 chars from an unambiguous alphabet —
 * no 0/O and no 1/I, so codes survive being read off a screen aloud.
 */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const RAID_CODE_LENGTH = 6

export function generateRaidCode(rng: () => number = Math.random): string {
  let code = ''
  for (let i = 0; i < RAID_CODE_LENGTH; i += 1) {
    code += ALPHABET[Math.floor(rng() * ALPHABET.length) % ALPHABET.length]
  }
  return code
}

export function isValidRaidCode(code: string): boolean {
  return code.length === RAID_CODE_LENGTH && [...code].every((ch) => ALPHABET.includes(ch))
}
