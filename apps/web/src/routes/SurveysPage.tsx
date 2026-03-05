import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import {
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
  TableContainer,
  Typography
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { statusChipSx } from "../lib/ui";

type Survey = {
  id: string;
  title: string;
  surveyType: string;
  status: string;
  scheduledAt?: string | null;
  items?: any[];
};

export default function SurveysPage() {
  const nav = useNavigate();
  const { data, isLoading, error } = useQuery({
    queryKey: ["surveys"],
    queryFn: async () => (await api.get<Survey[]>("/surveys")).data
  });

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Surveys & Audits
      </Typography>
      <Card>
        <CardContent>
          {isLoading ? <Typography>Loading…</Typography> : null}
          {error ? <Typography color="error">Failed to load</Typography> : null}

          <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Scheduled</TableCell>
                <TableCell>Items</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(data ?? []).map((s) => (
                <TableRow key={s.id}>
                  <TableCell sx={{ fontWeight: 700 }}>{s.title}</TableCell>
                  <TableCell>{s.surveyType}</TableCell>
                  <TableCell>
                    <Chip size="small" sx={statusChipSx(s.status)} label={s.status.toLowerCase().replaceAll("_"," ")} />
                  </TableCell>
                  <TableCell>{s.scheduledAt ? new Date(s.scheduledAt).toLocaleDateString() : "-"}</TableCell>
                  <TableCell>{s.items?.length ?? 0}</TableCell>
                  <TableCell align="right">
                    <Button size="small" variant="outlined" onClick={() => nav(`/surveys/${s.id}`)}>
                      Open
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
