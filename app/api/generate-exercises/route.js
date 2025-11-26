// app/api/generate-exercises/route.js
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { NextResponse } from "next/server";

// Reusable data
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

  // Added more to make smart-fit more dynamic
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

  // Added more to make smart-fit more dynamic
  "5-8","3-6 (strength)","20-30 (endurance)","AMRAP","EMOM 10",
  "8x3 (power)","4x12","5x5","3x20","Drop Set",
  "Superset","Pyramid Set","Negative Reps"
];


const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
const generateName = () => random(namePool);
const generateReps = () => random(repSchemes);

const generateDescription = (name, muscle) =>
  `${name} — savage ${muscle.toLowerCase()} builder. Strict form, full burn, massive gains.`;

export async function POST(request) {
  try {
    const body = await request.json();

    // Logic for generation of workouts
    if (body.action === "generate_ai_workouts") {
      const { count, imageUrl } = body;

      if (!count || !imageUrl) {
        return NextResponse.json(
          { error: "Count and imageUrl required." },
          { status: 400 }
        );
      }

      const items = [];

      for (let i = 0; i < count; i++) {
        const name = generateName();
        const muscle = random(muscleGroups);
        const reps = generateReps();
        const equipment = random(equipmentList);
        const description = generateDescription(name, muscle);

        // Save to Firestore
        const docRef = await addDoc(collection(db, "exercises"), {
          name,
          description,
          muscleGroup: muscle,
          reps,
          equipment,
          // Image uploaded by admin
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
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
