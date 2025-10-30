import React, { useState } from "react";
import { Button } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import deleteSchedules from "./api/deleteSchedules";
import createSchedulesQueryOptions from "./api/createSchedulesQueryOptions";
import createCoursesQueryOptions from "./api/createCoursesQueryOptions";

export default function RemoveLockSchedules({
  lockedSchedules,
  setExistingSchedules,
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

  return (
    <>
      <div className="max-w-4xl bg-white border-t-6 border-red-800 p-4 rounded-md shadow-md w-full ">
        <section className=" p-6 bg-yellow-50 border-4 border-yellow-400 shadow-md rounded-xl">
          <h2 className="text-xl flex items-center font-bold mb-4 text-yellow-800">
            <span>Removing Locked Schedules</span>
            <DeleteIcon className="ml-2" />
          </h2>

          <p className="text-sm text-gray-700 font-medium mb-3">
            ⚠️ Warning: Removing locked schedules may shift the flow of a
            timetable, this may allow other users to fill-in the available cell
            disrupting the flow of your schedule.
          </p>
        </section>

        <Button
          variant="contained"
          color="error"
          size="small"
          endIcon={<DeleteIcon />}
          onClick={handleRemoveAllChecked}
          disabled={checkedCount === 0}
          sx={{ textTransform: "none", fontWeight: 600, mt: 2 }}
        >
          Remove All Checked ({checkedCount})
        </Button>

        <div className="grid gap-4 mt-4">
          {uniqueCourses?.length === 0 && (
            <p className="text-gray-500 italic">No locked schedules found.</p>
          )}

          {uniqueCourses?.map((course, i) => (
            <div
              key={i}
              className="flex justify-between items-center bg-gray-100 p-3 rounded-md border border-gray-300"
            >
              <div className="flex gap-4 items-center">
                <input
                  type="checkbox"
                  checked={checkedCourses[course.slot_course] || false}
                  onChange={() => handleCheckboxChange(course.slot_course)}
                  className="size-5 cursor-pointer"
                />
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
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Confirm Removal
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              Deleting this locked course-schedule may cause other users to
              fill-in. Are you sure you want to remove{" "}
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
