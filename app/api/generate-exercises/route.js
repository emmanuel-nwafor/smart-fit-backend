import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────
// STATIC POOL DATA
// ─────────────────────────────────────────────────────────────

const muscleGroups = [
  "Chest","Back","Shoulders","Biceps","Triceps","Legs","Glutes","Core",
  "Full Body","Arms","Calves","Forearms","Upper Back","Lower Back",
  "Quads","Hamstrings","Obliques","Hip Flexors","Neck"
];

const equipmentList = [
  "Dumbbells","Barbell","Bodyweight","Cable","Machine","Kettlebell",
  "Resistance Bands","Smith Machine","EZ Bar","Medicine Ball",
  "Bench","TRX","Plate","Trap Bar","Sandbag"
];

const namePool = [
  "Power Press","Iron Grip Curl","Deadlift Destroyer","Squat King","Lunge Master",
  "Pull-Up Beast","Push-Up Pro","Plank God","Hip Thrust Hero","Calf Crusher",
  "Overhead Destroyer","Beast Mode Rows","Diamond Push-Ups","Glute Fire","Core Burner",
  "Skull Crusher","Hammer Curl","Romanian Deadlift","Goblet Squat","Face Pull",
  "Mountain Crusher","Iron Titan Rows","Shadow Squat","Viking Press",
  "Dragon Lunge","Atomic Push-Up","Steel Core Crunch","Beast Lift",
  "Fury Deadlift","Titan Chest Press","Hammer Blast Curl","Grit Row",
  "Power Lunge Pro","Warrior Plank","Ultra Hip Drive",
  "Impact Shoulder Raise","Max Burn Flyes","Charge Press",
  "Inferno Pushdown","Prime Row Pull","Supreme Split Squat",
  "Alpha Chest Fly","Rhino Leg Press","Fortress Core Twist"
];

const repSchemes = [
  "8-12","10-15","12-15","15-20","6-10",
  "30-45 sec","45-60 sec","60-90 sec",
  "5-8","3-6 (strength)","20-30 (endurance)","AMRAP","EMOM 10",
  "8x3 (power)","4x12","5x5","3x20","Drop Set",
  "Superset","Pyramid Set","Negative Reps"
];

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
const generateName = () => random(namePool);
const generateReps = () => random(repSchemes);

const generateDescription = (name, muscle) =>
  `${name} — savage ${muscle.toLowerCase()} builder. Strict form, full burn, massive gains.`;

// ─────────────────────────────────────────────────────────────
// MAIN POST HANDLER
// ─────────────────────────────────────────────────────────────

export async function POST(request) {
  let body;

  // -------- SAFE JSON PARSE --------
  try {
    const text = await request.text();
    body = text ? JSON.parse(text) : null;
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid JSON format sent to backend." },
      { status: 400 }
    );
  }

  // -------- BASIC VALIDATION --------
  if (!body || !body.action) {
    return NextResponse.json(
      { error: "Missing 'action' in request body." },
      { status: 400 }
    );
  }

  // =======================================================================
  // ACTION: GENERATE AI WORKOUTS
  // =======================================================================

  if (body.action === "generate_ai_workouts") {
    const { count, imageUrl } = body;

    if (!count || count < 1) {
      return NextResponse.json(
        { error: "You must request at least 1 workout." },
        { status: 400 }
      );
    }

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL (local imageUri) is required." },
        { status: 400 }
      );
    }

    try {
      const items = [];

      for (let i = 0; i < count; i++) {
        const name = generateName();
        const muscle = random(muscleGroups);
        const reps = generateReps();
        const equipment = random(equipmentList);
        const description = generateDescription(name, muscle);

        // Save a temporary record to Firestore
        const docRef = await addDoc(collection(db, "exercises"), {
          name,
          description,
          muscleGroup: muscle,
          reps,
          equipment,
          imageUrl,
          isGenerated: true,
          isAdminCreated: true,
          likes: 0,
          usedCount: 0,
          createdAt: serverTimestamp(),
        });

        items.push({
          id: docRef.id,
          name,
          description,
          muscleGroup: muscle,
          reps,
          equipment,
          imageUrl,
        });
      }

      return NextResponse.json({
        success: true,
        message: `${count} AI workouts generated!`,
        items,
      }, { status: 200 });

    } catch (err) {
      console.error("GENERATION ERROR:", err);
      return NextResponse.json(
        { error: "Failed to generate workouts." },
        { status: 500 }
      );
    }
  }

  // =======================================================================
  // ACTION: SAVE ADMIN WORKOUT
  // =======================================================================

  if (body.action === "save_workout") {
    try {
      const { name, description, muscleGroup, reps, equipment, imageUrl } = body;

      if (!name || !description || !muscleGroup || !reps || !equipment || !imageUrl) {
        return NextResponse.json(
          { error: "All workout fields are required." },
          { status: 400 }
        );
      }

      const docRef = await addDoc(collection(db, "exercises"), {
        name,
        description,
        muscleGroup,
        reps,
        equipment,
        imageUrl,
        isGenerated: false,
        isAdminCreated: true,
        likes: 0,
        usedCount: 0,
        createdAt: serverTimestamp(),
      });

      return NextResponse.json({
        success: true,
        message: "Workout saved successfully!",
        id: docRef.id,
      }, { status: 200 });

    } catch (err) {
      console.error("SAVE WORKOUT ERROR:", err);
      return NextResponse.json(
        { error: "Failed to save workout." },
        { status: 500 }
      );
    }
  }

  // =======================================================================
  // INVALID ACTION
  // =======================================================================

  return NextResponse.json(
    { error: "Invalid action." },
    { status: 400 }
  );
}
