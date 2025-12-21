/**
 * Tutorial store for managing first-login tutorial state
 * Guides new users through creating their first season, girls, cookies, and transactions
 */

export const useTutorialStore = defineStore('tutorial', () => {
  // State
  const tutorialActive = ref(false);
  const currentStep = ref<'season' | 'girls' | 'cookies' | 'transactions' | null>(null);
  const tutorialDismissed = ref(false);
  const completedSteps = ref<string[]>([]);

  // Load tutorial state from localStorage on initialization
  const loadTutorialState = () => {
    if (typeof window === 'undefined') return;
    
    const dismissed = localStorage.getItem('tutorial_dismissed');
    const completed = localStorage.getItem('tutorial_completed_steps');
    
    if (dismissed === 'true') {
      tutorialDismissed.value = true;
    }
    
    if (completed) {
      try {
        completedSteps.value = JSON.parse(completed);
      } catch {
        completedSteps.value = [];
      }
    }
  };

  // Save tutorial state to localStorage
  const saveTutorialState = () => {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('tutorial_dismissed', tutorialDismissed.value.toString());
    localStorage.setItem('tutorial_completed_steps', JSON.stringify(completedSteps.value));
  };

  // Check if tutorial should be shown
  const shouldShowTutorial = () => {
    const seasonsStore = useSeasonsStore();
    const girlsStore = useGirlsStore();
    const cookiesStore = useCookiesStore();
    const transactionsStore = useTransactionsStore();

    // Don't show if already dismissed
    if (tutorialDismissed.value) return false;

    // Show season tutorial if no seasons exist and not completed
    if (!seasonsStore.currentSeason?.id && !completedSteps.value.includes('season')) {
      return true;
    }

    // Show girls tutorial if season exists but no girls and season step completed
    if (
      seasonsStore.currentSeason?.id &&
      girlsStore.allGirls.length === 0 &&
      completedSteps.value.includes('season') &&
      !completedSteps.value.includes('girls')
    ) {
      return true;
    }

    // Show cookies tutorial if girls exist but no cookies and girls step completed
    if (
      girlsStore.allGirls.length > 0 &&
      cookiesStore.allCookies.length === 0 &&
      completedSteps.value.includes('season') &&
      completedSteps.value.includes('girls') &&
      !completedSteps.value.includes('cookies')
    ) {
      return true;
    }

    // Show transactions tutorial if cookies exist but no transactions and cookies step completed
    if (
      cookiesStore.allCookies.length > 0 &&
      transactionsStore.allTransactions.length === 0 &&
      completedSteps.value.includes('season') &&
      completedSteps.value.includes('girls') &&
      completedSteps.value.includes('cookies') &&
      !completedSteps.value.includes('transactions')
    ) {
      return true;
    }

    return false;
  };

  // Determine which step should be shown
  const determineCurrentStep = () => {
    const seasonsStore = useSeasonsStore();
    const girlsStore = useGirlsStore();
    const cookiesStore = useCookiesStore();
    const transactionsStore = useTransactionsStore();

    if (!seasonsStore.currentSeason?.id && !completedSteps.value.includes('season')) {
      return 'season';
    }

    if (
      seasonsStore.currentSeason?.id &&
      girlsStore.allGirls.length === 0 &&
      completedSteps.value.includes('season') &&
      !completedSteps.value.includes('girls')
    ) {
      return 'girls';
    }

    if (
      girlsStore.allGirls.length > 0 &&
      cookiesStore.allCookies.length === 0 &&
      completedSteps.value.includes('season') &&
      completedSteps.value.includes('girls') &&
      !completedSteps.value.includes('cookies')
    ) {
      return 'cookies';
    }

    if (
      cookiesStore.allCookies.length > 0 &&
      transactionsStore.allTransactions.length === 0 &&
      completedSteps.value.includes('season') &&
      completedSteps.value.includes('girls') &&
      completedSteps.value.includes('cookies') &&
      !completedSteps.value.includes('transactions')
    ) {
      return 'transactions';
    }

    return null;
  };

  // Start the tutorial
  const startTutorial = () => {
    loadTutorialState();
    if (shouldShowTutorial()) {
      tutorialActive.value = true;
      currentStep.value = determineCurrentStep();
    }
  };

  // Complete a step
  const completeStep = (step: string) => {
    if (!completedSteps.value.includes(step)) {
      completedSteps.value.push(step);
      saveTutorialState();
    }
    
    // Move to next step
    currentStep.value = determineCurrentStep();
    if (!currentStep.value) {
      tutorialActive.value = false;
    }
  };

  // Dismiss the tutorial
  const dismissTutorial = () => {
    tutorialDismissed.value = true;
    tutorialActive.value = false;
    currentStep.value = null;
    saveTutorialState();
  };

  // Reset tutorial (for testing or user request)
  const resetTutorial = () => {
    tutorialDismissed.value = false;
    tutorialActive.value = false;
    currentStep.value = null;
    completedSteps.value = [];
    saveTutorialState();
  };

  return {
    tutorialActive,
    currentStep,
    tutorialDismissed,
    completedSteps,
    startTutorial,
    completeStep,
    dismissTutorial,
    resetTutorial,
    shouldShowTutorial,
  };
});
