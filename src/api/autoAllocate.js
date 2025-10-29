import axios from "axios";

const API_URL = import.meta.env.VITE_SCHEDULER_API;

export default async function autoAllocate(courseList) {
  const queue = courseList;

  try {
    const { data } = await axios.put(`${API_URL}/update_schedules`, queue);

    // console.log(data);
    return data;
  } catch (err) {
    throw new Error(err);
  }
}
