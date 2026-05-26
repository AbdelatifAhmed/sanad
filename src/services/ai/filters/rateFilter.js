module.exports = (queryObj, maxRate) => {
  if (maxRate) {
    queryObj.hourlyRate = { $lte: Number(maxRate) };
  }
  return queryObj;
};