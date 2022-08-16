<template>
  <div class="home">
    <img class="home-logo" src="../assets/home.png"/>
    <p class="message">
      Fully Decentralized and Safe Email Service
    </p>
    <el-button type="warning" round class="home-btn" @click="onOpenEmail">
      Launch App
    </el-button>
  </div>
</template>

<script>

export default {
  name: 'Home',
  methods: {
    onOpenEmail() {
      this.$router.push({path: "/email"});
    },
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.home-logo {
  margin-top: 35px;
  width: 230px;
}

.message {
  font-size: 30px;
  color: #333333;
  margin-bottom: 35px;
  margin-top: 35px;
}

.home-btn {
  background-color: #486FAE;
  margin-top: 20px;
  font-size: 18px;
  border: 0;
}
.home-btn:focus,
.home-btn:hover {
  background-color: #486FAEBB;
}
.home-btn:disabled:hover,
.home-btn:disabled {
  background-color: #cccccc;
}
</style>
