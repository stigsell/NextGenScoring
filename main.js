console.log('main process loaded');

var drw = require('./data_read_write.js');

const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const path = require("path");
const url = require("url");
const fs = require("fs");	//node.js filesystem
const ipc = electron.ipcMain;
const dialog = electron.dialog;

let win;
const TESTING = true;
const file_name = 'test_read_game_file';
const test_file_name = "test_drw_file";

function createWindow() {
	win = new BrowserWindow();
	win.loadURL(url.format({
		pathname: path.join(__dirname, 'backend_index.html'),
		protocol: 'file',
		slashes: true		
	}));

	/** SIMPLE BACKEND TESTING */
	/** TODO: DELETE WHEN PUT IN TEST SUITE */
	if(TESTING) {
		//var test_file_name = "test_drw_file";
		drw.create_game_file(['player_number','fg','fga','m3','3a','ft','fta','reb','ast','pf','blk','trn','stl'], test_file_name);
		drw.read_game_file(test_file_name);
	}
	win.on('closed', () => {
		win = null;
		drw.delete_file(test_file_name);	
		app.quit();
	})
}




/**
 * Sends data from the front end to the back end. 
 * Dummy function for the front end. Temporary
 * --USED FOR TESTING--
 * 
 * INPUT HOLDS ARGUMENTS FROM FRONTEND
 * FORMAT:
 *	 
 * FOR FIELD GOALS: [PLAY_CODE, PLAYER_NUMBER, RESULT_CODE, REBOUND/ASSIST/BLOCK_PLAYER (REBOUND IF RESULT_CODE = 'R or X' / BLOCK IF RESULT_CODE = 'K' / ASSIST IF ANYTHING ELSE), HOME/AWAY]
 *                  [    0    ,       1      ,      2     ,                                                       3                                                               ,     4    ]	
 * 
 * FOR FREETHROWS: [E, PLAYER_NUMBER, RESULT_CODE, HOME/AWAY]
 *
 * FOR REBOUNDS/ASSISTS/FOULS/BLOCKS/TURNOVERS/STEALS: [PLAY_CODE, PLAYER_NUMBER, HOME/AWAY]
 *  
 * FOR CHANGING JERSEY: [F2, PLAYER_NUMBER, NEW_PLAYER_NUMBER, HOME/AWAY]
 *
 *
 * STATARRAY GETS SUBMITTED TO GAME FILE
 * FORMAT:
 *
 *	 (1)/(0)
 *
 * [HOME/AWAY, PLAYER_NUMBER, FIELDGOAL, FIELDGOAL_ATTEMPT, MADE_3, 3_ATTEMPT, FREETHROW, FREETHROW_ATTEMPT, REBOUND, ASSIST, PERSONAL FOUL, BLOCK, TURNOVER, STEAL]
 * [    0    ,       1      ,     2    ,         3        ,    4  ,     5    ,     6    ,         7        ,    8   ,   9   ,       10     ,  11  ,    12   ,  13  ]
 *
 *
 * [7]-[12] ARE EDITED IN SUBPLAY FUNCTIONS BELOW
 *
 * TO: T (TEAM TURNOVER)
 * TO: D (DEAD BALL)
 *
 *
 */

 
function addPlay(keystrokes){ 
	var statArray = [0,0,0,0,0,0,0,0,0,0,0,0,0,0];
	var input = keystrokes.split(/ /);
	if(TESTING) console.log(input);
		
	//input parsing
	statArray[1] = input[1];	//add player's number
	var team = input[input.length-1];
	console.log("team:" + team);
	if (team === 'h')
		statArray[0] = 1;
	else if (team === 'v')
		statArray[0] = 0;
	switch(input[0]){
		case 'y':
		case 'w':
		case 'j':
		case 'p':
		case 'l':
		case 'd':
			var actingPlayer = input[3];
			statArray[3] = 1;	//fieldgoal attempt
			switch(input[2]){
				case 'g' || 'G' || 'q' || 'Q':
					statArray[2] = 1;	//fieldgoal
					if (input[3] != '') assist(statArray[0], actingPlayer);	//If there's an assist, record it
					break;
				case 'y':
					statArray[4] = 1;	//made 3-pointer
					if (input[3] != '') assist(statArray[0], actingPlayer);	//If there's an assist, record it
					break;
				case 'r':
					if (input[3] != '') rebound(statArray[0], actingPlayer);	//If there's a rebound, record it
					break;
				case 'x':
					if (input[3] != '') rebound(statArray[0], actingPlayer);	//If there's a rebound, record it
					break;
				case 'k':
					block(statArray[0], actingPlayer);
					break;
				case 'p':
					//in the paint
					break;
				case 'f':
					//fast break
					break;
				case 'z':
					//fast break in paint
					break;				
			}
			break;
		case 'e':
			statArray[6] = 1; //freethrow attempt
			if (input[2] == 'g') statArray[4] = 1;
			break;
		case 'r':
			rebound(statArray[0], input[1]);
			return;
		case 'a':
			assist(statArray[0], input[1]); 
			return;
		case 'f':
			statArray[9] = 1;	//foul
			break;
		case 't':
			statArray[11] = 1; //turnover
			//team turnover
			//dead ball
			break;
		case 's':
			statArray[12] = 1;	//steal
			break;
		case 'f2':
			chg(input[input.length-1], input[1], input[2]);
			return;
	}
	console.log(statArray);
	drw.write_to_game_file(statArray, test_file_name);
} 
 
 
/*	
 *	SUBPLAY FUNCTIONS
 *	CALLED BY ADDPLAY()
 *
 */ 
 
function rebound(t, player_number){
	var statArray = [t, player_number,0,0,0,0,0,1,0,0,0,0,0,0];
	drw.write_to_game_file(statArray, test_file_name);
}
 
function assist(t, player_number){
	console.log("assist");
	var statArray = [t, player_number,0,0,0,0,0,0,1,0,0,0,0,0];
	drw.write_to_game_file(statArray, test_file_name);	
}

function block(t, player_number){
	var statArray = [t, player_number,0,0,0,0,0,0,0,0,1,0,0,0];
	drw.write_to_game_file(statArray, test_file_name);	
}

function chg (t, player_number, new_player_number){
	var playerSub = [t, "CHG", player_number, new_player_number];
	drw.write_to_game_file(statArray, test_file_name);	
}


/*
function turnover(team, player_number){
	var statArray = [team, player_number,0,0,0,0,0,0,0,0,0,1,0];
	drw.write_to_game_file(statArray, file_path);	
}
*/

/*
 *	IPC EVENT HANDLER
 *
 */
 
ipc.on('send-data', function (event,keystrokes){ 
	try {
		addPlay(keystrokes);
	} catch (e) {
		//if failure
		console.log("An error occurred in file writing: " + e);
		event.sender.send('send-data-failure');
		return;
	}
	event.sender.send('send-data-success');
});



/**
 * Sends data from the back end to the front end.
 * Dummy function for the front end. Temporary
 * --USED FOR TESTING--
 */
 
ipc.on('get-data', function(event){ 
	try {
		var data = [];
		data = drw.read_game_file(test_file_name);
		console.log(data);
	} catch (e) {
		//if failure
		console.log("An error occurred in file reading: " + e);
		event.sender.send('get-data-failure');
		return;
	}
	event.sender.send('get-data-success', data);
});


app.on('ready', createWindow);

app.on('activate', () => {
	if (win === null) {
		createWindow();
	}	
})
