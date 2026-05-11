import { Button, Group, Stack, Text } from '@mantine/core';
import { useState } from 'react';

import type { Session } from 'types/session';

import Filmstrip from './filmstrip';
import PidPicker from './pid-picker';
import { DEFAULT_SELECTED_PIDS } from './utils';

interface ChartsTabProps {
  readonly session: Session;
  readonly testId?: string;
}

/** Cross-chart cursor sync id for the Charts tab filmstrip. Distinct
 *  from the Overview tab's id so each tab maintains its own hover
 *  cursor and they don't fight each other across re-mounts. */
const CHARTS_SYNC_ID = 'session-charts';

/**
 * Renders the Session Detail page's Charts tab — a stacked filmstrip
 * of single-PID line charts, each driven by the user's selection from
 * the categorized PID picker drawer.
 *
 * Initial selection comes from `DEFAULT_SELECTED_PIDS`. Local component
 * state tracks the active picks; persistence (per-vehicle defaults,
 * per-session overrides) lands later with the preferences slice.
 *
 * Every chart in the filmstrip shares `CHARTS_SYNC_ID` so the hover
 * cursor moves in lockstep down the stack — find a single event
 * (hard brake, throttle blip) by hovering once.
 *
 * @returns The Charts tab body React element.
 */
function ChartsTab({ session, testId }: ChartsTabProps) {
  const [selectedPids, setSelectedPids] = useState<readonly string[]>(
    DEFAULT_SELECTED_PIDS
  );
  const [pickerOpened, setPickerOpened] = useState(false);

  return (
    <Stack data-testid={ testId } gap="md">
      <Group justify="space-between">
        <Text c="dimmed" size="sm">
          { selectedPids.length } PID{ selectedPids.length === 1 ? '' : 's' } selected.
          Hover any chart to move the cursor across the stack.
        </Text>
        <Button
          data-testid={ testId === undefined ? undefined : `${ testId }-picker-trigger` }
          onClick={ () => setPickerOpened(true) }
          variant="default"
        >
          Pick PIDs
        </Button>
      </Group>
      <Filmstrip
        data={ session.data }
        selectedPids={ selectedPids }
        syncId={ CHARTS_SYNC_ID }
        testId={ testId === undefined ? undefined : `${ testId }-filmstrip` }
      />
      <PidPicker
        onChange={ setSelectedPids }
        onClose={ () => setPickerOpened(false) }
        opened={ pickerOpened }
        selectedPids={ selectedPids }
        testId={ testId === undefined ? undefined : `${ testId }-picker` }
      />
    </Stack>
  );
}

export default ChartsTab;
