import React, { useState } from "react";
import { Button } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import deleteSchedules from "./api/deleteSchedules";
import createSchedulesQueryOptions from "./api/createSchedulesQueryOptions";
import createCoursesQueryOptions from "./api/createCoursesQueryOptions";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

export default function RemoveLockSchedules({
  lockedSchedules,
  setExistingSchedules,
  schedules_loading,
  schedules_error,
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [checkedCourses, setCheckedCourses] = useState({});

  const queryClient = useQueryClient();

  const { mutate, isPending: loadingRemove } = useMutation({
    mutationFn: (schedules) => {
      deleteSchedules(schedules);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: createCoursesQueryOptions().queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: createSchedulesQueryOptions().queryKey,
      });

      setConfirmOpen(false);
      setSelectedSchedule(null);

      // setExistingSchedules([]);
    },
    onError: (error) => {
      console.log(error);
    },
  });

  const getUniqueSchedules = (schedules) => {
    return [...new Set(schedules.map((item) => item.slot_course))].map(
      (course) => ({ slot_course: course })
    );
  };

  const uniqueSchedules = getUniqueSchedules(lockedSchedules);

  const handleDeleteClick = (courseName) => {
    setSelectedSchedule(courseName);
    setConfirmOpen(true);
  };

  const handleConfirmRemove = async () => {
    // Get all schedules for this course
    const scheduleToRemove = uniqueSchedules.filter(
      (s) => s.slot_course === selectedSchedule
    );

    console.log("Removing from db:", scheduleToRemove);

    // mutate(scheduleToRemove);
    try {
      await deleteSchedules(scheduleToRemove);

      queryClient.invalidateQueries({
        queryKey: createCoursesQueryOptions().queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: createSchedulesQueryOptions().queryKey,
      });

      setConfirmOpen(false);
      setSelectedSchedule(null);
    } catch (err) {
      console.error("Error");
    }
  };

  // Group schedules by slot_course
  const groupLockedSchedules = Object.groupBy(
    lockedSchedules,
    (groupSched) => groupSched.slot_course
  );

  // Get unique course names - returns [{slot_course: "CCS_101"}, {slot_course: "CCS_102"}]
  const uniqueCourses = Object.keys(groupLockedSchedules).map((courseName) => ({
    slot_course: courseName,
    count: groupLockedSchedules[courseName].length, // Number of schedules for this course
  }));

  // console.log(uniqueCourses);

  // Handle checkbox toggle
  const handleCheckboxChange = (courseName) => {
    setCheckedCourses((prev) => ({
      ...prev,
      [courseName]: !prev[courseName],
    }));
  };

  // Get all schedules that belong to checked courses
  const getSchedulesToRemove = () => {
    // const checkedCourseNames = Object.keys(checkedCourses).filter(
    //   (course) => checkedCourses[course]
    // );
    // // Return all schedules that ma`tch the checked courses
    // return lockedSchedules.filter((schedule) =>
    //   checkedCourseNames.includes(schedule.slot_course)
    // );
  };

  // Handle remove all checked
  const handleRemoveAllChecked = async () => {
    // const schedulesToRemove = getSchedulesToRemove();
    // if (schedulesToRemove.length === 0) {
    //   alert("Please select at least one course to remove");
    //   return;
    // }
    // console.log("Schedules to remove:", schedulesToRemove);
    // mutate(schedulesToRemove);
    // setCheckedCourses({});
  };

  const checkedCount = Object.values(checkedCourses).filter(Boolean).length;

  if (schedules_loading) return <SchedulesLoading />;

  if (schedules_error) return <SchedulesError />;

  return (
    <>
      <div className="relative max-w-4xl bg-white border-t-6 border-red-800 p-4 rounded-md shadow-md w-full ">
        {/* Header Warning */}
        <HeaderWarning />

        {/* Empty state */}
        <div className="grid gap-4 mt-4 text-xl">
          {uniqueCourses.length != 0 ? (
            <h1 className="text-gray-700">
              {uniqueCourses?.length} locked schedules found
            </h1>
          ) : (
            ""
          )}

          {uniqueCourses?.length === 0 && (
            <p className="text-gray-500 italic">No locked schedules found.</p>
          )}

          {/* Has value state */}
          {uniqueCourses?.map((course, i) => {
            return (
              <div
                key={i}
                className="flex justify-between items-center bg-gray-100 p-3 rounded-md border border-gray-300"
              >
                <div className="flex gap-4 items-center">
                  <div>
                    <p className="font-semibold">{course.slot_course}</p>
                    <p className="text-xs text-gray-500">
                      {course.count} time slot{course.count > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  endIcon={<DeleteIcon />}
                  onClick={() => handleDeleteClick(course.slot_course)}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  Remove
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-96">
            <h3 className="text-lg flex items-center font-semibold text-gray-800 mb-3">
              Confirm Removal
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              Deleting this locked course-schedule may cause other users to
              fill-in its current cell. Are you sure you want to remove{" "}
              <strong>{selectedSchedule}</strong>?
            </p>

            <div className="flex justify-end gap-3">
              <Button
                variant="outlined"
                onClick={() => setConfirmOpen(false)}
                sx={{ fontWeight: 600, textTransform: "none" }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleConfirmRemove}
                sx={{ fontWeight: 600, textTransform: "none" }}
              >
                Yes, Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const SchedulesLoading = () => {
  return (
    <>
      <div className="relative max-w-4xl bg-white border-t-6 border-red-800 p-4 rounded-md shadow-md w-full ">
        {/* {schedules_error && <SchedulesError />}

        {schedules_loading && <SchedulesLoading />} */}

        <HeaderWarning />

        <div className="bg-white mt-4 px-8 py-6 rounded-2xl flex flex-col items-center gap-3 animate-fade-in">
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
    </>
    // <div className="flex items-center justify-center backdrop-blur-xs bg-white/40 z-10">
    // <div className="bg-white border border-gray-300 shadow-xl px-8 py-6 rounded-2xl flex flex-col items-center gap-3 animate-fade-in">
    //   <div className="w-10 h-10 border-4 border-gray-300 border-t-red-800 rounded-full animate-spin"></div>
    //   <span className="text-lg font-semibold text-gray-700 flex items-center">
    //     Loading Schedules<span className="typing-dots ml-1"></span>
    //   </span>
    // </div>

    // <style jsx>{`
    //   .typing-dots::after {
    //     content: "...";
    //     animation: dots 1.2s steps(4, end) infinite;
    //   }
    //   @keyframes dots {
    //     0%,
    //     20% {
    //       content: "";
    //     }
    //     40% {
    //       content: ".";
    //     }
    //     60% {
    //       content: "..";
    //     }
    //     80%,
    //     100% {
    //       content: "...";
    //     }
    //   }
    //   @keyframes fade-in {
    //     from {
    //       opacity: 0;
    //       transform: scale(0.95);
    //     }
    //     to {
    //       opacity: 1;
    //       transform: scale(1);
    //     }
    //   }
    // `}</style>
    // </div>
  );
};

const HeaderWarning = () => {
  return (
    <section className=" p-6 bg-yellow-50 border-4 border-yellow-400 shadow-md rounded-xl">
      <h2 className="text-xl flex items-center font-bold mb-4 text-yellow-800">
        <span>Removing Locked Schedules</span>
        <DeleteIcon className="ml-2" />
      </h2>

      <p className="text-sm text-gray-700 font-medium mb-3">
        ⚠️ Warning: Removing locked schedules may shift the flow of a timetable,
        this may allow other users to fill-in the available cell disrupting the
        flow of your schedule.
      </p>
    </section>
  );
};

const SchedulesError = () => {
  return (
    <>
      <div className="relative max-w-4xl bg-white border-t-6 border-red-800 p-4 rounded-md shadow-md w-full ">
        <HeaderWarning />
        <div className="bg-white mt-4 px-8 py-6 rounded-2xl flex flex-col items-center gap-4 animate-fade-in">
          <span className="text-xl font-bold text-red-700">
            Error Loading Schedule
          </span>
          <p className="text-gray-600 text-center">
            Something went wrong while fetching data.
          </p>
        </div>
      </div>
    </>
    // <div className="flex items-center justify-center backdrop-blur-xs bg-white/40 z-10">
    // <div className="bg-white border border-red-300 shadow-xl px-8 py-6 rounded-2xl flex flex-col items-center gap-4 animate-fade-in">
    //   <span className="text-xl font-bold text-red-700">
    //     Error Loading Schedule
    //   </span>
    //   <p className="text-gray-600 text-center">
    //     Something went wrong while fetching data.
    //   </p>
    // </div>

    //   <style jsx="true">{`
    //     @keyframes fade-in {
    //       from {
    //         opacity: 0;
    //         transform: scale(0.95);
    //       }
    //       to {
    //         opacity: 1;
    //         transform: scale(1);
    //       }
    //     }
    //   `}</style>
    // </div>
  );
};
