<template>
  <div id="app">
    <Header />
    <main class="container">
      <router-view />
    </main>
    <footer class="footer">Vue + Spring Boot + MyBatis + MariaDB</footer>
  </div>
</template>

<script setup>
import Header from './components/Header.vue'
</script>