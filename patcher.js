//-------------------------------------------------------------
// Javascript/Node.js JSON diffing/patching utility
//
// Author: Mikola Lysenko
//
// "patcher.js"
//
// License: BSD
//-------------------------------------------------------------

//node.js interoperability
if(typeof(exports) == "undefined") {
  var patcher = {};
}

(function(){


//-------------------------------------------------------------
// Helper function, clones an object doing a deep copy
//-------------------------------------------------------------
function clone(obj) {
  if(obj === null) {
    return null;
    
  } else if(typeof(obj) != "object") {
    return obj;
    
  } else if(obj instanceof Array) {
    var result = new Array(obj.length);
    for(var i=0; i<result.length; ++i) {
      result[i] = clone(obj[i]);
    }
    return result;
    
  } else {  
    var result = {}
    for(var i in obj) {
      result[i] = clone(obj[i]);
    }
    return result;
  }
}

//-------------------------------------------------------------
// Computes a patch between a pair of json objects
// Note that this assumes both prev and next are simple, acyclic
// dictionaries.  This does not support serializing functions.
// Also removals are stored in a special field called "_r", so 
// don't name any variables that.
//
//  prev - Object we are patching from
//  next - Object we are patching to
//  update_in_place - A flag, which if set updates prev to next
//
//  Returns:
//    1. A patch object if there are any differences, or
//    2. null if the objects are equal.
//-------------------------------------------------------------
function computePatch(prev, next, update_in_place) {
  var updates = { }, removals = [ ], has_updates = false;
  
  //Checks if an element common to prev and next 
  var processElement = function(id) {
    //First, check if the element exists and types match
    if(id in prev && typeof(prev[id]) == typeof(next[id])) {
    
      if(typeof(next[id]) == "object" && (prev[id] instanceof Array) == (next[id] instanceof Array) ) {
      
        //Object case
        var res = computePatch(prev[id], next[id], update_in_place);
        if(res !== null) {
          has_updates = true;
          updates[id] = res;
        }
        return;
      }
      else if(prev[id] === next[id]) {
      
        //P.O.D. case
        return;
      }
    }
    
    //Add to update list
    has_updates = true;
    updates[id] = clone(next[id]);

    if(update_in_place) {
      prev[id] = updates[id];
    }
  };
  
  //Two cases to deal with for plain old javascript objects:
  if(next instanceof Array) {
    //Case 1: Arrays
    if(prev.length != next.length) {
      for(var i=prev.length-1; i>next.length; --i) {
        removals.push(i);
      }
      if(update_in_place) {
        prev.length = next.length;
      }
    }
    for(var i=next.length-1; i>=0; --i) {
      processElement(i);
    }
    
  } else {
    //Case 2: Objects
    for(var i in prev) {
      if(!(i in next)) {
        removals.push(i);
      }
    }
    if(update_in_place) {
      for(var i=removals.length-1; i>=0; --i) {
        delete prev[removals[i]];
      }
    }
    for(var i in next) {
      processElement(i);
    }
  }
  
  //If nothing changed, don't post an update
  if(removals.length > 0) {
    has_updates = true;
    updates["_r"] = removals;  
  }
  if(has_updates) {
    return updates;
  }
  return null;
};


//-------------------------------------------------------------
// Applies a patch to an object
//-------------------------------------------------------------
function applyPatch(obj, patch) {
  var removals = patch["_r"], i;
  if(removals) {
    for(i=0; i<removals.length; ++i) {
      delete obj[removals[i]];
    }
    delete patch["_r"];
  }
  
  for(i in patch) {
    if(typeof(obj[i]) == typeof(patch[i]) &&
      typeof(patch[i]) == "object" &&
      patch[i] != null &&
      (obj[i] instanceof Array) == (patch[i] instanceof Array)) {
      applyPatch(obj[i], patch[i]);
      continue;
    }
    obj[i] = patch[i]
  }
};


//Add methods to patcher
if(typeof(exports) == "unedefined") {
  patcher.computePatch = computePatch;
  patcher.applyPatch   = applyPatch;
} else {
  exports.computePatch = computePatch;
  exports.applyPatch   = applyPatch;
}

})();

