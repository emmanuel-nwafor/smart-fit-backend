import { auth, db, signInWithEmailAndPassword } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    const userData = userSnap.data();

    const token = jwt.sign(
      {
        userId: user.uid,
        email: user.email,
        role: userData.role || "user",
        status: userData.status || "active",
        profileCompleted: userData.profileCompleted || false,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.EXPIRES_IN }
    );

    const redirectTo = userData.profileCompleted ? "/dashboard" : "/auth/profile-complete";

    return NextResponse.json({
      message: "Login successful",
      uid: user.uid,
      email: user.email,
      role: userData.role || "user",
      status: userData.status || "active",
      profileCompleted: userData.profileCompleted || false,
      token,
      redirect: redirectTo,
    }, { status: 200 });

  } catch (error) {
    console.error("Login error:", error);

    let friendlyMessage = "Login failed";
    if (error.code === "auth/user-not-found") friendlyMessage = "No account found with this email.";
    else if (error.code === "auth/wrong-password") friendlyMessage = "Incorrect password.";
    else if (error.code === "auth/invalid-email") friendlyMessage = "Invalid email address.";

    return NextResponse.json({ error: friendlyMessage }, { status: 400 });
  }
}
