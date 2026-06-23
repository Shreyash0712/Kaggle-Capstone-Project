### General Guidelines
- **File Annotations**: Always include a high-level comment at the top of every file to provide immediate context on its purpose.
- **Production-Ready Code**: Never hardcode values or create "demo" or mock implementations. If specific data or configuration is required to properly build a feature, stop and ask for instructions.
- **Code Organization**: Write concise and correct code. When a file or function becomes too large, break it down into smaller, modular components.
- **Environment Variables**: Never hardcode secrets, keys, or configurable values. Always use environment variables. Whenever a new environment variable is introduced, add it to `.env.example` so it can be safely tracked and added to the actual `.env` file. Never access the actual `.env` file yourself.

### Backend Rules
- **AI Service Modularity**: The AI components must be strictly modular. Implement a configuration system driven by environment variables that allows dynamically swapping models and providers (e.g., from Groq to Gemini) without requiring any code changes.

### Frontend Rules
- **Design Philosophy**: Keep the UI architecture modular and the overall design clean and minimalistic.
- **Package Manager**: STRICTLY use `pnpm` for all frontend package management operations. Do NOT use `npm`, `yarn`, `npx` or similar tools unless explicitly required by a tool that doesn't support `pnpm`.

### Bug Fixing & Verification
- **Test Before Concluding**: Never assume or claim that a bug is fixed without explicit confirmation. Always verify your changes by running the backend/frontend or executing relevant tests before reporting back.
- **Cleanup**: Always clean up any temporary test files, scratch scripts, or experimental code created during the debugging process.

### Database Migration Rule
- **Manual Migration Tracking**: Whenever you modify the database schema via ORM models or raw SQL, you MUST append the corresponding raw SQL query (e.g., `CREATE TABLE`, `ALTER TABLE`) to `backend/db/migrations.sql`. This ensures a single source of truth for schema changes.