module.exports = function(str) {
  var isObjectID = !!str.match(/[a-z0-9]{24}/i);
  if (!isObjectID)
    return;
};