import generateTimeSlots from "./generateTimeSlots";
import { colorPalette } from "./components/colorPalette";
import BackspaceIcon from "@mui/icons-material/Backspace";
import { IconButton, Tooltip } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export default function ScheduleTable({
  schedules_loading,
  schedules_error,
  headers,
  timeSlotMap,
  onCellClick,
  schedules,
  selectedCourse,
  children,
  onRemoveSchedule = { handleRemoveSchedule },
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
    <div className="w-full relative border-t-6 border-t-red-800 bg-white p-6 rounded-2xl shadow-md border border-gray-300 overflow-x-auto">
      {/* header */}

      {schedules_error && <SchedulesError />}

      {schedules_loading && <SchedulesLoading />}

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
                      className={`group border relative border-x-gray-50 border-gray-300 text-center font-semibold cursor-pointer transition-all duration-200 ease-out
                        ${
                          course
                            ? `${courseColor.bg} ${courseColor.border} shadow-md scale-95 rounded-xl hover:scale-104`
                            : "hover:bg-green-50"
                        }`}
                    >
                      {course ? (
                        <div className="flex flex-col items-center justify-center">
                          <button
                            className="absolute top-2 right-2 group-hover:block hover:text-red-900 hidden cursor-pointer text-red-700 font-bold"
                            onClick={(e) => {
                              e.stopPropagation(); // prevent cell click event
                              onRemoveSchedule(
                                course.slot_day,
                                course.slot_time
                              );
                            }}
                            sx={{
                              // display: "none",
                              display: "block",
                              position: "absolute",
                              top: 0,
                              right: 0,
                              "&:hover": {
                                display: "block",
                              },
                            }}
                            title={`Remove ${course?.slot_course} ${header} - ${time.time_slot}?`}
                          >
                            <CloseIcon fontSize="medium" />
                          </button>
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

const SchedulesLoading = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center backdrop-blur-xs bg-white/40 z-10">
      <div className="bg-white border border-gray-300 shadow-xl px-8 py-6 rounded-2xl flex flex-col items-center gap-3 animate-fade-in">
        <div className="w-10 h-10 border-4 border-gray-300 border-t-red-800 rounded-full animate-spin"></div>
        <span className="text-lg font-semibold text-gray-700 flex items-center">
          Loading Schedules<span className="typing-dots ml-1"></span>
        </span>
      </div>

      <style jsx="true">{`
        .typing-dots::after {
          content: "...";
          animation: dots 1.2s steps(4, end) infinite;
        }
        @keyframes dots {
          0%,
          20% {
            content: "";
          }
          40% {
            content: ".";
          }
          60% {
            content: "..";
          }
          80%,
          100% {
            content: "...";
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

const SchedulesError = ({ onRetry }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center backdrop-blur-xs bg-white/40 z-10">
      <div className="bg-white border border-red-300 shadow-xl px-8 py-6 rounded-2xl flex flex-col items-center gap-4 animate-fade-in">
        <span className="text-xl font-bold text-red-700">
          Error Loading Schedule
        </span>
        <p className="text-gray-600 text-center">
          Something went wrong while fetching data.
        </p>

        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg shadow"
        >
          Retry
        </button>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};
