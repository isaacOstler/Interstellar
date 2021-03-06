var scanningObject;
var scanningInterval = undefined;
var scanAnswer = "";
var updateSpeed = 100; // this is how long the interval to update the time passed will wait;
var speedBoost = 0;

Interstellar.onDatabaseValueChange("internalSensors.scanSpeedBoost",function(newData){
	if(newData == null){
		//not our responsiblity to set this
		return;
	}
	speedBoost = Number(newData);
});

Interstellar.onDatabaseValueChange("internalSensors.scanAnswer",function(newData){
	if(newData == null){
		Interstellar.setDatabaseValue("internalSensors.scanAnswer","");
		return;
	}
	scanAnswer = newData;
	if(scanningObject == undefined){
		return;
	}
	if(scanningObject.timePassed >= scanningObject.timeRequired && scanAnswer != ""){
		Interstellar.setDatabaseValue("internalSensors.scanInfo",null);
	}
})

Interstellar.onDatabaseValueChange("internalSensors.scanInfo",function(newData){
	scanningObject = newData;
	if(scanningInterval != undefined){
		clearInterval(scanningInterval);
		scanningInterval = undefined;
	}
	if(newData == null){
		return;
	}
	scanningInterval = setInterval(function(){
		if(scanningObject.timePassed < scanningObject.timeRequired){
			scanningObject.timePassed += (updateSpeed / 1000) * speedBoost;
			Interstellar.setDatabaseValue("internalSensors.scanInfo",scanningObject)
		}else{;
			if(scanningObject.timePassed >= scanningObject.timeRequired && scanAnswer != ""){
				Interstellar.setDatabaseValue("internalSensors.scanInfo",null);
			}
		}
	},updateSpeed);
});