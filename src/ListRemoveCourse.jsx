import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";

export default function ListRemoveCourse({ newSchedules, onRemoveCourse }) {
  if (!newSchedules || newSchedules.length === 0)
    return (
      <section className="bg-white w-full p-4 rounded-md">
        <h1 className="text-2xl font-semibold mb-2">Remove schedules:</h1>
        <p className="italic text-gray-500">No plotted schedules.</p>
      </section>
    );

  const groupedList = Object.groupBy(
    newSchedules,
    (sched) => sched?.slot_course
  );

  return (
    <section className="bg-white space-y-4 w-full p-4 rounded-md">
      <h1 className="text-2xl font-semibold">Remove schedules:</h1>

      {Object.entries(groupedList).map(([courseId, schedules]) => (
        <div
          key={courseId}
          className="border px-6 py-4 rounded flex justify-between items-center"
        >
          <h3 className="font-semibold text-lg">{courseId}</h3>

          <button
            onClick={() => onRemoveCourse(courseId)}
            title="Remove this course's plotted schedules"
            className="cursor-pointer"
          >
            <CloseIcon color="error" />
          </button>
        </div>
      ))}
    </section>
  );
}
