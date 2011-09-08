var patcher = require("./patcher.js");

function assert(expr, mesg) {
  if(!expr) {
    throw mesg;
  }
}

function printObj(obj) {
  console.log(JSON.stringify(obj));
}


(function(){
  var A = { a : 1, b : 2, c : 3, d : 4 },
      B = { b : 2, c : 4, d : 4, e : 8 };
      
  var patch = patcher.computePatch(A, B);
  
  printObj(A);
  printObj(B);
  printObj(patch);

})();

//Test arrays

//Test null

//Objects with underscores
