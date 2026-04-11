export function getUpgradeMessage(error) {
  const detail = error?.response?.data?.detail;
  if (detail && typeof detail === "object" && detail.code === "UPGRADE_REQUIRED") {
    const base = detail.message || "This feature requires a higher plan.";
    const upgrade = detail.upgrade_to
      ? ` Upgrade to ${detail.upgrade_to.toUpperCase()} to continue.`
      : "";
    return `${base}${upgrade}`;
  }
  return null;
}
