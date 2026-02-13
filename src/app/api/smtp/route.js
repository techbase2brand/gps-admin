import nodemailer from 'nodemailer';
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';



export async function POST(req) {
  const { email, username, password, otp } = await req.json();

  // 1. Setup Nodemailer Transporter (using Gmail for free)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'gaganjotbase2brand@gmail.com', //process.env.EMAIL_USER, // Your gmail
      pass: "vejofyvqfezgcldy", // Your App Password
    },
  });

  try {
   if(email && username && password){
     // 2. Send the Email
     transporter.sendMail({
      from: '"GPS Tracker Admin"',
      to: email,
      subject: 'Your Login Credentials',
      text: `Hello ${username}, your login password is: ${password}`,
      html: `<b>Hello ${username}</b><p>Your login password is: <strong>${password}</strong></p>`,
    });
   }

   if(email && otp){
    // 2. Send the Email
    transporter.sendMail({
     from: '"GPS Tracker Admin"',
     to: email,
     subject: 'OTP ',
     text: `Hello  your otp is ${otp}`,
     html: `<p>Your forget password otp is: <strong>${otp}</strong></p>`,
   });
  }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: 'Email failed to send' }, { status: 500 });
  }
}