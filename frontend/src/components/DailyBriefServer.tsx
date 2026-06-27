import { api } from "@/lib/api";
import DailyBriefCard, { DailyBriefCardError } from "./DailyBriefCard";

export default async function DailyBriefServer() {
  try {
    const brief = await api.getDailyBrief();
    return <DailyBriefCard brief={brief} />;
  } catch {
    return <DailyBriefCardError />;
  }
}
