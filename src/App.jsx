import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import MoodEntry from "./components/MoodEntry";

const presetColors = ["#facc15", "#60a5fa", "#f87171", "#34d399", "#a78bfa"];

const defaultMoods = [
  { name: "Happy", emoji: "😃", color: "#facc15" },
  { name: "Sad", emoji: "😢", color: "#60a5fa" },
];

export default function App() {
  const [moods, setMoods] = useState(() => {
    return JSON.parse(localStorage.getItem("moods")) || defaultMoods;
  });
  const [selectedMood, setSelectedMood] = useState("");
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [calendarData, setCalendarData] = useState(() => {
    return JSON.parse(localStorage.getItem("calendarData")) || {};
  });
  const [newMood, setNewMood] = useState({ name: "", emoji: "", color: presetColors[0] });
  const [darkMode, setDarkMode] = useState(false);

  // Load/save data to localStorage
  useEffect(() => {
    localStorage.setItem("moods", JSON.stringify(moods));
    localStorage.setItem("calendarData", JSON.stringify(calendarData));
  }, [moods, calendarData]);

  // Mood management functions
  const addMood = () => {
    if (newMood.name && newMood.emoji && newMood.color && !moods.some((m) => m.name === newMood.name)) {
      setMoods([...moods, newMood]);
      setNewMood({ name: "", emoji: "", color: presetColors[0] });
    }
  };

  const deleteMood = (index) => {
    const moodToDelete = moods[index];
    if (Object.values(calendarData).includes(moodToDelete.name)) {
      if (!confirm("This mood is used in calendar. Delete anyway?")) return;
    }
    setMoods(moods.filter((_, i) => i !== index));
  };

  // Calendar functions
  const handleDayClick = (day) => {
    if (!selectedMood) return;
    const dateStr = currentMonth.date(day).format("YYYY-MM-DD");
    setCalendarData({ ...calendarData, [dateStr]: selectedMood });
  };

  const changeMonth = (amount) => {
    setCurrentMonth(currentMonth.add(amount, "month"));
  };

  const getMoodColor = (date) => {
    const moodName = calendarData[date];
    const mood = moods.find((m) => m.name === moodName);
    return mood ? mood.color : "transparent";
  };

  // Stats functions
  const getMoodStats = () => {
    const monthKey = currentMonth.format("YYYY-MM");
    const stats = {};
    Object.entries(calendarData).forEach(([date, moodName]) => {
      if (date.startsWith(monthKey)) {
        stats[moodName] = (stats[moodName] || 0) + 1;
      }
    });
    return moods
      .filter((m) => stats[m.name])
      .map((m) => ({
        name: m.name,
        emoji: m.emoji,
        value: stats[m.name],
        color: m.color,
      }));
  };

  const mostCommonMood = () => {
    const stats = getMoodStats();
    if (!stats.length) return null;
    return stats.reduce((max, mood) => (mood.value > max.value ? mood : max));
  };

  // Export function
  const exportCSV = () => {
    const headers = "Date,Mood\n";
    const rows = Object.entries(calendarData)
      .map(([date, mood]) => `${date},${mood}`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "mood-data.csv";
    link.click();
  };

  const daysInMonth = currentMonth.daysInMonth();

  return (
    <div className={`${darkMode ? "bg-gray-900 text-white" : "bg-white text-black"} min-h-screen p-8 max-w-4xl mx-auto`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Mood Tracker</h1>
        <button 
          onClick={() => setDarkMode(!darkMode)} 
          className="px-4 py-2 rounded bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
        >
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

      <MoodEntry 
        moods={moods}
        selectedMood={selectedMood}
        setSelectedMood={setSelectedMood}
        newMood={newMood}
        setNewMood={setNewMood}
        addMood={addMood}
        deleteMood={deleteMood}
        presetColors={presetColors}
      />

      <div className="mb-8 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <button 
            onClick={() => changeMonth(-1)} 
            className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            ← Previous
          </button>
          <h2 className="text-xl font-semibold">{currentMonth.format("MMMM YYYY")}</h2>
          <button 
            onClick={() => changeMonth(1)} 
            className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Next →
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {[...Array(daysInMonth).keys()].map((day) => {
            const dateStr = currentMonth.date(day + 1).format("YYYY-MM-DD");
            return (
              <div
                key={day}
                className={`h-12 border rounded-lg cursor-pointer flex items-center justify-center transition-colors
                  ${getMoodColor(dateStr) === "transparent" ? 
                    "bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600" : 
                    "hover:opacity-80"}`}
                style={{ backgroundColor: getMoodColor(dateStr) }}
                onClick={() => handleDayClick(day + 1)}
              >
                <span className={`${getMoodColor(dateStr) !== "transparent" ? "text-white" : ""}`}>
                  {day + 1}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-8 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Mood Distribution</h2>
        {getMoodStats().length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getMoodStats()}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, emoji }) => `${emoji} ${name}`}
                >
                  {getMoodStats().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            
            {mostCommonMood() && (
              <p className="mt-4 text-center">
                Most common mood this month: <span className="font-bold">
                  {mostCommonMood().emoji} {mostCommonMood().name}
                </span>
              </p>
            )}
          </>
        ) : (
          <p className="text-center py-8">No mood data for this month yet</p>
        )}
      </div>

      <div className="flex justify-center">
        <button
          onClick={exportCSV}
          className="px-6 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
        >
          Export All Data to CSV
        </button>
      </div>
    </div>
  );
}
