import { useSyncExternalStore } from 'react';
import {
  getPlanetHubSystemMessage,
  subscribePlanetHubSystemMessage,
  type PlanetHubSystemMessage,
} from './planetHubSystemMessage';

export function usePlanetHubSystemMessage(): PlanetHubSystemMessage | null {
  return useSyncExternalStore(
    subscribePlanetHubSystemMessage,
    getPlanetHubSystemMessage,
    getPlanetHubSystemMessage,
  );
}
