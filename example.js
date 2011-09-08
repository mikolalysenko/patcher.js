//An example server-client use case for the data model
var patcher = require("./patcher.js");

//----------------------------------------------------
//The server object
//----------------------------------------------------
function Server() {
  this.data = {};
  this.clients = [];
  this.client_models = [];
};

//Adds a client to the server
Server.prototype.addClient = function(client) {
  console.log("Client connected");
  this.clients.push(client);
  this.client_models.push({});
}

//Updates each of the clients
Server.prototype.broadcastChanges = function() {
  console.log("Broadcasting");
  for(var i=0; i<this.clients.length; ++i) {
  
    //The flag causes the patcher to update the client model in place
    var patch = patcher.computePatch(this.client_models[i], this.data, true);
    
    //If there were any changes, send the patch to the client
    if(patch) {
      console.log("Updating client[" + i + "], patch = " + JSON.stringify(patch));
      this.clients[i].sendUpdate(patch);
    } else {
      console.log("No changes for client[" + i + "]");
    }
  }
}

//Helper method, prints out the state of the server and all clients
Server.prototype.printState = function() {
  console.log("server.data:     " + JSON.stringify(this.data));
  for(var i=0; i<this.clients.length; ++i) {
    console.log("clients["+i+"].data: " + JSON.stringify(this.clients[i].data));
  }
};


//----------------------------------------------------
//A client object
//----------------------------------------------------
function Client() {
  this.data = {};
};

//Called when the client recieves an update from the server
Client.prototype.sendUpdate = function(patch) {

  //Simply apply the patch to the data, and that's it!
  patcher.applyPatch(this.data, patch);  
};


//----------------------------------------------------
// A hypothetical scenario:
//----------------------------------------------------


//1.
console.log("\n\n");
console.log("1. A server is created....")
var server = new Server();
server.data["foo"] = "bar";
server.data["someobj"] = { a : 1, b:2, c:3 }
server.printState();
console.log("\n\n");


//2.
console.log("2. A new client connects....");
server.addClient(new Client());
server.printState();
console.log("\n\n");


//3.
console.log("3.  The server broadcasts the state!");
server.broadcastChanges();
server.printState();
console.log("\n\n");


//4.
console.log("4. Suddenly, new clients connect..");
server.addClient(new Client());
server.addClient(new Client());
console.log("\n\n");

//5.
console.log("5. And the server updates their state");
server.broadcastChanges();
server.printState();
console.log("\n\n");


//6.
console.log("6. The server goes crazy and does a ton of updates");
delete server.data.someobj.a;
server.data.someobj.c = 4;
server.data.someobj["e"] = 6;
server.data["qqqq"] = true;
server.data["arr"] = [2,3,4];
server.broadcastChanges();
server.printState();
console.log("\n\n");

//7.
console.log("7. Later on, the server tweaks a single variable");
server.data.someobj["x"] = null;
server.printState();
server.broadcastChanges();
server.printState();
console.log("\n\n");


//8.
console.log("8. And then removes an object");
delete server.data.someobj;
server.broadcastChanges();
server.printState();
console.log("\n");


