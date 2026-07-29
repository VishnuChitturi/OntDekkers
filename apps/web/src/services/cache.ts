/**
 * OntDekker SWR Cache Helpers — Developer 3 scope
 *
 * Provides:
 *   1. Generic SWR fetchers backed by the shared Axios instance.
 *   2. Typed SWR key factories for Guide and Expedition domains.
 *
 * Usage:
 *   import useSWR from "swr";
 *   import { swrFetcherWithParams, guideKeys, expeditionKeys } from "@/services/cache";
 */

export { swrFetcher, swrFetcherWithParams } from "./cache/sharedCache";
export { guideKeys } from "./cache/guideCache";
export { expeditionKeys } from "./cache/expeditionCache";
