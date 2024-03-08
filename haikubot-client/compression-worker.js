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
      const compressedText = encodeURIComponent(text); // "Compress" text
      const compressedBlob = new Blob([compressedText]);
      postMessage({ compressedBlob, offset, fileName: `${file.name}.gz` });
      if (offset < file.size) {
        readChunk();
      }
    };
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
    };
    reader.readAsText(blob); // Read blob as text
  };

  readChunk();
};
