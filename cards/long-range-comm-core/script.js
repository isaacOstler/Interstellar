Interstellar.addCoreWidget("Long Range Comm",function(){
	//class instances

	var encrpyt = new Encryption();

	//DOM references
	var coreToCrew_messageList = $("#lrmCore_coreToCrewMessages"),
		crewToCore_messageList = $("#lrmCore_crewToCoreMessages"),
		crewMessageView_container = $("#lrmCore_crewToCoreMessageBox_body"),
		fromTextbox = $("#lrmCore_sendMessageControls_fromTextbox"),
		keyTextbox = $("#lrmCore_sendMessageControls_keyTextbox"),
		frequencySelect = $("#lrmCore_sendMessageControls_frequencySelect"),
		presetWindowFrequencySelect = $("#lrmCode-Core_editPresetsWindow_messageControls_frequencyTextbox"),
		sendMessageTextarea = $("#lrmCore_messageViewBox_textarea"),
		sendMessageButton = $("#lrmCore_sendMessageControls_sendButton"),
		presetWindow = $("#lrmCode-Core_editPresetsWindow"),
		editPresetsButton = $("#lrmCore_sendMessageControls_presetEditButton"),
		nextPresetButton = $("#lrmCore_sendMessageControls_presetNextButton"),
		presetMissionSelect = $("#lrmCore_sendMessageControls_missionPresetSelect"),
		presetPresetSelect = $("#lrmCore_sendMessageControls_presetPresetSelect"),
		editingAnOldMessageContainer = $("#lrmCore_sendMessageControls_editingOldMessages"),
		editingAnOldMessageContainer_deleteButton = $("#lrmCore_sendMessageControls_editingOldMessages_sendAsNewButton"),
		editingAnOldMessageContainer_exitButton = $("#lrmCore_sendMessageControls_editingOldMessages_exitButton"),
		editingAnOldMessageContainer_saveOverButton = $("#lrmCore_sendMessageControls_editingOldMessages_saveOverButton");

	//variables
	var frequencies = [],
		messages = [],
		selectedPresetMission = 0,
		selectedPreset = 0,
		presetMessages = [],
		messageCurrentlyEditing = -1,
		presetKeys = [],
		systemIsDamaged = false,
		neverDrawn = true,
		systemHasNoPower = false;
	/*
		
		{
			"messageGUID" : uuidv4(),
			"timeRecieved" : new Date(),
			"timeDecoded" : new Date(),
			"reportedToCommand" : false,
			"decoded" : key != "" ? false : true,
			"downloadProgress" : 0,
			"sentByCore" : false, //control room sent this message, not the crew
			"wasReceived" : false, //has the crew received this message yet? (not possible when the system is damaged)
			"frequency" : frequency.toLowerCase(),
			"from" : to.toLowerCase(),
			"key" : key.toUpperCase(),
			"text" : key != "" ? encrpyt.encode(text,key.toLowerCase()) : text
		}

	*/
	//init calls

	//preset observers

	Interstellar.onPresetValueChange("lrm.messages",function(newData){
		if(newData == null){
			Interstellar.setPresetValue("lrm.messages",presets);
			return;
		}
		presetMessages = newData;
		updatePresetSelectsWithPresets(presetMessages,selectedPresetMission);
	});

	//database observers

	Interstellar.onDatabaseValueChange("longRangeComm.messages",function(newData){
		if(newData == null){
			Interstellar.setDatabaseValue("longRangeComm.messages",messages);
			return;
		}
		if(messages.length != newData.length){
			var old_numberOfCrewToCoreMessages = 0,
				old_numberOfCoreToCrewMessages = 0,
				current_numberOfCoreToCrewMessages = 0,
				current_numberOfCrewToCoreMessages = 0;
			for(var i = 0;i < newData.length;i++){
				if(newData[i].sentByCore){
					current_numberOfCoreToCrewMessages++;
				}else{
					current_numberOfCrewToCoreMessages++;
				}
			}
			for(var i = 0;i < messages.length;i++){
				if(messages[i].sentByCore){
					old_numberOfCoreToCrewMessages++;
				}else{
					old_numberOfCrewToCoreMessages++;
				}
			}
			if(old_numberOfCrewToCoreMessages < current_numberOfCrewToCoreMessages){
				Interstellar.say("New Long Range Message");
			}
		}
		updateMessageLists(newData,(messages.length != newData.length) || neverDrawn);
		neverDrawn = false;
		messages = newData;
	});
	Interstellar.onDatabaseValueChange("longRangeAntenna.frequencies",function(newData){
		if(newData == null){
			//we don't set this (long-range-antenna-core does)
			$.getJSON('/resource?path=public/frequencies.json&screen=long-range-comm-core', function(loadedJSON) {
			    Interstellar.setDatabaseValue("longRangeAntenna.frequencies",loadedJSON.frequencies);
			});
			return;
		}
		frequencies = newData;
		var html = "";
		for(var i = 0;i < frequencies.length;i++){
			console.log(frequencies[i]);
			html += "<option>";
				html += frequencies[i].systemName.toUpperCase();
			html += "</option>";
		}
		presetWindowFrequencySelect.html(html);
		frequencySelect.html(html);
	});
	//functions
	function updateMessageLists(messagesToDraw,redraw){
		if(!redraw){
			$(".lrmCore_message").each(function( index, element ) {
				var guid = String($(element).attr("guid"));
				for (var i = messagesToDraw.length - 1; i >= 0; i--) {
					//go backwards, it's probably faster
					if(messagesToDraw[i].messageGUID == guid){
						//found it
						if(messagesToDraw[i].sentByCore){
							if(messagesToDraw[i].wasReceived){
								if(messagesToDraw[i].downloadProgress < 1){
									$(element).css("background-color","rgba(0,128,255,.5)");
								}else if(!messagesToDraw[i].decoded){
									$(element).css("background-color","rgba(255,0,0,.5)");
								}else if(!messagesToDraw[i].reportedToCommand){
									$(element).css("background-color","rgba(255,255,0,.5)");
								}else{
									$(element).css("background-color","rgba(255,255,255,.2)");
								}
							}else{
								$(element).css("background-color","rgba(255,0,255,.5)");
							}
						}else if(messagesToDraw[i].downloadProgress < 1){
							$(element).css("background-color","rgba(0,128,255,.5)");
						}else{
							$(element).css("background-color","rgba(255,255,255,.2)");
						}
						break;
					}
				}
			});
		}else{
			var html_crewMessages = "",
			html_coreMessages = "";

			for(var i = messagesToDraw.length - 1;i >= 0;i--){
				//sort backwords, so the oldest messages come first
				var style = "style='background-color:rgba(255,0,0,.5)'";
				if(messagesToDraw[i].sentByCore){
					if(messagesToDraw[i].wasReceived){
						if(messagesToDraw[i].downloadProgress < 1){
							style = "style='background-color:rgba(0,128,255,.5)'";
						}else if(!messagesToDraw[i].decoded){
							style = "style='background-color:rgba(255,0,255,.5)'";
						}else if(!messagesToDraw[i].reportedToCommand){
							style = "style='background-color:rgba(255,255,0,.5)'";
						}else{
							style = "style='background-color:rgba(255,255,255,.2)'";
						}
					}
					var guid = messagesToDraw[i].messageGUID;
					html_crewMessages += '<div guid="' + guid + '" ' + style + ' class="lrmCore_message">';
					html_crewMessages += '<div guid="' + guid + '" class="lrmCore_message_from">' + messagesToDraw[i].from.toUpperCase() + '</div>';
					html_crewMessages += '<div guid="' + guid + '" class="lrmCore_message_time">' + toMilitaryTime(messagesToDraw[i].timeRecieved) + '</div>';
					html_crewMessages += '</div>';
				}else{
					if(messagesToDraw[i].downloadProgress < 1){
						style = "style='background-color:rgba(0,128,255,.5)'";
					}else{
						style = "style='background-color:rgba(255,255,255,.2)'";
					}
					var guid = messagesToDraw[i].messageGUID;
					html_coreMessages += '<div guid="' + guid + '" ' + style + ' class="lrmCore_message">';
					html_coreMessages += '<div guid="' + guid + '" class="lrmCore_message_from">' + messagesToDraw[i].from.toUpperCase() + '</div>';
					html_coreMessages += '<div guid="' + guid + '" class="lrmCore_message_time">' + toMilitaryTime(messagesToDraw[i].timeRecieved) + '</div>';
					html_coreMessages += '</div>';
				}
			}
			crewToCore_messageList.html(html_coreMessages);
			coreToCrew_messageList.html(html_crewMessages);
			$(".lrmCore_message").off();
			$(".lrmCore_message").click(function(event){
				var guid = String($(event.target).attr("guid"));
				for (var i = messages.length - 1; i >= 0; i--) {
					//go backwards, it's probably faster
					if(messages[i].messageGUID == guid){
						if(messages[i].sentByCore){
							//core message
							messageCurrentlyEditing = i;
							loadCoreMessageAtIndex(i);
						}else{
							//crew message
							loadCrewMessageAtIndex(i);
						}
						break;
					}
				}
			});
		}
	}

	function clearCoreMessageEncoder(){
		keyTextbox.val("");
		fromTextbox.val("");
		sendMessageTextarea.val("");
	}

	function loadCoreMessageAtIndex(index){
		editingAnOldMessageContainer.slideDown();
		sendMessageTextarea.animate({"top" : 22, "height" : sendMessageTextarea.parent().height() - 30});
		if(messages[index].key != null && messages[index].key != ""){
			sendMessageTextarea.val(encrpyt.decode(messages[index].text,messages[index].key.toUpperCase()));
			keyTextbox.val(messages[index].key);
			keyTextbox.css("color","white");
		}else{
			sendMessageTextarea.val(messages[index].text);
			keyTextbox.val("NO KEY");
			keyTextbox.css("color","red");
		}
		fromTextbox.val(messages[index].from);
		frequencySelect.val(messages[index].frequency.toUpperCase());
	}

	function loadCrewMessageAtIndex(index){
		var text = "KEY: " + (messages[index].key != "" ? messages[index].key : "<span color='red'>NO KEY</span>");
		text += "\nSENT AT: " + toMilitaryTime(messages[index].timeRecieved) + "\n";
		text += "FREQUENCY: " + messages[index].frequency;
		text += "\n\nTO: <b>" + messages[index].from + "</b>\n";
		if(messages[index].key != "" && messages[index].key != null){
			text += "\n" + encrpyt.decode(messages[index].text,messages[index].key.toUpperCase());
		}else{
			text += "\n" + messages[index].text;
		}
		crewMessageView_container.html(text.replace(/\n/g, "<br />"));
	}

	function toMilitaryTime(date){
		var compiledDate = new Date(date);
		return formatTo2Digits(String(compiledDate.getHours())) + ":" + formatTo2Digits(String(compiledDate.getMinutes()));
	}
	
	function formatTo2Digits(string){
		if(string.length == 1){
			return "0" + string;
		}
		return string;
	}

	function uuidv4() {
	  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
	    return v.toString(16);
	  });
	}

	function updatePresetSelectsWithPresets(presets,selectedPreset){
		var missionHTML = "",
			presetHTML = "";

		for(var i = 0;i < presetMessages.length;i++){
			missionHTML += "<option " + (i == selectedPreset ? "selected " : "") +  "value='" + i + "'>" + presetMessages[i].name + "</option>";
			if(i == selectedPreset){
				for(var j = 0;j < presetMessages[i].messages.length;j++){
					presetHTML += "<option value='" + j + "'>" + presetMessages[i].messages[j].name + "</option>";
				}
			}	
		}

		presetMissionSelect.html(missionHTML);
		presetPresetSelect.html(presetHTML);
	}

	function closePreExistingMessageWarning(){
		editingAnOldMessageContainer.slideUp();
		sendMessageTextarea.animate({"top" : 2, "height" : sendMessageTextarea.parent().height() - 9});
	}

	function loadPresetMessageAtIndex(mission,index){
		if(presetMessages[mission].messages.length > index){
			sendMessageTextarea.val(presetMessages[mission].messages[index].text);
			keyTextbox.val(presetMessages[mission].messages[index].key);
			frequencySelect.val(presetMessages[mission].messages[index].frequency);
			fromTextbox.val(presetMessages[mission].messages[index].from);
		}
	}

	function endsWith(str, suffix) {
    	return str.indexOf(suffix, str.length - suffix.length) !== -1;
	}

	//event handlers

	sendMessageTextarea.on("input",function(event){
		var lines = event.target.value.split(/\r?\n/),
			lastLine = lines[lines.length - 1];
		if(endsWith(lastLine.toUpperCase()," OUT")){
			fromTextbox.val(lastLine.slice(0,lastLine.length - 4));
		}
	});

	presetMissionSelect.on("change",function(event){
		selectedPresetMission = event.target.value;
		updatePresetSelectsWithPresets(presetMessages,selectedPresetMission);
		if(presetMessages[selectedPresetMission].messages.length > 0){
			loadPresetMessageAtIndex(selectedPresetMission,0);
		}
	});

	presetPresetSelect.on("input",function(event){
		selectedPreset = event.target.value;
		loadPresetMessageAtIndex(selectedPresetMission,selectedPreset);
	});

	editPresetsButton.click(function(event){
		Interstellar.openCoreWindow(presetWindow.attr("id"),event);
	});

	nextPresetButton.click(function(event){
		selectedPreset++;
		loadPresetMessageAtIndex(selectedPresetMission,selectedPreset);
	});

	editingAnOldMessageContainer_saveOverButton.click(function(event){
		var from = fromTextbox.val().toUpperCase();
		var text = sendMessageTextarea.val();
		var key = keyTextbox.val().toUpperCase();
		var frequency = frequencySelect.val().toLowerCase();

		messages[messageCurrentlyEditing].text = key != "" ? encrpyt.encode(text,key) : text;
		messages[messageCurrentlyEditing].frequency = frequency;
		messages[messageCurrentlyEditing].key = key;
		messages[messageCurrentlyEditing].decoded = key != "" ? false : true;
		messages[messageCurrentlyEditing].from = from;

		Interstellar.setDatabaseValue("longRangeComm.messages",messages);
		closePreExistingMessageWarning();
		clearCoreMessageEncoder();
		updateMessageLists(messages,true);
	});

	editingAnOldMessageContainer_exitButton.click(function(event){
		closePreExistingMessageWarning();
		clearCoreMessageEncoder();
		messageCurrentlyEditing = -1;
	});

	editingAnOldMessageContainer_deleteButton.click(function(event){
		var newMessages = [];
		for(var i = 0;i < messages.length;i++){
			if(i != messageCurrentlyEditing){
				newMessages.splice(newMessages.length,0,messages[i]);
			}
		}
		Interstellar.setDatabaseValue("longRangeComm.messages",newMessages);
		closePreExistingMessageWarning();
		clearCoreMessageEncoder();
	});

	sendMessageButton.click(function(event){
		closePreExistingMessageWarning();
		var from = fromTextbox.val().toUpperCase();
		var text = sendMessageTextarea.val();
		var key = keyTextbox.val().toUpperCase();
		var frequency = frequencySelect.val().toLowerCase();

		var newMessage =
		{
			"messageGUID" : uuidv4(),
			"timeRecieved" : new Date(),
			"timeDecoded" : new Date(),
			"reportedToCommand" : false,
			"decoded" : key != "" ? false : true,
			"downloadProgress" : 0,
			"sentByCore" : true, //control room sent this message, not the crew
			"wasReceived" : false, //has the crew received this message yet? (not possible when the system is damaged)
			"frequency" : frequency,
			"from" : from,
			"key" : key,
			"text" : key != "" ? encrpyt.encode(text,key) : text
		}
		var newMessages = [];
		for(var i = 0;i < messages.length; i++){
			newMessages.splice(newMessages.length,0,messages[i]);
		}
		newMessages.splice(newMessages.length,0,newMessage);
		Interstellar.setDatabaseValue("longRangeComm.messages",newMessages);
		clearCoreMessageEncoder();
	});

	//intervals

	//This should actually be on the long-range-antenna widget, but that hadn't be made by the time i was working on this
	setInterval(function(){
		if(systemIsDamaged || systemHasNoPower){
			return;
		}
		var detectedChange = false;
		for(var i = 0;i < messages.length;i++){
			if(!messages[i].wasReceived){
				messages[i].wasReceived = true;
				detectedChange = true;
			}
			if(messages[i].downloadProgress < 1){
				var progressAmountPerFrequency = .00;
				for(var j = 0;j < frequencies.length;j++){
					if(!frequencies[j].isDamaged && frequencies[j].systemName.toLowerCase() == messages[i].frequency.toLowerCase()){
						progressAmountPerFrequency = (frequencies[j].systemPower / 4) / 1000;
					}
				}
				if(progressAmountPerFrequency != 0){
					detectedChange = true;
					messages[i].downloadProgress += progressAmountPerFrequency;
				}
			}
		}
		if(detectedChange){
			Interstellar.setDatabaseValue("longRangeComm.messages",messages);
		}
	},1000 / 3);
});