// import generateTimeSlots from "./generateTimeSlots";

// export default function ScheduleTable({
//   headers,
//   timeSlotMap,
//   onCellClick,
//   schedules,
// }) {
//   const timeSlots = generateTimeSlots();

//   const findCourseAt = (dayIndex, timeIndex) =>
//     schedules?.find(
//       (s) => s.slot_day === dayIndex && s.slot_time === timeIndex
//     );

//   const isLunchBreak = (timeIndex) => timeIndex === 10 || timeIndex === 11;

//   return (
//     <div className="bg-white p-4 rounded-xl">
//       <table className="min-w-3xl 2xl:min-w-5xl mx-auto border-collapse">
//         <thead>
//           <tr>
//             <th className="border border-gray-400 px-4 py-2 bg-gray-100">
//               Time
//             </th>
//             {headers?.map((weekday, i) => (
//               <th
//                 key={i}
//                 className="border border-gray-400 px-4 py-2 bg-gray-100 font-semibold text-center"
//               >
//                 {weekday}
//               </th>
//             ))}
//           </tr>
//         </thead>

//         <tbody>
//           {timeSlots.map((time, timeIndex) => {
//             const alternating = timeIndex % 2 === 0;

//             return (
//               <tr key={timeIndex} className="bg-white">
//                 {/* Time Column */}
//                 <td
//                   className={`border border-gray-400 px-4 py-2 text-center ${
//                     alternating ? "font-bold" : "font-medium text-gray-500"
//                   }`}
//                 >
//                   {time.time_slot}
//                 </td>

//                 {/* Day Columns */}
//                 {headers.map((_, dayIndex) => {
//                   const course = findCourseAt(dayIndex, timeIndex);

//                   // Handle lunch break
//                   if (isLunchBreak(timeIndex)) {
//                     return (
//                       <td
//                         key={`${dayIndex}-${timeIndex}`}
//                         className="border border-gray-400 px-4 py-2 text-center bg-gray-200 text-gray-500 cursor-not-allowed"
//                       >
//                         Lunch Break
//                       </td>
//                     );
//                   }

//                   // Skip cell if it's already part of a merged block
//                   const previous = findCourseAt(dayIndex, timeIndex - 1);
//                   if (
//                     previous &&
//                     previous.slot_course === course?.slot_course
//                   ) {
//                     return null; // skip rendering (merged cell)
//                   }

//                   // Determine how many rows to span (merge)
//                   let rowSpan = 1;
//                   if (course) {
//                     for (let i = timeIndex + 1; i < timeSlots.length; i++) {
//                       const next = findCourseAt(dayIndex, i);
//                       if (next && next.slot_course === course.slot_course) {
//                         rowSpan++;
//                       } else break;
//                     }
//                   }

//                   return (
//                     <td
//                       key={`${dayIndex}-${timeIndex}`}
//                       rowSpan={rowSpan}
//                       onClick={() => onCellClick(course, dayIndex, timeIndex)}
//                       className={`border border-gray-400 px-4 py-2 text-center font-semibold transition cursor-pointer ${
//                         course
//                           ? "bg-blue-100 hover:bg-blue-200 text-xl outline-4 outline-blue-400 -outline-offset-4 transition-all ease-out duration-200"
//                           : "hover:bg-blue-100 "
//                       }`}
//                     >
//                       {course ? course.slot_course : ""}
//                     </td>
//                   );
//                 })}
//               </tr>
//             );
//           })}
//         </tbody>
//       </table>
//     </div>
//   );
// }

import generateTimeSlots from "./generateTimeSlots";

export default function ScheduleTable({
  headers,
  timeSlotMap,
  onCellClick,
  schedules,
  selectedCourse,
}) {
  const timeSlots = generateTimeSlots();

  const findCourseAt = (dayIndex, timeIndex) =>
    schedules?.find(
      (s) => s.slot_day === dayIndex && s.slot_time === timeIndex
    );

  const isLunchBreak = (timeIndex) => timeIndex === 10 || timeIndex === 11;

  // 🎨 Define 4 color variants (soft pastel tones)
  const colorPalette = [
    {
      bg: "bg-blue-100 hover:bg-blue-200 text-blue-800",
      border: "border-blue-300",
    },
    {
      bg: "bg-green-100 hover:bg-green-200 text-green-800",
      border: "border-green-300",
    },
    {
      bg: "bg-yellow-100 hover:bg-yellow-200 text-yellow-800",
      border: "border-yellow-300",
    },
    {
      bg: "bg-pink-100 hover:bg-pink-200 text-pink-800",
      border: "border-pink-300",
    },
  ];

  // 🗺️ Assign a consistent color per course name/id
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
    <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-300 overflow-x-auto">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Weekly Schedule
      </h2>

      <table className="min-w-5xl 2xl:min-w-7xl w-full border-collapse text-sm text-gray-700">
        <thead>
          <tr className="bg-gray-100 text-gray-800">
            <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
              Time
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
              <tr
                key={timeIndex}
                className={`${
                  alternating ? "bg-gray-50" : "bg-white"
                } transition-colors`}
              >
                {/* Time Column */}
                <td
                  className={`border border-gray-300 px-3 py-2 text-center font-medium text-gray-800 ${
                    alternating ? "bg-gray-100" : "bg-gray-50"
                  }`}
                >
                  {time.time_slot}
                </td>

                {/* Day Columns */}
                {headers.map((_, dayIndex) => {
                  const course = findCourseAt(dayIndex, timeIndex);

                  // Handle Lunch Break
                  if (isLunchBreak(timeIndex)) {
                    return (
                      <td
                        key={`${dayIndex}-${timeIndex}`}
                        className="border border-gray-300 px-4 py-3 text-center text-gray-500 bg-amber-50 font-medium italic select-none"
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
                      className={`border border-gray-300 px-3 py-2 text-center font-semibold cursor-pointer transition-all duration-200 ease-out
                        ${
                          course
                            ? `${courseColor.bg} ${courseColor.border} shadow-sm scale-100`
                            : "hover:bg-green-100"
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
