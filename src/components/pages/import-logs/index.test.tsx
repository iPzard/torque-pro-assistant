import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

import store from 'state/store';

import ImportLogs from '.';

/**
 * ImportLogs reads `useAppDispatch` + `useNavigate`, so the render harness
 * needs the Redux store + a router in scope. We mount the real app store
 * here (rather than a stub) since the page never dispatches during render
 * — only on `onDrop`, which these tests don't trigger.
 */
function renderImportLogs() {
  return render(
    <Provider store={ store }>
      <MantineProvider>
        <MemoryRouter initialEntries={ ['/import'] }>
          <ImportLogs />
        </MemoryRouter>
      </MantineProvider>
    </Provider>
  );
}

describe('pages/import-logs', () => {
  it('renders the page wrapper', () => {
    renderImportLogs();
    expect(screen.getByTestId('import-logs-page')).toBeInTheDocument();
  });

  it('renders the page heading', () => {
    renderImportLogs();
    expect(screen.getByTestId('import-logs-page-title')).toBeInTheDocument();
  });

  it('renders the page description', () => {
    renderImportLogs();
    expect(screen.getByTestId('import-logs-page-description')).toBeInTheDocument();
  });

  it('renders the dropzone headline', () => {
    renderImportLogs();
    expect(screen.getByTestId('import-logs-dropzone-headline')).toBeInTheDocument();
  });

  it('renders the dropzone size-limit hint', () => {
    renderImportLogs();
    expect(screen.getByTestId('import-logs-dropzone-hint')).toBeInTheDocument();
  });
});
