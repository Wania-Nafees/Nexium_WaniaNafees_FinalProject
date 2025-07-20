"use client";

import { useEffect, useState } from "react";
import { analyzeMood, getMoodHistory } from "./actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function Page() {
  const [entry, setEntry] = useState("");
  const [result, setResult] = useState("");
  const [history, setHistory] = useState<
    { entry: string; mood: string; score: number; createdAt: string }[]
  >([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const data = await getMoodHistory();
    setHistory(data);
  };

  const handleAnalyze = async () => {
    if (!entry.trim()) return;
    const mood = await analyzeMood(entry);
    setResult(mood);
    setEntry("");
    loadHistory();
  };

  // Prepare chart data
  const chartData = history.map((item) => ({
    date: new Date(item.createdAt).toLocaleDateString(),
    score: item.score ?? 1, // Default neutral if undefined
  }));

  return (
    <div className="min-h-screen bg-purple-200 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl bg-white shadow-lg">
        <CardContent className="space-y-4 p-6">
          <h1 className="text-2xl font-bold text-center text-purple-700">
            Mental Health Tracker
          </h1>

          {/* Mood Input */}
          <Textarea
            placeholder="How are you feeling today?"
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            className="border-purple-300 focus:ring-purple-500"
          />
          <Button
            onClick={handleAnalyze}
            className="w-full bg-purple-600 hover:bg-purple-800"
          >
            Analyze Mood
          </Button>

          {/* AI Result */}
          {result && (
            <div className="mt-4 p-4 bg-purple-100 rounded-md text-purple-800">
              {result}
            </div>
          )}

          {/* Mood History */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-purple-700 mb-2">
              Mood History
            </h2>
            <ul className="space-y-2 max-h-40 overflow-y-auto">
              {history.map((item, i) => (
                <li
                  key={i}
                  className="p-2 bg-purple-50 rounded-md text-sm text-purple-900"
                >
                  <strong>{new Date(item.createdAt).toLocaleString()}:</strong>{" "}
                  {item.mood}
                </li>
              ))}
            </ul>
          </div>

          {/* Mood Trend Chart */}
          {history.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-purple-700 mb-2">
                Mood Trend
              </h2>
              <div className="h-64 bg-purple-50 p-4 rounded-lg">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 2]} ticks={[0, 1, 2]} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#6b21a8"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
