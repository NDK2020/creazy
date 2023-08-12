<template>
  <a-upload-dragger v-model:fileList="file_list" 
    @change="on_change" 
    :customRequest="dummy_request">
    <a-button> Click or drag .mid file </a-button>
  </a-upload-dragger>
</template>

<script setup lang="ts">
import * as tauri_path from "@tauri-apps/api/path";
import * as os from "@tauri-apps/api/os";
import * as fs from "@tauri-apps/api/fs";
import { APP_NAME } from "@/constants";
import { invoke } from "@tauri-apps/api/tauri";
import { message } from "ant-design-vue";
import type { UploadChangeParam } from "ant-design-vue";
// const props = defineProps({
//   url: {
//     type: String,
//     default: undefined
//   }
// });
//--------------------
const file_list = ref([]);
// const headers = {
//   authorization: ""
// }


//---------
//-- @ref
//---------
const download_dir = ref();
const os_type = ref();
const file_seperator = ref();
const app_dir = ref();

onMounted(async () => {
  download_dir.value = await tauri_path.downloadDir();
  os_type.value = await os.type();
  file_seperator.value = os_type.value === "Windows_NT" ? "\\" : "/";
  await fs.createDir(APP_NAME, {
    dir: fs.BaseDirectory.Download,
    recursive: true,
  });
  app_dir.value = `${download_dir.value}${APP_NAME}`;
  //
  console.log(download_dir.value);
  console.log(os_type.value);
  console.log(app_dir.value);
});

const on_change = (info: UploadChangeParam) => {
  invoke("process_file", { name: "hello anh em" }).then((res) =>
    console.log(res)
  );
  //
  if (info.file.status !== "uploading") {
    console.log(info.file, info.fileList);
  }

  if (info.file.status === "done") {
    message.success(`${info.file.name} file uploaded successfully`);
  } else if (info.file.status === "error") {
    message.error(`${info.file.name} file upload failed.`);
  }
};
// const on_before_upload = () => {
//   console.log("on before upload");
//   return false;
// };

const dummy_request = async (options: any) => {
  //@ts-ignore
  const { onSuccess, onError, file, onProgress } = options;
  setTimeout(() => {
    onSuccess("ok");
  }, 0);
};
</script>
