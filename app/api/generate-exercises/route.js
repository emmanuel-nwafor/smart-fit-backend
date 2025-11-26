// app/api/generate-exercises/route.js
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { NextResponse } from "next/server";

const UNSPLASH_URL = "https://source.unsplash.com/featured/600x800?";

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

const muscleGroups = Object.keys(imageQueries);
const equipment = ["Dumbbells", "Barbell", "Bodyweight", "Cable", "Machine", "Kettlebell"];

const generateExerciseName = () => {
  const names = [
    "Power Press", "Iron Grip Curl", "Deadlift Destroyer", "Squat King", "Lunge Master",
    "Pull-Up Beast", "Push-Up Pro", "Plank God", "Hip Thrust Hero", "Calf Crusher"
  ];
  return names[Math.floor(Math.random() * names.length)];
};

const generateReps = () => {
  const options = ["8-12", "10-15", "12-15", "15-20", "30-45 sec", "45-60 sec"];
  return options[Math.floor(Math.random() * options.length)];
};

const generateDescription = (name, muscle) => {
  return `Perfect ${muscle.toLowerCase()} builder. ${name} targets strength and tone with proper form.`;
};

export async function POST(request) {
  try {
    const body = await request.json();
    const exercisesToAdd = Math.min(Math.max(1, Number(body.count) || 6), 50);

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
      await wait(2000);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully added ${exercisesToAdd} new exercises!`,
    });
  } catch (error) {
    console.error("Generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate exercises" },
      { status: 500 }
    );
  }
}