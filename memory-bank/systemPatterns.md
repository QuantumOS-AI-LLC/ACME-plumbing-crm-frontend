# System Patterns: ACME Plumbing CRM

## 1. Overall Architecture

*   **Client-Side Application:** The system is primarily a single-page application (SPA) built with React, running in the user's browser.
*   **API Driven:** It relies on a backend API (interfaced via `src/services/api.js`) for data persistence, business logic, and authentication. The specifics of the backend are not detailed in the frontend codebase.

## 2. Key Design Patterns (Frontend)

*   **Component-Based Architecture:** Standard React pattern, with UI broken down into reusable components (`src/components/`).
*   **Container/Presentational Component Pattern (Likely):** Pages (`src/pages/`) likely act as container components fetching and managing data, while components in `src/components/` might be more presentational.
*   **Context API for Global State:** Used for managing cross-cutting concerns like authentication (`AuthContext`), notifications (`NotificationContext`), and WebSocket connections (`SocketContext`). This avoids prop-drilling for widely used state.
*   **Custom Hooks for Reusable Logic:** Encapsulates stateful logic and side effects that can be reused across multiple components (e.g., `useAuth`, `useAIChat`).
*   **Service Layer Abstraction:** API calls and other external interactions are abstracted into a service layer (`src/services/`), decoupling components from direct data fetching logic.
*   **Modular Structure:** The codebase is organized by feature/domain (e.g., `contacts`, `jobs`, `estimates` within `src/components/` and `src/pages/`), promoting separation of concerns.

## 3. Data Flow

*   **User Interaction:** Triggers events in components.
*   **Component Logic:** Handles events, potentially calls custom hooks or services.
*   **Services:** Interact with the backend API for CRUD operations or other business logic.
*   **State Updates:** Data returned from services or derived from user actions updates component state or global context.
*   **Re-render:** React re-renders affected parts of the UI based on state changes.

## 4. Navigation

*   **Client-Side Routing:** Implied by the SPA architecture and `src/pages/` structure, likely managed by a library like `react-router-dom`. This allows for view changes without full page reloads.

## 5. Potential Future Patterns (Considerations)

*   **More Advanced State Management:** If complexity grows, libraries like Redux, Zustand, or Jotai might be considered, though Context API is currently in use.
*   **Data Fetching Libraries:** Libraries like React Query or SWR could be introduced to manage server state, caching, and synchronization more effectively.
*   **UI Component Library:** While custom components exist, a standardized UI library (e.g., Material-UI, Ant Design, Chakra UI) could be adopted for consistency and rapid development, though this would be a significant change.
