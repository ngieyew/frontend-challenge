self.onmessage = (event) => {
  const file = event.data;
  if (!(file instanceof Blob) && !(file instanceof File)) {
    return;
  }
  const chunkSize = 1024 * 1024; // 1MB
  let offset = 0;

  const readChunk = () => {
    const blob = file.slice(offset, offset + chunkSize);
    offset += chunkSize; // Update offset immediately after slicing the blob

    const reader = new FileReader();
    reader.onload = (event) => {
      let text = event.target.result;
      text = text.trim(); // Trim whitespaces
      if (offset < file.size) {
        readChunk();
      } else {
        postMessage({ offset, file, fileName: file.name });
      }
    };
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
    };
    reader.readAsText(blob); // Read blob as text
  };

  readChunk();
};
