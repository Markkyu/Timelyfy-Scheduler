import React, { useState } from "react";
import { Button } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

export default function RemoveLockSchedules({
  lockedSchedules,
  onRemoveLockedSchedule,
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  const handleDeleteClick = (schedule) => {
    setSelectedSchedule(schedule);
    setConfirmOpen(true);
  };

  const handleConfirmRemove = () => {
    onRemoveLockedSchedule(selectedSchedule);
    setConfirmOpen(false);
    setSelectedSchedule(null);
  };

  return (
    <>
      <section className="max-w-3xl w-full p-6 bg-yellow-50 border-4 border-yellow-400 shadow-md rounded-xl">
        <h2 className="text-xl font-bold mb-4 text-yellow-800">
          Remove Locked Schedules
        </h2>

        <p className="text-sm text-gray-700 font-medium mb-3">
          ⚠️ Warning: Removing locked schedules may shift the flow of this
          timetable
        </p>

        <div className="grid gap-4">
          {lockedSchedules?.length === 0 && (
            <p className="text-gray-500 italic">No locked schedules found.</p>
          )}

          {lockedSchedules?.map((sched, i) => (
            <div
              key={i}
              className="flex justify-between items-center bg-gray-100 p-3 rounded-md border border-gray-300"
            >
              <div>
                <p className="font-semibold">{sched.course_name}</p>
                <p className="text-sm text-gray-600">
                  {sched.day_name} — {sched.start_time} to {sched.end_time}
                </p>
              </div>

              <Button
                variant="contained"
                color="error"
                size="small"
                endIcon={<DeleteIcon />}
                onClick={() => handleDeleteClick(sched)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Confirmation Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Confirm Removal
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              Deleting this locked schedule may cause the timetable to shift.
              Are you sure you want to remove this schedule?
            </p>

            <div className="flex justify-end gap-3">
              <Button variant="outlined" onClick={() => setConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleConfirmRemove}
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
