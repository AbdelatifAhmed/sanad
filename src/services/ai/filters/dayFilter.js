module.exports = (queryObj, days) => {
  if (days && days.length > 0) {
    queryObj.availability = { $in: days };
  }
  return queryObj;
};