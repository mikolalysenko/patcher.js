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
  var updates = { }, has_updates = false;
  
  //Checks if an element common to prev and next 
  var processElement = function(id) {
  
    //Add _ to escape ids which start with _
    var target_id = (typeof(id) == "string" && id.charAt(0) == "_" ? "_" + id : id);
    
    //First, check if the element exists and types match
    if(id in prev && typeof(prev[id]) == typeof(next[id])) {
    
      if(typeof(next[id]) == "object" && (prev[id] instanceof Array) == (next[id] instanceof Array) ) {
      
        //Object case
        var res = computePatch(prev[id], next[id], update_in_place);
        if(res !== null) {
          has_updates = true;
          updates[target_id] = res;
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
    updates[target_id] = clone(next[id]);
    
    if(update_in_place) {
      prev[id] = updates[target_id];
    }
  };
  
  //Two cases to deal with for plain old javascript objects:
  if(next instanceof Array) {
    //Case 1: Arrays
    if(prev.length != next.length) {
      if(update_in_place) {
        prev.length = next.length;
      }
      has_updates = true;
      updates["_r"] = next.length;
    }
    for(var i=next.length-1; i>=0; --i) {
      processElement(i);
    }
    
  } else {
    //Case 2: Objects
    var removals = [];
    for(var i in prev) {
      if(!(i in next)) {
        removals.push(i);
      }
    }
    if(removals.length > 0) {
      has_updates = true;
      updates["_r"] = (removals.length == 1 ? removals[0] : removals);
      
      if(update_in_place) {
        for(var i=removals.length-1; i>=0; --i) {
          delete prev[removals[i]];
        }
      }
    }
    for(var i in next) {
      processElement(i);
    }
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
  var i;
  if("_r" in patch) {
    if(obj instanceof Array) {
      obj.length = patch["_r"];
    }
    else {
      var removals = patch["_r"];
      
      if(removals instanceof Array) {
        for(i=0; i<removals.length; ++i) {
          delete obj[removals[i]];
        }
      } else {
        delete obj[removals];
      }
    }
    delete patch["_r"];
  }
  
  for(i in patch) {
    //Unescape underscore
    var t = (typeof(i) == "string" && i.charAt(0) == "_" ? i.substring(1) : i);
    
    if(typeof(obj[t]) == typeof(patch[i]) &&
      typeof(patch[i]) == "object" &&
      patch[i] != null &&
      (obj[t] instanceof Array) == (patch[i] instanceof Array)) {
      applyPatch(obj[t], patch[i]);
      continue;
    }
    obj[t] = patch[i]
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

