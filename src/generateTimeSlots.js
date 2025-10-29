// Generate 30-min time slots from 7:00 AM – 8:00 PM
export default function generateTimeSlots(start = 0, end = 26) {
  const slots = [];
  const baseHour = 7;

  for (let i = start; i <= end; i++) {
    const totalMinutes = i * 30;
    const hour = Math.floor(baseHour + totalMinutes / 60);
    const minutes = totalMinutes % 60 === 0 ? "00" : "30";
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour;
    const formatted = `${displayHour}:${minutes} ${period}`;

    slots.push({
      id: i,
      time_slot: formatted,
    });
  }

  return slots;
}
