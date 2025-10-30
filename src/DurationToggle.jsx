import AccessTimeIcon from "@mui/icons-material/AccessTime";

export default function DurationToggle({
  duration,
  setDuration,
  selectedCourse,
}) {
  const options = [
    { label: "0.5h", value: 0.5 },
    { label: "1h", value: 1 },
    { label: "1.5h", value: 1.5 },
  ];

  const hasSelected = !!selectedCourse;

  return (
    <div className="flex justify-center items-center w-full">
      <div
        className={`flex items-center gap-1 rounded-full px-3 py-2 shadow-sm transition-all duration-200 border
          ${
            hasSelected
              ? "bg-white border-red-800"
              : "bg-gray-100 border-gray-200 opacity-70"
          }`}
      >
        <AccessTimeIcon
          fontSize="small"
          className={`${hasSelected ? "text-red-800" : "text-gray-400"} mr-2`}
        />

        {options.map((option, i) => (
          <label
            key={option.value}
            className={`px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-all select-none
              ${
                duration === option.value
                  ? "bg-red-800 text-white"
                  : hasSelected
                  ? "text-gray-700 hover:bg-red-100"
                  : "text-gray-400"
              }`}
          >
            <input
              type="radio"
              value={option.value}
              checked={duration === option.value}
              onChange={(e) => setDuration(parseFloat(e.target.value))}
              className="hidden"
              // disabled={!hasSelected}
            />
            {option.label}
          </label>
        ))}

        <div
          className={`ml-2 bg-gray-200 px-2 rounded-full font-medium
          ${hasSelected ? "text-gray-800" : "text-gray-400"}`}
        >
          {selectedCourse?.hours_week ?? "-"} hrs left
        </div>
      </div>
    </div>
  );
}
