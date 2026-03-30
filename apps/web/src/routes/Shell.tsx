import React, { useState } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AppBar, Box, Button, Chip, Collapse, Drawer, IconButton, List,
  ListItemButton, ListItemIcon, ListItemText, MenuItem, Select,
  Toolbar, Typography, useMediaQuery, useTheme
} from "@mui/material"
import MenuIcon from "@mui/icons-material/Menu"
import DashboardIcon from "@mui/icons-material/Dashboard"
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber"
import WarningAmberIcon from "@mui/icons-material/WarningAmber"
import TaskAltIcon from "@mui/icons-material/TaskAlt"
import FactCheckIcon from "@mui/icons-material/FactCheck"
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts"
import ApartmentIcon from "@mui/icons-material/Apartment"
import HistoryIcon from "@mui/icons-material/History"
import LocationOnIcon from "@mui/icons-material/LocationOn"
import ReportProblemIcon from "@mui/icons-material/ReportProblem"
import WorkIcon from "@mui/icons-material/Work"
import WorkspacesIcon from "@mui/icons-material/Workspaces"
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd"
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck"
import StorageIcon from "@mui/icons-material/Storage"
import ExpandLessIcon from "@mui/icons-material/ExpandLess"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import LogoutIcon from "@mui/icons-material/Logout"
import { api, revokeAndLogout } from "../lib/api"
import { getCurrentUser } from "../lib/auth"
import { hasAnyRole, ORG_SUPER_ROLES, ROLES } from "../lib/rbac"
import { getSelectedClientId, setSelectedClientId } from "../lib/scope"

const drawerWidth = 248

// ── Nav structure ────────────────────────────────────────────────────────────

type NavItem = {
  label: string
  path: string
  icon: React.ReactNode
  roles: string[]
  badge?: "overdue" | "pending"
}

type NavSection = {
  title: string
  items: NavItem[]
  scopeIndependent?: boolean
}

const personalSection: NavSection = {
  title: "Personal",
  scopeIndependent: true,
  items: [
    {
      label: "My Work",
      path: "/my-work",
      icon: <AssignmentIndIcon fontSize="small" />,
      roles: [...ORG_SUPER_ROLES, ROLES.SERVICE_MANAGER, ROLES.SERVICE_DESK_ANALYST, ROLES.ENGINEER]
    },
    {
      label: "Overview",
      path: "/overview",
      icon: <WorkspacesIcon fontSize="small" />,
      roles: [...ORG_SUPER_ROLES, ROLES.SERVICE_MANAGER]
    }
  ]
}

const clientSections: NavSection[] = [
  {
    title: "",
    items: [
      {
        label: "Dashboard",
        path: "/",
        icon: <DashboardIcon fontSize="small" />,
        roles: Object.values(ROLES)
      }
    ]
  },
  {
    title: "Service Desk",
    items: [
      {
        label: "Service Desk",
        path: "/service-desk",
        icon: <ConfirmationNumberIcon fontSize="small" />,
        roles: [...ORG_SUPER_ROLES, ROLES.SERVICE_MANAGER, ROLES.SERVICE_DESK_ANALYST]
      },
      {
        label: "Risks & Issues",
        path: "/risks",
        icon: <ReportProblemIcon fontSize="small" />,
        roles: [...ORG_SUPER_ROLES, ROLES.SERVICE_MANAGER, ROLES.SERVICE_DESK_ANALYST, ROLES.ENGINEER, ROLES.CLIENT_VIEWER]
      }
    ]
  },
  {
    title: "Operations",
    items: [
      {
        label: "Sites",
        path: "/sites",
        icon: <LocationOnIcon fontSize="small" />,
        roles: [...ORG_SUPER_ROLES, ROLES.SERVICE_MANAGER, ROLES.SERVICE_DESK_ANALYST, ROLES.ENGINEER, ROLES.CLIENT_VIEWER]
      },
      {
        label: "Engineering Checks",
        path: "/checks",
        icon: <FactCheckIcon fontSize="small" />,
        roles: [...ORG_SUPER_ROLES, ROLES.SERVICE_MANAGER, ROLES.SERVICE_DESK_ANALYST, ROLES.ENGINEER]
      },
      {
        label: "Check Templates",
        path: "/check-templates",
        icon: <PlaylistAddCheckIcon fontSize="small" />,
        roles: [...ORG_SUPER_ROLES, ROLES.SERVICE_MANAGER]
      },
      {
        label: "Service Scope",
        path: "/work-packages",
        icon: <WorkIcon fontSize="small" />,
        roles: [...ORG_SUPER_ROLES, ROLES.SERVICE_MANAGER, ROLES.SERVICE_DESK_ANALYST]
      },
      {
        label: "Tasks",
        path: "/tasks",
        icon: <TaskAltIcon fontSize="small" />,
        roles: [...ORG_SUPER_ROLES, ROLES.SERVICE_MANAGER, ROLES.SERVICE_DESK_ANALYST, ROLES.ENGINEER]
      },
      {
        label: "Assets",
        path: "/assets",
        icon: <StorageIcon fontSize="small" />,
        roles: [...ORG_SUPER_ROLES, ROLES.SERVICE_MANAGER, ROLES.SERVICE_DESK_ANALYST, ROLES.ENGINEER, ROLES.CLIENT_VIEWER]
      }
    ]
  },
  {
    title: "Admin",
    items: [
      {
        label: "Clients",
        path: "/clients",
        icon: <ApartmentIcon fontSize="small" />,
        roles: [...ORG_SUPER_ROLES]
      },
      {
        label: "Users",
        path: "/users",
        icon: <ManageAccountsIcon fontSize="small" />,
        roles: [...ORG_SUPER_ROLES, ROLES.SERVICE_MANAGER]
      },
      {
        label: "Audit Trail",
        path: "/audit",
        icon: <HistoryIcon fontSize="small" />,
        roles: [...ORG_SUPER_ROLES, ROLES.SERVICE_MANAGER]
      }
    ]
  }
]

// ── Scope-independent paths ──────────────────────────────────────────────────
const SCOPE_INDEPENDENT_PATHS = ["/my-work", "/overview"]

// ── Nav item component ────────────────────────────────────────────────────────
function NavListItem({
  item,
  isActive,
  onClick
}: {
  item: NavItem
  isActive: boolean
  onClick: () => void
}) {
  return (
    <ListItemButton
      selected={isActive}
      onClick={onClick}
      sx={{
        borderRadius: 1,
        mb: 0.125,
        py: 0.65,
        px: 1,
        minHeight: 0,
        color: "#94a3b8",
        "& .MuiListItemIcon-root": { color: "#475569", minWidth: 28 },
        "&.Mui-selected": {
          bgcolor: "rgba(59,130,246,0.15)",
          color: "#e2e8f0",
          "& .MuiListItemIcon-root": { color: "#7db4f5" }
        },
        "&.Mui-selected:hover": { bgcolor: "rgba(59,130,246,0.22)" },
        "&:hover": { bgcolor: "rgba(255,255,255,0.04)", color: "#cbd5e1" }
      }}
    >
      <ListItemIcon>{item.icon}</ListItemIcon>
      <ListItemText
        primary={item.label}
        primaryTypographyProps={{ fontSize: 13, fontWeight: 500, lineHeight: 1.4 }}
      />
    </ListItemButton>
  )
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({
  title,
  collapsed,
  onToggle
}: {
  title: string
  collapsed: boolean
  onToggle: () => void
}) {
  return (
    <Box
      onClick={onToggle}
      sx={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        px: 2, pt: 2, pb: 0.5, cursor: "pointer"
      }}
    >
      <Typography sx={{
        color: "#64748b", fontWeight: 700, fontSize: 10,
        letterSpacing: "0.07em", textTransform: "uppercase"
      }}>
        {title}
      </Typography>
      {collapsed
        ? <ExpandMoreIcon sx={{ fontSize: 12, color: "#475569" }} />
        : <ExpandLessIcon sx={{ fontSize: 12, color: "#475569" }} />
      }
    </Box>
  )
}

// ── Main Shell ────────────────────────────────────────────────────────────────
export default function Shell() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const nav = useNavigate()
  const loc = useLocation()
  const isOrgSuper = hasAnyRole([...ORG_SUPER_ROLES])
  const canSwitchClients = hasAnyRole([...ORG_SUPER_ROLES, ROLES.SERVICE_MANAGER])
  const isPersonalView = hasAnyRole([...ORG_SUPER_ROLES, ROLES.SERVICE_MANAGER, ROLES.SERVICE_DESK_ANALYST, ROLES.ENGINEER])
  const queryClient = useQueryClient()
  const [selectedClientId, setSelectedClientIdState] = useState(getSelectedClientId() ?? "")
  const [loggingOut, setLoggingOut] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const currentUser = getCurrentUser()

  const isScopeIndependent = SCOPE_INDEPENDENT_PATHS.some(p => loc.pathname.startsWith(p))

  const clients = useQuery({
    queryKey: ["clients"],
    enabled: canSwitchClients,
    queryFn: async () => (await api.get<Array<{ id: string; name: string }>>("/clients")).data
  })

  React.useEffect(() => {
    if (!canSwitchClients) return
    if ((clients.data?.length ?? 0) === 0) return
    const selected =
      selectedClientId && clients.data?.some((c) => c.id === selectedClientId)
        ? selectedClientId
        : currentUser?.clientId && clients.data?.some((c) => c.id === currentUser.clientId)
          ? currentUser.clientId
          : clients.data?.[0]?.id ?? ""
    if (selected && selected !== selectedClientId) {
      setSelectedClientIdState(selected)
      setSelectedClientId(selected)
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] !== "clients" })
    }
  }, [clients.data, currentUser?.clientId, isOrgSuper, queryClient, selectedClientId])

  async function onLogout() {
    if (loggingOut) return
    setLoggingOut(true)
    await revokeAndLogout()
    setLoggingOut(false)
  }

  function navigateTo(path: string) {
    nav(path)
    setMobileOpen(false)
  }

  function toggleSection(title: string) {
    setCollapsed((prev) => ({ ...prev, [title]: !prev[title] }))
  }

  function handleClientChange(clientId: string) {
    setSelectedClientIdState(clientId)
    setSelectedClientId(clientId || null)
    queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] !== "clients" })
    // If on a scope-independent page, navigate to dashboard on client select
    if (isScopeIndependent && clientId) {
      nav("/")
    }
  }

  const selectedClient = (clients.data ?? []).find(c => c.id === selectedClientId)

  const navContent = (
    <Box sx={{
      display: "flex", flexDirection: "column", height: "100%",
      overflow: "hidden"
    }}>

      {isMobile ? (
        <IconButton
          onClick={() => setMobileOpen(true)}
          sx={{
            position: "fixed", top: 8, left: 8, zIndex: 1300,
            bgcolor: "#0d1526", color: "#e2e8f0",
            "&:hover": { bgcolor: "#1e293b" }
          }}
        >
          <MenuIcon />
        </IconButton>
      ) : null}

      {/* App logo / name */}
      <Box sx={{
        px: 2, py: 2, borderBottom: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0
      }}>
        <Typography sx={{
          fontWeight: 800, fontSize: 14, color: "#e2e8f0",
          letterSpacing: "0.01em", lineHeight: 1.2
        }}>
          Assured Digital
        </Typography>
        <Typography sx={{ fontSize: 11, color: "#475569", mt: 0.4, fontWeight: 500 }}>
          Service Management
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflow: "auto", py: 1 }}>

        {/* Personal section — scope independent */}
        {isPersonalView ? (
          <Box sx={{ mb: 0.5 }}>
            <Typography sx={{
              color: "#334155", fontWeight: 700, fontSize: 10,
              letterSpacing: "0.07em", textTransform: "uppercase",
              px: 2, pt: 1, pb: 0.5
            }}>
              Personal
            </Typography>
            <List dense disablePadding sx={{ px: 1 }}>
              {personalSection.items
                .filter(item => hasAnyRole(item.roles))
                .map(item => (
                  <NavListItem
                    key={item.path}
                    item={item}
                    isActive={loc.pathname === item.path}
                    onClick={() => navigateTo(item.path)}
                  />
                ))}
            </List>
          </Box>
        ) : null}

        {/* Client scope selector — the context boundary */}
        {canSwitchClients ? (
          <Box sx={{
            mx: 1.5, my: 1,
            borderTop: "1px solid rgba(255,255,255,0.06)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            py: 1
          }}>
            <Typography sx={{
              color: "#334155", fontWeight: 700, fontSize: 10,
              letterSpacing: "0.07em", textTransform: "uppercase",
              mb: 0.75, px: 0.5
            }}>
              Client Context
            </Typography>
            <Select
              size="small"
              value={selectedClientId}
              onChange={(e) => handleClientChange(e.target.value)}
              displayEmpty
              IconComponent={KeyboardArrowDownIcon}
              sx={{
                width: "100%",
                fontSize: 12.5,
                fontWeight: 600,
                color: "#e2e8f0",
                bgcolor: "rgba(255,255,255,0.06)",
                borderRadius: 1.5,
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255,255,255,0.1)"
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255,255,255,0.2)"
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#3b82f6"
                },
                "& .MuiSvgIcon-root": { color: "#475569" },
                "& .MuiSelect-select": { py: 0.875, px: 1.25 }
              }}
            >
              <MenuItem value="" sx={{ fontSize: 13, color: "#94a3b8" }}>
                — Select client —
              </MenuItem>
              {(clients.data ?? []).map((c) => (
                <MenuItem key={c.id} value={c.id} sx={{ fontSize: 13 }}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </Box>
        ) : null}

        {/* Context strip — shows which client is active */}
        {!isOrgSuper && currentUser?.clientId ? (
          <Box sx={{
            mx: 1.5, my: 1, px: 1.25, py: 0.875,
            bgcolor: "rgba(59,130,246,0.12)",
            border: "1px solid rgba(59,130,246,0.2)",
            borderRadius: 1.5
          }}>
            <Typography sx={{ fontSize: 10, color: "#7db4f5", fontWeight: 700, letterSpacing: "0.05em" }}>
              WORKING IN
            </Typography>
            <Typography sx={{ fontSize: 12, color: "#e2e8f0", fontWeight: 600, mt: 0.25 }}>
              {selectedClient?.name ?? "Your organisation"}
            </Typography>
          </Box>
        ) : selectedClient && !isScopeIndependent ? (
          <Box sx={{
            mx: 1.5, mb: 0.5, px: 1.25, py: 0.75,
            bgcolor: "rgba(59,130,246,0.08)",
            border: "1px solid rgba(59,130,246,0.15)",
            borderRadius: 1.5
          }}>
            <Typography sx={{ fontSize: 10, color: "#475569", fontWeight: 700, letterSpacing: "0.05em" }}>
              WORKING IN
            </Typography>
            <Typography sx={{ fontSize: 12, color: "#cbd5e1", fontWeight: 600, mt: 0.125 }}>
              {selectedClient.name}
            </Typography>
          </Box>
        ) : isScopeIndependent ? (
          <Box sx={{
            mx: 1.5, mb: 0.5, px: 1.25, py: 0.75,
            bgcolor: "rgba(148,163,184,0.08)",
            border: "1px solid rgba(148,163,184,0.15)",
            borderRadius: 1.5
          }}>
            <Typography sx={{ fontSize: 10, color: "#475569", fontWeight: 700, letterSpacing: "0.05em" }}>
              SCOPE
            </Typography>
            <Typography sx={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, mt: 0.125 }}>
              All clients
            </Typography>
          </Box>
        ) : null}

        {/* Client-scoped nav sections */}
        {clientSections.map((section) => {
          const visibleItems = section.items.filter(item => hasAnyRole(item.roles))
          if (visibleItems.length === 0) return null
          const isCollapsed = collapsed[section.title] ?? false

          return (
            <Box key={section.title || "top"}>
              {section.title ? (
                <SectionHeader
                  title={section.title}
                  collapsed={isCollapsed}
                  onToggle={() => toggleSection(section.title)}
                />
              ) : null}
              <Collapse in={!isCollapsed}>
                <List dense disablePadding sx={{
                  px: 1,
                  pt: section.title ? 0.25 : 0.75,
                  pb: 0
                }}>
                  {visibleItems.map(item => (
                    <NavListItem
                      key={item.path}
                      item={item}
                      isActive={loc.pathname === item.path}
                      onClick={() => navigateTo(item.path)}
                    />
                  ))}
                </List>
              </Collapse>
            </Box>
          )
        })}
      </Box>

      {/* User account at bottom */}
      <Box sx={{
        flexShrink: 0,
        borderTop: "1px solid rgba(255,255,255,0.06)",
        px: 1.5, py: 1
      }}>
        <Box sx={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 1
        }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{
              fontSize: 11.5, fontWeight: 600, color: "#cbd5e1",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
            }}>
              {currentUser?.email?.split("@")[0] ?? "User"}
            </Typography>
            <Typography sx={{ fontSize: 10, color: "#475569" }}>
              {currentUser?.role?.toLowerCase().replace(/_/g, " ") ?? ""}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={onLogout}
            disabled={loggingOut}
            sx={{
              color: "#475569", flexShrink: 0,
              "&:hover": { color: "#e2e8f0", bgcolor: "rgba(255,255,255,0.06)" }
            }}
          >
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: "flex" }}>
      {/* Simplified top bar — no client dropdown */}
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
            background: "#0d1526",
            color: "#dbe7ff",
            borderRight: "1px solid rgba(255,255,255,0.05)"
          }
        }}
      >
        {navContent}
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 1.5, md: 3 } }}>
        <Outlet />
      </Box>
    </Box>
  )
}