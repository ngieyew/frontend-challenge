<template>
  <div class="container">
    <div class="form-container">
      <h2>Add New Item</h2>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="text">Text:</label>
          <input type="text" id="text" v-model="newItem.text" required>
        </div>
        <div class="form-group">
          <label for="file">File:</label>
          <input type="file" id="file" ref="fileInput" @change="handleFileChange">
        </div>
        <button type="submit">Submit</button>
      </form>
    </div>
    <div class="list-container">
      <h2>Items</h2>
      <ul class="item-list">
        <li v-for="item in items" :key="item.id">
          {{ item.text }}
          <span v-if="item.file">{{ item.fileName }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      items: [
        { id: 1, text: 'Item 1' },
        { id: 2, text: 'Item 2' },
        { id: 3, text: 'Item 3' },
      ],
      newItem: {
        text: '',
        file: null,
        fileName: '',
      },
    };
  },
  methods: {
    handleSubmit() {
      return ;
    },
    handleFileChange(event) {
      return ;
    },
    async ping() {
      try {
        const response = await fetch('http://localhost:8080/api/ping');

        if (!response.status === "ok") {
          throw new Error('Network response was not ok');
        }

        const data = await response.json(); 
        console.log('Ping response:', data);
      } catch (error) {
        console.error('Error during ping:', error);
      }
    },
  },
  async mounted() {
    this.ping();
  },
};
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

.item-list {
  height: 300px;
  overflow-y: scroll;
}
</style>