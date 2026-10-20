export type AiFeatureType =
  | "CLIENT_UPDATE_DRAFT"
  | "RISK_REASONING"
  | "AGENCY_SUMMARY"
  | "TASK_BREAKDOWN"
  | "THREAD_SUMMARY";

export interface AiGenerationResult<T = any> {
  feature: AiFeatureType;
  outputId: string;
  data: T;
  model: string;
  isAiGenerated: true;
  inputsReference: Record<string, any>;
  fallbackUsed: boolean;
  notice?: string;
  createdAt: string;
}

export interface ClientUpdateDraft {
  subject: string;
  greeting: string;
  body: string;
  completedHighlights: string[];
  upcomingNext: string[];
  nextMilestone?: string;
  clientSafeNotice: string;
}

export interface RiskCauseStep {
  step: number;
  entityType: "TASK" | "DEPENDENCY" | "DELIVERABLE" | "CLIENT_REVIEW";
  entityId: string;
  title: string;
  description: string;
}

export interface RiskEvidenceItem {
  entityId: string;
  entityType: "TASK" | "DELIVERABLE" | "CLIENT_REVIEW";
  title: string;
  status: string;
  dueDate?: string | null;
  delayDays?: number;
  blockerTitle?: string;
  linkUrl: string;
}

export interface RiskReasoningExplainer {
  deliverableId: string;
  deliverableTitle: string;
  currentRiskStatus: string;
  level1Summary: string;
  level2CauseChain: RiskCauseStep[];
  level3Evidence: RiskEvidenceItem[];
  mitigationSuggestions: string[];
}

export interface WeeklyAgencySummary {
  period: string;
  finishedThisWeek: Array<{
    id: string;
    type: "DELIVERABLE" | "TASK" | "SOCIAL_POST";
    title: string;
    completedAt: string;
    clientName?: string;
    projectName?: string;
  }>;
  stuckOrAtRisk: Array<{
    id: string;
    type: "DELIVERABLE" | "TASK" | "SOCIAL_POST";
    title: string;
    riskReason: string;
    delayDays?: number;
    clientName?: string;
    projectName?: string;
  }>;
  overloadedMembers: Array<{
    memberId: string;
    name: string;
    role: string;
    openTasksCount: number;
    hoursThisWeek: number;
    capacityRating: "AVAILABLE" | "HIGH_LOAD" | "ON_LEAVE";
    warningReason?: string;
  }>;
  actionRecommendations: string[];
}

export interface SuggestedTaskItem {
  tempId: string;
  title: string;
  description?: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  estimateHours: number;
}

export interface TaskBreakdownSuggestion {
  deliverableId: string;
  deliverableTitle: string;
  serviceType: string;
  suggestedTasks: SuggestedTaskItem[];
  approvalNotice: string;
}

export interface ThreadSummary {
  entityType: string;
  entityId: string;
  totalCommentsAnalyzed: number;
  discussionSummary: string;
  keyDecisions: string[];
  openQuestions: string[];
  actionItems: string[];
}
