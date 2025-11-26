// app/api/generate-exercises/route.js
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { NextResponse } from "next/server";

// Unsplash Source API
const UNSPLASH_URL = "https://source.unsplash.com/featured/600x800?";

// Mapping of muscles exercises
const imageQueries = {
  Chest: "chest+workout,bench+press,gym",
  Back: "pull+up,lat+pulldown,back+muscles,gym",
  Shoulders: "shoulder+press,delts,gym+shoulders",
  Biceps: "bicep+curl,dumbbell+curl,arms",
  Triceps: "triceps+extension,skull+crusher,arms",
  Legs: "squat,leg+press,quads,gym",
  Glutes: "hip+thrust,glute+bridge,glutes+workout",
  Core: "plank,abs+workout,core+training",
  "Full Body": "full+body+workout,hiit,functional+training",
  Arms: "arm+workout,biceps+triceps,gym",
  Calves: "calf+raises,standing+calf,gym",
};

const generateImageUrl = (muscleGroup) => {
  const query = imageQueries[muscleGroup] || "fitness,gym,workout";
  return `${UNSPLASH_URL}${query}&sig=${Date.now()}${Math.random()}`;
};

export async function POST() {
  try {
    const exercisesToAdd = 6;

    // Delay helper
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
        tags: ["inclusive", "all-genders", "strength", "tone", "confidence"],
        imageUrl: generateImageUrl(muscle),
      };

      await addDoc(collection(db, "exercises"), exercise);

      // Wait 2 seconds before next one
      await wait(2000);
    }

    return NextResponse.json({
      success: true,
      message: `Added ${exercisesToAdd} stunning new exercises with 2-second intervals!`,
    });
  } catch (error) {
    console.error("Exercise generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate exercises" },
      { status: 500 }
    );
  }
}
