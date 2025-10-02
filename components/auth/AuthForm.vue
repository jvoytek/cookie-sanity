<script setup>
import Button from 'primevue/button';
const supabase = useSupabaseClient();

const loading = ref(false);
const email = ref('');

const handleLogin = async () => {
  try {
    loading.value = true;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.value,
      options: {
        emailRedirectTo: 'http://localhost:3000/confirm',
      },
    });
    if (error) throw error;
    alert('Check your email for the login link!');
  } catch (error) {
    alert(error.error_description || error.message);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <form @submit.prevent="handleLogin">
    <div>
      <label
        for="email1"
        class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2"
        >Email</label
      >
      <InputText
        id="email1"
        v-model="email"
        type="text"
        placeholder="Email address"
        class="w-full md:w-[30rem] mb-8"
      />

      <Button
        type="submit"
        :label="loading ? 'Loading' : 'Send magic link'"
        :disabled="loading"
        class="w-full"
      />
    </div>
  </form>
</template>
