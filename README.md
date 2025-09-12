# Cookie Sanity

Cookie Sanity is a volunteer-built app designed to simplify and streamline the chaos of cookie season. The tools provided by GSUSA, the cookie bakers and local councils are confusing, overly complicated, and missing key features that volunteers have been requesting for years. Cookie Sanity fills in those gaps.

This app solves real, everyday problems that troop leaders, troop cookie managers, and parents face—like unclear inventory tracking, poor user interfaces, missing reports, and inventory forecasting. Cookie Sanity replaces your personal spreadsheets, with a clean, intuitive interface that’s actually built for the way volunteers work.

By eliminating frustration and making cookie management faster and easier, Cookie Sanity gives volunteers back what they need most: time and peace of mind. It helps troops stay organized, reduces errors, and makes the cookie season less stressful and more successful—for everyone.

You've found the public repository of source code for this project. If you would like to contribute to the project please read on. If you're looking for the app to use for your cookie season please check back in December 2025 when we hope to launch.

Other things to include:

  - **Technology stack**: Vue.js (with Nuxt), Tailwind CSS, PrimeVue, Node.js, and Supabase
  - **Status**:  Alpha 0.0.1 We're just getting started, join us!
  - **Links to production or demo instances**
  - Once we make it to a Beta version a demo and/or link to live site will go here.

## TODO: Dependencies

- NodeJS
- Supabase

Describe any dependencies that must be installed for this software to work.
This includes programming languages, databases or other storage mechanisms, build tools, frameworks, and so forth.
If specific versions of other software are required, or known not to work, call that out.

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Installation

1. **Clone this repository**.

   ```console
   $ git clone https://github.com/jvoytek/cookie-sanity
   $ cd cookie-sanity
   ```

2. **Install depenencies**

```bash
# npm
npm install
```

3. **Start the development server on `http://localhost:3000`**

```bash
# npm
npm run dev
```

**Lint your code**

```bash
# npm
npm run lint
```

**Build the application for production**

```bash
# npm
npm run build
```

**Locally preview production build**

```bash
# npm
npm run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.


## TODO: Configuration

If the software is configurable, describe it in detail, either here or in other documentation to which you link.

## TODO: Usage

Show users how to use the software.
Be specific.
Use appropriate formatting when showing code snippets.

## TODO: How to test the software

If the software includes automated tests, detail how to run those tests.

## TODO: Known issues

Document any known significant shortcomings with the software.

## Getting help

If you have questions, concerns, bug reports, etc, please file an issue in this repository's Issue Tracker.

## Getting involved

We are just getting started, but we need all the help we can get. We're looking for help with feature, UI/UX and software development, deployment, and getting the word out.

Check out our [Guide to Contributing](CONTRIBUTING.md) for more information.

## Local Supabase Development

To run Cookie Sanity with a local Supabase database:

1. **Install Supabase CLI**
   See [Supabase Local Development Guide](https://supabase.com/docs/guides/local-development) for details.
   ```bash
   npm install -g supabase
   ```

2. **Start Supabase locally**
   ```bash
   supabase start
   ```
   This will start Supabase services on `http://localhost:54321` and Supabase Studio on `http://localhost:54323`.

3. **Configure environment variables**
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

4. **Install dependencies and run the app**
   ```bash
   npm install
   npm run dev
   ```

The app will connect to your local Supabase instance. For production, set these variables to your hosted Supabase project values.

## Initializing the Local Database Schema (Command Line)

To set up the required tables and permissions for Cookie Sanity using the Supabase CLI:

1. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```
   See [Supabase CLI docs](https://supabase.com/docs/guides/cli) for more details.

2. **Create a migration file**
   Create a file named `init.sql` in your project root with the following example schema:

   ```sql
   -- Example: Create cookies table
   CREATE TABLE public.cookies (
     id SERIAL PRIMARY KEY,
     abbreviation TEXT NOT NULL,
     name TEXT NOT NULL,
     color TEXT,
     order INTEGER,
     price NUMERIC,
     profile UUID,
     season INTEGER,
     created_at TIMESTAMP DEFAULT now()
   );

   -- Example: Create sellers table
   CREATE TABLE public.sellers (
     id SERIAL PRIMARY KEY,
     first_name TEXT NOT NULL,
     last_name TEXT NOT NULL,
     preferred_name TEXT,
     profile UUID,
     season INTEGER,
     created_at TIMESTAMP DEFAULT now()
   );

   -- Example: Enable RLS
   ALTER TABLE public.cookies ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
   -- Add more tables and RLS policies as needed
   -- See /types/supabase.ts for full schema details
   ```

3. **Start Supabase locally**
   ```bash
   supabase start
   ```

4. **Apply the migration**
   ```bash
   supabase db execute ./init.sql
   ```

This will create the required tables and enable RLS. Repeat for all tables and relationships as defined in `/types/supabase.ts`.