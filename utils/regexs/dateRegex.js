const isDateValid = (date) => {
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
};

module.exports = { isDateValid };
