import { queryOptions, useQuery } from "@tanstack/react-query";
import getSchedules from "./getSchedules";

export default function createSchedulesQueryOptions(
  classGroup,
  year,
  semester
) {
  return queryOptions({
    queryKey: ["schedules"],
    queryFn: () => getSchedules(classGroup, year, semester),
    cacheTime: 1000 * 60 * 2,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}
