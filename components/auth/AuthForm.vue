<script setup>
  import Button from 'primevue/button';
  const supabase = useSupabaseClient();
  const config = useRuntimeConfig();
  const appHostName = config.public.appHostName || 'http://localhost:3000';

  const loading = ref(false);
  const email = ref('');

  const handleLogin = async () => {
    try {
      loading.value = true;
      const { error } = await supabase.auth.signInWithOtp({
        email: email.value,
        options: {
          emailRedirectTo: `${appHostName}/confirm`,
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

  const signInWithGithub = async () => {
    try {
      loading.value = true;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${appHostName}/confirm`,
        },
      });
      if (error) throw error;
    } catch (error) {
      alert(error.error_description || error.message);
    } finally {
      loading.value = false;
    }
  };

  const signInWithGoogle = async () => {
    try {
      loading.value = true;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${appHostName}/confirm`,
        },
      });
      if (error) throw error;
    } catch (error) {
      alert(error.error_description || error.message);
    } finally {
      loading.value = false;
    }
  };

  const signInWithFacebook = async () => {
    try {
      loading.value = true;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${appHostName}/confirm`,
        },
      });
      if (error) throw error;
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
        class="w-full mb-8"
      />

      <Button
        type="submit"
        :label="loading ? 'Loading' : 'Send magic link'"
        :disabled="loading"
        class="w-full"
      />
    </div>
  </form>
  <Divider align="center">
    <strong>or</strong>
  </Divider>
  <Button
    type="button"
    label="Sign in with Google"
    :disabled="loading"
    class="w-full mb-6"
    icon="pi pi-google"
    @click="signInWithGoogle"
    style="background-color: #de5246; border-color: #de5246"
  />
  <Button
    type="button"
    label="Sign in with GitHub"
    :disabled="loading"
    class="w-full"
    icon="pi pi-github"
    @click="signInWithGithub"
    style="background-color: #333; border-color: #333"
  />
</template>
