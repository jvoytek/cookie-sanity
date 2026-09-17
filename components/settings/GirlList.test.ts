import { describe, it, expect, vi, beforeEach } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { mount } from '@vue/test-utils';
import GirlList from '@/components/settings/GirlList.vue';

vi.mock('@formkit/vue', () => ({
  useFormKitNodeById: () =>
    ref({
      submit: vi.fn(),
    }),
}));

vi.mock('@/shared/utils/personDisplay', () => ({
  formatPersonDisplayName: (person: {
    first_name?: string;
    last_name?: string;
    preferred_name?: string | null;
  }) =>
    `${person.preferred_name ?? person.first_name ?? ''} ${person.last_name ?? ''}`.trim(),
}));

const MockDataTable = defineComponent({
  name: 'DataTable',
  template: '<div><slot name="header" /><slot /></div>',
});

const MockColumn = defineComponent({
  name: 'Column',
  props: {
    header: {
      type: String,
      default: '',
    },
  },
  template: '<div>{{ header }}</div>',
});

const MockFormKit = defineComponent({
  name: 'FormKit',
  template: '<form><slot /></form>',
});

const MockFormKitSchema = defineComponent({
  name: 'FormKitSchema',
  props: {
    schema: {
      type: Array,
      default: () => [],
    },
  },
  setup(props) {
    return () =>
      h(
        'div',
        props.schema.map((field: { label?: string; name?: string }) =>
          h('span', `${field.label ?? field.name}`),
        ),
      );
  },
});

describe('GirlList', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.stubGlobal('useGirlsStore', () => ({
      allGirls: [
        {
          id: 1,
          first_name: 'Alice',
          last_name: 'Smith',
          preferred_name: 'Allie',
          program_level: 'brownie',
          email: 'alice@example.com',
          forms: [],
          season: 1,
          profile: 'test-profile-id',
        },
      ],
      upsertGirl: vi.fn(),
      insertGirl: vi.fn(),
      deleteGirl: vi.fn(),
    }));

    vi.stubGlobal('useAdultsStore', () => ({
      allAdults: [],
    }));

    vi.stubGlobal('useFormsStore', () => ({
      girlFormOptions: [],
      requiredGirlForms: [],
      allForms: [],
    }));

    vi.stubGlobal('useEventsStore', () => ({
      getRequiredFormsForEventsForGirl: vi.fn(() => []),
    }));

    vi.stubGlobal('useSeasonsStore', () => ({
      currentSeason: {
        id: 1,
        publish_girl_request_form: false,
      },
      allSeasons: [{ id: 1 }],
      upsertSeason: vi.fn(),
      fetchSeasons: vi.fn(),
    }));

    vi.stubGlobal('useRoute', () => ({
      path: '/girls',
      query: {},
    }));

    vi.stubGlobal('useRouter', () => ({
      push: vi.fn(),
      replace: vi.fn(),
    }));

    vi.stubGlobal('useMobileContact', () => ({
      callNumber: vi.fn(),
      textNumber: vi.fn(),
      emailAddress: vi.fn(),
    }));
  });

  it('renders program level in the desktop column, mobile view, and dialog schema', () => {
    const wrapper = mount(GirlList, {
      global: {
        stubs: {
          Toolbar: true,
          Button: true,
          IconField: true,
          InputIcon: true,
          InputText: true,
          ToggleSwitch: true,
          DataTable: MockDataTable,
          Column: MockColumn,
          Menu: true,
          Message: true,
          Dialog: {
            template: '<div><slot /><slot name="footer" /></div>',
          },
          FormKit: MockFormKit,
          FormKitSchema: MockFormKitSchema,
          CopyGirlsDialog: true,
        },
        directives: {
          tooltip: () => {},
        },
      },
    });

    expect(wrapper.text()).toContain('Program Level');
    expect(wrapper.text()).toContain('Program Level: Brownie');
  });
});
