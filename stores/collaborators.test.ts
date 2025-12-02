import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import type { SeasonCollaborator } from '@/types/types';

// Import the store after setting up global mocks
import { useCollaboratorsStore } from '@/stores/collaborators';

describe('stores/collaborators', () => {
  let collaboratorsStore: ReturnType<typeof useCollaboratorsStore>;

  beforeEach(() => {
    // Create a fresh Pinia instance for each test
    setActivePinia(createPinia());

    // Set up the seasonsStore mock
    vi.stubGlobal(
      'useSeasonsStore',
      vi.fn(() => ({
        currentSeason: {
          id: 1,
          troop_number: '12345',
          year: 2024,
          profile: 'test-profile-id',
        },
      })),
    );

    // Set up the user mock
    vi.stubGlobal(
      'useSupabaseUser',
      vi.fn(() => ({ value: { id: 'test-user-id' } })),
    );

    collaboratorsStore = useCollaboratorsStore();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('state management', () => {
    it('initializes with empty arrays', () => {
      setActivePinia(createPinia());
      const freshStore = useCollaboratorsStore();

      expect(freshStore.collaborators).toEqual([]);
      expect(freshStore.activeCollaborator).toBeNull();
      expect(freshStore.collaboratorDialogVisible).toBe(false);
    });
  });

  describe('fetchCollaborators', () => {
    it('successfully fetches collaborators for a season', async () => {
      const mockCollaborators: SeasonCollaborator[] = [
        {
          id: 1,
          season_id: 1,
          profile_id: 'collaborator-id',
          invited_by: 'test-user-id',
          can_view_booths: true,
          can_edit_booths: false,
          can_view_inventory_checks: true,
          can_edit_inventory_checks: false,
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      vi.stubGlobal(
        'useSupabaseClient',
        vi.fn(() => ({
          from: vi.fn(() => ({
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() =>
                  Promise.resolve({ data: mockCollaborators, error: null }),
                ),
              })),
            })),
          })),
        })),
      );

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newCollaboratorsStore = useCollaboratorsStore();

      await newCollaboratorsStore.fetchCollaborators(1);

      expect(newCollaboratorsStore.collaborators).toEqual(mockCollaborators);
    });

    it('handles errors when fetching collaborators', async () => {
      const mockError = new Error('Failed to fetch');

      vi.stubGlobal(
        'useSupabaseClient',
        vi.fn(() => ({
          from: vi.fn(() => ({
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() =>
                  Promise.resolve({ data: null, error: mockError }),
                ),
              })),
            })),
          })),
        })),
      );

      const mockNotificationHelpers = {
        addError: vi.fn(),
        addSuccess: vi.fn(),
      };

      vi.stubGlobal(
        'useNotificationHelpers',
        vi.fn(() => mockNotificationHelpers),
      );

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newCollaboratorsStore = useCollaboratorsStore();

      await newCollaboratorsStore.fetchCollaborators(1);

      expect(mockNotificationHelpers.addError).toHaveBeenCalledWith(mockError);
      expect(newCollaboratorsStore.collaborators).toEqual([]);
    });
  });

  describe('addCollaborator', () => {
    it('successfully adds a collaborator', async () => {
      const mockCollaborator: SeasonCollaborator = {
        id: 1,
        season_id: 1,
        profile_id: 'new-collaborator-id',
        invited_by: 'test-user-id',
        can_view_booths: true,
        can_edit_booths: false,
        can_view_inventory_checks: false,
        can_edit_inventory_checks: false,
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({ data: mockCollaborator, error: null }),
          ),
        })),
      }));

      vi.stubGlobal(
        'useSupabaseClient',
        vi.fn(() => ({
          from: vi.fn(() => ({
            insert: mockInsert,
          })),
        })),
      );

      const mockNotificationHelpers = {
        addError: vi.fn(),
        addSuccess: vi.fn(),
      };

      vi.stubGlobal(
        'useNotificationHelpers',
        vi.fn(() => mockNotificationHelpers),
      );

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newCollaboratorsStore = useCollaboratorsStore();

      const result = await newCollaboratorsStore.addCollaborator(
        'new-collaborator-id',
        1,
        {
          can_view_booths: true,
          can_edit_booths: false,
          can_view_inventory_checks: false,
          can_edit_inventory_checks: false,
        },
      );

      expect(result).toEqual(mockCollaborator);
      expect(mockNotificationHelpers.addSuccess).toHaveBeenCalledWith(
        'Collaborator added successfully',
      );
    });
  });

  describe('dialog management', () => {
    it('shows and hides dialog correctly', () => {
      expect(collaboratorsStore.collaboratorDialogVisible).toBe(false);

      collaboratorsStore.showDialog();
      expect(collaboratorsStore.collaboratorDialogVisible).toBe(true);

      collaboratorsStore.hideDialog();
      expect(collaboratorsStore.collaboratorDialogVisible).toBe(false);
      expect(collaboratorsStore.activeCollaborator).toBeNull();
    });

    it('sets and clears active collaborator', () => {
      const mockCollaborator: SeasonCollaborator = {
        id: 1,
        season_id: 1,
        profile_id: 'collaborator-id',
        invited_by: 'test-user-id',
        can_view_booths: true,
        can_edit_booths: false,
        can_view_inventory_checks: true,
        can_edit_inventory_checks: false,
        created_at: '2024-01-01T00:00:00Z',
      };

      collaboratorsStore.setActiveCollaborator(mockCollaborator);
      expect(collaboratorsStore.activeCollaborator).toEqual(mockCollaborator);

      collaboratorsStore.setActiveCollaborator(null);
      expect(collaboratorsStore.activeCollaborator).toBeNull();
    });
  });
});
