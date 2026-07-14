import type { UniversityFeeAdapter } from "./types";
import { bilkentFeeAdapter } from "./bilkent";

export const feeAdapters: UniversityFeeAdapter[] = [bilkentFeeAdapter];
