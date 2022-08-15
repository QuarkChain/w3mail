<template>
  <div class="go-upload">
    <input
        :multiple="multiple"
        :accept="accept"
        class="go-upload-input"
        ref="input"
        type="file"
        @change="onInputChange"
    />
    <div class="input-file" :class="{'input-file-disabled': this.disabled}">
      <span v-if="!this.currentFile" @click="onClickTrigger">
        <i class="el-icon-paperclip" style="margin-right: 3px;"></i><span>Upload</span>
      </span>
      <span v-else-if="this.currentFile.status==='pending'">
        <i class="el-icon-loading deploy-pending"></i><span>{{ this.currentFile.name }}</span>
      </span>
      <span v-else-if="this.currentFile.status==='success'" @click="onRemove">
        <span>{{ this.currentFile.name }}</span><i class="el-icon-close" style="margin-left: 3px;"></i>
      </span>
      <span v-else @click="onClear">
        <i class="el-icon-warning-outline deploy-fail"></i>
        <span>{{ this.currentFile.name }}</span>
        <i class="el-icon-close" style="margin-left: 3px;"></i>
      </span>
    </div>
  </div>
</template>

<script>
import request from '@/utils/request';

const noop = () => {};

export default {
  name: 'w3q-deployer',
  props: {
    driveKey: {
      type: String,
      default: ""
    },
    emailUuid: {
      type: String,
      default: ""
    },
    fileContract: {
      type: String,
      default: ""
    },
    beforeUpload: { type: Function },
    onChange: { type: Function, default: noop },
    onSuccess: { type: Function, default: noop },
    onError: { type: Function, default: noop },
    onDelete: { type: Function, default: noop },
    onProgress: { type: Function, default: noop },
    accept: { type: String },
    multiple: { type: Boolean, default: false },
    customRequestClint: { type: Function, default: request },
    disabled: { type: Boolean, default: false }
  },
  data () {
    return {
      currentFile: null,
      // store all uploading files xhr instance, so that can invoke xhr.abort to cancel upload request
      currentReq: null
    };
  },
  methods: {
    // event
    onClickTrigger() {
      this.$refs.input.click();
    },
    onInputChange (e) {
      // e.target.files is pseudo array, need to convert to real array
      const rawFiles = Array.from(e.target.files);
      if (rawFiles.length > 0) {
        this.normalizeReq(rawFiles[0]);
        // auto start upload
        this.autoUpload();
      }
    },
    normalizeReq (rawFile) {
      const file = {
        name: rawFile.name,
        size: rawFile.size,
        type: rawFile.type,
        percent: 0,
        status: 'init', // value list: init pending success failure
        raw: rawFile
      };
      this.currentFile = file;
      this.currentReq = {
        driveKey: this.driveKey,
        emailUuid: this.emailUuid,
        contractAddress: this.fileContract,
        file: file,
        onSuccess: this.handleSuccess.bind(this, file),
        onError: this.handleError.bind(this, file),
        onProgress: this.handleProgress.bind(this, file)
      };
    },
    async autoUpload() {
      if (!this.beforeUpload || this.beforeUpload()) {
        const options = this.currentReq;
        const file = this.currentReq.file;
        file.status = 'pending';
        this.onChange(file);
        await this.customRequestClint(options);
      }
    },

    // fallback
    handleError(file, error) {
      file.status = 'failure';
      this.onChange(file);
      this.onError(error, file);
      this.$notify.error({title: 'Upload', message: 'Upload Fail!'});
    },
    handleSuccess(file, response) {
      file.status = 'success';
      // Not only front end can implement picture preview but also back end can do it. Here make use of back end api
      this.$set(file, 'uuid', response.uuid);
      this.onChange(file);
      this.onSuccess(response);
      this.$notify({title: 'Upload', message: 'Upload Success',type: 'success'});
    },
    handleProgress(file, event) {
      file.percent = event.percent;
      this.onChange(file);
      this.onProgress(event, file);
    },
    onRemove () {
      this.onClear();
      this.onDelete();
    },
    onClear() {
      this.currentFile = null;
      this.currentReq = null;
      this.$refs.input.value = ''
    }
  }
};
</script>

<style lang="scss" scoped>
.go-upload {
  .go-upload-input {
    display: none;
    width: 100%;
  }
  .input-file {
    padding: 3px 8px;
    border: 1px solid #999999;
    border-radius: 25px;
    font-size: 12px;
    color: black;
    cursor: pointer;
    width: max-content;
  }
  .input-file:hover {
    border: 1px solid #6E529C;
  }
  .input-file-disabled {
    border: 1px solid #cccccc;
    color: #cccccc;
    pointer-events: none;
  }

  .deploy-pending {
    color: #409eff;
    margin-right: 3px;
  }
  .deploy-fail {
    color: #f5365c;
    margin-right: 3px;
  }
}
</style>
