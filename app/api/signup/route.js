// app/api/signup/route.js
import { auth, db, createUserWithEmailAndPassword } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { name, email, password } = await req.json();

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      name,
      email: user.email,
      role: "user",
      status: "active",
      profileCompleted: false,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(
      { message: "Signup successful", redirect: "/login" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: error.code === "auth/email-already-in-use" ? "Email already in use" : "Signup failed" },
      { status: 400 }
    );
  }
}