import { act, renderHook, waitFor } from '@testing-library/react';

import { pingFlask } from 'components/app/utils/ping-flask';

import { useBackendStatus } from '.';

jest.mock('components/app/utils/ping-flask', () => ({ pingFlask: jest.fn() }));

const pingFlaskMock = pingFlask as jest.MockedFunction<typeof pingFlask>;

describe('components/app/utils/use-backend-status', () => {
  beforeEach(() => { pingFlaskMock.mockReset(); });

  it('starts online when the initial ping succeeds', async () => {
    pingFlaskMock.mockResolvedValue(true);
    const { result } = renderHook(() => useBackendStatus({ retryIntervalMs: 50 }));
    await act(async () => { await Promise.resolve(); });
    expect(result.current.offline).toBe(false);
    expect(result.current.attempts).toBe(0);
  });

  it('flips to offline + attempts=1 when the initial ping fails', async () => {
    pingFlaskMock.mockResolvedValue(false);
    const { result } = renderHook(() => useBackendStatus({ retryIntervalMs: 60_000 }));
    await waitFor(() => { expect(result.current.offline).toBe(true); });
    expect(result.current.attempts).toBe(1);
  });

  it('reconnects + resets the counter once a ping succeeds', async () => {
    pingFlaskMock.mockResolvedValueOnce(false).mockResolvedValue(true);
    const { result } = renderHook(() => useBackendStatus({ retryIntervalMs: 50 }));
    await waitFor(() => { expect(result.current.offline).toBe(true); });
    await waitFor(() => { expect(result.current.offline).toBe(false); }, { timeout: 1000 });
    expect(result.current.attempts).toBe(0);
  });

  it('dismiss() flips the dismissed flag', async () => {
    pingFlaskMock.mockResolvedValue(false);
    const { result } = renderHook(() => useBackendStatus({ retryIntervalMs: 60_000 }));
    await waitFor(() => { expect(result.current.offline).toBe(true); });
    act(() => { result.current.dismiss(); });
    expect(result.current.dismissed).toBe(true);
  });

  it('retry() fires an immediate ping + resets the counter to 1', async () => {
    pingFlaskMock.mockResolvedValue(false);
    const { result } = renderHook(() => useBackendStatus({ retryIntervalMs: 60_000 }));
    await waitFor(() => { expect(result.current.offline).toBe(true); });
    pingFlaskMock.mockClear();
    act(() => { result.current.retry(); });
    expect(pingFlaskMock).toHaveBeenCalled();
    expect(result.current.attempts).toBe(1);
  });
});
