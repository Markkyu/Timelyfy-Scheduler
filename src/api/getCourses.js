import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const getCourses = async (collegeGroup, year, sem) => {
  try {
    const { data } = await axios.get(
      `${API_URL}/api/courses/${collegeGroup}/filter?year=${year}&sem=${sem}`
    );
    return data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message);
  }
};
