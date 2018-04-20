/*
  player-format:
        object: array[name: "Giannis", number: 34, position: "everything"]
*/
const electron = require("electron");
const ipc = electron.ipcRenderer;
const Team = require('./Team.js'); // Imports stuff from the Team.js backend file
const Player = require('./Player.js'); // Imports stuff from the Player.js backend file
const TRW = require('./team_read_write.js'); // Imports stuff from the team_read_write.js backend file
//const Main = require('./main.js'); // Imports main.js team creation
/*
// Creating a new team (note: empty roster is created by the constructor, therefore is not passed as a parameter)
var team = new Team(name, code, coach, assistants, home_stadium, <team_roster>);

// Creating a new player
var player = new Player(name, number, position);

// Add a team to the backend
ipc.send('add-team', team_object);

// Delete a team from the backend
ipc.send('delete-team', team_code);

note:
    Need to add success and failure event handlers for adding and deleting a team
*/

function help() {
    // Get the modal
    var modal = document.getElementById('myModal');
    // Get the <span> element that closes the modal
    var span = document.getElementById("closeModal");

    // show modal
    modal.style.display = "block";


    // When the user clicks on <span> (x), close the modal
    span.onclick = function() {
        modal.style.display = "none";
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    // When the user hits ESC, close it
    document.onkeydown = function(e) {
        e = e || window.event;
        var isEscape = false;
        if ("key" in e) {
            isEscape = (e.key == "Escape" || e.key == "Esc");
        } else {
            isEscape = (e.keyCode == 27);
        }
        if (isEscape) {
            modal.style.display = "none";
        }
    }
}
/*
  on load event handler to fill the teams array
  by calling get_all_teams from the back-end
*/
window.onload = function() {
  var teams = TRW.get_all_teams();
  console.log(teams);
}
var n_disabled = false;
var new_team = {};
var app = new Vue({
  el: '#team_app',
  data: {
    message: "SELECT A TEAM",
    teams: TRW.get_all_teams(),
    roster_options: [
      {name: "<ENTER> - EDIT TEAM"},
      {name: "N - CREATE NEW TEAM"},
      {name: "F9 - DELETE TEAM"}
    ],
    teams_hold: [],
    selected_team: {},
    search_active: false,
    adding_team: false,
    temp_team_size: 0,
  },
  created() {
   document.addEventListener('keydown', this.keyevent);
  },
  methods: {
    keyevent : function (e) {
      console.log(e.keyCode);
      // alt + h - Help menu
      if(e.altKey && e.keyCode == 72) {
          help();
      }

      // <Enter> --> Edit Team
      if(e.keyCode == 13 && app.adding_team == false) {
        app.edit_team();
      }
      // <N> --> Add New Team
      else if (e.keyCode == 78 && (document.getElementById('searched') != document.activeElement) && this.n_disabled != true) {
        app.enter_team_information();
      }
      // <F9> --> Delete Team
      else if (e.keyCode == 120) {
        app.delete_team();
      }
      else if (e.keyCode == 8 && app.search_active == true)
      {
        document.getElementById('searched').value = "";
        app.reset_team_table();
      }
    },
    // If Enter is pressed (Runs search if no team selected)
    edit_team : function() {
      if(app.selected_team.name != undefined) {
        window.alert("Now editing "+app.selected_team.name);
        // See laptop for team edit screen
        // Might require loading from backend
      }
      else if(document.getElementById("searched") == document.activeElement){
        app.run_search();
      }
    },
    // If N is pressed
    enter_team_information : function() {
      app.adding_team = true;
      this.n_disabled = true;
      var modal = document.getElementById('team_entry');
      // Get the <span> element that closes the modal
      var span = document.getElementById("close_team_entry");
      // show modal
      modal.style.display = "block";
      // When the user clicks on <span> (x), close the modal
      span.onclick = function() {
          modal.style.display = "none";
      }
      // When the user clicks anywhere outside of the modal, close it
      window.onclick = function(event) {
          if (event.target == modal) {
              modal.style.display = "none";
          }
      }
      // When the user hits ESC, close it
      document.onkeydown = function(e) {
          e = e || window.event;
          var isEscape = false;
          if ("key" in e) {
              isEscape = (e.key == "Escape" || e.key == "Esc");
          } else {
              isEscape = (e.keyCode == 27);
          }
          if (isEscape) {
              modal.style.display = "none";
          }
        }
    },
    // If F9 is pressed
    delete_team : function() {
      if(app.selected_team.name != undefined) {
        if(window.confirm("DELETE TEAM: "+app.selected_team.name+"?"))
        {
          for(var index = 0; index < app.teams.length; index++)
          {
            if(app.teams[index].name == app.selected_team.name)
            {
              //UPDATE BACKEND HERE
              /*
              //Testing code to delete Nate's created test team
              // Create team object to send to the backend to delete
              var del_team = new Team("Badgers", "WIS", "Bo Ryan", "I Forgot", "Kohl Center");
              // Send the request to delete the team
              ipc.send('delete-team', "WIS");
              */
              app.teams.splice(index, 1);
              app.selected_team = {};
              break;
            }
          }
        }
      }
      else {
        console.log("NO TEAM SELECTED");
        window.alert("ERROR NO TEAM SELECTED");
      }
    },
    // Runs a search based on user input
    run_search : function() {
      if(app.search_active)
      {
        app.reset_team_table();
      }
      console.log("RUNNING SEARCH");
      app.teams_hold = app.teams;
      var query_teams = [];
      app.teams.forEach(function(team) {
        if (team[0].includes(document.getElementById('searched').value.toUpperCase())) {
          query_teams.push(team);
          console.log(team[0] + " was found during search");
        }
      });
      app.teams = query_teams;
      app.search_active = true;
    },
    // Registers which team is currently selected
    select_team : function(team) {
      console.log("Clicked "+team[0]);
      app.selected_team = team;
      app.input_selected = false;
    },
    // Handles when enter is pressed and no team is selected
    deselect_team : function() {
      app.selected_team = {};
      app.input_selected = true;
    },
    // Resets the team table when a search is over
    reset_team_table : function() {
      app.teams = app.teams_hold;
      app.search_active = false;
    },
    // Submit new team data
    submit_team_data : function() {
      // Retreive information about the new team
      var name = document.getElementsByName("team_name")[0].value;
      var code = document.getElementsByName("team_code")[0].value;
      var coach = document.getElementsByName("team_coach")[0].value;
      var assistants = document.getElementsByName("team_assistants")[0].value;
      var stadium = document.getElementsByName("team_stadium")[0].value;
      app.temp_team_size = document.getElementById('roster_size').selectedIndex + 5; // Note: Index 0 = 5 players, so add 5 to the selected index
      console.log('NAME: '+name+' CODE: '+code+' COACH: '+coach+' ASSISTANTS: '+assistants+' STADIUM: '+stadium+' ROSTER SIZE: '+app.temp_team_size);
      // Reset the modal
      document.getElementsByName("team_name")[0].value = "";
      document.getElementsByName("team_code")[0].value = "";
      document.getElementsByName("team_coach")[0].value = "";
      document.getElementsByName("team_assistants")[0].value = "";
      document.getElementsByName("team_stadium")[0].value = "";
      // Verify all fields are filled out
      if(name != "" && code != "" && coach != "" && assistants != "" && stadium != "")
      {
         this.new_team = new Team(name, code, coach, assistants, stadium);
         var modal = document.getElementById('team_entry');
         modal.style.display = "none";
         var roster_entry = document.getElementById('team_roster_entry');
         roster_entry.style.display = "block";
         // When the user hits ESC, close it
         document.onkeydown = function(e) {
             e = e || window.event;
             var isEscape = false;
             if ("key" in e) {
                 isEscape = (e.key == "Escape" || e.key == "Esc");
             } else {
                 isEscape = (e.keyCode == 27);
             }
             if (isEscape) {
                 roster_entry.style.display = "none";
                 this.n_disabled = false;
                 app.adding_team = false;
             }
           }
      }
      else {
        window.alert("NOT ALL REQUIRED FIELDS ARE SATISFIED");
      }
    },
    // Creates roster and adds it to the team object
    submit_roster : function () {
      this.n_disabled = false;
      app.adding_team = false;
      var team_entered = [];
      var incomplete_form = false;
      for(var i = 1; i < 16; i++)
      {
        // HANDLES PLAYERS NOT ENTERED INTO THE ROSTER (THIS IS ALLOWED)
        if(document.getElementsByName("player_name_"+i)[0].value == "" && document.getElementsByName("player_number_"+i)[0].value == "" && document.getElementsByName("player_pos_"+i)[0].value == "")
        {
          console.log("Player "+i+ " was not entered");
        }
        else {
          // HANDLES INCOMPLETE PLAYER ENTRY (THIS IS NOT OKAY)
          if(document.getElementsByName("player_name_"+i)[0].value == "" && document.getElementsByName("player_number_"+i)[0].value != "" && document.getElementsByName("player_pos_"+i)[0].value != "")
          {
            window.alert("Player "+i+" was not given a name.  Please enter a name.");
            incomplete_form = true;
          }
          else if(document.getElementsByName("player_name_"+i)[0].value != "" && document.getElementsByName("player_number_"+i)[0].value == "" && document.getElementsByName("player_pos_"+i)[0].value != "")
          {
            window.alert("Player "+i+" was not given a number.  Please enter a number.");
            incomplete_form = true;
          }
          else if(document.getElementsByName("player_name_"+i)[0].value != "" && document.getElementsByName("player_number_"+i)[0].value != "" && document.getElementsByName("player_pos_"+i)[0].value == "")
          {
            window.alert("Player "+i+" was not given a position.  Please enter a positon.");
            incomplete_form = true;
          }
          else if(document.getElementsByName("player_name_"+i)[0].value == "" && document.getElementsByName("player_number_"+i)[0].value == "" && document.getElementsByName("player_pos_"+i)[0].value == "")
          {
            window.alert("Player "+i+" was not given a name or number.  Please enter the missing information.");
            incomplete_form = true;
          }
          else if(document.getElementsByName("player_name_"+i)[0].value != "" && document.getElementsByName("player_number_"+i)[0].value == "" && document.getElementsByName("player_pos_"+i)[0].value == "")
          {
            window.alert("Player "+i+" was not given a number or position.  Please enter the missing information.");
            incomplete_form = true;
          }
          else if(document.getElementsByName("player_name_"+i)[0].value == "" && document.getElementsByName("player_number_"+i)[0].value != "" && document.getElementsByName("player_pos_"+i)[0].value == "")
          {
            window.alert("Player "+i+" was not given a name or position.  Please enter the missing information.");
            incomplete_form = true;
          }
          // ALL OF THE CURRENT PLAYER DETAILS ARE ENTERED
          else if(incomplete_form == false)
          {
            // CREATE PLAYER: Name, number, position
            var player = new Player(document.getElementsByName("player_name_"+i)[0].value, document.getElementsByName("player_number_"+i)[0].value, document.getElementsByName("player_pos_"+i)[0].value);
            console.log("NAME: "+ player.get_name() + " NUMBER: " + player.get_number() + " POSITION: " + player.get_position());
            team_entered.unshift(player);
          }
        }
      }
      if(incomplete_form == false || team_entered.length < 5)
      {
        for(var i = 1; i < 16; i++)
        {
          // RESET EACH MODAL SPOT
          document.getElementsByName("player_name_"+i)[0].value = "";
          document.getElementsByName("player_number_"+i)[0].value = "";
          document.getElementsByName("player_pos_"+i)[0].value = "";
        }

          // HIDE THE MODAL
          var modal = document.getElementById('team_roster_entry');
          for(var i = 0; i < team_entered.length; i++)
          {
            this.new_team.add_player_to_roster(team_entered[i]);
          }
          modal.style.display = 'none';
          app.teams.push(this.new_team);
          var team_file = this.new_team.get_name().toLowerCase();
          team_file = team_file.split(' ').join('_');
          console.log(team_file+".txt");
          TRW.create_team(team_file, this.new_team);
          console.log("NAME: "+this.new_team.get_name()+" CODE: "+this.new_team.get_code()+" STADIUM: "+this.new_team.get_stadium()+" ROSTER: "+this.new_team.get_active_roster()[0].get_name());
          for(var i = 0; i < team_entered.length; i++)
          {
            console.log("Player "+i+": "+team_entered[i].name);
          }
          this.new_team = {};
      }

    }
  }
})
