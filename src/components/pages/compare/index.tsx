import { Stack, Text, Title } from '@mantine/core';

/**
 * Renders the Compare page — the design's overlay view, putting 2–4
 * sessions on shared timelines (Speed + RPM, Throttle, Boost) with an
 * alignment toggle (trip start vs. GPS) and a side-by-side summary table
 * with a delta column. Currently a placeholder; real content lands in
 * CLAUDE.md TODO §F.
 *
 * @returns The Compare page React element.
 */
function Compare() {
  return (
    <Stack gap="xs">
      <Title order={ 2 }>Compare</Title>
      <Text c="dimmed">
        Side-by-side session comparison will live here. Currently a placeholder.
      </Text>
    </Stack>
  );
}

export default Compare;
