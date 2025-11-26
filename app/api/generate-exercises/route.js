// app/api/generate-exercises/route.js

import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { NextResponse } from "next/server";

const equipment = ["DumBbells", "Barbell", "Bodyweight", "Cable", "Machine", "Kettlebell"];

const muscleGroups = [
  "Chest", "Back", "Shoulders", "Biceps", "Triceps",
  "Legs", "Glutes", "Core", "Full Body", "Arms", "Calves"
];

const generateExerciseName = () => {
  const names = [
    "Power Press", "Iron Grip Curl", "Deadlift Destroyer", "Squat King", "Lunge Master",
    "Pull-Up Beast", "Push-Up Pro", "Plank God", "Hip Thrust Hero", "Calf Crusher",
    "Overhead Crusher", "Beast Mode Rows", "Diamond Push-Ups", "Glute Fire", "Core Burner"
  ];
  return names[Math.floor(Math.random() * names.length)];
};

const generateReps = () => {
  const options = ["8-12", "10-15", "12-15", "15-20", "30-45 sec", "45-60 sec", "60-90 sec"];
  return options[Math.floor(Math.random() * options.length)];
};

const generateDescription = (name, muscle) => {
  return `${name} — High-intensity ${muscle.toLowerCase()} builder. Focus on form, feel the burn, and level up your gains.`;
};

export async function POST(request) {
  try {
    const body = await request.json();
    const exercisesToAdd = Math.min(Math.max(1, Number(body.count) || 6), 50);
    const customImageUrl = body.customImageUrl?.trim();

    // Must have a Cloudinary image URL
    if (!customImageUrl) {
      return NextResponse.json(
        { error: "No image uploaded. Please upload an image first." },
        { status: 400 }
      );
    }

    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    for (let i = 0; i < exercisesToAdd; i++) {
      const muscle = muscleGroups[Math.floor(Math.random() * muscleGroups.length)];
      const equip = equipment[Math.floor(Math.random() * equipment.length)];

      const exercise = {
        name: generateExerciseName(),
        muscleGroup: muscle,
        equipment: equip,
        reps: generateReps(),
        description: generateDescription(generateExerciseName(), muscle),
        difficulty: ["Beginner", "Intermediate", "Advanced"][Math.floor(Math.random() * 3)],
        isInclusive: true,
        createdAt: serverTimestamp(),
        isGenerated: true,
        likes: 0,
        usedCount: 0,
        tags: ["inclusive", "all-genders", "strength", "tone", "confidence", "admin-upload"],
        imageUrl: customImageUrl, // Only your uploaded image
      };

      await addDoc(collection(db, "exercises"), exercise);
      await wait(2000); // Still needed for Firestore write limits
    }

    return NextResponse.json({
      success: true,
      message: `BOOM! ${exercisesToAdd} premium exercises created with your image!`,
    });
  } catch (error) {
    console.error("Exercise generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate exercises", details: error.message },
      { status: 500 }
    );
  }
}