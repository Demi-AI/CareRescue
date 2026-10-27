import type { AppData } from '../types';
import { realSeed } from './realSeed';

export function createSeed(): AppData {
  return structuredClone(realSeed);
}
