import React from "react";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <Box sx={{ py: 6, display: "grid", placeItems: "center", gap: 1.5 }}>
      <CircularProgress size={26} />
      <Typography color="text.secondary">{label}</Typography>
    </Box>
  );
}

export function ErrorState({
  title = "Something went wrong",
  detail = "Please retry in a moment."
}: {
  title?: string;
  detail?: string;
}) {
  return (
    <Alert severity="error" sx={{ mb: 2 }}>
      <strong>{title}</strong> {detail}
    </Alert>
  );
}

export function EmptyState({
  title,
  detail
}: {
  title: string;
  detail: string;
}) {
  return (
    <Box
      sx={{
        py: 7,
        textAlign: "center",
        border: "1px dashed #cbd5e1",
        borderRadius: 2,
        bgcolor: "#f8fafc"
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      <Typography color="text.secondary">{detail}</Typography>
    </Box>
  );
}
