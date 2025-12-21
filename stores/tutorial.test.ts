import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

// Import the store after setting up global mocks in setup.ts
import { useTutorialStore } from '@/stores/tutorial';

describe('stores/tutorial', () => {
  let tutorialStore: ReturnType<typeof useTutorialStore>;

  beforeEach(() => {
    // Create a fresh Pinia instance for each test
    setActivePinia(createPinia());

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    vi.stubGlobal('localStorage', localStorageMock);

    // Set up store mocks
    vi.stubGlobal(
      'useSeasonsStore',
      vi.fn(() => ({
        currentSeason: { id: 1 },
        allSeasons: [{ id: 1 }],
      })),
    );

    vi.stubGlobal(
      'useGirlsStore',
      vi.fn(() => ({
        allGirls: [],
      })),
    );

    vi.stubGlobal(
      'useCookiesStore',
      vi.fn(() => ({
        allCookies: [],
      })),
    );

    vi.stubGlobal(
      'useTransactionsStore',
      vi.fn(() => ({
        allTransactions: [],
      })),
    );

    tutorialStore = useTutorialStore();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('state management', () => {
    it('initializes with default state', () => {
      expect(tutorialStore.tutorialActive).toBe(false);
      expect(tutorialStore.currentStep).toBeNull();
      expect(tutorialStore.tutorialDismissed).toBe(false);
      expect(tutorialStore.completedSteps).toEqual([]);
    });
  });

  describe('dismissTutorial', () => {
    it('dismisses the tutorial and saves to localStorage', () => {
      tutorialStore.dismissTutorial();

      expect(tutorialStore.tutorialDismissed).toBe(true);
      expect(tutorialStore.tutorialActive).toBe(false);
      expect(tutorialStore.currentStep).toBeNull();
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'tutorial_dismissed',
        'true',
      );
    });
  });

  describe('completeStep', () => {
    it('adds step to completed steps', () => {
      tutorialStore.completeStep('season');

      expect(tutorialStore.completedSteps).toContain('season');
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'tutorial_completed_steps',
        JSON.stringify(['season']),
      );
    });

    it('does not add duplicate steps', () => {
      tutorialStore.completeStep('season');
      tutorialStore.completeStep('season');

      expect(tutorialStore.completedSteps).toEqual(['season']);
    });
  });

  describe('resetTutorial', () => {
    it('resets tutorial state and clears localStorage', () => {
      tutorialStore.completeStep('season');
      tutorialStore.dismissTutorial();

      tutorialStore.resetTutorial();

      expect(tutorialStore.tutorialDismissed).toBe(false);
      expect(tutorialStore.tutorialActive).toBe(false);
      expect(tutorialStore.currentStep).toBeNull();
      expect(tutorialStore.completedSteps).toEqual([]);
    });
  });

  describe('shouldShowTutorial', () => {
    it('returns false when tutorial is dismissed', () => {
      tutorialStore.dismissTutorial();

      const result = tutorialStore.shouldShowTutorial();

      expect(result).toBe(false);
    });

    it('returns true when no seasons exist and season not completed', () => {
      vi.stubGlobal(
        'useSeasonsStore',
        vi.fn(() => ({
          currentSeason: null,
          allSeasons: [],
        })),
      );

      // Recreate store with new mocks
      setActivePinia(createPinia());
      const freshStore = useTutorialStore();

      const result = freshStore.shouldShowTutorial();

      expect(result).toBe(true);
    });
  });
});
