import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

type Assignee = { id: string; email: string };

type SR = {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  assigneeId?: string | null;
  assignee?: Assignee | null;
};

type Incident = {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  assigneeId?: string | null;
  assignee?: Assignee | null;
};

type Task = {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  assigneeId?: string | null;
  assignee?: Assignee | null;
};

type Asset = { id: string };
type Survey = { id: string; status: string };
type TriageItem = { id: string; status: string };

type TrendMetric = {
  label: string;
  opened: number;
  resolved: number;
  tone: string;
};

function formatDateForInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function inDateRange(value: string, dateFrom: string, dateTo: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const from = dateFrom ? new Date(`${dateFrom}T00:00:00.000Z`) : null;
  const to = dateTo ? new Date(`${dateTo}T23:59:59.999Z`) : null;

  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

function countOpenedResolved<T extends { status: string; createdAt: string; updatedAt: string }>(
  items: T[],
  dateFrom: string,
  dateTo: string,
  resolvedStatuses: string[]
) {
  const opened = items.filter((x) => inDateRange(x.createdAt, dateFrom, dateTo)).length;
  const resolved = items.filter(
    (x) => resolvedStatuses.includes(x.status) && inDateRange(x.updatedAt, dateFrom, dateTo)
  ).length;
  return { opened, resolved };
}

export default function DashboardPage() {
  const [dateFrom, setDateFrom] = React.useState(
    formatDateForInput(new Date(Date.now() - 1000 * 60 * 60 * 24 * 30))
  );
  const [dateTo, setDateTo] = React.useState(formatDateForInput(new Date()));
  const [assigneeId, setAssigneeId] = React.useState("");
  const [isExporting, setIsExporting] = React.useState<string | null>(null);

  const srs = useQuery({
    queryKey: ["srs"],
    queryFn: async () => (await api.get<SR[]>("/service-requests")).data
  });
  const incidents = useQuery({
    queryKey: ["incidents"],
    queryFn: async () => (await api.get<Incident[]>("/incidents")).data
  });
  const tasks = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => (await api.get<Task[]>("/tasks")).data
  });
  const assets = useQuery({
    queryKey: ["assets"],
    queryFn: async () => (await api.get<Asset[]>("/assets")).data
  });
  const surveys = useQuery({
    queryKey: ["surveys"],
    queryFn: async () => (await api.get<Survey[]>("/surveys")).data
  });
  const triage = useQuery({
    queryKey: ["triage-queue"],
    queryFn: async () => (await api.get<TriageItem[]>("/triage/queue")).data
  });

  const assignees = React.useMemo(() => {
    const byId = new Map<string, Assignee>();
    [...(srs.data ?? []), ...(incidents.data ?? []), ...(tasks.data ?? [])].forEach((item) => {
      if (item.assignee?.id && item.assignee?.email) byId.set(item.assignee.id, item.assignee);
    });
    return Array.from(byId.values()).sort((a, b) => a.email.localeCompare(b.email));
  }, [srs.data, incidents.data, tasks.data]);

  const applyAssignee = <T extends { assigneeId?: string | null }>(items: T[]) =>
    assigneeId ? items.filter((x) => x.assigneeId === assigneeId) : items;

  const filteredSrs = applyAssignee(srs.data ?? []);
  const filteredIncidents = applyAssignee(incidents.data ?? []);
  const filteredTasks = applyAssignee(tasks.data ?? []);

  const srTrend = countOpenedResolved(filteredSrs, dateFrom, dateTo, ["COMPLETED", "CLOSED"]);
  const incidentTrend = countOpenedResolved(filteredIncidents, dateFrom, dateTo, ["RESOLVED", "CLOSED"]);
  const taskTrend = countOpenedResolved(filteredTasks, dateFrom, dateTo, ["DONE"]);

  const triageInbox = (triage.data ?? []).filter((x) => x.status === "NEW").length;
  const openTickets = filteredSrs.filter(
    (x) => x.status !== "CLOSED" && inDateRange(x.createdAt, dateFrom, dateTo)
  ).length;
  const openIncidents = filteredIncidents.filter(
    (x) => inDateRange(x.createdAt, dateFrom, dateTo) && !["RESOLVED", "CLOSED"].includes(x.status)
  ).length;
  const openTasks = filteredTasks.filter(
    (x) => inDateRange(x.createdAt, dateFrom, dateTo) && !["DONE"].includes(x.status)
  ).length;
  const activeSurveys = (surveys.data ?? []).filter((x) => x.status !== "COMPLETED").length;

  const trendCards: TrendMetric[] = [
    { label: "Service Requests", opened: srTrend.opened, resolved: srTrend.resolved, tone: "#2563eb" },
    { label: "Incidents", opened: incidentTrend.opened, resolved: incidentTrend.resolved, tone: "#dc2626" },
    { label: "Tasks", opened: taskTrend.opened, resolved: taskTrend.resolved, tone: "#0f766e" }
  ];

  const cards = [
    { label: "Triage Inbox", value: triageInbox, tone: "#f59e0b" },
    { label: "Open Service Requests", value: openTickets, tone: "#2563eb" },
    { label: "Open Incidents", value: openIncidents, tone: "#dc2626" },
    { label: "Open Tasks", value: openTasks, tone: "#0f766e" },
    { label: "Assets", value: assets.data?.length ?? 0, tone: "#0f766e" },
    { label: "Active Surveys", value: activeSurveys, tone: "#7c3aed" }
  ];

  async function exportCsv(kind: "service-requests" | "incidents" | "tasks") {
    try {
      setIsExporting(kind);
      const res = await api.get<Blob>(`/${kind}/export`, {
        params: {
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          assigneeId: assigneeId || undefined
        },
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/csv;charset=utf-8;" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${kind}-report-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } finally {
      setIsExporting(null);
    }
  }

  return (
    <Box>
      <Stack
        direction={{ xs: "column", lg: "row" }}
        justifyContent="space-between"
        sx={{ mb: 1.5 }}
        spacing={1.5}
      >
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Operational reporting with scoped filters, trend tracking, and exportable reports.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FileDownloadIcon />}
            onClick={() => exportCsv("service-requests")}
            disabled={isExporting !== null}
          >
            Export SRs
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FileDownloadIcon />}
            onClick={() => exportCsv("incidents")}
            disabled={isExporting !== null}
          >
            Export Incidents
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FileDownloadIcon />}
            onClick={() => exportCsv("tasks")}
            disabled={isExporting !== null}
          >
            Export Tasks
          </Button>
        </Stack>
      </Stack>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.2}>
            <TextField
              type="date"
              label="From"
              InputLabelProps={{ shrink: true }}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <TextField
              type="date"
              label="To"
              InputLabelProps={{ shrink: true }}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
            <TextField
              select
              label="Assignee"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              sx={{ minWidth: 260 }}
            >
              <MenuItem value="">All assignees</MenuItem>
              {assignees.map((assignee) => (
                <MenuItem key={assignee.id} value={assignee.id}>
                  {assignee.email}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {trendCards.map((metric) => (
          <Grid item xs={12} md={4} key={metric.label}>
            <Card sx={{ borderLeft: `4px solid ${metric.tone}` }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  {metric.label} Trend
                </Typography>
                <Stack direction="row" spacing={3} sx={{ mt: 1 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Opened
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                      {metric.opened}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Resolved
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                      {metric.resolved}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        {cards.map((c) => (
          <Grid item xs={12} sm={6} md={4} lg={2.4 as any} key={c.label}>
            <Card sx={{ overflow: "hidden" }}>
              <Box sx={{ height: 4, bgcolor: c.tone }} />
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                    {c.label}
                  </Typography>
                  <TrendingUpIcon sx={{ color: c.tone, fontSize: 18 }} />
                </Stack>
                <Typography variant="h4" sx={{ mt: 1.2, fontWeight: 800 }}>
                  {c.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
