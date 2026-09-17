import type { Girl } from '@/types/types';

export function useProgramLevelDisplay() {
  const programLevelOptions = [
    { label: 'Daisy', value: 'daisy' },
    { label: 'Brownie', value: 'brownie' },
    { label: 'Junior', value: 'junior' },
    { label: 'Cadette', value: 'cadette' },
    { label: 'Senior', value: 'senior' },
    { label: 'Ambassador', value: 'ambassador' },
  ] as const;

  const getProgramLevelLabel = (programLevel: Girl['program_level']) => {
    return (
      programLevelOptions.find((option) => option.value === programLevel)
        ?.label ?? '—'
    );
  };

  const programLevelClassMap: Record<string, string> = {
    daisy:
      'w-4 h-4 inline-flex items-center justify-center text-white bg-sky-400 rounded-full mr-1 text-xs',
    brownie:
      'w-4 h-4 inline-flex items-center justify-center text-white bg-yellow-800 rounded-full mr-1 text-xs',
    junior:
      'w-4 h-4 inline-flex items-center justify-center text-white bg-emerald-500 rounded-full mr-1 text-xs',
    cadette:
      'w-4 h-4 inline-flex items-center justify-center text-white bg-red-600 rounded-full mr-1 text-xs',
    senior:
      'w-4 h-4 inline-flex items-center justify-center text-white bg-amber-400 rounded-full mr-1 text-xs',
    ambassador:
      'w-4 h-4 inline-flex items-center justify-center text-white bg-yellow-300 rounded-full mr-1 text-xs',
  };

  return {
    programLevelOptions,
    getProgramLevelLabel,
    programLevelClassMap,
  };
}
