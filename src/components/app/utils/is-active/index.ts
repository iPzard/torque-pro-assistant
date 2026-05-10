/**
 * Decides whether a sidebar nav entry should render in its "active" state.
 *
 * The Library entry is treated as active when the location is exactly
 * `/library` AND when the location is the root `/`, since the root path
 * redirects to `/library` and the sidebar should reflect the destination.
 *
 * @param currentPathname - `useLocation().pathname` from react-router. The
 *   live URL the user is on.
 * @param navItemPath - The `path` declared on the nav item being rendered.
 * @returns true when the nav item should highlight, false otherwise.
 */
export const isActive = (currentPathname: string, navItemPath: string): boolean => (
  currentPathname === navItemPath
  || (navItemPath === '/library' && currentPathname === '/')
);
