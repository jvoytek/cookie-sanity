<script setup>
import Button from "primevue/button";
const supabase = useSupabaseClient();
const toast = useToast();

const loading = ref(false);
const email = ref("");
const password = ref("");
const signUp = ref(false);

const handleLogin = async () => {
  try {
    loading.value = true;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.value,
      options: {
        emailRedirectTo: "http://localhost:3000/confirm",
      },
    });
    if (error) throw error;
    alert("Check your email for the login link!");
  } catch (error) {
    alert(error.error_description || error.message);
  } finally {
    loading.value = false;
  }
};

const signUpNewUser = async () => {
  console.log("Signing up with email:", email.value);
  try {
    loading.value = true;
    const { data, error } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
      options: {
        emailRedirectTo: 'http://localhost:3000/confirm',
      },
    });
    if (error) throw error;
    console.log(data);
    toast.add({
      severity: "success",
      summary: "Success",
      detail: "Check your email for the confirmation link!",
      life: 3000,
    });
    email.value = "";
    password.value = "";
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: error.message,
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

const signInWithEmail = async () => {
  console.log("Signing in with email:", email.value);
  try {
    loading.value = true;
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });
    if (error) throw error;
    toast.add({
      severity: "success",
      summary: "Success",
      detail: "Logged in successfully!",
      life: 3000,
    });
    email.value = "";
    password.value = "";
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: error.message,
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

</script>

<template>
  <form @submit.prevent="signInWithEmail" v-if="!signUp">
    <div>
      <label
        for="email"
        class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2"
        >Email</label
      >
      <InputText
        id="email"
        v-model="email"
        type="text"
        placeholder="Email address"
        class="w-full md:w-[30rem] mb-8"
      />
      <label
        for="password"
        class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2"
        >Password</label
      >
      <InputText
        id="password"
        v-model="password"
        type="text"
        placeholder="Password"
        class="w-full md:w-[30rem] mb-8"
      />

      <Button
        type="submit"
        :label="loading ? 'Loading' : 'Sign In'"
        :disabled="loading"
        class="w-full"
      />
    </div>
    <div>
      <p class="text-center text-surface-700 dark:text-surface-300 mt-4">
        Don't have an account?
        <a
          href="#"
          class="text-primary-600 hover:underline"
          @click.prevent="signUp = !signUp"
          >Sign Up</a
        >
      </p>
    </div>
  </form>
  <form v-else @submit.prevent="signUpNewUser">
    <div>
      <label
        for="email"
        class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2"
        >Email</label
      >
      <InputText
        id="email"
        v-model="email"
        type="text"
        placeholder="Email address"
        class="w-full md:w-[30rem] mb-8"
      />
      <label
        for="password"
        class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2"
        >Password</label
      >
      <InputText
        id="password"
        v-model="password"
        type="text"
        placeholder="Password"
        class="w-full md:w-[30rem] mb-8"
      />

      <Button
        type="submit"
        :label="loading ? 'Loading' : 'Sign Up'"
        :disabled="loading"
        class="w-full"
      />
    </div>
  </form>
</template>
