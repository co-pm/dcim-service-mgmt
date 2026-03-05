import React, { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AppBar, Box, Button, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import InboxIcon from "@mui/icons-material/Inbox";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import StorageIcon from "@mui/icons-material/Storage";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import { revokeAndLogout } from "../lib/api";

const drawerWidth = 280;

const items = [
  { label: "Dashboard", path: "/", icon: <DashboardIcon /> },
  { label: "Triage", path: "/triage", icon: <InboxIcon /> },
  { label: "Service Requests", path: "/service-requests", icon: <ConfirmationNumberIcon /> },
  { label: "Assets", path: "/assets", icon: <StorageIcon /> },
  { label: "Surveys & Audits", path: "/surveys", icon: <FactCheckIcon /> }
];

export default function Shell() {
  const nav = useNavigate();
  const loc = useLocation();
  const [loggingOut, setLoggingOut] = useState(false);

  async function onLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    await revokeAndLogout();
    setLoggingOut(false);
  }

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            DCMS v1.0
          </Typography>
          <Button color="inherit" onClick={onLogout} disabled={loggingOut}>
            {loggingOut ? "Signing out..." : "Logout"}
          </Button>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: "border-box" }
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: "auto" }}>
          <List>
            {items.map((it) => (
              <ListItemButton key={it.path} selected={loc.pathname === it.path} onClick={() => nav(it.path)}>
                <ListItemIcon>{it.icon}</ListItemIcon>
                <ListItemText primary={it.label} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
