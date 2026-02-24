import * as dotenv from 'dotenv';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from "@supabase/supabase-js";
import { addDataInQueue, addTagBatteryDataInQueue } from '../../../queue/Producer.js';
import { TagProcessing } from '../../hooks/useTagProcess.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const LocalSenseSalt = process.env.LocalSenseSalt;
const LocalSensePassword = process.env.LocalSensePassword;
const LocalSenseUser = process.env.LocalSenseUser;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("[CRITICAL] Supabase credentials missing");
    process.exit(1);
}

// Initialize JSDOM with error handling for script execution
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: "http://localhost",
    runScripts: "dangerously",
    resources: "usable"
});

global.window = dom.window;
global.document = dom.window.document;
global.Number = dom.window.Number;

Object.defineProperty(global, 'navigator', {
    value: dom.window.navigator,
    writable: true,
    configurable: true
});

const baseDir = path.join(__dirname, '../../../../public/websocket_api/');
const files = ['jquery.js', 'md5.min.js', 'reconnecting-websocket.js', 'localsense_websocket_api.js'];

// Secure Script Loading
try {
    files.forEach(file => {
        const filePath = path.join(baseDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        dom.window.eval(content);
        console.log(`[INFO] Loaded script: ${file}`);
    });
    console.log("[INFO] Environment setup successful");
} catch (err) {
    console.error("[FATAL] Environment Setup Error:", err.message);
    process.exit(1);
}

const API = dom.window.LOCALSENSE?.WEBSOCKET_API;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

if (API) {
    console.log("[INFO] LocalSense API Initialized");

    API.SetAccount("base2", "Aa123456", "abcdefghijklmnopqrstuvwxyz20191107salt");
    API.setPosOutType(API.PosOutMode["2"]);
    API.RequireBasicInfo("47.236.94.129:48300");

    let tagUpdateBuffer = new Map();
    let lastUpdateTracker = new Map();
    let lastLogTime = 0;
    const THROTTLE_TIME = 40000;

    /**
     * Data Reception Handler
     */
    API.onRecvTagPos = function (data) {
        try {
            if (!data) return;

            const dataArray = Array.isArray(data) ? data : [data];
            const now = Date.now();

            dataArray.forEach(async (tagContainer) => {
                Object.keys(tagContainer).forEach(async (tagId) => {
                    const pos = tagContainer[tagId];

                    if (pos && pos.id) {
                        const hexId = Number(pos.id).toString(16);
                        const lastUpdate = lastUpdateTracker.get(hexId) || 0;

                        // Check throttling logic
                        if (now - lastUpdate >= THROTTLE_TIME) {

                            lastUpdateTracker.set(hexId, now);

                            tagUpdateBuffer.set(hexId, {
                                chip: hexId,
                                longitude: pos.x,
                                latitude: pos.y,
                                last_location_update: new Date().toISOString()
                            });

                            await TagProcessing(supabase, tagUpdateBuffer);

                            console.log("Data saved to the TagProcessing ");


                        }
                    }
                });
            });

            // Occasional logging
            if (now - lastLogTime > THROTTLE_TIME) {
                console.log(`[STATUS] Buffer Size: ${tagUpdateBuffer.size}`);
                lastLogTime = now;
            }

        } catch (error) {
            console.error("[ERROR] Data processing failure:", error.message);
        }
    };


    API.onRecvTagPower = function (data) {
        // console.log("Data of the tag power is ", );
        const tags = Object.values(data);
        for (let i = 0; i < tags.length; i++) {
            const tagCap = tags[i].cap
            const tagID = Number(tags[i].tagid).toString(16)
            console.log(" from tagPower tagID,tagCap", tagID, tagCap);
            let dataonRecvTagPower = {
                tagID: tagID, tagCap: tagCap
            }

            // addTagBatteryDataInQueue(dataonRecvTagPower)

        }

    }



    /**
     * Batch Sync to Queue
     */
    setInterval(async () => {
        try {
            if (tagUpdateBuffer.size === 0) return;

            const dataToSave = Array.from(tagUpdateBuffer.values());
            tagUpdateBuffer.clear();

            console.log(`[QUEUE] Dispatching batch: ${dataToSave.length} records`);

            await addDataInQueue(dataToSave);

            console.log(`[SUCCESS] Batch dispatched to queue`);
        } catch (error) {
            console.error("[QUEUE] Dispatch failed:", error.message);
            // Optionally: Implement logic to restore dataToSave back to buffer if needed
        }
    }, THROTTLE_TIME);

} else {
    console.error("[FATAL] LocalSense API failed to load into DOM context");
}

// Global Process Error Handling
process.on('unhandledRejection', (reason, promise) => {
    console.error('[CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.error(`[CRITICAL] Uncaught Exception: ${err.message}`);
    // Keep process alive or exit gracefully
});