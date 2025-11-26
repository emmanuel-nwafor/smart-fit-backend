// app/api/admin-generate/route.js
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

// Reusable data
const muscleGroups = ["Chest","Back","Shoulders","Biceps","Triceps","Legs","Glutes","Core","Full Body","Arms","Calves"];
const equipmentList = ["Dumbbells","Barbell","Bodyweight","Cable","Machine","Kettlebell"];
const namePool = [
  "Power Press","Iron Grip Curl","Deadlift Destroyer","Squat King","Lunge Master",
  "Pull-Up Beast","Push-Up Pro","Plank God","Hip Thrust Hero","Calf Crusher",
  "Overhead Destroyer","Beast Mode Rows","Diamond Push-Ups","Glute Fire","Core Burner",
  "Skull Crusher","Hammer Curl","Romanian Deadlift","Goblet Squat","Face Pull"
];
const repSchemes = ["8-12","10-15","12-15","15-20","6-10","30-45 sec","45-60 sec","60-90 sec"];

const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

const generateName = () => random(namePool);
const generateReps = () => random(repSchemes);
const generateDescription = (name, muscle) => 
  `${name} — savage ${muscle.toLowerCase()} builder. Strict form, full burn, massive gains.`;

export async function POST(request) {
  try {
    const body = await request.json();

    // 1. Create Category
    if (body.action === "create_category") {
      const { name, description, imageUrl } = body;
      if (!name?.trim() || !imageUrl?.trim()) {
        return NextResponse.json({ error: "Name and image required" }, { status: 400 });
      }

      await addDoc(collection(db, "exercise_categories"), {
        name: name.trim(),
        description: (description || "").trim(),
        imageUrl,
        createdAt: serverTimestamp(),
      });

      return NextResponse.json({ success: true, message: "Category created!" });
    }

    // 2. Create Single Workout
    if (body.action === "create_workout") {
      const { 
        name, description, imageUrl, categoryId,
        muscleGroup, reps, equipment, useAISuggestions 
      } = body;

      if (!name?.trim() || !imageUrl?.trim() || !categoryId) {
        return NextResponse.json({ error: "Name, image and category required" }, { status: 400 });
      }

      // Validate category exists
      const catRef = doc(db, "exercise_categories", categoryId);
      const catSnap = await getDoc(catRef);
      if (!catSnap.exists()) {
        return NextResponse.json({ error: "Invalid category" }, { status: 400 });
      }

      // Optional "AI" enhancement (pure logic)
      const finalName = useAISuggestions 
        ? `${name.trim()} Pro` 
        : name.trim();

      const finalDesc = useAISuggestions && !description?.trim()
        ? generateDescription(finalName, muscleGroup || random(muscleGroups))
        : (description || "").trim();

      await addDoc(collection(db, "exercises"), {
        name: finalName,
        description: finalDesc,
        categoryId,
        categoryName: catSnap.data().name,
        muscleGroup: (muscleGroup || "").trim() || random(muscleGroups),
        reps: (reps || "").trim() || generateReps(),
        equipment: (equipment || "").trim() || random(equipmentList),
        imageUrl,
        isGenerated: false,
        isAdminCreated: true,
        likes: 0,
        usedCount: 0,
        createdAt: serverTimestamp(),
      });

      return NextResponse.json({ success: true, message: "Workout created!" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}