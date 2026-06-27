import { api } from "@/lib/api";
import DailyBriefCard, { DailyBriefCardError } from "./DailyBriefCard";

export default async function DailyBriefServer() {
  try {
    const brief = await api.getDailyBrief();
    return <DailyBriefCard brief={brief} />;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    return <DailyBriefCardError />;
  }
}
