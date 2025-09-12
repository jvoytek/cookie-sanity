# Cookie Sanity - GitHub Copilot Instructions

Cookie Sanity is a Nuxt.js 3 web application for managing cookie season activities. It provides inventory management, order processing, seller tracking, and reporting functionality integrated with Supabase for backend services.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Prerequisites

- Node.js v20.19.5+ (tested and working)
- npm 10.8.2+ (tested and working)
- Supabase project with URL and anon key for full functionality

### Bootstrap and Build Process

- Install dependencies: `npm install` -- takes 1 minute. NEVER CANCEL. Set timeout to 120+ seconds.
- Lint code: `npm run lint` -- takes 4 seconds
- Format code: `npm run format` -- takes 4 seconds
- Build for production: `npm run build` -- takes 2.5 minutes. NEVER CANCEL. Set timeout to 240+ seconds.
- Preview production build: `npm run preview` -- starts server on http://localhost:3000
- Start development server: `npm run dev` -- takes 4 seconds, runs on http://localhost:3000

### Supabase Configuration Required

The application requires Supabase environment variables to function properly:

- Without these variables, the dev server will show a clear 500 error with setup instructions
- Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` environment variables or configure in `nuxt.config.ts`
- Static generation (`npm run generate`) will fail without proper Supabase configuration due to prerendering requirements

### Development Workflow

- ALWAYS run `npm run lint` and `npm run format` before committing changes
- Build takes significant time but always completes successfully - do not cancel builds
- Development server starts quickly but requires Supabase configuration for full functionality
- Application shows informative error messages when dependencies are missing

## Validation

### Manual Testing Scenarios

When making changes to the application, ALWAYS test these core user scenarios:

- User authentication flow (login/logout)
- Girl/seller management (add, edit, view sellers)
- Cookie inventory tracking (view current stock, update quantities)
- Order processing (create, upload, manage orders)
- Reporting and data export functionality
- Settings and season management

### Build Validation

- Always run the full build process after making changes: `npm run build`
- Test both development and production modes: `npm run dev` and `npm run preview`
- Verify linting passes: `npm run lint`
- Ensure formatting is consistent: `npm run format`

### Testing Limitations

- Static generation (`npm run generate`) requires Supabase configuration and will fail in CI/CD without proper environment setup
- Full application functionality requires database connection for authentication and data operations

## Architecture Overview

### Technology Stack

- **Frontend**: Nuxt.js 3, Vue 3, TypeScript
- **UI Framework**: PrimeVue components with Aura theme
- **Styling**: Tailwind CSS v4 with custom SCSS
- **State Management**: Pinia stores
- **Forms**: FormKit with PrimeVue integration
- **Backend**: Supabase (PostgreSQL database, authentication, real-time)
- **Build Tools**: Vite, Nitro

### Key Directories

- `/pages` - Route components (index, login, orders, girls, girl-inventory, troop-inventory, settings)
- `/components` - Reusable Vue components organized by feature areas
- `/stores` - Pinia stores (cookies, girls, orders, profile, seasons, uploads)
- `/types` - TypeScript definitions including generated Supabase types
- `/service` - Data service classes (CountryService, CustomerService, etc.)
- `/assets` - CSS/SCSS styles, includes PrimeVue theme customizations
- `/layouts` - Vue layout components (default, login)
- `/composables` - Vue composition utilities
- `/server` - Server-side TypeScript configuration
- `/public` - Static assets including demo data files

### Database Integration

- Uses Supabase PostgreSQL with generated TypeScript types in `/types/supabase.ts`
- Main entities: profiles, sellers (girls), orders, cookies, seasons, uploads
- Real-time subscriptions for live data updates
- Row Level Security (RLS) policies for data access control

## Common Tasks

### Adding New Features

- Create components in appropriate `/components` subdirectory
- Add routes by creating files in `/pages` directory
- Use existing Pinia stores or create new ones in `/stores`
- Follow existing TypeScript patterns and import from `/types/types.ts`
- Style with Tailwind CSS classes and PrimeVue components

### Working with Data

- Use `useSupabaseClient()` composable for database operations
- Reference existing store patterns in `/stores` directory
- Always handle loading states and error conditions
- Use TypeScript types from `/types/types.ts` and `/types/supabase.ts`

### Styling Guidelines

- Primary UI framework is PrimeVue with Aura theme
- Use Tailwind CSS for custom styling
- SCSS files in `/assets` for component-specific styles
- Responsive design with mobile-first approach

### File Organization

The project follows Nuxt.js conventions:

- Auto-imported components from `/components`
- File-based routing in `/pages`
- Auto-imported composables from `/composables`
- Middleware in `/middleware` (when needed)

## Development Notes

### Expected Warnings

- Supabase configuration warnings are normal in development without environment variables
- Tailwind CSS sourcemap warnings during build are non-blocking
- PrimeVue theme warnings can be safely ignored

### Performance Considerations

- Large JavaScript bundles are normal due to PrimeVue component library
- Build process includes tree-shaking and optimization
- Consider code-splitting for new large features

### Environment Configuration

- Development: Requires Supabase environment variables for full functionality
- Production: Must have proper Supabase configuration
- Testing: Can run linting and formatting without external dependencies

This application is actively developed for managing Girl Scout cookie seasons with features for inventory tracking, order management, seller coordination, and financial reporting.
