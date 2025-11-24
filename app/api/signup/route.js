// app/api/signup/route.js
import { auth, createUserWithEmailAndPassword } from "@/lib/firebase";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function POST(req) {
  console.log("🔥 Signup API route hit");

  try {
    const body = await req.json();
    console.log("📥 Request body:", body);

    const { name, email, password } = body;

    // Validation
    if (!name || !email || !password) {
      console.log("❌ Missing fields");
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    console.log("🔑 Creating user in Firebase Auth...");
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("✅ Firebase Auth user created:", user.uid);

    console.log("💾 Saving user profile to Firestore...");
    await setDoc(doc(db, "users", user.uid), {
      name,
      email: user.email,
      role: "user",
      status: "active",
      profileCompleted: false,
      createdAt: new Date().toISOString(),
    });
    console.log("✅ User profile saved to Firestore!");

    console.log("🎉 Signup successful for:", user.email);
    return NextResponse.json(
      {
        message: "Signup successful",
        uid: user.uid,
        email: user.email,
        redirect: "/login",
        type: "success",
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("💥 Signup failed:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);

    let message = "Signup failed. Please try again.";

    if (error.code === "auth/email-already-in-use") {
      message = "This email is already registered.";
    } else if (error.code === "auth/weak-password") {
      message = "Password should be at least 6 characters.";
    } else if (error.code === "auth/invalid-email") {
      message = "Please enter a valid email.";
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}