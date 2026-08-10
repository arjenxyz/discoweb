export type DayStatus =
  | 'operational'
  | 'degraded'
  | 'partial_outage'
  | 'major_outage'
  | 'maintenance'
  | 'no_data';

export type ComponentStatus =
  | 'operational'
  | 'degraded'
  | 'partial_outage'
  | 'major_outage'
  | 'maintenance';

export type IncidentPhase =
  | 'investigating'
  | 'identified'
  | 'monitoring'
  | 'resolved';

export type StatusComponent = {
  id: string;
  name: string;
  description: string;
  status: ComponentStatus;
  uptime90: number;
  history: DayStatus[];
  responseTime?: number;
};

export type StatusGroup = {
  id: string;
  name: string;
  components: StatusComponent[];
};

export type StatusIncidentUpdate = {
  phase: IncidentPhase;
  body: string;
  at: string;
};

export type StatusIncident = {
  id: string;
  title: string;
  status: IncidentPhase;
  severity: 'low' | 'medium' | 'high' | 'critical';
  startedAt: string;
  updatedAt: string;
  affectedComponents: string[];
  updates: StatusIncidentUpdate[];
};

export type StatusDayIncidents = {
  date: string;
  label: string;
  incidents: StatusIncident[];
  empty: boolean;
};

export type StatusPayload = {
  generatedAt: string;
  overall: ComponentStatus;
  groups: StatusGroup[];
  activeIncidents: StatusIncident[];
  pastIncidents: StatusDayIncidents[];
};
