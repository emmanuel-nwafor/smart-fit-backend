// app/api/signup/route.js
import { auth, createUserWithEmailAndPassword } from "@/lib/firebase";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function POST(req) {
  console.log("Signup request received");

  try {
    const { name, email, password } = await req.json();
    console.log("Received data:", { name, email, hasPassword: !!password });

    // Basic validation
    if (!name || !email || !password) {
      console.log("Validation failed: missing fields");
      return NextResponse.json(
        { error: "Please fill in all fields" },
        { status: 400 }
      );
    }

    // Create user in Firebase Auth
    console.log("Creating user in Firebase Authentication...");
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("User created successfully! UID:", user.uid);

    // Save profile to Firestore
    console.log("Saving user profile to Firestore...");
    await setDoc(doc(db, "users", user.uid), {
      name,
      email: user.email,
      role: "user",
      status: "active",
      profileCompleted: false,
      createdAt: new Date().toISOString(),
    });
    console.log("Profile saved to Firestore!");

    // Success!
    console.log("Signup completed for:", email);
    return NextResponse.json(
      {
        message: "Account created successfully!",
        uid: user.uid,
        email: user.email,
        redirect: "/login",
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Signup failed:", error.code || error.message);

    // Friendly error messages
    const errorMessages = {
      "auth/email-already-in-use": "This email is already registered.",
      "auth/weak-password": "Password should be at least 6 characters.",
      "auth/invalid-email": "Please enter a valid email address.",
      "permission-denied": "Firestore rules blocked the write. Check your security rules!",
    };

    const message = errorMessages[error.code] || "Something went wrong. Please try again.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}