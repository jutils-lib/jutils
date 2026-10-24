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
