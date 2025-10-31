// React imports
import { useState, useMemo, useEffect } from "react";
// MUI Components and Icons
import { Button, Snackbar, Alert, Radio } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import LockIcon from "@mui/icons-material/Lock";
import RotateLeftIcon from "@mui/icons-material/RotateLeft";
import UploadIcon from "@mui/icons-material/Upload";
// Components
import ToastNotification from "./ToastNotification";
import CourseList from "./CourseList";
import ScheduleTable from "./ScheduleTable";
import DurationToggle from "./DurationToggle";
import validateSlot from "./validateSlot";
import getSchedules from "./api/getSchedules";
import ListRemoveCourse from "./ListRemoveCourse";
import AutoAllocatingOverlay from "./AutoAllocatingOverlay";
import autoAllocate from "./api/autoAllocate";
import createSchedulesQueryOptions from "./api/createSchedulesQueryOptions";
import createCoursesQueryOptions from "./api/createCoursesQueryOptions";
import uploadSchedule from "./api/uploadSchedule";
import { getCourses } from "./api/getCourses";
import RemoveLockSchedules from "./RemoveLockSchedules";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const timeHeader = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function App() {
  const college_group = 1; // useParams here
  const college_year = 1; // useParams here
  const college_sem = 1; // useParams here

  // Track selected course state
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Allocating error message
  const [allocatingError, setAllocatingError] = useState(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("error");
  const [toastTrigger, setToastTrigger] = useState(0);

  // from DB schedules' state
  const [existingSchedules, setExistingSchedules] = useState([]);
  const [queueSubjects, setQueueSubjects] = useState([]);

  // newly plotted (temporary) state
  const [newSchedules, setNewSchedules] = useState([]);

  const queryClient = useQueryClient();

  // fetch via tanstack
  const {
    data: getInitialCourses,
    isPending: queue_loading,
    error: queue_error,
  } = useQuery(
    createCoursesQueryOptions(college_group, college_year, college_sem)
  );

  const {
    data: getInitialSchedules,
    isPending: schedules_loading,
    error: schedules_error,
  } = useQuery(
    createSchedulesQueryOptions(college_group, college_year, college_sem)
  );

  const allSchedules = useMemo(() => {
    return [...existingSchedules, ...newSchedules];
  }, [existingSchedules, newSchedules]);

  const disabledLockButton =
    (selectedCourse && selectedCourse?.hours_week != 0) || !selectedCourse;

  const [duration, setDuration] = useState(1);

  // Auto allocate states
  const [allocating, setAllocating] = useState(false);
  const [allocatingStatus, setAllocatingStatus] = useState("loading");

  const [selectedCourseOriginalHours, setSelectedCourseOriginalHours] =
    useState(null);

  const disableFillButton = newSchedules.length != 0;

  // Load the queue and the timetable with data
  useEffect(() => {
    if (getInitialCourses) {
      setQueueSubjects(getInitialCourses);
    }
  }, [getInitialCourses]);

  useEffect(() => {
    if (getInitialSchedules) {
      setExistingSchedules(getInitialSchedules);
    }
  }, [getInitialSchedules]);

  const handleCellClick = (course, dayIndex, timeIndex) => {
    const validation = validateSlot({
      dayIndex,
      timeIndex,
      duration,
      selectedCourse,
      existingSchedules,
      newSchedules,
    });

    if (!validation.valid) {
      console.error(validation.message);
      setToastMessage(validation.message);
      setToastType("error");
      setToastTrigger((prev) => prev + 1);
      return;
    }

    // Proceed with placement logic if valid
    let slotsNeeded = duration === 1 ? 2 : duration === 1.5 ? 3 : 1;

    const newEntries = Array.from({ length: slotsNeeded }, (_, i) => ({
      slot_course: selectedCourse.course_id,
      teacher_id: selectedCourse.assigned_teacher,
      room_ID: selectedCourse.assigned_room,
      slot_day: dayIndex,
      slot_time: timeIndex + i,
    }));

    // Update state
    setNewSchedules((prev) => [...prev, ...newEntries]);

    setQueueSubjects((prevSubjects) =>
      prevSubjects.map((subject) =>
        subject.course_code === selectedCourse.course_code
          ? { ...subject, hours_week: subject.hours_week - duration }
          : subject
      )
    );

    setSelectedCourse((prevCourse) => ({
      ...prevCourse,
      hours_week: prevCourse.hours_week - duration,
    }));
  };

  const handleRemoveSchedule = (day, startTime) => {
    // setSelectedCourse(null);

    // Find course at clicked slot
    const target = newSchedules.find(
      (s) => s.slot_day === day && s.slot_time === startTime
    );
    if (!target) return;

    const courseId = target.slot_course;

    // Find contiguous block (rowSpan)
    let timePointer = startTime;
    let block = [];

    while (true) {
      const cell = newSchedules.find(
        (s) =>
          s.slot_day === day &&
          s.slot_time === timePointer &&
          s.slot_course === courseId
      );
      if (!cell) break;
      block.push(cell);
      timePointer++;
    }

    // Remove the full contiguous duration
    setNewSchedules((prev) => prev.filter((s) => !block.includes(s)));

    const hoursToRestore = block.length * 0.5;

    // Restore hours in queue subjects
    setQueueSubjects((prev) =>
      prev.map((subject) =>
        subject.course_id === courseId
          ? { ...subject, hours_week: subject.hours_week + hoursToRestore }
          : subject
      )
    );

    // Restore hours to selected course if applicable
    setSelectedCourse((prev) =>
      prev?.course_id === courseId
        ? { ...prev, hours_week: prev.hours_week + hoursToRestore }
        : prev
    );

    console.log(
      `Removed full block for course ${courseId}, restored ${hoursToRestore} hrs.`
    );
  };

  const handleAutoAllocate = async () => {
    const slots = queueSubjects
      .filter((s) => s.hours_week > 0 && s.is_plotted !== 1)
      .map((s) => ({
        course_ID: s.course_id,
        teacher_ID: s.assigned_teacher?.toString() || "0",
        room_ID: s.assigned_room?.toString() || "0",
      }));

    // wait for how many ms
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    try {
      setAllocating(true);
      setAllocatingStatus("loading");

      await sleep(500); // “thinking”

      const assigningSchedules = await autoAllocate(slots);

      if (!assigningSchedules || assigningSchedules.length === 0) {
        setAllocatingStatus("empty");
        return;
      }

      setAllocatingStatus("success");

      // success — animate insertion
      for (let i = 0; i < assigningSchedules.length; i++) {
        setNewSchedules((prev) => [...prev, assigningSchedules[i]]);
        await sleep(45);
      }

      // update hours
      setQueueSubjects((prev) =>
        prev.map((subject) => {
          const scheduledCount = assigningSchedules.filter(
            (s) => s.slot_course === subject.course_id
          ).length;
          const hoursUsed = scheduledCount * 0.5;
          return hoursUsed > 0
            ? { ...subject, hours_week: subject.hours_week - hoursUsed }
            : subject;
        })
      );
    } catch (err) {
      console.error(err.message);
      setAllocatingError(err.message);
      setAllocatingStatus("error");
    } finally {
      await sleep(500);
      setAllocating(false);
      setSelectedCourse(null);
    }
  };

  // Mutation of uploading schedules
  const { mutate: uploadScheduleMutate, isPending: postScheduleLoading } =
    useMutation({
      mutationFn: (newSchedules) => uploadSchedule(newSchedules),

      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: createCoursesQueryOptions().queryKey,
        });
        queryClient.invalidateQueries({
          queryKey: createSchedulesQueryOptions().queryKey,
        });
        console.log("Succesful Schedule!");

        setSelectedCourse(null);
        setNewSchedules([]);

        setToastMessage("New schedules successfully saved!");
        setToastType("success");
        setToastTrigger((prev) => prev + 1);
      },

      onError: (error) => {
        console.error(error?.message);
        setToastMessage("Error saving schedules");
        setToastType("error");
        setToastTrigger((prev) => prev + 1);
      },
    });

  // Create an upload to take the newSchedules and pass it to a check then the database
  const uploadScheduleToDatabase = async () => {
    uploadScheduleMutate(newSchedules);
  };

  const handleResetTable = () => {
    if (!queueSubjects) return;

    const restoredCourses = queueSubjects.map((subject) => {
      const plottedCount = newSchedules.filter(
        (s) => s.slot_course === subject.course_id
      ).length;

      const restoredHours = plottedCount / 2;

      return {
        ...subject,
        hours_week: subject.hours_week + restoredHours,
      };
    });

    setNewSchedules([]);
    setQueueSubjects(restoredCourses);
    setSelectedCourse(null);

    console.log("Table reset — schedules cleared and hours restored.");

    setToastMessage("Table reset — schedules cleared and hours restored");
    setToastType("success");
    setToastTrigger((prev) => prev + 1);
  };

  const handleRemoveCourseSchedules = (courseId) => {
    // Find all plotted schedules for this course
    const courseSchedules = newSchedules.filter(
      (sched) => sched.slot_course === courseId
    );

    if (courseSchedules.length === 0) {
      console.log(`No plotted schedules found for course ${courseId}`);
      return;
    }

    // Compute total hours to restore (0.5 hr per cell)
    const hoursToRestore = courseSchedules.length * 0.5;

    // Remove the course's schedules
    setNewSchedules((prev) =>
      prev.filter((sched) => sched.slot_course !== courseId)
    );

    // Restore hours in queueSubjects
    setQueueSubjects((prevSubjects) =>
      prevSubjects.map((subject) =>
        subject.course_id === courseId
          ? { ...subject, hours_week: subject.hours_week + hoursToRestore }
          : subject
      )
    );

    // If selected course is the same one, restore its hours too
    setSelectedCourse((prev) =>
      prev?.course_id === courseId
        ? { ...prev, hours_week: prev.hours_week + hoursToRestore }
        : prev
    );

    setSelectedCourse(selectedCourseOriginalHours);

    console.log(
      `Removed ${courseSchedules.length} plotted schedules for course ${courseId}. Restored ${hoursToRestore} hrs.`
    );
  };

  return (
    <div className="bg-gray-300 py-10 h-full container-fluid">
      <h1 className="text-center text-4xl font-bold underline text-gray-800">
        Schedule of {"Computer Science"}
      </h1>
      <main className="flex flex-col gap-4 p-6">
        <div className="w-full flex justify-center gap-4">
          <div className="flex-1 justify-end">
            <CourseList
              courses={queueSubjects}
              courses_error={queue_error}
              courses_loading={queue_loading}
              selectedCourse={selectedCourse}
              setSelectedCourse={setSelectedCourse}
              selectedCourseOriginalHours={selectedCourseOriginalHours}
              setSelectedCourseOriginalHours={setSelectedCourseOriginalHours}
              setToastMessage={() => {
                setToastMessage("Finish scheduling this subject first");
                setToastType("error");
                setToastTrigger((prev) => prev + 1);
              }}
            >
              <DurationToggle
                selectedCourse={selectedCourse}
                duration={duration}
                setDuration={setDuration}
              />
            </CourseList>
          </div>
          <div className="flex-3">
            <ScheduleTable
              schedules_loading={schedules_loading}
              schedules_error={schedules_error}
              headers={timeHeader}
              schedules={allSchedules}
              onCellClick={handleCellClick}
              selectedCourse={selectedCourse}
              onRemoveSchedule={handleRemoveSchedule}
            >
              {/* Auto Allocate */}
              <button
                onClick={handleAutoAllocate}
                disabled={disableFillButton}
                className={`flex cursor-pointer items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200
              ${
                disableFillButton
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-900/30"
              }`}
              >
                <span>{allocating ? "Allocating..." : "Auto Allocate"}</span>
                <AutoAwesomeIcon fontSize="small" />
              </button>

              {/* Reset Table */}
              <button
                onClick={handleResetTable}
                className="flex cursor-pointer items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm bg-gray-500 hover:bg-gray-400 text-gray-50 shadow-md shadow-gray-900/40"
              >
                <span>Reset Non-locked Schedules</span>
                <RotateLeftIcon fontSize="small" />
              </button>

              {/* Lock Schedule */}
              <button
                onClick={uploadScheduleToDatabase}
                disabled={disabledLockButton}
                className={`flex cursor-pointer items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200
              ${
                disabledLockButton
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/40"
              }`}
              >
                <span>{"Lock Schedule"}</span>
                <LockIcon fontSize="small" />
              </button>
            </ScheduleTable>
          </div>
        </div>

        <hr className="my-6 border-gray-400" />

        <div className="w-full flex justify-center">
          <RemoveLockSchedules
            lockedSchedules={existingSchedules}
            loading={schedules_loading}
            schedules_loading={schedules_loading}
            schedules_error={schedules_error}
          />
        </div>

        <AutoAllocatingOverlay
          visible={allocating}
          status={allocatingStatus} // "loading" | "success" | "empty" | "error"
          errorMessage={allocatingError}
        />

        <ToastNotification
          message={toastMessage}
          type={toastType}
          duration={3500}
          trigger={toastTrigger}
        />
      </main>
    </div>
  );
}

// const handleAutoAllocate = async () => {
//   // Only send schedule that has the complete hours remove the schedules with 0 hours

//   // const slots = queueSubjects
//   //   .filter((subject) => subject.hours_week !== 0)
//   //   .map((subject) => ({
//   //     course_ID: subject.course_id,
//   //     teacher_ID: subject.assigned_teacher.toString(),
//   //     room_ID: subject.assigned_room.toString(),
//   //   }));

//   // // Update all queued subjects at once (turn to 0)
//   // setQueueSubjects((prevSubjects) =>
//   //   prevSubjects.map((subject) =>
//   //     subject.hours_week !== 0 ? { ...subject, hours_week: 0 } : subject
//   //   )
//   // );

//   const slots = [];

//   queueSubjects.forEach((element) => {
//     if (element.hours_week !== 0) {
//       slots.push({
//         course_ID: element.course_id,
//         teacher_ID: element.assigned_teacher.toString(),
//         room_ID: element.assigned_room.toString(),
//       });

//       setQueueSubjects((prevSubjects) =>
//         prevSubjects.map((subject) =>
//           subject.course_code === element.course_code
//             ? { ...subject, hours_week: 0 }
//             : subject
//         )
//       );
//     }
//   });

//   try {
//     const assigningSchedules = await autoAllocate(slots);
//     const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

//     for (let i = 0; i < assigningSchedules.length; i++) {
//       setNewSchedules((prev) => [...prev, assigningSchedules[i]]);
//       await sleep(44);
//     }
//   } catch (err) {
//     console.error(err);
//   }
// };
