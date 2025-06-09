import { useContext } from "react";
import { useDashboardStats as useDashboardStatsContext } from "../contexts/DashboardStatsContext";

export const useDashboardStats = () => {
  return useDashboardStatsContext();
};
