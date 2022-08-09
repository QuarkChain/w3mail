<template>
  <el-container class="home">
    <el-aside width="200px" class="email-menu">
      <el-button class="home-btn" @click="openNewMail">New Email</el-button>
      <el-menu :default-active="this.currentIndex" @select="handleSelect">
        <el-menu-item index="1" class="menu-item">
          <i class="el-icon-receiving menu-item-icon"></i>
          <span slot="title">Inbox</span>
        </el-menu-item>
        <el-menu-item index="2" class="menu-item">
          <i class="el-icon-position menu-item-icon"></i>
          <span slot="title">Sent</span>
        </el-menu-item>
        <el-menu-item index="3" disabled class="menu-item">
          <i class="el-icon-delete menu-item-icon"></i>
          <span slot="title">Trash</span>
        </el-menu-item>
        <el-menu-item index="4" disabled class="menu-item">
          <i class="el-icon-edit-outline menu-item-icon"></i>
          <span slot="title">Draft</span>
        </el-menu-item>
        <el-menu-item index="5" disabled class="menu-item">
          <i class="el-icon-star-off menu-item-icon"></i>
          <span slot="title">Starred</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header-menu">
        <div v-if="this.currentIndex==='100'" class="header-back" @click="onBack">
          <i class="el-icon-back" style="margin-right: 10px;"></i>Back
        </div>
        <div v-else class="header-layout">
          <div>
            <input type="checkbox"/>
            <i class="el-icon-delete" style="margin-left: 15px"></i>
          </div>
          <el-pagination layout="prev, pager, next" :page-size="20" :total="1"></el-pagination>
        </div>
      </el-header>

      <el-main class="main-menu">
        <CreateMail v-if="currentIndex==='0'"/>
        <EmailList v-else-if="currentIndex==='1'" :types="1"/>
        <EmailList v-else-if="currentIndex==='2'" :types="0"/>
        <EmailInfo v-else-if="currentIndex==='100'" />
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
import CreateMail from "@/page/CreateMail.vue";
import EmailList from "@/page/EmailList.vue";
import EmailInfo from "@/page/EmailInfo.vue";

export default {
  name: 'Email',
  data: () => {
    return {
      signature: undefined,
      input: "",
      currentIndex: "1"
    }
  },
  components: {
    CreateMail,
    EmailList,
    EmailInfo
  },
  computed: {
    contract() {
      if (this.$store.state.chainConfig && this.$store.state.chainConfig.chainID) {
        const {EmailController} = this.$store.state.chainConfig;
        return EmailController;
      }
      return null;
    },
    account() {
      return this.$store.state.account;
    },
  },
  methods: {
    openNewMail() {
      this.currentIndex = "0";
      this.$router.push({path: '/email', query: {index: this.currentIndex}});
    },
    handleSelect(index) {
      this.currentIndex = index;
      this.$router.push({path: '/email', query: {index: this.currentIndex}});
    },
    canNumber(value) {
      try {
        Number(value);
      } catch (e){
        return false;
      }
      return true;
    },
    onBack() {
      this.$router.back(-1);
    }
  },
  created() {
    const index = this.$route.query.index;
    if (index && this.canNumber(index)) {
      this.currentIndex = index;
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.home {
  height: 75vh;
}

.email-menu {
  background: #ffffff;
  border-radius: 5px;
  height: 75vh;
}

.home-btn {
  background-color: #6E529C;
  margin: 20px 0;
  font-size: 18px;
  color: #ffffff;
  border: 0;
}
.home-btn:focus,
.home-btn:hover {
  color: #ffffff;
  background-color: #6E529CBB;
}
.home-btn:disabled:hover,
.home-btn:disabled {
  background-color: #cccccc;
}

.menu-item {
  display: flex;
  justify-content: left;
  align-items: center;
}
.menu-item-icon {
  margin-left: 40px;
}

.header-menu {
  background: #ffffff;
  border-radius: 5px;
  height: 8vh;
  margin: 0 20px;
}

.header-layout {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}
.header-back {
  display: flex;
  justify-content: left;
  align-items: center;
  height: 100%;
  color: black;
  cursor: pointer;
}

.main-menu {
  background: #ffffff;
  border-radius: 5px;
  margin: 20px 20px 0;
}
</style>
