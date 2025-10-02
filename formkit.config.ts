import type { DefaultConfigOptions } from '@formkit/vue';
import { primeInputs, primeOutputs } from '@sfxcode/formkit-primevue';

const config: DefaultConfigOptions = {
  // Define the active locale
  inputs: { ...primeInputs, ...primeOutputs },
};

export default config;
