import { Queue } from 'bullmq';

const connectionOptions = {
  url: "rediss://default:AUx6AAIncDJjNmI0MmFjZTE5MDM0NWMyOTZjZDBhZTRmNGQ3NDRiMHAyMTk1Nzg@major-vulture-19578.upstash.io:6379",
  tls: { rejectUnauthorized: false },
  maxRetriesPerRequest: null,
};



// Singleton pattern for Next.js
const myFirstQueue = global.myFirstQueue || new Queue('myFirstQueue', { connection: connectionOptions });
if (process.env.NODE_ENV !== 'production') global.myFirstQueue = myFirstQueue;


// Function jo data nu queue vich add karega
export const addDataInQueue = async (dataToSave) => {
  try {
      await myFirstQueue.add("tagUpdate", dataToSave, {
          removeOnComplete: true, 
          attempts: 3,            
          backoff: {              
              type: 'exponential',
              delay: 1000
          }
      });
      
      console.log(` [QUEUE] Successfully added ${dataToSave.length} tags to queue`);
  } catch (error) {
      console.error(" Failed to add data to queue:", error.message);
  }
};
