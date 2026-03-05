import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type ApiError } from "../lib/api";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";

type Submission = {
  id: string;
  requesterName: string;
  requesterEmail: string;
  subject: string;
  status: string;
  createdAt: string;
  convertedServiceRequestId?: string | null;
};

export default function TriagePage() {
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["triage-submissions"],
    queryFn: async () => (await api.get<Submission[]>("/public-submissions")).data
  });

  const convert = useMutation({
    mutationFn: async (id: string) =>
      (await api.post(`/public-submissions/${id}/convert`, { priority: "medium" })).data,
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["triage-submissions"] }),
        qc.invalidateQueries({ queryKey: ["service-requests"] }),
        qc.invalidateQueries({ queryKey: ["srs"] })
      ]);
    }
  });

  const convertError = convert.error as ApiError | null;
  const convertErrorMessage = Array.isArray(convertError?.message)
    ? convertError?.message.join(", ")
    : convertError?.message;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Triage
      </Typography>
      <Card>
        <CardContent>
          {isLoading ? <Typography>Loading…</Typography> : null}
          {error ? <Typography color="error">Failed to load triage inbox</Typography> : null}
          {convertError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {convertErrorMessage ?? "Failed to convert submission"}
            </Alert>
          ) : null}

          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Requester</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(data ?? []).map((row) => {
                const canConvert = row.status === "NEW";
                return (
                  <TableRow key={row.id}>
                    <TableCell>{row.requesterName}</TableCell>
                    <TableCell>{row.requesterEmail}</TableCell>
                    <TableCell>{row.subject}</TableCell>
                    <TableCell>
                      <Chip size="small" label={row.status.toLowerCase()} />
                    </TableCell>
                    <TableCell>{new Date(row.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="contained"
                        disabled={!canConvert || convert.isPending}
                        onClick={() => convert.mutate(row.id)}
                      >
                        {canConvert ? "Convert" : "Converted"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}
