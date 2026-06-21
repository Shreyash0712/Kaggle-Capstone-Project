# React Expert Guidance
- **State Management**: Prefer functional components with hooks (`useState`, `useReducer`, `useEffect`) over class components.
- **Performance**: Use `React.memo`, `useMemo`, and `useCallback` when passing props deeply to avoid unnecessary re-renders.
- **Component Design**: Keep components small and focused. Extract custom hooks for complex logic.
- **Styling**: Avoid raw CSS. Use CSS Modules, Tailwind, or styled-components depending on the project's setup.
