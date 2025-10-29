// utils/validateSlot.js

export default function validateSlot({
  dayIndex,
  timeIndex,
  duration,
  selectedCourse,
  existingSchedules,
  newSchedules,
}) {
  const TOTAL_SLOTS = 27;
  const LUNCH_SLOTS = [10, 11]; // 12:00–1:00 PM
  let slotsNeeded = duration === 1 ? 2 : duration === 1.5 ? 3 : 1;

  // 1️⃣ Check valid day index
  if (dayIndex < 0 || dayIndex > 4) {
    return { valid: false, message: "Invalid day index." };
  }

  // 2️⃣ No selected course
  if (!selectedCourse) {
    return { valid: false, message: "Select a course first." };
  }

  // 3️⃣ No remaining hours
  if (selectedCourse.hours_week <= 0) {
    return { valid: false, message: "No hours left for this subject." };
  }

  // 4️⃣ Check bounds (don’t exceed timetable)
  if (timeIndex + slotsNeeded > TOTAL_SLOTS) {
    return { valid: false, message: "Exceeds timetable limit." };
  }

  // 5️⃣ Check lunch break overlap
  const overlapsLunch = Array.from(
    { length: slotsNeeded },
    (_, i) => timeIndex + i
  ).some((slot) => LUNCH_SLOTS.includes(slot));

  if (overlapsLunch) {
    return { valid: false, message: "Cannot overlap lunch time (12:00–1:00)." };
  }

  // 6️⃣ Prevent scheduling into occupied cells
  const occupiedCells = [...existingSchedules, ...newSchedules];

  const cellsFree = Array.from(
    { length: slotsNeeded },
    (_, i) => timeIndex + i
  ).every((slot) => {
    return !occupiedCells.some(
      (s) => s.slot_day === dayIndex && s.slot_time === slot
    );
  });

  if (!cellsFree) {
    return { valid: false, message: "Some cells are already occupied." };
  }

  // 7️⃣ Check if adding would exceed remaining hours
  if (selectedCourse.hours_week - duration < 0) {
    return {
      valid: false,
      message: "Not enough remaining hours for this duration.",
    };
  }

  // ✅ Passed all checks
  return { valid: true };
}
