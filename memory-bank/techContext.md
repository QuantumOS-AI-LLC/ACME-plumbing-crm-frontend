# Technical Context: ACME Plumbing CRM

## 1. Core Technologies

*   **Frontend Framework:** React (indicated by `.jsx` files, `App.jsx`, `main.jsx`, and component-based structure in `src/components`)
*   **Language:** JavaScript (ES6+ with JSX syntax)
*   **Build Tool/Bundler:** Vite (inferred from `vite.config.js` and `public/vite.svg`)
*   **Package Manager:** npm (indicated by `package.json` and `package-lock.json`)
*   **Styling:** CSS (direct CSS files like `App.css`, `index.css`, `src/assets/css/style.css`). The project might use global styles, component-specific styles, or a combination.

## 2. Project Structure & Key Patterns

*   **Source Code:** Primarily located in the `src/` directory.
*   **Components:** Reusable UI elements are organized under `src/components/`, further categorized by feature (e.g., `ai-assistant`, `calendar`, `contacts`).
*   **Pages:** Top-level view components are in `src/pages/` (e.g., `DashboardPage.jsx`, `ContactsPage.jsx`), suggesting a page-based routing structure.
*   **State Management:** React Context API is used for global state management (e.g., `AuthContext`, `NotificationContext`, `SocketContext` found in `src/contexts/`).
*   **Custom Hooks:** Logic reusability is achieved through custom hooks located in `src/hooks/` (e.g., `useAuth.js`, `useAIChat.js`).
*   **Services:** API interactions and other services like local storage management are abstracted into `src/services/` (e.g., `api.js`, `auth.js`, `localStorage.js`).
*   **Assets:** Static assets like images and global CSS are in `src/assets/` and `public/`.
*   **Routing:** While not explicitly defined here, the presence of a `src/pages/` directory strongly suggests the use of a routing library like `react-router-dom`.

## 3. Development Environment

*   **Setup:** A standard Node.js environment is required. Dependencies are managed via `npm install`.
*   **Development Server:** Likely started with `npm run dev` (a common Vite command, usually defined in `package.json` scripts).
*   **Linting:** ESLint is configured for code quality (`eslint.config.js`).

## 4. Key Dependencies (Inferred or Common)

*   `react`, `react-dom`
*   `vite` (as a development dependency)
*   Potentially `react-router-dom` for client-side routing.
*   Libraries for specific UI components or functionalities (e.g., date pickers for calendar, charting libraries for dashboard) might be present but are not explicitly identifiable from the file list alone.

## 5. Technical Constraints & Considerations

*   Being a frontend application, performance (load times, rendering speed) is important.
*   Cross-browser compatibility needs to be considered.
*   State management complexity might grow as the application scales.
*   API design and backend integration (via `src/services/api.js`) are crucial for data handling.
