import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import CopyGirlsDialog from '@/components/settings/CopyGirlsDialog.vue';

describe('CopyGirlsDialog', () => {
  it('renders without crashing', () => {
    expect(() => {
      mount(CopyGirlsDialog, {
        props: {
          visible: false,
        },
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            Dialog: true,
            Stepper: true,
            StepList: true,
            Step: true,
            StepPanels: true,
            StepPanel: true,
            Select: true,
            Button: true,
            DataTable: true,
            Column: true,
            ProgressSpinner: true,
          },
        },
      });
    }).not.toThrow();
  });

  it('mounts successfully', () => {
    const wrapper = mount(CopyGirlsDialog, {
      props: {
        visible: false,
      },
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          Dialog: true,
          Stepper: true,
          StepList: true,
          Step: true,
          StepPanels: true,
          StepPanel: true,
          Select: true,
          Button: true,
          DataTable: true,
          Column: true,
          ProgressSpinner: true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('shows note about copying related adults', () => {
    const wrapper = mount(CopyGirlsDialog, {
      props: {
        visible: true,
      },
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          Dialog: {
            template: '<div><slot /></div>',
          },
          Select: true,
          Button: true,
          DataTable: true,
          Column: true,
          ProgressSpinner: true,
        },
      },
    });

    expect(wrapper.text()).toContain(
      'Adults related to girls that are copied will also be copied to this season',
    );
  });
});
