// React imports
import { useState, useMemo, useEffect } from "react";
// MUI Components and Icons
import { Button, Snackbar, Alert, Radio } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import LockIcon from "@mui/icons-material/Lock";
import RotateLeftIcon from "@mui/icons-material/RotateLeft";
import UploadIcon from "@mui/icons-material/Upload";
// Components
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
  const college_group = 1;
  const college_year = 1;
  const college_sem = 1;

  const [selectedCourse, setSelectedCourse] = useState(null);

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

  const disabledLockButton = selectedCourse && selectedCourse?.hours_week != 0;

  const disableFillButton = selectedCourse;
  // const [disableFillButton, setDisableFillButton] = useState(true);

  const [duration, setDuration] = useState(1);

  const [allocating, setAllocating] = useState(false);

  const [selectedCourseOriginalHours, setSelectedCourseOriginalHours] =
    useState(null);

  // Load the queue and the timetable with data
  // useEffect(() => {
  // const loadData = async () => {
  // const fetchCourses = await getCourses(
  //   college_group,
  //   college_year,
  //   college_sem
  // );
  // const fetchSchedules = await getSchedules(
  //   college_group,
  //   college_year,
  //   college_sem
  // );
  // setQueueSubjects(fetchCourses);
  //   setExistingSchedules(fetchSchedules);
  //   console.log("Initial data loaded");
  // };
  // setDisableFillButton(false);
  // loadData();
  // }, []);

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
      console.log(validation.message);
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

    console.log("Added schedule:", newEntries);

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

  const handleRemoveSchedule = (day, timeIndex) => {
    // if (!selectedCourse || !queueSubjects) return;

    // Find the schedule to remove
    const targetSchedule = newSchedules.find(
      (s) => s.slot_day === day && s.slot_time === timeIndex
    );

    if (!targetSchedule) {
      console.log("No schedule found at that cell.");
      return;
    }

    const courseCode = targetSchedule.slot_course;

    // Remove it from the newSchedules array
    setNewSchedules((prev) =>
      prev.filter((s) => !(s.slot_day === day && s.slot_time === timeIndex))
    );

    // Restore 0.5 hours (1 cell = 0.5 hr)
    setQueueSubjects((prevSubjects) =>
      prevSubjects.map((subject) =>
        subject.course_code === courseCode
          ? { ...subject, hours_week: subject.hours_week + 0.5 }
          : subject
      )
    );

    // If currently selected course is the same, restore hours to it too
    setSelectedCourse((prev) =>
      prev?.course_code === courseCode
        ? { ...prev, hours_week: prev.hours_week + 0.5 }
        : prev
    );

    console.log(
      `Removed schedule for ${courseCode} on day ${day}, time ${timeIndex}`
    );
  };

  const handleAutoAllocate = async () => {
    const slots = queueSubjects
      .filter((element) => element.hours_week > 0 && element.is_plotted != 1)
      .map((element) => ({
        course_ID: element.course_id,
        teacher_ID: element.assigned_teacher?.toString() || "0",
        room_ID: element.assigned_room?.toString() || "0",
      }));

    console.log(slots);

    try {
      setAllocating(true);
      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      await sleep(1800);

      const assigningSchedules = await autoAllocate(slots);

      console.log(assigningSchedules);

      // Smooth insertion of generated schedules
      for (let i = 0; i < assigningSchedules.length; i++) {
        setNewSchedules((prev) => [...prev, assigningSchedules[i]]);
        await sleep(44);
      }

      // Now that we know which courses got scheduled
      setQueueSubjects((prevSubjects) =>
        prevSubjects.map((subject) => {
          const scheduledCount = assigningSchedules.filter(
            (s) => s.slot_course === subject.course_id
          ).length;

          // Each cell = 0.5 hours
          const hoursUsed = scheduledCount * 0.5;

          return hoursUsed > 0
            ? { ...subject, hours_week: subject.hours_week - hoursUsed }
            : subject;
        })
      );
    } catch (err) {
      console.error(err);
    } finally {
      setAllocating(false);
    }
  };

  const { mutate: uplaodScheduleMutate, isPending: postScheduleLoading } =
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
      },

      onError: (error) => {
        console.error(error?.message);
      },
    });

  // Create an upload to take the newSchedules and pass it to a check then the database
  const uploadScheduleToDatabase = async () => {
    uplaodScheduleMutate(newSchedules);
    // try {
    //   const { message, plottedCourses } = await uploadSchedule(newSchedules);
    //   console.log(message);
    //   console.log(plottedCourses);
    //   alert("Successful");
    // } catch (err) {
    //   console.error(err?.message);
    // }
  };

  const handleResetTable = () => {
    if (!queueSubjects) return;

    const restoredCourses = queueSubjects.map((subject) => {
      const plottedCount = newSchedules.filter(
        (s) => s.slot_course === subject.course_id
      ).length;

      console.log(plottedCount);

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

    setSelectedCourse(null);

    console.log(
      `Removed ${courseSchedules.length} plotted schedules for course ${courseId}. Restored ${hoursToRestore} hrs.`
    );
  };

  return (
    <div className="bg-gray-300 py-10 h-full container-fluid">
      <h1 className="text-center text-4xl font-bold underline text-gray-800">
        Schedule of {"Computer Science"}
      </h1>
      <main className="flex flex-col gap-4 py-5 px-15">
        <div className="flex justify-center items-center gap-6 p-6">
          <CourseList
            courses={queueSubjects}
            selectedCourse={selectedCourse}
            setSelectedCourse={setSelectedCourse}
            selectedCourseOriginalHours={selectedCourseOriginalHours}
            setSelectedCourseOriginalHours={setSelectedCourseOriginalHours}
          />
        </div>

        <div className="px-10 pb-4 flex justify-between">
          <div>
            <DurationToggle
              selectedCourse={selectedCourse}
              duration={duration}
              setDuration={setDuration}
            />
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="contained"
              sx={{
                fontWeight: "600",
                borderRadius: "5px",
              }}
              onClick={handleAutoAllocate}
              endIcon={<AutoAwesomeIcon />}
              disabled={disableFillButton}
            >
              Auto Allocate
            </Button>

            <Button
              variant="contained"
              sx={{
                fontWeight: 600,
                backgroundColor: "gray",
                borderRadius: "5px",
              }}
              endIcon={<RotateLeftIcon />}
              onClick={handleResetTable}
            >
              Reset Table
            </Button>

            <Button
              variant="contained"
              color="success"
              sx={{
                fontWeight: 600,
                borderRadius: "5px",
              }}
              endIcon={<LockIcon />}
              onClick={uploadScheduleToDatabase}
              disabled={disabledLockButton}
            >
              Lock Schedule
            </Button>
          </div>
        </div>

        <div className="w-full flex justify-center gap-10">
          <ScheduleTable
            headers={timeHeader}
            schedules={allSchedules}
            onCellClick={handleCellClick}
            selectedCourse={selectedCourse}
          />
        </div>

        <div className="w-full bg-red-200">test</div>

        <AutoAllocatingOverlay visible={allocating} />
      </main>
    </div>
  );
}

{
  /* <div className="bg-red-300">
  <ScheduleTable
    headers={timeHeader}
    schedules={allSchedules}
    onCellClick={handleCellClick}
  />
</div> */
}

// {/* <div className="flex flex-col">
//   {/* 3-button radio for duration */}
//   {selectedCourse ? (
//     <DurationToggle
//       selectedCourse={selectedCourse}
//       duration={duration}
//       setDuration={setDuration}
//     />
//   ) : (
//     <div className="w-full min-w-sm shadow-md bg-white p-8 rounded-xl text-center italic text-gray-600">
//       No Course Selected
//     </div>
//   )}
// </div> */}

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
