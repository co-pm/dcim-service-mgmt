import React from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api"
import {
  Box, Button, Card, Chip, Dialog, DialogContent, DialogTitle,
  MenuItem, Stack, Tab, Tabs, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Typography
} from "@mui/material"
import { statusChipSx } from "../lib/ui"
import { EmptyState, ErrorState, LoadingState } from "../components/PageState"

type Risk = {
  id: string
  reference: string
  title: string
  likelihood: string
  impact: string
  status: string
  source: string | null
  createdAt: string
}

type Issue = {
  id: string
  reference: string
  title: string
  severity: string
  status: string
  reviewDate: string | null
  createdAt: string
}

function deriveRag(likelihood: string, impact: string): "RED" | "AMBER" | "GREEN" {
  const score: Record<string, number> = { LOW: 1, MEDIUM: 2, HIGH: 3 }
  const total = (score[likelihood] ?? 2) * (score[impact] ?? 2)
  if (total >= 6) return "RED"
  if (total >= 3) return "AMBER"
  return "GREEN"
}

function ragSx(level: string) {
  if (level === "RED" || level === "HIGH")
    return { bgcolor: "#fee2e2", color: "#b91c1c", fontWeight: 700 }
  if (level === "AMBER" || level === "MEDIUM")
    return { bgcolor: "#fef3c7", color: "#b45309", fontWeight: 700 }
  return { bgcolor: "#dcfce7", color: "#15803d", fontWeight: 700 }
}

function severitySx(severity: string) {
  if (severity === "RED") return { bgcolor: "#fee2e2", color: "#b91c1c", fontWeight: 700 }
  if (severity === "AMBER") return { bgcolor: "#fef3c7", color: "#b45309", fontWeight: 700 }
  return { bgcolor: "#dcfce7", color: "#15803d", fontWeight: 700 }
}

const RISK_STATUSES = ["IDENTIFIED", "ASSESSED", "MITIGATING", "ACCEPTED", "CLOSED", "ALL"]
const ISSUE_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "ALL"]

const RISK_STATUS_LABELS: Record<string, string> = {
  ALL: "All", IDENTIFIED: "Identified", ASSESSED: "Assessed",
  MITIGATING: "Mitigating", ACCEPTED: "Accepted", CLOSED: "Closed"
}

const ISSUE_STATUS_LABELS: Record<string, string> = {
  ALL: "All", OPEN: "Open", IN_PROGRESS: "In progress",
  RESOLVED: "Resolved", CLOSED: "Closed"
}

function StatusTabs({ statuses, labels, active, onChange, counts }: {
  statuses: string[]
  labels: Record<string, string>
  active: string
  onChange: (s: string) => void
  counts: Record<string, number>
}) {
  return (
    <Box sx={{ borderBottom: "1px solid #e2e8f0", px: 2 }}>
      <Tabs
        value={active}
        onChange={(_, v) => onChange(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ minHeight: 44 }}
        textColor="inherit"
        TabIndicatorProps={{ style: { backgroundColor: "#0f172a" } }}
      >
        {statuses.map((s) => (
          <Tab
            key={s}
            value={s}
            sx={{ minHeight: 44, fontSize: 13 }}
            label={
              <Stack direction="row" spacing={0.75} alignItems="center">
                <span>{labels[s] ?? s}</span>
                {(counts[s] ?? 0) > 0 && s !== "ALL" ? (
                  <Box sx={{
                    bgcolor: active === s ? "#0f172a" : "#e2e8f0",
                    color: active === s ? "#fff" : "#475569",
                    borderRadius: 10, px: 0.75, py: 0.1,
                    fontSize: 11, fontWeight: 700, lineHeight: 1.6
                  }}>
                    {counts[s]}
                  </Box>
                ) : null}
              </Stack>
            }
          />
        ))}
      </Tabs>
    </Box>
  )
}

function RisksView({ logOpen, setLogOpen }: {
  logOpen: boolean
  setLogOpen: (v: boolean) => void
}) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [filterStatus, setFilterStatus] = React.useState("IDENTIFIED")
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [likelihood, setLikelihood] = React.useState("MEDIUM")
  const [impact, setImpact] = React.useState("MEDIUM")
  const [source, setSource] = React.useState("MANUAL")
  const [saving, setSaving] = React.useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ["risks"],
    queryFn: async () => (await api.get<Risk[]>("/risks")).data
  })

  const all = data ?? []
  const filtered = filterStatus === "ALL" ? all : all.filter((r) => r.status === filterStatus)

  const counts: Record<string, number> = { ALL: all.length }
  RISK_STATUSES.slice(0, -1).forEach((s) => {
    counts[s] = all.filter((r) => r.status === s).length
  })

  async function handleCreate() {
    if (!title.trim() || !description.trim()) return
    setSaving(true)
    try {
      await api.post("/risks", { title, description, likelihood, impact, source })
      setLogOpen(false)
      setTitle(""); setDescription("")
      setLikelihood("MEDIUM"); setImpact("MEDIUM"); setSource("MANUAL")
      qc.invalidateQueries({ queryKey: ["risks"] })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Card>
        <StatusTabs
          statuses={RISK_STATUSES}
          labels={RISK_STATUS_LABELS}
          active={filterStatus}
          onChange={setFilterStatus}
          counts={counts}
        />
        {isLoading ? <Box sx={{ p: 2 }}><LoadingState /></Box> : null}
        {error ? <Box sx={{ p: 2 }}><ErrorState title="Failed to load risks" /></Box> : null}
        {!isLoading && !error && filtered.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <EmptyState
              title={filterStatus === "ALL" ? "No risks logged" : `No ${RISK_STATUS_LABELS[filterStatus]?.toLowerCase()} risks`}
              detail={filterStatus === "ALL" ? "Log a risk to get started." : "Try a different status filter."}
            />
          </Box>
        ) : null}
        {filtered.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Reference</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Overall</TableCell>
                  <TableCell>Likelihood</TableCell>
                  <TableCell>Impact</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Logged</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((r) => {
                  const rag = deriveRag(r.likelihood, r.impact)
                  return (
                    <TableRow
                      key={r.id}
                      onClick={() => navigate(`/risks/${r.id}`)}
                      sx={{ cursor: "pointer", "&:hover": { bgcolor: "#f8fafc" } }}
                    >
                      <TableCell sx={{ fontWeight: 700, fontFamily: "monospace", fontSize: 12 }}>
                        {r.reference}
                      </TableCell>
                      <TableCell>{r.title}</TableCell>
                      <TableCell>
                        <Chip size="small" sx={ragSx(rag)}
                          label={rag === "RED" ? "High" : rag === "AMBER" ? "Medium" : "Low"} />
                      </TableCell>
                      <TableCell>
                        <Chip size="small" sx={ragSx(r.likelihood)} label={r.likelihood} />
                      </TableCell>
                      <TableCell>
                        <Chip size="small" sx={ragSx(r.impact)} label={r.impact} />
                      </TableCell>
                      <TableCell>
                        <Chip size="small" sx={statusChipSx(r.status)}
                          label={RISK_STATUS_LABELS[r.status] ?? r.status} />
                      </TableCell>
                      <TableCell>{new Date(r.createdAt).toLocaleDateString("en-GB")}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : null}
      </Card>

      <Dialog open={logOpen} onClose={() => setLogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Log risk</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ mt: 1 }}>
            <TextField label="Title" value={title}
              onChange={(e) => setTitle(e.target.value)} required fullWidth />
            <TextField label="Description" value={description}
              onChange={(e) => setDescription(e.target.value)}
              required fullWidth multiline rows={3} />
            <Stack direction="row" gap={2}>
              <TextField select label="Likelihood" value={likelihood}
                onChange={(e) => setLikelihood(e.target.value)} fullWidth>
                <MenuItem value="LOW">Low</MenuItem>
                <MenuItem value="MEDIUM">Medium</MenuItem>
                <MenuItem value="HIGH">High</MenuItem>
              </TextField>
              <TextField select label="Impact" value={impact}
                onChange={(e) => setImpact(e.target.value)} fullWidth>
                <MenuItem value="LOW">Low</MenuItem>
                <MenuItem value="MEDIUM">Medium</MenuItem>
                <MenuItem value="HIGH">High</MenuItem>
              </TextField>
            </Stack>
            <TextField select label="Source" value={source}
              onChange={(e) => setSource(e.target.value)} fullWidth>
              <MenuItem value="MANUAL">Manual entry</MenuItem>
              <MenuItem value="SURVEY">Survey / audit</MenuItem>
              <MenuItem value="INCIDENT">Incident</MenuItem>
              <MenuItem value="CHANGE">Change request</MenuItem>
              <MenuItem value="AUDIT">Audit finding</MenuItem>
            </TextField>
            <Stack direction="row" justifyContent="flex-end" gap={1} sx={{ mt: 1 }}>
              <Button onClick={() => setLogOpen(false)}>Cancel</Button>
              <Button variant="contained" onClick={handleCreate}
                disabled={saving || !title.trim() || !description.trim()}>
                {saving ? "Saving..." : "Log risk"}
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  )
}

function IssuesView({ logOpen, setLogOpen }: {
  logOpen: boolean
  setLogOpen: (v: boolean) => void
}) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [filterStatus, setFilterStatus] = React.useState("OPEN")
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [severity, setSeverity] = React.useState("AMBER")
  const [reviewDate, setReviewDate] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ["issues"],
    queryFn: async () => (await api.get<Issue[]>("/issues")).data
  })

  const all = data ?? []
  const filtered = filterStatus === "ALL" ? all : all.filter((i) => i.status === filterStatus)

  const counts: Record<string, number> = { ALL: all.length }
  ISSUE_STATUSES.slice(0, -1).forEach((s) => {
    counts[s] = all.filter((i) => i.status === s).length
  })

  async function handleCreate() {
    if (!title.trim() || !description.trim()) return
    setSaving(true)
    try {
      await api.post("/issues", {
        title, description, severity,
        reviewDate: reviewDate || undefined
      })
      setLogOpen(false)
      setTitle(""); setDescription("")
      setSeverity("AMBER"); setReviewDate("")
      qc.invalidateQueries({ queryKey: ["issues"] })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Card>
        <StatusTabs
          statuses={ISSUE_STATUSES}
          labels={ISSUE_STATUS_LABELS}
          active={filterStatus}
          onChange={setFilterStatus}
          counts={counts}
        />
        {isLoading ? <Box sx={{ p: 2 }}><LoadingState /></Box> : null}
        {error ? <Box sx={{ p: 2 }}><ErrorState title="Failed to load issues" /></Box> : null}
        {!isLoading && !error && filtered.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <EmptyState
              title={filterStatus === "ALL" ? "No issues logged" : `No ${ISSUE_STATUS_LABELS[filterStatus]?.toLowerCase()} issues`}
              detail={filterStatus === "ALL" ? "Log an issue to get started." : "Try a different status filter."}
            />
          </Box>
        ) : null}
        {filtered.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Reference</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Review date</TableCell>
                  <TableCell>Logged</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((i) => (
                  <TableRow
                    key={i.id}
                    onClick={() => navigate(`/issues/${i.id}`)}
                    sx={{ cursor: "pointer", "&:hover": { bgcolor: "#f8fafc" } }}
                  >
                    <TableCell sx={{ fontWeight: 700, fontFamily: "monospace", fontSize: 12 }}>
                      {i.reference}
                    </TableCell>
                    <TableCell>{i.title}</TableCell>
                    <TableCell>
                      <Chip size="small" sx={severitySx(i.severity)} label={i.severity} />
                    </TableCell>
                    <TableCell>
                      <Chip size="small" sx={statusChipSx(i.status)}
                        label={ISSUE_STATUS_LABELS[i.status] ?? i.status} />
                    </TableCell>
                    <TableCell>
                      {i.reviewDate
                        ? new Date(i.reviewDate).toLocaleDateString("en-GB")
                        : "—"}
                    </TableCell>
                    <TableCell>{new Date(i.createdAt).toLocaleDateString("en-GB")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : null}
      </Card>

      <Dialog open={logOpen} onClose={() => setLogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Log issue</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ mt: 1 }}>
            <TextField label="Title" value={title}
              onChange={(e) => setTitle(e.target.value)} required fullWidth />
            <TextField label="Description" value={description}
              onChange={(e) => setDescription(e.target.value)}
              required fullWidth multiline rows={3} />
            <Stack direction="row" gap={2}>
              <TextField select label="Severity" value={severity}
                onChange={(e) => setSeverity(e.target.value)} fullWidth>
                <MenuItem value="GREEN">Green — low</MenuItem>
                <MenuItem value="AMBER">Amber — medium</MenuItem>
                <MenuItem value="RED">Red — high</MenuItem>
              </TextField>
              <TextField label="Review date" type="date"
                InputLabelProps={{ shrink: true }} value={reviewDate}
                onChange={(e) => setReviewDate(e.target.value)} fullWidth />
            </Stack>
            <Stack direction="row" justifyContent="flex-end" gap={1}>
              <Button onClick={() => setLogOpen(false)}>Cancel</Button>
              <Button variant="contained" onClick={handleCreate}
                disabled={saving || !title.trim() || !description.trim()}>
                {saving ? "Saving..." : "Log issue"}
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  )
}

type GrcView = "risks" | "issues"

export default function RisksIssuesPage() {
  const [view, setView] = React.useState<GrcView>("risks")
  const [logOpen, setLogOpen] = React.useState(false)

  const riskData = useQuery({
    queryKey: ["risks"],
    queryFn: async () => (await api.get<Risk[]>("/risks")).data
  })
  const issueData = useQuery({
    queryKey: ["issues"],
    queryFn: async () => (await api.get<Issue[]>("/issues")).data
  })

  const openRisks = (riskData.data ?? []).filter((r) => r.status !== "CLOSED").length
  const openIssues = (issueData.data ?? []).filter((i) => i.status !== "CLOSED").length

  React.useEffect(() => {
    setLogOpen(false)
  }, [view])

  return (
    <Box>
      {/* Title + log button on one line */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
        <Typography variant="h4">Risk & Issue Management</Typography>
        <Button variant="contained" onClick={() => setLogOpen(true)}>
          {view === "risks" ? "Log risk" : "Log issue"}
        </Button>
      </Stack>

      {/* Switcher pills on separate line below */}
      <Stack direction="row" spacing={1} sx={{ mb: 2.5 }}>
        <Button
          variant={view === "risks" ? "contained" : "outlined"}
          size="small"
          onClick={() => setView("risks")}
          sx={{ borderRadius: 10, px: 2 }}
        >
          <Stack direction="row" spacing={0.75} alignItems="center">
            <span>Risks</span>
            {openRisks > 0 ? (
              <Box sx={{
                bgcolor: view === "risks" ? "rgba(255,255,255,0.25)" : "#1d4ed8",
                color: "#fff", borderRadius: 10, px: 0.75, py: 0.1,
                fontSize: 11, fontWeight: 700, lineHeight: 1.6
              }}>
                {openRisks}
              </Box>
            ) : null}
          </Stack>
        </Button>
        <Button
          variant={view === "issues" ? "contained" : "outlined"}
          size="small"
          onClick={() => setView("issues")}
          sx={{ borderRadius: 10, px: 2 }}
        >
          <Stack direction="row" spacing={0.75} alignItems="center">
            <span>Issues</span>
            {openIssues > 0 ? (
              <Box sx={{
                bgcolor: view === "issues" ? "rgba(255,255,255,0.25)" : "#1d4ed8",
                color: "#fff", borderRadius: 10, px: 0.75, py: 0.1,
                fontSize: 11, fontWeight: 700, lineHeight: 1.6
              }}>
                {openIssues}
              </Box>
            ) : null}
          </Stack>
        </Button>
      </Stack>

      {view === "risks" ? <RisksView logOpen={logOpen} setLogOpen={setLogOpen} /> : null}
      {view === "issues" ? <IssuesView logOpen={logOpen} setLogOpen={setLogOpen} /> : null}
    </Box>
  )
}