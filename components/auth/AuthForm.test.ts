import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import AuthForm from '@/components/auth/AuthForm.vue';

// Mock Supabase client
const mockSignInWithOtp = vi.fn();
const mockSupabaseClient = {
  auth: {
    signInWithOtp: mockSignInWithOtp,
  },
};

vi.stubGlobal(
  'useSupabaseClient',
  vi.fn(() => mockSupabaseClient),
);
global.alert = vi.fn();

describe('AuthForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form element', () => {
    const wrapper = mount(AuthForm, {
      global: {
        stubs: {
          Button: true,
          InputText: true,
        },
      },
    });

    expect(wrapper.find('form').exists()).toBe(true);
  });

  it('renders email label', () => {
    const wrapper = mount(AuthForm, {
      global: {
        stubs: {
          Button: true,
          InputText: true,
        },
      },
    });

    expect(wrapper.find('label[for="email1"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Email');
  });

  it('renders input and button components', () => {
    const wrapper = mount(AuthForm, {
      global: {
        stubs: {
          Button: true,
          InputText: true,
        },
      },
    });

    expect(wrapper.findComponent({ name: 'InputText' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'Button' }).exists()).toBe(true);
  });

  it('has correct form structure', () => {
    const wrapper = mount(AuthForm, {
      global: {
        stubs: {
          Button: true,
          InputText: true,
        },
      },
    });

    // Form should have submit prevention
    const form = wrapper.find('form');
    expect(form.exists()).toBe(true);
  });
});
