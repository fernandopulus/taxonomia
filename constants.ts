
import { Subject, GradeLevel, BloomLevel } from './types';

export const SUBJECTS_LIST: Subject[] = Object.values(Subject);
export const GRADE_LEVELS_LIST: GradeLevel[] = Object.values(GradeLevel);
export const BLOOM_LEVELS_LIST: BloomLevel[] = Object.values(BloomLevel);

export const BLOOM_LEVEL_COLORS: Record<BloomLevel, string> = {
  [BloomLevel.RECORDAR]: "#3B82F6", // blue-500
  [BloomLevel.COMPRENDER]: "#10B981", // emerald-500
  [BloomLevel.APLICAR]: "#F59E0B", // amber-500
  [BloomLevel.ANALIZAR]: "#2563EB", // blue-600 (Changed from violet-500 #8B5CF6)
  [BloomLevel.EVALUAR]: "#EC4899", // pink-500
  [BloomLevel.CREAR]: "#EF4444", // red-500
};