<script setup>
const profileStore = useProfileStore();

const uploading = ref(false);

const uploadAvatar = async (evt) => {
  try {
    uploading.value = true;

    profileStore.uploadAvatar(evt.files[0]);
  } catch (error) {
    alert(error.message);
  } finally {
    uploading.value = false;
  }
};
</script>

<template>
  <div>
    <Image
      v-if="profileStore.avatar_src"
      :src="profileStore.avatar_src"
      alt="Avatar"
      style="width: 10em; height: 10em"
    />
    <div v-else class="avatar no-image" style="width: 10em; height: 10em" />

    <div class="flex flex-col gap-2">
      <label class="button primary block" for="single">
        {{ uploading ? "Uploading ..." : "Upload" }}
      </label>
      <FileUpload
        name="avatar"
        mode="basic"
        accept="image/*"
        :custom-upload="true"
        :auto="true"
        :max-file-size="1000000"
        choose-label="Choose File"
        :upload-label="'Upload File'"
        @select="uploadAvatar"
      />
    </div>
  </div>
</template>
