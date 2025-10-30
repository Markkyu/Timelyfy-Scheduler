import generateTimeSlots from "./generateTimeSlots";
import { colorPalette } from "./components/colorPalette";

export default function ScheduleTable({
  headers,
  timeSlotMap,
  onCellClick,
  schedules,
  selectedCourse,
  children,
}) {
  const timeSlots = generateTimeSlots();

  const findCourseAt = (dayIndex, timeIndex) =>
    schedules?.find(
      (s) => s.slot_day === dayIndex && s.slot_time === timeIndex
    );

  const isLunchBreak = (timeIndex) => timeIndex === 10 || timeIndex === 11;

  // Assign a consistent color per course name/id
  const courseColorMap = {};
  let colorIndex = 0;
  schedules?.forEach((sched) => {
    const key = sched.slot_course;
    if (!courseColorMap[key]) {
      courseColorMap[key] = colorPalette[colorIndex % colorPalette.length];
      colorIndex++;
    }
  });

  return (
    <div className="w-full border-t-6 border-t-red-800 bg-white p-6 rounded-2xl shadow-md border border-gray-300 overflow-x-auto">
      {/* header */}
      <header className="flex justify-between mb-4">
        <h2 className="text-2xl font-semibold text-red-800 mb-4">
          Weekly Schedule
        </h2>

        <div className="flex gap-4">{children}</div>
      </header>

      <table className="w-full border-collapse text-sm text-gray-700 border-x-2">
        <thead>
          <tr className="bg-gray-800 text-gray-50">
            <th className="border border-gray-300 px-4 py-3 text-center font-semibold">
              TIME
            </th>
            {headers?.map((weekday, i) => (
              <th
                key={i}
                className="border border-gray-300 px-4 py-3 text-center font-semibold uppercase tracking-wide"
              >
                {weekday}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {timeSlots.map((time, timeIndex) => {
            const alternating = timeIndex % 2 === 0;

            return (
              <tr key={timeIndex} className={`transition-colors`}>
                <td
                  className={`border-y border-l border-gray-300 px-3 py-4 text-center font-medium text-gray-800 `}
                >
                  {time.time_slot}
                </td>

                {headers.map((header, dayIndex) => {
                  const course = findCourseAt(dayIndex, timeIndex);

                  // Handle Lunch Break
                  if (isLunchBreak(timeIndex)) {
                    return (
                      <td
                        key={`${dayIndex}-${timeIndex}`}
                        className="border border-gray-300 px-4 py-3 text-center text-gray-500 bg-amber-50 font-medium italic select-none cursor-not-allowed"
                      >
                        Lunch Break
                      </td>
                    );
                  }

                  // Skip merged cells
                  const previous = findCourseAt(dayIndex, timeIndex - 1);
                  if (
                    previous &&
                    previous.slot_course === course?.slot_course
                  ) {
                    return null;
                  }

                  // Merge course cells (rowSpan)
                  let rowSpan = 1;
                  if (course) {
                    for (let i = timeIndex + 1; i < timeSlots.length; i++) {
                      const next = findCourseAt(dayIndex, i);
                      if (next && next.slot_course === course.slot_course) {
                        rowSpan++;
                      } else break;
                    }
                  }

                  // Apply course color if exists
                  const courseColor =
                    course && courseColorMap[course.slot_course]
                      ? courseColorMap[course.slot_course]
                      : null;

                  return (
                    <td
                      key={`${dayIndex}-${timeIndex}`}
                      rowSpan={rowSpan}
                      onClick={() => {
                        if (!selectedCourse && course) {
                          console.log(course, time);
                          return;
                        }

                        onCellClick(course, dayIndex, timeIndex);
                      }}
                      className={`group border border-x-gray-50 border-gray-300 text-center font-semibold cursor-pointer transition-all duration-200 ease-out
                        ${
                          course
                            ? `${courseColor.bg} ${courseColor.border} shadow-md scale-95 rounded-xl hover:scale-104`
                            : "hover:bg-green-50"
                        }`}
                    >
                      {course ? (
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-base font-semibold">
                            {course.slot_course}
                          </span>
                        </div>
                      ) : (
                        ""
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
