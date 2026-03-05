import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { api, type ApiError } from "../lib/api";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  TextField,
  Typography
} from "@mui/material";
import { statusChipSx } from "../lib/ui";

type SurveyItem = {
  id: string;
  label: string;
  response: "PASS" | "FAIL" | "NA" | null;
  notes?: string | null;
};

type Survey = {
  id: string;
  title: string;
  surveyType: string;
  status: "DRAFT" | "IN_PROGRESS" | "COMPLETED";
  items: SurveyItem[];
};

export default function SurveyDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [newLabel, setNewLabel] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["survey-detail", id],
    queryFn: async () => (await api.get<Survey>(`/surveys/${id}`)).data,
    enabled: !!id
  });

  const [drafts, setDrafts] = useState<Record<string, { response: string; notes: string }>>({});

  const mergedItems = useMemo(
    () =>
      (data?.items ?? []).map((item) => ({
        ...item,
        draftResponse: drafts[item.id]?.response ?? (item.response ?? ""),
        draftNotes: drafts[item.id]?.notes ?? (item.notes ?? "")
      })),
    [data?.items, drafts]
  );

  const start = useMutation({
    mutationFn: async () => (await api.post(`/surveys/${id}/start`)).data,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["survey-detail", id] });
      await qc.invalidateQueries({ queryKey: ["surveys"] });
    }
  });

  const addItem = useMutation({
    mutationFn: async () => (await api.post(`/surveys/${id}/items`, { label: newLabel })).data,
    onSuccess: async () => {
      setNewLabel("");
      await qc.invalidateQueries({ queryKey: ["survey-detail", id] });
      await qc.invalidateQueries({ queryKey: ["surveys"] });
    }
  });

  const updateItem = useMutation({
    mutationFn: async (payload: { itemId: string; response: string; notes: string }) =>
      (
        await api.post(`/surveys/${id}/items/${payload.itemId}`, {
          response: payload.response || undefined,
          notes: payload.notes
        })
      ).data,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["survey-detail", id] });
    }
  });

  const complete = useMutation({
    mutationFn: async () => (await api.post(`/surveys/${id}/complete`)).data,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["survey-detail", id] });
      await qc.invalidateQueries({ queryKey: ["surveys"] });
    }
  });

  const mutationError = [start.error, addItem.error, updateItem.error, complete.error].find(Boolean) as
    | ApiError
    | undefined;
  const mutationErrorMessage = Array.isArray(mutationError?.message)
    ? mutationError?.message.join(", ")
    : mutationError?.message;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Survey Execution
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Execute checklist responses with controlled lifecycle transitions.
      </Typography>

      {isLoading ? <Typography>Loading…</Typography> : null}
      {error ? <Alert severity="error">Failed to load survey</Alert> : null}
      {mutationErrorMessage ? <Alert severity="error" sx={{ mb: 2 }}>{mutationErrorMessage}</Alert> : null}

      {data ? (
        <Stack spacing={2}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h6">{data.title}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.75 }}>
                    {data.surveyType}
                  </Typography>
                </Box>
                <Chip sx={statusChipSx(data.status)} label={data.status.toLowerCase().replaceAll("_", " ")} />
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => start.mutate()}
                  disabled={data.status !== "DRAFT" || start.isPending}
                >
                  Start Survey
                </Button>
                <Button
                  variant="contained"
                  onClick={() => complete.mutate()}
                  disabled={data.status === "COMPLETED" || complete.isPending}
                >
                  Complete Survey
                </Button>
              </Stack>

              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <TextField
                  label="New checklist item"
                  fullWidth
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  disabled={data.status === "COMPLETED"}
                />
                <Button
                  variant="outlined"
                  onClick={() => addItem.mutate()}
                  disabled={!newLabel.trim() || data.status === "COMPLETED" || addItem.isPending}
                >
                  Add Item
                </Button>
              </Stack>

              <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Checklist Item</TableCell>
                    <TableCell>Response</TableCell>
                    <TableCell>Notes</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mergedItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.label}</TableCell>
                      <TableCell sx={{ width: 180 }}>
                        <TextField
                          select
                          size="small"
                          fullWidth
                          value={item.draftResponse}
                          disabled={data.status === "COMPLETED"}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [item.id]: {
                                response: e.target.value,
                                notes: prev[item.id]?.notes ?? item.draftNotes
                              }
                            }))
                          }
                        >
                          <MenuItem value="">-</MenuItem>
                          <MenuItem value="PASS">PASS</MenuItem>
                          <MenuItem value="FAIL">FAIL</MenuItem>
                          <MenuItem value="NA">NA</MenuItem>
                        </TextField>
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          value={item.draftNotes}
                          disabled={data.status === "COMPLETED"}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [item.id]: {
                                response: prev[item.id]?.response ?? item.draftResponse,
                                notes: e.target.value
                              }
                            }))
                          }
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={data.status === "COMPLETED" || updateItem.isPending}
                          onClick={() =>
                            updateItem.mutate({
                              itemId: item.id,
                              response: item.draftResponse,
                              notes: item.draftNotes
                            })
                          }
                        >
                          Save
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Stack>
      ) : null}
    </Box>
  );
}
