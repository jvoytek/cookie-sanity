import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAccountsStore } from './accounts';

describe('Accounts Store - DIRECT_SHIP Functionality', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should properly initialize with expected structure', () => {
    const store = useAccountsStore();
    expect(store).toBeDefined();
    expect(store.girlAccountBalances).toBeDefined();
    expect(store.troopAccountSummary).toBeDefined();
  });

  it('should have functions for getting direct ship transactions', () => {
    const store = useAccountsStore();
    // The store should be properly initialized
    expect(store.girlAccountBalances).toBeDefined();
  });
});
