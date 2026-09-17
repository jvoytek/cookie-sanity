import { describe, expect, it } from 'vitest';
import { formatPersonDisplayName } from '@/shared/utils/personDisplay';

describe('formatPersonDisplayName', () => {
  it('appends pronouns when present', () => {
    expect(
      formatPersonDisplayName({
        first_name: 'Suzzie',
        last_name: 'Anderson',
        pronouns: 'she/her',
      }),
    ).toBe('Suzzie Anderson (she/her)');
  });

  it('omits blank pronouns', () => {
    expect(
      formatPersonDisplayName({
        first_name: 'Suzzie',
        last_name: 'Anderson',
        pronouns: '   ',
      }),
    ).toBe('Suzzie Anderson');
  });

  it('supports preferred name display modes', () => {
    const person = {
      first_name: 'Susan',
      last_name: 'Anderson',
      preferred_name: 'Suzzie',
      pronouns: 'she/her',
    };

    expect(
      formatPersonDisplayName(person, { includePreferredName: true }),
    ).toBe('Susan (Suzzie) Anderson (she/her)');
    expect(formatPersonDisplayName(person, { usePreferredName: true })).toBe(
      'Suzzie Anderson (she/her)',
    );
  });
});
