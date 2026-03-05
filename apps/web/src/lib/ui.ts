export function statusChipSx(status: string) {
  const s = status.toUpperCase();

  if (s.includes("CLOSED") || s.includes("COMPLETED") || s.includes("RESOLVED")) {
    return { bgcolor: "#e7f8ee", color: "#0f7a42", fontWeight: 700 };
  }
  if (s.includes("IN_PROGRESS") || s.includes("ASSIGNED") || s.includes("OPEN")) {
    return { bgcolor: "#e8f1ff", color: "#1d4ed8", fontWeight: 700 };
  }
  if (s.includes("NEW") || s.includes("DRAFT")) {
    return { bgcolor: "#fff5e8", color: "#b45309", fontWeight: 700 };
  }
  if (s.includes("FAIL") || s.includes("CANCELLED")) {
    return { bgcolor: "#fdecec", color: "#b42318", fontWeight: 700 };
  }
  return { bgcolor: "#eef2f7", color: "#334155", fontWeight: 700 };
}

export function priorityChipSx(priority: string) {
  const p = priority.toLowerCase();
  if (p === "high") return { bgcolor: "#fdecec", color: "#b42318", fontWeight: 700 };
  if (p === "medium") return { bgcolor: "#fff5e8", color: "#b45309", fontWeight: 700 };
  return { bgcolor: "#eef2f7", color: "#475569", fontWeight: 700 };
}
