import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Box, Card, CardContent, Grid, Typography } from "@mui/material";

type SR = { id: string; status: string };
type Asset = { id: string };
type Survey = { id: string; status: string };
type Submission = { id: string; status: string };

export default function DashboardPage() {
  const srs = useQuery({ queryKey: ["srs"], queryFn: async () => (await api.get<SR[]>("/service-requests")).data });
  const assets = useQuery({ queryKey: ["assets"], queryFn: async () => (await api.get<Asset[]>("/assets")).data });
  const surveys = useQuery({ queryKey: ["surveys"], queryFn: async () => (await api.get<Survey[]>("/surveys")).data });
  const triage = useQuery({
    queryKey: ["triage-submissions"],
    queryFn: async () => (await api.get<Submission[]>("/public-submissions")).data
  });

  const triageInbox = (triage.data ?? []).filter((x) => x.status === "NEW").length;
  const openTickets = (srs.data ?? []).filter((x) => x.status !== "CLOSED").length;
  const degradedAssets = 0; // placeholder for asset health modelling
  const activeSurveys = (surveys.data ?? []).filter((x) => x.status !== "COMPLETED").length;

  const cards = [
    { label: "Triage Inbox", value: triageInbox },
    { label: "Open Tickets", value: openTickets },
    { label: "Assets", value: assets.data?.length ?? 0 },
    { label: "Degraded Assets", value: degradedAssets },
    { label: "Active Surveys", value: activeSurveys }
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Dashboard
      </Typography>
      <Grid container spacing={2}>
        {cards.map((c) => (
          <Grid item xs={12} sm={6} md={2.4 as any} key={c.label}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                  {c.label}
                </Typography>
                <Typography variant="h3" sx={{ mt: 1 }}>
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
