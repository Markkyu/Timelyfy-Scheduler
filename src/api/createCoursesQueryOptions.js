import { queryOptions, useQuery } from "@tanstack/react-query";
import { getCourses } from "./getCourses";

export default function createCoursesQueryOptions(classGroup, year, semester) {
  return queryOptions({
    queryKey: ["courses"],
    queryFn: () => getCourses(classGroup, year, semester),
    cacheTime: 1000 * 60 * 2, // 2 minutes
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
}
