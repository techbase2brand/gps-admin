import client from "../client";

export async function POST(request) {
    try {
        const body = await request.json();
        const { email, otp } = body;

        if (!email || !otp) {
            return Response.json({ 
                success: false, 
                response: "Email and OTP are required" 
            }, { status: 400 });
        }

        // 2. Fetch the user's stored OTP
        const { data: staffMember, error: fetchError } = await client
            .from('staff')
            .select("otp")
            .eq('email', email)
            .single();

        if (fetchError || !staffMember) {
            return Response.json({
                success: false,
                response: "User not found"
            }, { status: 404 });
        }

        // 3. Compare the OTPs
        // Note: Use == if otp comes as a string from JSON, or Number(otp)
        if (staffMember.otp == otp) {
            
            // OPTIONAL: Clear the OTP after successful verification so it can't be reused
            await client
                .from('staff')
                .update({ otp: null })
                .eq('email', email);

            return Response.json({
                success: true,
                response: "Verification successful"
            }, { status: 200 });
            
        } else {
            return Response.json({
                success: false,
                response: "Invalid OTP"
            }, { status: 401 });
        }

    } catch (error) {
        return Response.json({
            success: false,
            response: "Server error",
            error: error.message
        }, { status: 500 });
    }
}