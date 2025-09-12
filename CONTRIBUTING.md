# Contributing to Cookie Sanity

Thank you for your interest in contributing to Cookie Sanity! This document provides guidelines and information for contributors.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Code Standards](#code-standards)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [License](#license)

## Getting Started

Cookie Sanity is a web application built with Nuxt.js 3 to help bring sanity to the cookie season. We welcome contributions of all kinds, including:

- Bug fixes
- Feature enhancements
- Documentation improvements
- UI/UX improvements
- Test coverage improvements

## Development Setup

### Prerequisites

- Node.js (version 18 or higher recommended)
- npm, pnpm, yarn, or bun package manager

### Initial Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:

   ```bash
   git clone https://github.com/YOUR_USERNAME/cookie-sanity.git
   cd cookie-sanity
   ```

3. **Install dependencies:**

   ```bash
   # Using npm
   npm install

   # Using pnpm
   pnpm install

   # Using yarn
   yarn install

   # Using bun
   bun install
   ```

4. **Set up environment** (if needed):
   - Copy any example environment files
   - Configure Supabase connection if working on backend features
   - [ADD MORE DETAILS HERE]

### Development Commands

- **Start development server:**

  ```bash
  npm run dev
  ```

  Access the application at `http://localhost:3000`

- **Build for production:**

  ```bash
  npm run build
  ```

- **Preview production build:**

  ```bash
  npm run preview
  ```

- **Run linting:**

  ```bash
  npm run lint
  ```

- **Format code:**
  ```bash
  npm run format
  ```

## Contributing Guidelines

### Before You Start

1. **Check existing issues** to see if your bug report or feature request already exists
2. **Create an issue** to discuss major changes before starting work
3. **Keep changes focused** - one feature or bug fix per pull request

### Workflow

1. **Create a feature branch** from `main`:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the code standards below
3. **Test your changes** thoroughly
4. **Run linting and formatting:**

   ```bash
   npm run lint
   npm run format
   ```

5. **Commit your changes** with descriptive commit messages
6. **Push to your fork** and create a pull request

## Code Standards

### Code Style

- **ESLint**: All code must pass ESLint checks (`npm run lint`)
- **Prettier**: Code must be formatted with Prettier (`npm run format`)
- **TypeScript**: Use TypeScript for type safety where applicable
- **Vue 3 Composition API**: Prefer Composition API over Options API for new components

### File Naming

- **Components**: Use PascalCase (e.g., `CookieCard.vue`)
- **Pages**: Use kebab-case (e.g., `cookie-management.vue`)
- **Composables**: Use camelCase with `use` prefix (e.g., `useCookieData.ts`)
- **Types**: Use PascalCase (e.g., `CookieType.ts`)

### Code Organization

- **Components**: Place in appropriate subdirectories under `/components`
- **Pages**: Organize by feature in `/pages`
- **Composables**: Keep business logic in `/composables`
- **Types**: Define TypeScript types in `/types`
- **Stores**: Use Pinia stores in `/stores`

### Documentation

- **Component Props**: Document all props with proper TypeScript types
- **Complex Functions**: Add JSDoc comments for complex business logic
- **API Integration**: Document API endpoints and data structures

## Pull Request Process

### Before Submitting

1. **Ensure all tests pass** (if applicable)
2. **Run linting and formatting checks**
3. **Update documentation** if needed
4. **Test across different screen sizes** for UI changes

### Pull Request Requirements

1. **Clear title and description** explaining the change
2. **Reference related issues** using `Fixes #issue-number` or `Closes #issue-number`
3. **Include screenshots** for UI changes
4. **Small, focused changes** - break large features into smaller PRs

### Review Process

1. **Automated checks** must pass (linting, formatting)
2. **Code review** by maintainers
3. **Testing** of the functionality
4. **Approval** before merge

## Issue Reporting

### Bug Reports

When reporting bugs, please include:

- **Clear description** of the issue
- **Steps to reproduce** the problem
- **Expected vs actual behavior**
- **Environment details** (browser, OS, etc.)
- **Screenshots or screen recordings** if applicable

### Feature Requests

For feature requests, please provide:

- **Clear description** of the proposed feature
- **Use case and benefits**
- **Possible implementation approach** (if you have ideas)
- **Mockups or wireframes** for UI features

### Issue Labels

We use labels to categorize issues:

- `bug`: Something isn't working
- `enhancement`: New feature or improvement
- `documentation`: Documentation related
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention is needed

## License

By contributing to Cookie Sanity, you agree that your contributions will be licensed under the [GNU General Public License v3.0 or later](COPYING.txt).

### License Headers

When creating new files, include appropriate license headers if substantial original code is being added. The project uses GPL-3.0-or-later license.

### Third-Party Code

- **Do not include** code with incompatible licenses
- **Document** any third-party code or assets with proper attribution
- **Prefer** libraries with compatible open-source licenses

## Questions?

If you have questions about contributing, feel free to:

- **Open an issue** for discussion
- **Check existing issues** for similar questions
- **Review the README.md** for basic project information

Thank you for contributing to Cookie Sanity! 🍪
