// export default async function sendNotification(supabase, carData, slotNumber) {
//   try {

// console.log("hi from notificaion");

//     console.log("carData, slotNumber",carData, slotNumber);



//     let chipId = carData.chip
//     const { count, error: lockError } = await supabase
//       .from('cars')
//       .update({ notification_sent_check: true })
//       .eq('chip', carData.chip);

//     if (lockError) {
//       console.error(`[${chipId}] Error locking notification status:`, lockError.message);
//       return false;
//     }


//     if (count === 0) {
//       console.log(`[${chipId}] Notification already processed by another instance. Skipping.`);
//       return false;
//     }
//     const { data: facilityData, error: facilityDataError } = await supabase.from("facility").select("*").eq("id", carData.facilityId);
//     if (facilityDataError) return;
//     let facilityName = facilityData.name;
//     let finalSlotNumber = slotNumber ?? 'Unknown';

//     try {
//       const message = `Car with VIN ${carData?.chip} and chip id ${carData?.chip} has left ${facilityName}, Slot ${finalSlotNumber}.`;
//       const title = 'Car Left Facility';
//       console.log("message", message);


//       // FETCH ACTIVE TOKENS (Ensure is_active=true filter is used)
//       const { data: tokensData, error: fetchError } = await supabase
//         .from('user_fcm_tokens')
//         .select('fcm_token')
//         .eq('is_active', true);

//       if (fetchError) {
//         console.error(
//           'ERROR fetching active FCM tokens for notification:',
//           fetchError.message,
//         );
//         return false; // Return false on error
//       }

//       const tokensToSend = tokensData
//         .map(row => row.fcm_token)
//         .filter(token => token);

//       console.log(
//         `++++ Fetched ${tokensToSend.length} active tokens for broadcast.`,
//       );

//       if (tokensToSend.length > 0) {
//         const response = await admin.messaging().sendEachForMulticast({
//           tokens: tokensToSend,

//           // UI notification (Android + iOS)
//           notification: {
//             title,
//             body: message,
//           },

//           // Data payload
//           data: {
//             chip_id: chipId.toString(),
//             facility: facilityName,
//             slot: String(finalSlotNumber),
//             title,
//             body: message,
//             type: 'car_left_facility',
//           },

//           // Android specific (optional but recommended)
//           android: {
//             priority: 'high',
//             notification: {
//               channelId: 'default-channel-id',
//               sound: 'default',
//             },
//           },

//           // iOS / APNs config
//           apns: {
//             headers: {
//               'apns-priority': '10', // Immediate delivery
//             },
//             payload: {
//               aps: {
//                 alert: {
//                   title,
//                   body: message,
//                 },
//                 sound: 'default',
//                 'content-available': 1,
//               },
//             },
//           },
//         });

//         console.log(
//           `FCM Broadcast Sent successfully to ${response.successCount} tokens.`,
//         );

//         // Update DB status to prevent repeat notification until next End Moving event
//         const { error: updateError } = await supabase
//           .from('cars')
//           .update({
//             notification_sent_check: true,
//           })
//           .eq('id', carData.id);

//         if (updateError) {
//           console.error('DB update failed after successful FCM send. Re-notification possible.', updateError);
//           return false; // Treat as failure if DB update fails to ensure retry
//         }

//         console.log('DB updated after notification was sent.');
//         return true; // Notification attempt successful (even if 0 tokens sent)
//       } else {
//         console.log('No active FCM tokens available for broadcasting.');
//         return false;
//       }
//     } catch (error) {
//       // If any error occurs (FCM failure or DB update failure after FCM), 
//       // the notification_sent_check flag is not set to true, allowing retry.
//       console.error('Notification Error: Failed to send or update DB status after successful send attempt.', error);
//       return false; // Notification attempt failed
//     }
//   } catch (error) {
//     console.log("error", error);
//     return error;

//   }
// }




import admin from "../admin/scripts/firebase-admin.js";


export default async function sendNotification(supabase, carDataArr, slotNumber) {
  try {
    console.log("hi from notification");
    // console.log("carDataArr,carDataArr",carDataArr);
    
    let carData=carDataArr;
    // console.log(carData);
    
    let chipId = carData.chip;

    // 1. Lock the notification status
    const { error: lockError } = await supabase
      .from('cars')
      .update({ notification_sent_check: true })
      .eq('chip', chipId);

    if (lockError) {
      console.error(`[${chipId}] Error locking status:`, lockError.message);
      return { data: null, error: lockError };
    }

    // 2. Fetch Facility Name
    const { data: facilityData, error: facilityDataError } = await supabase
      .from("facility")
      .select("name")
      .eq("id", carData.facilityId)
      .single();

    if (facilityDataError) return { data: null, error: facilityDataError };

    let facilityName = facilityData.name;
    let finalSlotNumber = slotNumber ?? 'Unknown';
    const message = `Car with VIN ${carData?.vin || chipId} and chip id ${chipId} has left ${facilityName}, Slot ${finalSlotNumber}.`;
    const title = 'Car Left Facility';

    // 3. Fetch Tokens
    const { data: tokensData, error: fetchError } = await supabase
      .from('user_fcm_tokens')
      .select('fcm_token')
      .eq('is_active', true);

    if (fetchError) return { data: null, error: fetchError };

    const tokensToSend = tokensData?.map(row => row.fcm_token).filter(t => t) || [];

    if (tokensToSend.length > 0) {
      const response = await admin.messaging().sendEachForMulticast({
        tokens: tokensToSend,

        // UI notification (Android + iOS)
        notification: {
          title,
          body: message,
        },

        // Data payload
        data: {
          chip_id: chipId.toString(),
          facility: facilityName,
          slot: String(finalSlotNumber),
          title,
          body: message,
          type: 'car_left_facility',
        },

        // Android specific (optional but recommended)
        android: {
          priority: 'high',
          notification: {
            channelId: 'default-channel-id',
            sound: 'default',
          },
        },

        // iOS / APNs config
        apns: {
          headers: {
            'apns-priority': '10', // Immediate delivery
          },
          payload: {
            aps: {
              alert: {
                title,
                body: message,
              },
              sound: 'default',
              'content-available': 1,
            },
          },
        },
      });

      console.log(`FCM Sent: ${response.successCount} successful.`);
      return { data: response, error: null };
    } else {
      return { data: null, error: "No active tokens found" };
    }

  } catch (error) {
    console.error("Critical Notification Error:", error);
    return { data: null, error: error.message };
  }
}