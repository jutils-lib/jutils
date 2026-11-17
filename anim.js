function ui(u) {
console.log(u);    
}


/*// Update existing properties on every record matching the supplied query.
obj.update = function (query, data = {}) {
if(!$.isObject(data)) $.error(`"${data}" is not an object`);

config(query, ({ result, cursor, missing }) => {
if(missing) return;
for(const key of Object.keys(data)){ 
 if(key in result) {
  const value = $.compute(data[key], result[key]);
  result[key] = value;
 }  
}   
cursor.update(result);
}); 
return this;
}*/



/*
jUtils.fn.get = function (callback, mode) {
 // Exit early if the collection is empty.
if(this.length === 0) return;

// Extract valid DOM elements from the internal collection structure.
let elements = this.elements.filter(el => el && el.nodeType === 1);    

// Ensure the first argument is a function before continuing.
if(typeof callback !== 'function') $.error(`${callback} is not a function at argument 1`);

// Execute callback once for a single element.
if(arguments.length === 1) return callback(elements[0], 0, elements[0]);

return elements[mode](callback); 
}
*/


/*
 * Moves the previously detached elements (stored by detach()) and
 * inserts them in place of the element matched by the given selector.
 * The target element is replaced by the stored elements.
 *
 * @param {string|Element|jUtils} input - Selector, element, or jUtils
 *   object identifying the element to replace.
 * @returns {jUtils} this, for chaining.
jUtils.fn.moveTo = function (input) {
// Nothing to do if no elements were previously stored by detach().
if(this.storedElements) {
// Resolve the target element from the provided input
const target = $(input).get(item => item);

if(target) {
// Replace the target with all the stored elements
target.replaceWith(...this.storedElements.map(item => item.target));
}
}
return this; 
}*/
