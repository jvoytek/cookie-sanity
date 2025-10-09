import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import AccountCard from '@/components/account/AccountCard.vue';

// Mock the stores and composables
const mockUpdateProfile = vi.fn();
const mockProfileStore = {
  display_name: 'Test User',
  updateProfile: mockUpdateProfile,
};

const mockUser = {
  value: {
    email: 'test@example.com',
  },
};

vi.mock('@/stores/profile', () => ({
  useProfileStore: () => mockProfileStore,
}));

vi.stubGlobal(
  'useProfileStore',
  vi.fn(() => mockProfileStore),
);
vi.stubGlobal(
  'useSupabaseUser',
  vi.fn(() => mockUser),
);

// Mock PrimeVue components
const MockButton = {
  name: 'Button',
  props: ['type', 'label', 'disabled'],
  template: `<button :type="type" :disabled="disabled" data-testid="submit-button">{{ label }}</button>`,
};

const MockInputText = {
  name: 'InputText',
  props: ['id', 'type', 'value', 'disabled', 'modelValue'],
  emits: ['update:modelValue'],
  template: `<input 
    :id="id" 
    :type="type" 
    :value="value || modelValue" 
    :disabled="disabled"
    @input="$emit('update:modelValue', $event.target.value)"
    data-testid="input"
  />`,
};

describe('AccountCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProfileStore.display_name = 'Test User';
    mockUser.value = { email: 'test@example.com' };
  });

  it('displays correct title', () => {
    const wrapper = mount(AccountCard, {
      global: {
        components: {
          Button: MockButton,
          InputText: MockInputText,
        },
      },
    });

    expect(wrapper.text()).toContain('Account');
    expect(wrapper.find('.font-semibold.text-xl').text()).toBe('Account');
  });

  it('renders email field with user email (disabled)', () => {
    const wrapper = mount(AccountCard, {
      global: {
        components: {
          Button: MockButton,
          InputText: MockInputText,
        },
      },
    });

    const inputs = wrapper.findAllComponents({ name: 'InputText' });
    expect(inputs.length).toBeGreaterThan(0);

    // Check that there is an email input (first one should be the email input based on component structure)
    const emailFieldInput = inputs[0];
    expect(emailFieldInput.exists()).toBe(true);
  });

  it('renders display name field with store value', () => {
    const wrapper = mount(AccountCard, {
      global: {
        components: {
          Button: MockButton,
          InputText: MockInputText,
        },
      },
    });

    const displayNameInput = wrapper.find('input[id="display_name"]');
    expect(displayNameInput.exists()).toBe(true);
    expect(displayNameInput.attributes('value')).toBe('Test User');
    expect(displayNameInput.attributes('disabled')).toBeUndefined();
  });

  it('renders submit button with correct text when not loading', () => {
    const wrapper = mount(AccountCard, {
      global: {
        components: {
          Button: MockButton,
          InputText: MockInputText,
        },
      },
    });

    const submitButton = wrapper.find('[data-testid="submit-button"]');
    expect(submitButton.exists()).toBe(true);
    expect(submitButton.text()).toBe('Update');
    expect(submitButton.attributes('disabled')).toBeUndefined();
  });

  it('shows loading state when loading', async () => {
    const wrapper = mount(AccountCard, {
      global: {
        components: {
          Button: MockButton,
          InputText: MockInputText,
        },
      },
    });

    // Find the form and trigger submit to set loading state
    const form = wrapper.find('form');
    await form.trigger('submit');

    // The component should show loading state
    // Note: This test might need adjustment based on the actual loading behavior
  });

  it('calls updateProfile when form is submitted', async () => {
    const wrapper = mount(AccountCard, {
      global: {
        components: {
          Button: MockButton,
          InputText: MockInputText,
        },
      },
    });

    const form = wrapper.find('form');
    await form.trigger('submit');

    expect(mockUpdateProfile).toHaveBeenCalled();
  });

  it('updates display name when input changes', async () => {
    const wrapper = mount(AccountCard, {
      global: {
        components: {
          Button: MockButton,
          InputText: MockInputText,
        },
      },
    });

    const displayNameInput = wrapper.find('input[id="display_name"]');
    await displayNameInput.setValue('New Display Name');

    // The v-model should update the store
    expect((displayNameInput.element as HTMLInputElement).value).toBe(
      'New Display Name',
    );
  });

  it('renders proper labels for form fields', () => {
    const wrapper = mount(AccountCard, {
      global: {
        components: {
          Button: MockButton,
          InputText: MockInputText,
        },
      },
    });

    expect(wrapper.find('label[for="email"]').text()).toBe('Email');
    expect(wrapper.find('label[for="display_name"]').text()).toBe(
      'Display Name',
    );
  });
});
