import supabase from "./mqttWorker";
export function checkCordinate(facilityId){
    if(isNaN(facilityId)){
        console.log("enter a facility ID");
        return false;
        
    }
    const data=supabase.select("coordinates").eq("facility_id",facilityId)
    // console.log(`data of the ${facilityId} coordinates are ${data}`);
    if (isNaN(data)){
        return dataObj={
        check:0
    }
    }
    else {
        dataObj={
        check:1,
        value:data
    }
    }
    return dataObj
    
    
}