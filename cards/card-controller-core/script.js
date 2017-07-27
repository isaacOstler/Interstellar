Interstellar.addCoreWidget("Card Controller",function(){

	//variables
	var thisWidget = this,
		currentCommand = "Flash",
		currentStation = "All Stations",
		presetButtons = [
			{
				"symbol" : "O",
				"function" : "Online",
				"backgroundColor" : "#88fc7b",
				"color" : "black"
			},
			{
				"symbol" : "F",
				"function" : "Flash",
				"backgroundColor" : "#f4df42",
				"color" : "black"
			},
			{
				"symbol" : "B",
				"function" : "Blackout",
				"backgroundColor" : "#424242",
				"color" : "white"
			},
			{
				"symbol" : "R",
				"function" : "Reset",
				"backgroundColor" : "#7bd5fc",
				"color" : "black"
			}
		]

	//widget functions
	thisWidget.onResize = function(){
		drawGUI();
	}
	thisWidget.onReset = function(){

	}
	//init calls
	drawGUI();

	//functions
	function drawGUI(){
		$("#card-controller-core_executeButton").css("font-size",(($("#card-controller-core_executeButton").height() * 0.6) - 2) + "px");
		for(var i = 0;i < 4;i++){
			var element = $("#card-controller-core_QuickButtons-" + i);
			element.css("background-color",presetButtons[i].backgroundColor);
			element.css("font-size",((element.height() * 0.75) - 2) + "px");
			element.css("color",presetButtons[i].color);
			element.html(presetButtons[i].symbol);
			element.attr("function",presetButtons[i].function);
		}
		generateButtonText();
	}

	function generateButtonText(){
		var filler = " ";
		if(currentCommand == "Restart Interstellar" || currentCommand == "Quit Interstellar" || currentCommand == "Restart Computer" || currentCommand == "Shutdown Computer"){
			filler = " On ";
		}
		$("#card-controller-core_executeButton").html(currentCommand + filler + currentStation);
	}

	//preset observers

	//database observers

	//event handlers
	$("#card-controller-core_commandSelect_command").change(function(event){
		currentCommand = $(event.target).val();
		generateButtonText();
	});
	$("#card-controller-core_commandSelect_station").change(function(event){
		currentStation = $(event.target).val();
		generateButtonText();
	});
	$(".card-controller-core_QuickButton").click(function(event){
		currentCommand = $(event.target).attr("function");
		generateButtonText();
	});
	$("#card-controller-core_executeButton").click(function(event){
		if(currentCommand.toLowerCase() == "reset"){
			Interstellar.clearDatabase();
			return;
		}
		Interstellar.setDatabaseValue("ship.cardController.command",{"command" : currentCommand, "station" : currentStation});
	});
});