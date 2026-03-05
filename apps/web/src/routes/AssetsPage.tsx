import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import {
  Box,
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
import { EmptyState, ErrorState, LoadingState } from "../components/PageState";

type Asset = {
  id: string;
  assetTag: string;
  name: string;
  assetType: string;
  ownerType: string;
  location?: string | null;
};

export default function AssetsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["assets"],
    queryFn: async () => (await api.get<Asset[]>("/assets")).data
  });

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Assets
      </Typography>
      <Card>
        <CardContent>
          {isLoading ? <LoadingState /> : null}
          {error ? <ErrorState title="Failed to load assets" /> : null}
          {!isLoading && !error && (data?.length ?? 0) === 0 ? (
            <EmptyState title="No assets found" detail="Assets will appear once inventory is onboarded." />
          ) : null}

          <TableContainer>
          <Table sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow>
                <TableCell>Asset Tag</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>Location</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(data ?? []).map((a) => (
                <TableRow key={a.id}>
                  <TableCell sx={{ fontWeight: 700 }}>{a.assetTag}</TableCell>
                  <TableCell>{a.name}</TableCell>
                  <TableCell>{a.assetType}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      sx={{ bgcolor: a.ownerType === "INTERNAL" ? "#e8f1ff" : "#e7f8ee", color: "#1e3a8a", fontWeight: 700 }}
                      label={a.ownerType.toLowerCase()}
                    />
                  </TableCell>
                  <TableCell>{a.location ?? "-"}</TableCell>
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
