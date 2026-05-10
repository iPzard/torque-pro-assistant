import { Stack, Text, Title } from '@mantine/core';

/**
 * Renders the Compare Logs page — the design's overlay view, putting 2–4
 * sessions on shared timelines (Speed + RPM, Throttle, Boost) with an
 * alignment toggle (trip start vs. GPS) and a side-by-side summary table
 * with a delta column. Currently a placeholder; real content lands in
 * CLAUDE.md TODO §F.
 *
 * @returns The Compare Logs page React element.
 */
function CompareLogs() {
  return (
    <Stack data-testid="compare-logs-page" gap="xs">
      <Title data-testid="compare-logs-page-title" order={ 2 }>Compare</Title>
      <Text c="dimmed" data-testid="compare-logs-page-description">
        Side-by-side session comparison will live here. Currently a placeholder.
      </Text>
    </Stack>
  );
}

export default CompareLogs;
