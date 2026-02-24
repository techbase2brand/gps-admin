import { Worker } from 'bullmq';
import { createClient } from "@supabase/supabase-js";
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionOptions = {
    url: "rediss://default:AUx6AAIncDJjNmI0MmFjZTE5MDM0NWMyOTZjZDBhZTRmNGQ3NDRiMHAyMTk1Nzg@major-vulture-19578.upstash.io:6379",
    tls: { rejectUnauthorized: false },
    maxRetriesPerRequest: null,
};

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error(" [consumer] Supabase credentials missing");
    process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const worker = new Worker('myFirstQueue', async (job) => {
    try {
        const start = Date.now();
        const dataArray = job.data;

        if (!Array.isArray(dataArray)) {
            console.error("[consumer] Expected array but received:", typeof dataArray);
            return;
        }
        console.log(`[consumer] Processing batch of ${dataArray.length} updates`);

        const updatePromises = dataArray.map(async (tag) => {
            const { chip, longitude, latitude, last_location_update } = tag;

            const { error } = await supabase
                .from('cars')
                .update({
                    longitude,
                    latitude,
                    last_location_update
                })
                .eq("chip", chip);

            if (error) {
                console.error(`[consumer] Failed for ${chip}:`, error.message);
            } else {
                console.log(`[consumer] Data saved for chip: ${chip}`);
            }
        });

        await Promise.all(updatePromises);
        const duration = Date.now() - start;
        console.log(`[consumer] Batch of ${job.data.length} took ${duration}ms`);

        return { status: '[consumer] success', duration };
    } catch (err) {
        throw new Error(` [consumer] Worker failed: ${err.message}`);
    }

}, {
    connection: connectionOptions,
    concurrency: 5
});


const TagUpdateworker = new Worker('updateTagBattery', async (job) => {
    try {
        const start = Date.now();
        const updateTagData = job.data;
        console.log(updateTagData);
        
        const TagId = updateTagData.tagID;
        const TagBatt = updateTagData.tagCap
        console.log("updateTagData", TagId, TagBatt);

        const { error } = await supabase
            .from('cars')
            .update({
                "battery_level": TagBatt
            })
            .eq("chip", TagId);

        if (error) {
            console.error(`[consumer] Failed for ${TagId}:`, error.message);
        } else {
            console.log(`[consumer] Data saved for chip: ${TagId}`);

        }

        // await Promise.all(updatePromises);
        const duration = Date.now() - start;
        console.log(`[TagUpdateworker consumer] Batch  took ${duration}ms`);

        return { status: '[TagUpdateworker consumer] success', duration };
    }
    catch (err) {
        throw new Error(` [consumer] Worker failed: ${err.message}`);
    }

}, {
    connection: connectionOptions,
    concurrency: 5
});