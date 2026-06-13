# Tech Stack

## Core Stack

- React for the browser UI.
- TypeScript for type safety and explicit game-state models.
- Vite for local development and bundling.
- pnpm as the package manager.
- Vitest for unit tests, especially game rules and AI behavior.
- ESLint for static code checks.
- Prettier for consistent formatting.

## Optional Later

- SVG board rendering if it improves crisp 2D visuals or exportability.
- Drag/drop library after click-based movement is stable.
- OpenAI SDK for a ChatGPT/OpenAI AI opponent adapter.

## Notes for Future Agents

- Do not install packages until the user asks for project bootstrap.
- Do not create the React application until the user asks for implementation.
- Keep game rules testable without the browser.
- Prefer boring, explicit dependencies over framework-heavy choices.

