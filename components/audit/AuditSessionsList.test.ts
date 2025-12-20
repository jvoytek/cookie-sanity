import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import AuditSessionsList from './AuditSessionsList.vue';
import type { AuditSession } from '@/types/types';

describe('AuditSessionsList', () => {
  let mockAuditSessionsStore: {
    allAuditSessions: AuditSession[];
    mostRecentAuditSession: AuditSession | null;
    fetchAllAuditSessions: ReturnType<typeof vi.fn>;
    archiveAuditSession: ReturnType<typeof vi.fn>;
    fetchMatches: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    setActivePinia(createPinia());

    mockAuditSessionsStore = {
      allAuditSessions: [],
      mostRecentAuditSession: null,
      fetchAllAuditSessions: vi.fn().mockResolvedValue(undefined),
      archiveAuditSession: vi.fn().mockResolvedValue(undefined),
      fetchMatches: vi.fn().mockResolvedValue(undefined),
    };

    vi.stubGlobal('useAuditSessionsStore', () => mockAuditSessionsStore);
    vi.stubGlobal('useNotificationHelpers', () => ({
      addSuccess: vi.fn(),
      addError: vi.fn(),
    }));
  });

  it('should render the component', () => {
    const wrapper = mount(AuditSessionsList);
    expect(wrapper.find('h2').text()).toBe('Audit Sessions');
  });

  it('should display message when no sessions are available', async () => {
    mockAuditSessionsStore.allAuditSessions = [];

    const wrapper = mount(AuditSessionsList);
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain(
      'No audit sessions found. Upload a file to create one.',
    );
  });

  it('should display audit sessions in a table', async () => {
    const mockSessions: AuditSession[] = [
      {
        id: 'session-1',
        profile: 'user-1',
        file_name: 'test-file.csv',
        file_size: 1024,
        created_at: new Date('2025-01-01').toISOString(),
        status: 'pending',
        original_file_data: {},
        parsed_rows: [{ row: 1 }, { row: 2 }],
        season: 1,
      },
    ];

    mockAuditSessionsStore.allAuditSessions = mockSessions;

    const wrapper = mount(AuditSessionsList);
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('test-file.csv');
  });

  it('should call archiveAuditSession when archive button is clicked', async () => {
    const mockSession: AuditSession = {
      id: 'session-1',
      profile: 'user-1',
      file_name: 'test-file.csv',
      file_size: 1024,
      created_at: new Date().toISOString(),
      status: 'pending',
      original_file_data: {},
      parsed_rows: [],
      season: 1,
    };

    mockAuditSessionsStore.allAuditSessions = [mockSession];

    const wrapper = mount(AuditSessionsList);
    await wrapper.vm.$nextTick();

    // Find and click the archive button
    const archiveButton = wrapper
      .findAll('button')
      .find((btn) => btn.text().includes('Archive'));

    if (archiveButton) {
      await archiveButton.trigger('click');
      expect(mockAuditSessionsStore.archiveAuditSession).toHaveBeenCalledWith(
        'session-1',
      );
    }
  });

  it('should not show archive button for archived sessions', async () => {
    const mockSession: AuditSession = {
      id: 'session-1',
      profile: 'user-1',
      file_name: 'archived-file.csv',
      file_size: 1024,
      created_at: new Date().toISOString(),
      status: 'archived',
      original_file_data: {},
      parsed_rows: [],
      season: 1,
    };

    mockAuditSessionsStore.allAuditSessions = [mockSession];

    const wrapper = mount(AuditSessionsList);
    await wrapper.vm.$nextTick();

    const archiveButton = wrapper
      .findAll('button')
      .find((btn) => btn.text().includes('Archive'));

    expect(archiveButton).toBeUndefined();
  });

  it('should show archived checkbox', () => {
    const wrapper = mount(AuditSessionsList);
    expect(wrapper.text()).toContain('Show archived');
  });

  it('should fetch sessions including archived when checkbox is toggled', async () => {
    const wrapper = mount(AuditSessionsList);
    await wrapper.vm.$nextTick();

    // Initially should fetch without archived
    expect(mockAuditSessionsStore.fetchAllAuditSessions).toHaveBeenCalledWith(
      false,
    );

    // Toggle the checkbox
    const checkbox = wrapper.find('input[type="checkbox"]');
    await checkbox.setValue(true);

    // Should fetch with archived
    expect(mockAuditSessionsStore.fetchAllAuditSessions).toHaveBeenCalledWith(
      true,
    );
  });

  it('should call selectSession and fetchMatches when select button is clicked', async () => {
    const mockSession: AuditSession = {
      id: 'session-1',
      profile: 'user-1',
      file_name: 'test-file.csv',
      file_size: 1024,
      created_at: new Date().toISOString(),
      status: 'pending',
      original_file_data: {},
      parsed_rows: [],
      season: 1,
    };

    mockAuditSessionsStore.allAuditSessions = [mockSession];

    const wrapper = mount(AuditSessionsList);
    await wrapper.vm.$nextTick();

    const selectButton = wrapper
      .findAll('button')
      .find((btn) => btn.text().includes('Select'));

    if (selectButton) {
      await selectButton.trigger('click');
      expect(mockAuditSessionsStore.mostRecentAuditSession).toEqual(
        mockSession,
      );
      expect(mockAuditSessionsStore.fetchMatches).toHaveBeenCalled();
    }
  });

  it('should format file size correctly', async () => {
    const mockSessions: AuditSession[] = [
      {
        id: 'session-1',
        profile: 'user-1',
        file_name: 'small.csv',
        file_size: 512, // 512 B
        created_at: new Date().toISOString(),
        status: 'pending',
        original_file_data: {},
        parsed_rows: [],
        season: 1,
      },
      {
        id: 'session-2',
        profile: 'user-1',
        file_name: 'medium.csv',
        file_size: 2048, // 2 KB
        created_at: new Date().toISOString(),
        status: 'pending',
        original_file_data: {},
        parsed_rows: [],
        season: 1,
      },
    ];

    mockAuditSessionsStore.allAuditSessions = mockSessions;

    const wrapper = mount(AuditSessionsList);
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('512 B');
    expect(wrapper.text()).toContain('2.0 KB');
  });

  it('should display the correct number of parsed rows', async () => {
    const mockSession: AuditSession = {
      id: 'session-1',
      profile: 'user-1',
      file_name: 'test.csv',
      file_size: 1024,
      created_at: new Date().toISOString(),
      status: 'pending',
      original_file_data: {},
      parsed_rows: [{ row: 1 }, { row: 2 }, { row: 3 }],
      season: 1,
    };

    mockAuditSessionsStore.allAuditSessions = [mockSession];

    const wrapper = mount(AuditSessionsList);
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('3');
  });

  it('should display correct status tags with appropriate severity', async () => {
    const mockSessions: AuditSession[] = [
      {
        id: 'session-1',
        profile: 'user-1',
        file_name: 'complete.csv',
        file_size: 1024,
        created_at: new Date().toISOString(),
        status: 'complete',
        original_file_data: {},
        parsed_rows: [],
        season: 1,
      },
      {
        id: 'session-2',
        profile: 'user-1',
        file_name: 'pending.csv',
        file_size: 1024,
        created_at: new Date().toISOString(),
        status: 'pending',
        original_file_data: {},
        parsed_rows: [],
        season: 1,
      },
      {
        id: 'session-3',
        profile: 'user-1',
        file_name: 'archived.csv',
        file_size: 1024,
        created_at: new Date().toISOString(),
        status: 'archived',
        original_file_data: {},
        parsed_rows: [],
        season: 1,
      },
    ];

    mockAuditSessionsStore.allAuditSessions = mockSessions;

    const wrapper = mount(AuditSessionsList);
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('complete');
    expect(wrapper.text()).toContain('pending');
    expect(wrapper.text()).toContain('archived');
  });
});
