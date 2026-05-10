import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';

import ImportLogs from '.';

function renderImportLogs() {
  return render(
    <MantineProvider>
      <ImportLogs />
    </MantineProvider>
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
