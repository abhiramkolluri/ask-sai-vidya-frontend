const sortAndMapDataByMonthAndYear = (data) => {
  // Sort the data array by timestamp in descending order (latest date first)
  data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Create an object to store the mapped arrays by section title
  const mappedData = {};

  // Iterate over the data array to group entries by month and year
  data.forEach((entry) => {
    const entryDate = new Date(entry.timestamp);
    const sectionTitle = entryDate.toLocaleString("en-us", {
      month: "long",
      year: "numeric",
    });
    if (!mappedData[sectionTitle]) {
      mappedData[sectionTitle] = [];
    }
    mappedData[sectionTitle].push(entry);
  });

  // Convert the mapped data into an array of [sectionTitle, mappedQuestions]
  const sortedMappedData = Object.entries(mappedData).map(
    ([sectionTitle, mappedQuestions]) => {
      return [sectionTitle, mappedQuestions];
    }
  );

  return sortedMappedData;
};

export default sortAndMapDataByMonthAndYear;
