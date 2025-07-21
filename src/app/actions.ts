/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import clientPromise from "@/lib/mongodb";

type MoodData = {
  sentiment: string;
  score: number; // 0=neg,1=neutral,2=pos
  tip: string;
};

// TEMP: simple fallback analyzer (use until your AI key works)
function ruleBasedMood(entry: string): MoodData {
  const text = entry.toLowerCase();
  if (text.includes("happy") || text.includes("good") || text.includes("great")) {
    return { sentiment: "Happy", score: 2, tip: "Keep doing what’s working—maybe jot down what helped today!" };
  }
  if (text.includes("sad") || text.includes("down") || text.includes("cry")) {
    return { sentiment: "Sad", score: 0, tip: "It may help to talk to someone you trust or take a short walk." };
  }
  if (text.includes("anxious") || text.includes("stress") || text.includes("overwhelm")) {
    return { sentiment: "Anxious", score: 0, tip: "Try 5 slow deep breaths—inhale 4, hold 4, exhale 6." };
  }
  return { sentiment: "Neutral", score: 1, tip: "Consider writing 1 thing you’re grateful for today." };
}

async function callAI(entry: string): Promise<MoodData> {
  // If no key, use fallback
  if (!process.env.HF_API_KEY) {
    return ruleBasedMood(entry);
  }

  try {
    const res = await fetch("https://api-inference.huggingface.co/models/your-model", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
      },
      body: JSON.stringify({
        inputs: `Return JSON: { sentiment:<happy/sad/neutral/anxious>, score:0-2, tip:string } for: "${entry}"`,
      }),
      cache: "no-store",
    });

    const data = await res.json();
    const text = data?.[0]?.generated_text;

    if (typeof text === "string") {
      try {
        const parsed = JSON.parse(text) as MoodData;
        if (parsed.sentiment && typeof parsed.score === "number" && parsed.tip) {
          return parsed;
        }
      } catch {
        /* fall through */
      }
    }
    // fallback parse failure
    return ruleBasedMood(entry);
  } catch {
    return ruleBasedMood(entry);
  }
}

export async function analyzeMood(entry: string) {
  const moodData = await callAI(entry);

  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB ?? "mental_health_tracker");
  const collection = db.collection("entries");

  await collection.insertOne({
    entry,
    mood: moodData.sentiment,
    score: moodData.score,
    tip: moodData.tip,
    createdAt: new Date(),
  });

  // What we return shows up in the UI
  return `${moodData.sentiment}: ${moodData.tip}`;
}

export async function getMoodHistory(): Promise<
  { entry: string; mood: string; score: number; tip: string; createdAt: string }[]
> {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB ?? "mental_health_tracker");
  const collection = db.collection("entries");

  const docs = await collection.find().sort({ createdAt: 1 }).toArray();

  return docs.map((d) => ({
    entry: d.entry ?? "",
    mood: d.mood ?? "Unknown",
    score: typeof d.score === "number" ? d.score : 1,
    tip: d.tip ?? "",
    createdAt:
      d.createdAt instanceof Date
        ? d.createdAt.toISOString()
        : new Date(d.createdAt ?? Date.now()).toISOString(),
  }));
}


