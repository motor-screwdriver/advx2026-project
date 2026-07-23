import { parseDeviceId } from '../einkConfig';

describe('parseDeviceId', () => {
  it('extracts the ID from a full Quote NFC link', () => {
    expect(parseDeviceId('https://dot.mindreset.tech/clip/quote/0/2/7CE8B17A3FCC')).toBe(
      '7CE8B17A3FCC',
    );
  });

  it('ignores query strings and trailing slashes', () => {
    expect(parseDeviceId('https://dot.mindreset.tech/clip/quote/0/2/ABC123/?x=1')).toBe('ABC123');
  });

  it('passes a raw device ID through, trimmed', () => {
    expect(parseDeviceId('  7CE8B17A3FCC  ')).toBe('7CE8B17A3FCC');
  });
});
