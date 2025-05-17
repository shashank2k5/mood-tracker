import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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

  useEffect(() => {
    localStorage.setItem("moods", JSON.stringify(moods));
  }, [moods]);

  useEffect(() => {
    localStorage.setItem("calendarData", JSON.stringify(calendarData));
  }, [calendarData]);

  const addMood = () => {
    if (
      newMood.name &&
      newMood.emoji &&
      newMood.color &&
      !moods.some((m) => m.name === newMood.name)
    ) {
      setMoods([...moods, newMood]);
      setNewMood({ name: "", emoji: "", color: presetColors[0] });
    }
  };

  const updateMood = (index, key, value) => {
    const updated = [...moods];
    updated[index][key] = value;
    setMoods(updated);
  };

  const deleteMood = (index) => {
    const moodToDelete = moods[index];
    if (Object.values(calendarData).includes(moodToDelete.name)) {
      if (!confirm("This mood is used in calendar. Delete anyway?")) return;
    }
    setMoods(moods.filter((_, i) => i !== index));
  };

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
    <div className={`${darkMode ? "bg-gray-900 text-white" : "bg-white text-black"} min-h-screen p-4`}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Mood Tracker</h1>
        <button onClick={() => setDarkMode(!darkMode)} className="px-4 py-2 rounded bg-indigo-500 text-white">
          Toggle {darkMode ? "Light" : "Dark"} Mode
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <h2 className="font-semibold mb-2">Select Mood</h2>
          <select value={selectedMood} onChange={(e) => setSelectedMood(e.target.value)} className="w-full p-2 border">
            <option value="">-- Select --</option>
            {moods.map((m, i) => (
              <option key={i} value={m.name}>{`${m.emoji} ${m.name}`}</option>
            ))}
          </select>
        </div>
        <div>
          <h2 className="font-semibold mb-2">Add/Edit Mood</h2>
          <input
            type="text"
            placeholder="Name"
            value={newMood.name}
            onChange={(e) => setNewMood({ ...newMood, name: e.target.value })}
            className="w-full mb-1 p-2 border"
          />
          <input
            type="text"
            placeholder="Emoji"
            value={newMood.emoji}
            onChange={(e) => setNewMood({ ...newMood, emoji: e.target.value })}
            className="w-full mb-1 p-2 border"
          />
          <select
            value={newMood.color}
            onChange={(e) => setNewMood({ ...newMood, color: e.target.value })}
            className="w-full mb-2 p-2 border"
          >
            {presetColors.map((c, i) => (
              <option key={i} value={c}>{c}</option>
            ))}
          </select>
          <button onClick={addMood} className="w-full bg-green-500 text-white py-1 rounded">Add Mood</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {moods.map((m, i) => (
          <div key={i} className="p-2 border rounded">
            <div className="flex justify-between items-center">
              <span>{m.emoji} {m.name}</span>
              <div className="space-x-2">
                <button
                  onClick={() => deleteMood(i)}
                  className="text-red-500 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <button onClick={() => changeMonth(-1)}>&lt; Prev</button>
          <h2 className="text-xl font-semibold">{currentMonth.format("MMMM YYYY")}</h2>
          <button onClick={() => changeMonth(1)}>Next &gt;</button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {[...Array(daysInMonth).keys()].map((day) => {
            const dateStr = currentMonth.date(day + 1).format("YYYY-MM-DD");
            return (
              <div
                key={day}
                className="h-16 border rounded cursor-pointer flex items-center justify-center"
                style={{ backgroundColor: getMoodColor(dateStr) }}
                onClick={() => handleDayClick(day + 1)}
              >
                {day + 1}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-bold mb-2">Mood Distribution</h2>
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
      </div>

      {mostCommonMood() && (
        <p className="mb-4">
          Most common mood: <strong>{mostCommonMood().emoji} {mostCommonMood().name}</strong>
        </p>
      )}

      <button
        onClick={exportCSV}
        className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
      >
        Export to CSV
      </button>
    </div>
  );
}