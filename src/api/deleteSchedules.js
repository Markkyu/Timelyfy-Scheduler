import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export default async function deleteSchedules(schedules) {
  const courses = schedules;

  console.log(courses);

  try {
    const { data } = await axios.post(
      `${API_URL}/api/schedules/unplot`,
      courses
    );

    // console.log(data);
    return data;
  } catch (err) {
    throw new Error(error.response?.data?.message || error.message);
  }
}
