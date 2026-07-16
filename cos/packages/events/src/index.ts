export { EventPublisher } from "./publisher";
export { EventConsumer } from "./consumer";
export type { EventHandler } from "./consumer";
export {
  CosEventSchema,
  DocumentUploadedSchema,
  RiskThresholdBreachedSchema,
  ClientStageChangedSchema,
  MeetingScheduledSchema,
} from "./events-schemas";
export type {
  CosEvent,
  DocumentUploaded,
  RiskThresholdBreached,
  ClientStageChanged,
  MeetingScheduled,
} from "./events-schemas";
