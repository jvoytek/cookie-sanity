# Cookie Sanity

Cookie Sanity is a volunteer-built app designed to simplify and streamline the chaos of cookie season. The tools provided by GSUSA, the cookie bakers and local councils are confusing, overly complicated, and missing key features that volunteers have been requesting for years. Cookie Sanity fills in those gaps.

This app solves real, everyday problems that troop leaders, troop cookie managers, and parents face—like unclear inventory tracking, poor user interfaces, missing reports, and inventory forecasting. Cookie Sanity replaces your personal spreadsheets, with a clean, intuitive interface that’s actually built for the way volunteers work.

By eliminating frustration and making cookie management faster and easier, Cookie Sanity gives volunteers back what they need most: time and peace of mind. It helps troops stay organized, reduces errors, and makes the cookie season less stressful and more successful—for everyone.

You've found the public repository of source code for this project. If you would like to contribute to the project please read on. If you're looking for the app to use for your cookie season please check back in December 2025 when we hope to launch.

Other things to include:

- **Technology stack**: Vue.js (with Nuxt), Tailwind CSS, PrimeVue, Node.js, and Supabase
- **Status**: Alpha 0.0.1 We're just getting started, join us!
- **Links to production or demo instances**
- Once we make it to a Beta version a demo and/or link to live site will go here.

## Prerequisites

- [git](https://git-scm.com/)
- [NodeJs](https://nodejs.org/en)
- A container runtime compatible with Docker APIs [Take a look at the Supabase Local Development Guide for some options](https://supabase.com/docs/guides/local-development)

## Installation

1. **Clone this repository**

   ```console
   $ git clone https://github.com/jvoytek/cookie-sanity
   $ cd cookie-sanity
   ```

2. **Install depenencies**
   
   This includes Supabase and Nuxt and other required node packages.

   ```bash
   npm install
   ```

3. **Start Supabase locally**

   ```bash
   npx supabase start
   ```

   This will start Supabase services on `http://localhost:54321` Supabase Studio on `http://localhost:54323`, and MailPit on `http://localhost:54324/`

4. **Configure environment variables**

   1. Get your local anon key from Supabase Studio (`http://localhost:54323/project/_/settings/api`).
   2. Create a new file called `.env.local` using vim:

   ```bash
   vim .env.local
   ```

   3. Enter Insert Mode
      Press `i` to enter **insert mode**.
   4. Add the following lines:

   ```env
   SUPABASE_URL=http://localhost:54321
   SUPABASE_ANON_KEY=your-local-anon-key
   ```

   5. Exit Insert Mode

   Press `Esc` to return to normal mode.

   6. Save and Quit

   Type the following and press `Enter`:

   ```vim
   :wq
   ```

5. **Seed the DB with some testing data** (optional)
   
   Rename `supabase/seed_RENAME_TO_USE.sql` to `supabase/seed.sql`

   ```bash
   mv supabase/seed_RENAME_TO_USE.sql supabase/seed.sql
   ```

6. **Reset Database with latest migration**
   
   If you renamed the seed file in the last step this will also load testing data.

   ```bash
   npx supabase db reset
   ```

7. **Start the development server on `http://localhost:3000`**
   
   ```bash
   npm run dev-local
   ```

## Usage

**Lint your code**

```bash
npm run lint
```

**Reset Supabase DB to latest migration**

This will also load seed data if you have a supabase/seed.sql file.

```bash
npx supabase db reset
```

**Build the application for production**

```bash
npm run build
```

**Locally preview production build**

```bash
npm run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## How to test the software

Cookie Sanity includes unit tests using Vitest, a fast and modern testing framework with excellent Vue.js support.

### Running Tests

**Run all tests:**
```bash
npm test
```

**Run tests in watch mode:**
```bash
npm run test:watch
```

**Run tests with coverage:**
```bash
npm run test:coverage
```

### Test Structure

The test suite includes:

- **Unit Tests** (`tests/unit/`): Test individual functions, utilities, and Vue components
  - `helpers.test.ts`: Tests for utility functions like currency formatting, calculations, and email validation
  - `component.test.ts`: Example Vue component tests demonstrating the testing capabilities

### Test Dependencies

The testing setup includes:
- **Vitest**: Modern testing framework with excellent Vue support
- **@vue/test-utils**: Vue component testing utilities
- **@vitejs/plugin-vue**: Vue support for Vite/Vitest
- **happy-dom**: Lightweight DOM implementation for testing

### Writing Tests

When adding new features, include appropriate tests:

1. **Unit tests** for utility functions, business logic, and data transformations
2. **Component tests** for Vue components and their behavior
3. **Integration tests** for connected functionality

Example unit test:
```typescript
import { describe, it, expect } from 'vitest'
import { calculateTotal } from '../../utils/helpers'

describe('calculateTotal', () => {
  it('calculates correct total', () => {
    expect(calculateTotal(5, 4.00)).toBe(20.00)
  })
})
```

Example component test:
```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MyComponent from '~/components/MyComponent.vue'

describe('MyComponent', () => {
  it('renders correctly', () => {
    const wrapper = mount(MyComponent)
    expect(wrapper.text()).toContain('Expected text')
  })
})
```

### Testing Environment

Tests run in a fast, isolated environment that:
- Uses happy-dom for DOM simulation
- Supports Vue 3 component mounting and testing
- Includes TypeScript support
- Provides comprehensive assertion capabilities
- Supports async/await patterns

### Future Enhancements

The testing framework is set up to support:
- End-to-end testing with Playwright (planned)
- Visual regression testing (planned)
- Component integration testing with Nuxt runtime (planned)

## TODO: Known issues

Document any known significant shortcomings with the software.

## Getting help

If you have questions, concerns, bug reports, etc, please file an issue in this repository's Issue Tracker.

## Getting involved

We are just getting started, but we need all the help we can get. We're looking for help with feature, UI/UX and software development, deployment, and getting the word out.

Check out our [Guide to Contributing](CONTRIBUTING.md) for more information.
