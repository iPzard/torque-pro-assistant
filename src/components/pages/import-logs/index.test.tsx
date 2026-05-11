import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

import store from 'state/store';

import ImportLogs from '.';

/**
 * ImportLogs reads `useAppDispatch` + `useNavigate`, so the render harness
 * needs the Redux store + a router in scope. We mount the real app store
 * here since the page never dispatches during render — only on `onDrop`
 * / `onSaved`, which these tests don't trigger.
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

  it('renders the dropzone on initial mount', () => {
    renderImportLogs();
    expect(screen.getByTestId('import-logs-dropzone')).toBeInTheDocument();
    expect(screen.getByTestId('import-logs-dropzone-headline')).toHaveTextContent('Drop CSV here');
  });

  it('does not render the preview stage before a file is dropped', () => {
    renderImportLogs();
    expect(screen.queryByTestId('import-logs-preview')).not.toBeInTheDocument();
  });
});
