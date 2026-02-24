import { Queue } from 'bullmq';

const connectionOptions = {
  url: "rediss://default:AUx6AAIncDJjNmI0MmFjZTE5MDM0NWMyOTZjZDBhZTRmNGQ3NDRiMHAyMTk1Nzg@major-vulture-19578.upstash.io:6379",
  tls: { rejectUnauthorized: false },
  maxRetriesPerRequest: null,
};

// Singleton pattern for Next.js
const myFirstQueue = global.myFirstQueue || new Queue('myFirstQueue', { connection: connectionOptions });
const updateTagBattery = global.updateTagBattery || new Queue('updateTagBattery', { connection: connectionOptions });
if (process.env.NODE_ENV !== 'production') global.myFirstQueue = myFirstQueue;

// Function jo data nu queue vich add karega
 const addDataInQueue = async (dataToSave) => {
  try {
      await myFirstQueue.add("tagUpdate", dataToSave, {
          removeOnComplete: true, 
          attempts: 2,            
          backoff: {              
              type: 'exponential',
              delay: 1000
          }
      });
      
      console.log(` [ addDataInQueue QUEUE][Producer] Successfully added ${dataToSave.length} tags to queue`);
  } catch (error) {
      console.error(" [addDataInQueue Producer] Failed to add data to queue:", error.message);
  }
};




 const addTagBatteryDataInQueue = async (data) => {
  try {
      await updateTagBattery.add("updateTagBattery", data, {
          removeOnComplete: true, 
          attempts: 2,            
          backoff: {              
              type: 'exponential',
              delay: 1000
          }
      });
      
      console.log(` [updateTagBattery QUEUE][Producer] Successfully added  tags to queue`);
  } catch (error) {
      console.error(" [updateTagBattery Producer] Failed to add data to queue:", error.message);
  }
};


export {addDataInQueue,addTagBatteryDataInQueue}
