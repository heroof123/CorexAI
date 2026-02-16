# Contributing to Corex IDE

Thank you for your interest in contributing to Corex! 🎉

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)

---

## 📜 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Help others learn and grow

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Rust 1.70+
- Git
- Code editor (VS Code recommended)

### Fork and Clone

```bash
# Fork on GitHub, then:
git clone https://github.com/YOUR_USERNAME/corex.git
cd corex

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/corex.git
```

---

## 💻 Development Setup

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Run development server
npm run tauri:dev
```

### Project Structure

```
src/
├── components/     # React components
├── services/       # Business logic
├── contexts/       # React contexts
├── hooks/          # Custom hooks
├── types/          # TypeScript types
└── config/         # Configuration

src-tauri/
└── src/
    ├── commands.rs # Tauri commands
    ├── gguf.rs     # GGUF support
    └── oauth.rs    # OAuth
```

---

## 🔧 Making Changes

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation
- `refactor/` - Code refactoring
- `test/` - Tests
- `chore/` - Maintenance

### 2. Make Your Changes

- Write clean, readable code
- Follow existing patterns
- Add comments for complex logic
- Update documentation

### 3. Test Your Changes

```bash
# Type check
npm run type-check

# Build
npm run build

# Run app
npm run tauri:dev
```

---

## 📝 Coding Standards

### TypeScript

```typescript
// ✅ Good
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): User | null {
  // ...
}

// ❌ Bad
function getUser(id: any): any {
  // ...
}
```

### React Components

```typescript
// ✅ Good
interface Props {
  title: string;
  onClose: () => void;
}

export default function Modal({ title, onClose }: Props) {
  // ...
}

// ❌ Bad
export default function Modal(props: any) {
  // ...
}
```

### Naming Conventions

- **Components:** PascalCase (`UserProfile.tsx`)
- **Functions:** camelCase (`getUserData()`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **Types:** PascalCase (`UserProfile`)
- **Files:** kebab-case (`user-profile.ts`)

### Code Style

- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Max line length: 100 characters
- Add trailing commas

---

## 📝 Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting
- `refactor` - Code restructuring
- `test` - Tests
- `chore` - Maintenance

### Examples

```bash
feat(editor): add syntax highlighting for Rust

- Added Rust language support
- Updated Monaco configuration
- Added syntax theme

Closes #123
```

```bash
fix(oauth): resolve token refresh issue

Fixed bug where refresh token was not being stored correctly

Fixes #456
```

---

## 🔄 Pull Request Process

### 1. Update Your Branch

```bash
git fetch upstream
git rebase upstream/main
```

### 2. Push Changes

```bash
git push origin feature/your-feature-name
```

### 3. Create Pull Request

- Go to GitHub
- Click "New Pull Request"
- Fill in the template
- Link related issues

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation

## Testing
- [ ] Tested locally
- [ ] Added tests
- [ ] Updated docs

## Screenshots
(if applicable)

## Related Issues
Closes #123
```

### 4. Code Review

- Address reviewer feedback
- Make requested changes
- Push updates

### 5. Merge

Once approved:
- Squash commits (if needed)
- Merge to main
- Delete branch

---

## 🧪 Testing

### Manual Testing

```bash
# Run app
npm run tauri:dev

# Test features:
- Open project
- Edit files
- Use AI features
- Test Git operations
```

### Future: Automated Tests

```bash
# Unit tests (coming soon)
npm test

# E2E tests (coming soon)
npm run test:e2e
```

---

## 📚 Documentation

### Update Documentation

When adding features:
- Update README.md
- Add to docs/ folder
- Update JSDoc comments
- Add examples

### JSDoc Example

```typescript
/**
 * Fetches user data from the API
 * 
 * @param userId - The unique user identifier
 * @returns Promise resolving to user data
 * @throws {Error} If user not found
 * 
 * @example
 * ```typescript
 * const user = await fetchUser('123');
 * console.log(user.name);
 * ```
 */
async function fetchUser(userId: string): Promise<User> {
  // ...
}
```

---

## 🐛 Reporting Bugs

### Bug Report Template

```markdown
**Describe the bug**
Clear description

**To Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen

**Screenshots**
If applicable

**Environment:**
- OS: [e.g. Windows 11]
- Version: [e.g. 0.1.0]
- Node: [e.g. 18.0.0]

**Additional context**
Any other info
```

---

## 💡 Feature Requests

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
Description

**Describe the solution**
What you want

**Describe alternatives**
Other options considered

**Additional context**
Mockups, examples, etc.
```

---

## 🎯 Areas to Contribute

### Good First Issues

- Documentation improvements
- UI/UX enhancements
- Bug fixes
- Test coverage

### Advanced

- AI model integration
- Performance optimization
- New features
- Architecture improvements

---

## 📞 Getting Help

- **Discord:** [Join our server](#)
- **GitHub Discussions:** [Ask questions](#)
- **Email:** dev@corex.dev

---

## 🙏 Thank You!

Every contribution helps make Corex better!

**Happy coding! 🚀**
