module.exports = (queryObj, startDate, endDate) => {
  if (startDate || endDate) {
    queryObj.bookedDates = {
      $not: {
        $elemMatch: {
          $gte: startDate ? new Date(startDate) : new Date(),
          $lte: endDate ? new Date(endDate) : new Date('2030-01-01')
        }
      }
    };
  }
  return queryObj;
};