import { Box, Typography } from "@mui/material"

export default function MyWorkPage() {
  return (
    <Box>
      <Typography variant="h4">My Work</Typography>
      <Typography color="text.secondary" sx={{ mt: 0.5 }}>
        Coming soon — your assigned checks and tasks across all clients.
      </Typography>
    </Box>
  )
}