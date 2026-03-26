import React from "react"
import { Box, Stack, Tooltip, Typography } from "@mui/material"
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"
import CheckIcon from "@mui/icons-material/Check"

export interface WorkflowStage {
  id: string
  label: string
  description?: string
}

interface WorkflowStripProps {
  stages: WorkflowStage[]
  currentStage: string
  nextStages?: string[]
  onTransition?: (stageId: string) => void
  canTransition?: boolean
  mb?: number
  specialStageColors?: Record<string, string>
}

export function WorkflowStrip({
  stages,
  currentStage,
  nextStages = [],
  onTransition,
  canTransition = false,
  mb = 3,
  specialStageColors = {}
}: WorkflowStripProps) {
  const currentIndex = stages.findIndex(s => s.id === currentStage)

  return (
    <Box sx={{
      border: "0.5px solid var(--color-border-tertiary)",
      borderTop: "none",
      borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
      bgcolor: "var(--color-background-primary)",
      px: 2.5, pt: 1.5, pb: 2, mb
    }}>
      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1.5 }}>
        <Typography sx={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.07em",
          color: "var(--color-text-tertiary)"
        }}>
          STATUS
        </Typography>
        <Tooltip
          title={
            canTransition && onTransition
              ? "Click an available stage to transition this record. Stages shown in blue are available next steps."
              : "Use the action buttons above to transition this record through its lifecycle."
          }
          placement="right"
          arrow
        >
          <InfoOutlinedIcon sx={{
            fontSize: 13, color: "var(--color-text-tertiary)", cursor: "help"
          }} />
        </Tooltip>
      </Stack>

      <Stack direction="row" spacing={0} alignItems="stretch">
        {stages.map((stage, idx) => {
          const isCurrent = stage.id === currentStage
          const isPast = idx < currentIndex
          const isNext = nextStages.includes(stage.id) && canTransition && !!onTransition
          const specialColor = isCurrent ? (specialStageColors[stage.id] ?? "#0f172a") : null

          return (
            <React.Fragment key={stage.id}>
              <Tooltip
                title={stage.description ?? ""}
                placement="bottom"
                arrow
                disableHoverListener={!stage.description}
              >
                <Box
                  onClick={isNext ? () => onTransition?.(stage.id) : undefined}
                  sx={{
                    flex: 1, px: 1.5, py: 1.25, borderRadius: 1.5,
                    cursor: isNext ? "pointer" : "default",
                    bgcolor: isCurrent
                      ? specialColor!
                      : isPast ? "#f1f5f9"
                      : isNext ? "#eff6ff"
                      : "transparent",
                    border: "1px solid",
                    borderColor: isCurrent
                      ? specialColor!
                      : isPast ? "var(--color-border-tertiary)"
                      : isNext ? "#bfdbfe"
                      : "transparent",
                    transition: "all 0.15s",
                    "&:hover": isNext ? { bgcolor: "#dbeafe", borderColor: "#93c5fd" } : {}
                  }}
                >
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    {isCurrent ? (
                      <Box sx={{
                        width: 16, height: 16, borderRadius: "50%", bgcolor: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                      }}>
                        <CheckIcon sx={{ fontSize: 11, color: specialColor! }} />
                      </Box>
                    ) : isPast ? (
                      <Box sx={{
                        width: 16, height: 16, borderRadius: "50%", bgcolor: "#cbd5e1",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                      }}>
                        <CheckIcon sx={{ fontSize: 11, color: "#fff" }} />
                      </Box>
                    ) : (
                      <Box sx={{
                        width: 16, height: 16, borderRadius: "50%",
                        border: isNext ? "1.5px solid #3b82f6" : "1.5px solid #e2e8f0",
                        flexShrink: 0
                      }} />
                    )}
                    <Typography sx={{
                      fontSize: 12, fontWeight: isCurrent ? 700 : 500,
                      color: isCurrent ? "#fff"
                        : isPast ? "#94a3b8"
                        : isNext ? "#1d4ed8"
                        : "var(--color-text-tertiary)"
                    }}>
                      {stage.label}
                    </Typography>
                  </Stack>
                </Box>
              </Tooltip>

              {idx < stages.length - 1 ? (
                <Box sx={{
                  width: 20, display: "flex", alignItems: "center",
                  justifyContent: "center", flexShrink: 0
                }}>
                  <Box sx={{ width: 12, height: 1, bgcolor: "var(--color-border-tertiary)" }} />
                </Box>
              ) : null}
            </React.Fragment>
          )
        })}
      </Stack>
    </Box>
  )
}