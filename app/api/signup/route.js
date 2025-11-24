import { auth, db } from "../../lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password, name, role } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    // Create user in firebase authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Saving users to firestore 
    await setDoc(doc(db, "users", user.uid), {
      name,
      email: user.email,
      role: role || "user",
      status: "active",
      profileCompleted: false,
      createdAt: new Date().toISOString(),
    });

    // 3️⃣ Create JWT
    const token = jwt.sign(
      {
        userId: user.uid,
        email: user.email,
        role: role || "user",
        name,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.EXPIRES_IN }
    );

    // Redirecting after user signup
    return NextResponse.json(
      {
        message: "Signup successful",
        uid: user.uid,
        email: user.email,
        role: role || "user",
        token,
        redirect: "/auth/profile-complete", 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Signup error:", error);

    let friendlyMessage = "Signup failed";

    if (error.code === "auth/email-already-in-use") {
      friendlyMessage = "This email is already registered.";
    } else if (error.code === "auth/invalid-email") {
      friendlyMessage = "Invalid email address.";
    } else if (error.code === "auth/weak-password") {
      friendlyMessage = "Weak password.";
    }

    return NextResponse.json(
      { error: friendlyMessage },
      { status: 400 }
    );
  }
}
