self.onmessage = (event) => {
  const text = event.data;
  const lines = text.trim().split("\n");
  for (const line of lines) {
    const matches = line.match(/\S/g);
    if (!matches) {
      self.postMessage(false);
      return;
    }
  }
  self.postMessage(true);
};
