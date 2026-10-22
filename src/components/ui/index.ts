/**
 * KaryaLaya 2.0 — Shared UI Component Primitives
 * Light Editorial / Precision-Product Design Language
 * Location: src/components/ui/index.ts
 */

export * from "./Button";
export * from "./Pill";
export * from "./StatCard";
export * from "./SpecSheet";
export * from "./Dialog";
export * from "./Toast";
export { default as DataRain } from "./data-rain";
export * from "./data-rain";

// Backwards-compatible re-exports for work-os primitives
export * from "../work-os/Badges";
export {
  StatusMark,
  StateHeader,
  NodeLink,
  ErrorState,
  PermissionState,
  Avatar,
} from "../work-os/Primitives";
