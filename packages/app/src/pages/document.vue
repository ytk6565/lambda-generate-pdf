<script lang="ts" setup>
import { useRoute } from "#vue-router";

const route = useRoute();
</script>

<template>
  <div>
    <p>{{ route.query.message }} from query.</p>
  </div>
</template>
