import { useState } from "react";
import LockIcon from "@mui/icons-material/Lock";
import CoPresentIcon from "@mui/icons-material/CoPresent";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

export default function CourseList({
  courses,
  courses_error,
  courses_loading,
  selectedCourse,
  setSelectedCourse,
  selectedCourseOriginalHours,
  setSelectedCourseOriginalHours,
  setToastMessage,
  children,
}) {
  const handleSelect = (course) => {
    setSelectedCourse((prev) => {
      if (prev?.course_id === course.course_id) {
        setSelectedCourseOriginalHours(null);
        return null;
      } else {
        setSelectedCourseOriginalHours(course);
        return course;
      }
    });
  };

  const checkOriginalCourse = selectedCourse === selectedCourseOriginalHours;

  if (courses_error) {
    return (
      <section className="w-full h-full border-t-6 border-t-red-800 p-6 bg-white shadow-md rounded-xl">
        <h2 className="text-2xl font-semibold text-red-800">
          Available Courses
        </h2>
        <div className="py-4">{children}</div>
        <div className="w-full bg-white rounded-xl p-2 border border-red-600 text-center">
          <h1 className="text-red-600 text-xl font-bold">
            Error Loading Courses
          </h1>
          <span className="text-gray-700 underline">
            {courses_error?.message}
          </span>
        </div>
      </section>
    );
  }

  if (courses_loading) {
    const repeatCards = Array.from({ length: 6 }, (x, i) => i);

    return (
      <section className="w-full h-full border-t-6 border-t-red-800 p-6 bg-white shadow-md rounded-xl">
        <h2 className="text-2xl font-semibold text-red-800">
          Available Courses
        </h2>
        <div className="py-4">{children}</div>
        <div className="grid grid-cols-1 gap-4">
          {repeatCards.map((x, index) => (
            <LoadingCard key={index} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="w-full h-full border-t-6 border-t-red-800 p-6 bg-white shadow-md rounded-xl">
      <h2 className="text-2xl font-semibold text-red-800">Available Courses</h2>
      <div className="py-4">{children}</div>
      <div className="grid grid-cols-1 gap-4">
        {courses?.map((course) => {
          const isSelected = selectedCourse?.course_id === course.course_id;
          const isPlotted = course.is_plotted;

          return isPlotted ? (
            <LockCourseCard key={course.course_id} course={course} />
          ) : (
            <CourseCard
              key={course.course_id}
              course={course}
              isSelected={isSelected}
              onClick={() => {
                if (
                  !selectedCourse ||
                  selectedCourse.hours_week === 0 ||
                  checkOriginalCourse
                ) {
                  handleSelect(course);
                } else {
                  setToastMessage(""); // set toast message callback function
                }
              }}
            />
          );
        })}
      </div>
    </section>
  );
}

// LOCKED COURSE CARD
const LockCourseCard = ({ course }) => {
  const teacherFullName = course.first_name
    ? `${course.first_name} ${course.last_name}`
    : null;

  const assignedRoom = course.room_name;

  return (
    <div className="p-4 rounded-2xl border border-gray-400 bg-gray-200 shadow-sm relative select-none opacity-80">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-semibold text-gray-800">{course.course_code}</p>
          <p className="text-sm text-gray-600">{course.course_name}</p>
        </div>
        <LockIcon color="warning" />
      </div>

      <div className="mt-2 space-y-1 text-sm text-gray-600">
        <p className="flex items-center gap-2">
          <AccessTimeIcon fontSize="small" />
          {course.hours_week} hrs/week
        </p>
        <p className="flex items-center gap-2">
          <CoPresentIcon fontSize="small" />
          {teacherFullName || "No Teacher"} → {assignedRoom || "No Room"}
        </p>
      </div>

      <p className="mt-2 text-xs text-gray-500 italic">
        Locked / already plotted
      </p>
    </div>
  );
};

// UNLOCKED COURSE CARD
const CourseCard = ({ course, isSelected, onClick }) => {
  const teacherFullName = course.first_name
    ? `${course.first_name} ${course.last_name}`
    : null;

  const assignedRoom = course.room_name;

  return (
    <div
      onClick={onClick}
      className={`relative group p-4 rounded-2xl border shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-1 
      ${
        isSelected
          ? "border-red-800 bg-red-50 ring-1 ring-red-700"
          : "border-gray-400 bg-white"
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-semibold text-gray-900">{course.course_code}</p>
          <p className="text-sm text-gray-600">{course.course_name}</p>
        </div>
        {isSelected && (
          <span className="absolute right-2 top-2 text-xs bg-red-800 text-white px-2 py-0.5 rounded-full">
            Selected
          </span>
        )}
      </div>
      {/* Info */}
      <div className="mt-2 space-y-1 text-sm text-gray-700">
        <p className="flex items-center gap-2">
          <AccessTimeIcon fontSize="small" className="text-sky-500" />
          {course.hours_week} hrs/week
        </p>
        <p className="flex items-center gap-2">
          <CoPresentIcon
            fontSize="small"
            className={teacherFullName ? "text-sky-500" : "text-rose-500"}
          />
          {teacherFullName || "No teacher"} → {assignedRoom || "No room"}
        </p>
      </div>
    </div>
  );
};

// LOADING COURSE CARD (Skeleton)
const LoadingCard = () => {
  return (
    <div className="relative p-4 rounded-2xl border border-gray-300 bg-white shadow-sm animate-pulse">
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="space-y-2">
          <div className="h-4 w-24 bg-gray-300 rounded"></div>
          <div className="h-3 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-3 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-gray-300 rounded-full"></div>
          <div className="h-3 w-28 bg-gray-200 rounded"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-gray-300 rounded-full"></div>
          <div className="h-3 w-36 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
};
