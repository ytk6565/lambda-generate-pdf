<script lang="ts" setup>
import { useRoute } from "#vue-router";

import assets from "~/assets/assets.png";

const route = useRoute();
</script>

<template>
  <div>
    <p>{{ route.query.message }} from query.</p>

    <h2>Public</h2>
    <img src="/public.png" alt="placeholder" width="120" height="80" />

    <h2>Assets</h2>
    <img :src="assets" alt="placeholder" width="120" height="80" />
  </div>
</template>
