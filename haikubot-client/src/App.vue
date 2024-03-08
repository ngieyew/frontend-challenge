<template>
  <div class="container">
    <div class="form-container">
      <h2>UPLOAD FILE or TEXT</h2>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="text">Text:</label>
          <input type="text" id="text" v-model="newItem.text" required>
        </div>
        <div class="form-group">
          <label for="file-upload" class="custom-file-upload">
            <i class="fa fa-cloud-upload"></i> Upload File
          </label>
          <input id="file-upload" :disabled="uploadStatus === 'pending'" type="file" ref="fileInput"
            @change="handleFileChange" style="display: none;">
          <div> {{ uploadStatus }} </div>
        </div>
        <button type="submit">Submit</button>
      </form>
    </div>
    <div class="list-container">
      <h2>HAIKU BOT SAYS </h2>
      <ul class="item-list" ref="listContainer" @scroll="handleScroll">
        <li v-for="item in visibleItems" :key="item.id">
          <span v-html="item.text"></span> <!-- Use v-html to render text with HTML -->
          <span v-if="item.file">{{ item.fileName }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>

export default {
  data() {
    const defaultItem = {
      text: '',
      file: null,
      fileName: '',
    }
    return {
      items: [
        // { id: 1, text: 'Item 1' },
        // { id: 2, text: 'Item 2' },
        // { id: 3, text: 'Item 3' },
      ],
      visibleItems: [],
      timerId: null,
      visibleItemCount: 5,
      currentPage: 1, // current page
      itemsPerPage: 5, // number of items per page
      uploadStatus: 'idle', // Add this line
      defaultItem: { ...defaultItem },
      newItem: { ...defaultItem },
    };
  },
  methods: {
    async isValidHaikuFormat(text) {
      const worker = new Worker('/validation-worker.js');
      worker.postMessage(text);
      const result = await new Promise((resolve) => {
        worker.onmessage = (event) => {
          resolve(event.data);
        };
      });
      worker.terminate();
      return result;
    },
    async handleSubmit() {

      if (this.newItem.text) {
        const validateText = await this.isValidHaikuFormat(this.newItem.text)
        console.log(validateText)
        if (!validateText) {
          alert('Invalid haiku format');
          return
        }

        this.postUpdate(this.newItem.text)
      }
    },
    async postUpload(file, fileName) {
      try {
        const formData = new FormData();
        formData.append('file', file, fileName);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();
        alert('Successful upload of file')
        this.newItem = { ...this.defaultItem }
        return data;
      } catch (error) {
        alert(error)
        console.error('Post Error:', error);
      }
    },
    async postUpdate(text) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/update`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: text }),
        });

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();
        return data;
      } catch (error) {
        alert(error)
        console.error('Post Error:', error);
      }
    },
    async fetchHistory() {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/history`);

        if (response.status !== 200) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();
        const history = data.map((item, index) => {
          return { id: index + 1, text: item.replace(/\n/g, '<br>') };
        });
        this.items = history.reverse()
        this.updateVisibleItems()
      } catch (error) {
        alert(error)
        console.error("Fetch error: ", error);
      }
    },
    async fetchData() {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/converse`);

        if (response.status !== 200) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();
        data.text = data.text.replace(/\n/g, '<br>'); // Replace newline characters with <br> tags
        data.id = this.items.length + 1; // Append an ID to the data
        this.items.unshift(data); // Append new item to the list
        this.updateVisibleItems();
      } catch (error) {
        console.error("Fetch error: ", error);
      } finally {
        this.timerId = setTimeout(this.fetchData, 7000);
      }
    },
    updateVisibleItems() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      this.visibleItems = this.items.slice(start, end);
    },
    nextPage() {
      if (this.currentPage * this.itemsPerPage < this.items.length) {
        this.currentPage++;
        this.updateVisibleItems();
        this.$nextTick(() => {
          this.$refs.listContainer.scrollTop -= 1; // adjust this value as needed
        });
      }
    },
    previousPage() {
      if (this.currentPage > 1) {
        const oldScrollTop = this.$refs.listContainer.scrollTop;
        this.currentPage--;
        this.updateVisibleItems();
        this.$nextTick(() => {
          this.$refs.listContainer.scrollTop = oldScrollTop + 1; // adjust this value as needed
        });
      }
    },
    handleScroll() {
      const { scrollTop, clientHeight, scrollHeight } = this.$refs.listContainer;
      const isBottom = scrollTop + clientHeight >= scrollHeight;
      const isTop = scrollTop === 0;

      if (isBottom) {
        this.nextPage();
      } else if (isTop) {
        this.previousPage();
      }
    },
    stopFetching() {
      clearTimeout(this.timerId);
    },
    handleFileUpload(file) {
      const reader = new FileReader();

      reader.onload = async (e) => {
        this.uploadStatus = 'pending';
        const fileContent = e.target.result;
        const validateFile = await this.isValidHaikuFormat(fileContent)
        if (!validateFile) {
          alert('Invalid haiku format');
          this.uploadStatus = 'error';
          return false;
        }
        const worker = new Worker('/compression-worker.js');
        console.log('Compression start')
        worker.postMessage(file);

        worker.onmessage = (event) => {
          const { offset, file, fileName } = event.data;
          this.newItem.file = file
          this.newItem.fileName = fileName

          if (offset < file.size) {
            this.uploadStatus = 'pending'; // Update status to 'pending'
          } else {
            console.log('Compression end')
            this.postUpload(this.newItem.file)
            this.uploadStatus = 'success'; // Update status to 'success'
          }

          worker.terminate(); // Terminate the worker
        };

        worker.onerror = (error) => {
          console.log('Error compressing file:', error);
          this.uploadStatus = 'error'; // Update status to 'error'

          worker.terminate(); // Terminate the worker
        };
      };

      reader.readAsText(file);
    },
    async handleFileChange(event) {
      this.uploadStatus = 'idle'; // Reset status to 'idle'
      const file = event.target.files[0];

      // Limit file size
      // const maxSize = 5 * 1024 * 1024; // 5MB

      // if (file.size > maxSize) {
      //   alert('File size should not exceed 5MB');
      //   this.$refs.fileInput.value = ''; // Reset the file input
      //   return;
      // }

      if (!file) {
        console.log('No file selected.');
        return;
      }

      this.handleFileUpload(file)

    },
    async ping() {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ping`);

        if (response.status !== 200) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        console.log('Ping response:', data);
      } catch (error) {
        console.error('Error during ping:', error);
      }
    },
    // generateLargeList() {
    //   const newItems = [];
    //   for (let i = 1; i <= 10000; i++) {
    //     newItems.push({ id: i, text: `${i} Words not meant to fly, \n Like leaves in a quiet stream— \n Drift away, untouched.` });
    //   }
    //   this.items = newItems;
    // }
  },
  created() {
    // this.generateLargeList();

    this.visibleItems = this.items.slice(0, this.visibleItemCount);
  },
  async mounted() {
    this.$refs.listContainer.addEventListener('scroll', this.handleScroll);
    this.ping();
    // this.fetchHistory();
    this.fetchData();
  },
  beforeDestroy() {
    this.$refs.listContainer.removeEventListener('scroll', this.handleScroll);
    this.stopFetching();
  },
}

</script>

<style>
.container {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-around;
}

.form-container,
.list-container {
  width: 500px;
  margin: 20px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.form-group {
  margin-bottom: 10px;
}

.item-list::before,
.item-list::after {
  content: "";
  display: block;
  min-height: 45%;
}

.item-list {
  height: 300px;
  overflow-y: scroll;
}

.item-list li {
  list-style-type: none;
  margin-bottom: 8px;
}

.custom-file-upload {
  padding: 6px 12px;
  cursor: pointer;
  border: 1px solid #ccc;
  display: inline-block;
  /* Add more styles as needed */
}
</style>