<template>
  <div>
    <div v-if="!this.file" class="domain-loading" v-loading="true"/>
    <el-card v-else class="profile-card">
      <div class="file-header">
        <div class="file-title">
          <span class="file-title-text">{{ renderName(this.file.name) }}</span>
          <span class="file-title-time">{{ renderTimestamp(this.file.time) }}</span>
        </div>
        <div>
          <el-button round class="profile-delete-btn" @click="onDelete">Remove</el-button>
          <el-button v-if="!this.file.isFail" round class="profile-delete-btn" @click="onDownload">Download</el-button>
        </div>
      </div>
      <div class="divider"/>
      <!--   data   -->
      <div class="profile-date" v-loading="showProgress">
        <el-col v-if="this.file.isFail">
          <el-row><i class="el-icon-error fail-img"/></el-row>
          <el-row><span class="fail-text">Error: The data has not been uploaded!!</span></el-row>
        </el-col>
        <img v-else-if="this.isImage(this.file.type)" :src="'data:image/png;base64,' + arrayBufferToBase64(this.file.data)"/>
        <update-icon v-else class="go-upload-list-item-img" name="file"/>
      </div>
    </el-card>
  </div>
</template>

<script>
import {ethers} from "ethers";
import fileDownload from "js-file-download";
import UpdateIcon from "./icon";
import {getFile, downloadFile, deleteFile} from '@/utils/profile';

const stringToHex = (s) => ethers.utils.hexlify(ethers.utils.toUtf8Bytes(s));
const hexToString = (h) => ethers.utils.toUtf8String(h);

export default {
  name: 'File',
  data: () => {
    return {
      showProgress: false,
    };
  },
  components: { UpdateIcon },
  computed: {
    driveKey() {
      return this.$store.state.driveKey;
    },
    uuid() {
      return stringToHex(this.$route.params.uuid);
    }
  },
  watch: {
    driveKey: function () {
      this.goHome();
    }
  },
  mounted() {
    if(!this.driveKey){
      this.goHome();
    }
  },
  asyncComputed: {
    file : {
      async get() {
        if (!this.uuid) {
          return 'none';
        }
        const { FileBoxController} = this.$store.state.chainConfig;
        if (!FileBoxController) {
          return "none";
        }
        return await getFile(FileBoxController, this.driveKey, this.uuid);
      },
      default: undefined,
      watch: ["driveKey", "uuid"],
    },
  },
  methods: {
    isImage(type) {
      if (!type) {return;}
      type = hexToString(type);
      return type.includes('image');
    },
    renderTimestamp(ts) {
      if (!ts) {
        return "";
      }
      return ts.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    },
    renderName(name) {
      return hexToString(name);
    },
    arrayBufferToBase64(buffer) {
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return window.btoa(binary);
    },
    goHome() {
      this.$router.push({path: "/"});
    },
    async onDownload() {
      if (!this.file) {
        return;
      }

      // download image
      if (this.file.data) {
        fileDownload(this.file.data, this.renderName(this.file.name));
        return;
      }

      const { FileBoxController} = this.$store.state.chainConfig;
      if (!FileBoxController) {
        return;
      }
      this.showProgress = true;
      const data = await downloadFile(FileBoxController, this.driveKey, this.uuid, this.file.iv, this.file.chunkCount);
      fileDownload(data, this.renderName(this.file.name));
      this.showProgress = false;
    },
    onDelete() {
      const { FileBoxController} = this.$store.state.chainConfig;
      if (!FileBoxController) {
        return;
      }
      this.showProgress = true;
      deleteFile(FileBoxController, this.uuid)
          .then((v) => {
            if (v) {
              this.$notify({title: 'Success',message: 'Delete Success',type: 'success'});
              this.goHome();
            } else {
              this.showProgress = false;
              this.$notify({title: 'Error',message: 'Delete Fail',type: 'error'});
            }
          })
          .catch(() => {
            this.showProgress = false;
            this.$notify({title: 'Error',message: 'Delete Fail',type: 'error'});
          });
    },
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
@import "../assets/styles/mixins.scss";
@import "../assets/styles/vars.scss";

.domain-loading {
  min-width: 40vw;
  min-height: 50vh;
}
.domain-loading >>> .el-loading-mask{
  background: transparent !important;
}

.profile-card {
  background: #FFFFFF;
  border-radius: 16px;
  margin-top: 35px;
  padding: 15px;
}

.file-header{
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}
.file-title {
  display: flex;
  flex-direction: column;
  align-items: start;
}

.file-title-text {
  font-size: 25px;
  font-weight: bold;
  color: #221F33;
}
.file-title-time {
  font-size: 14px;
  color: #999999;
  margin-top: 6px;
}

.profile-delete-btn {
  background-color: #6E529C;
  font-size: 16px;
  border: 0;
  color: #ffffff;
}
.profile-delete-btn:focus,
.profile-delete-btn:hover {
  background-color: #6E529CBB;
  color: #ffffff;
}

.divider {
  background-color: #E8E6F2;
  height: 1px;
  padding: 0;
  width: 100%;
  margin: 20px 0;
}

.profile-date {
  width: 100%;
  min-height: 500px;
  padding: 30px 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.go-upload-list-item-img {
  width: 90px;
  height: 90px;
}

.fail-img {
  font-size: 50px;
  color: #F56C6C;
}
.fail-text {
  font-size: 22px;
  color: #333333;
  margin-top: 10px;
}
@media screen and (max-width: 420px) {
  .profile-card {
    padding: 0;
    margin-top: 5px;
  }
}
</style>
